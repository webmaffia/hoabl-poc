"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { getPocketById } from "@/lib/data";
import { rankPockets } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn, formatLakh } from "@/lib/utils";
import { Pocket } from "@/lib/types";

const ROWS: { key: string; label: string; get: (p: Pocket) => string; scoreGet?: (p: Pocket) => number }[] = [
  { key: "price", label: "Price", get: (p) => formatLakh(p.price) },
  { key: "size", label: "Size (sq.ft.)", get: (p) => p.sizeSqft.toLocaleString() },
  { key: "road", label: "Road access", get: (p) => tierLabel(p.roadAccess), scoreGet: (p) => p.roadAccess },
  { key: "privacy", label: "Privacy", get: (p) => tierLabel(p.privacy), scoreGet: (p) => p.privacy },
  { key: "amenity", label: "Amenity proximity", get: (p) => tierLabel(p.amenityProximity), scoreGet: (p) => p.amenityProximity },
  { key: "entry", label: "Entry price", get: (p) => tierLabel(p.entryPriceScore), scoreGet: (p) => p.entryPriceScore },
];

function tierLabel(v: number) {
  if (v >= 80) return "High";
  if (v >= 55) return "Medium";
  return "Low";
}

export function Screen12ComparePockets() {
  const { comparedPockets, dispatch, buyerProfile, pocketPreferences, next, projectPockets } = useJourney();
  const { speak } = useAira();

  const ranked = useMemo(
    () => rankPockets(projectPockets, buyerProfile, pocketPreferences),
    [projectPockets, buyerProfile, pocketPreferences]
  );

  const ids = comparedPockets.length >= 2 ? comparedPockets : ranked.slice(0, 3).map((r) => r.pocket.id);
  const pockets = ids.map((id) => getPocketById(id)).filter(Boolean) as Pocket[];
  const scored = pockets.map((p) => ({ pocket: p, score: ranked.find((r) => r.pocket.id === p.id)?.score ?? 0 }));
  const best = scored.slice().sort((a, b) => b.score - a.score)[0];

  const toggle = (id: string) => {
    const has = ids.includes(id);
    let next = has ? ids.filter((x) => x !== id) : [...ids, id];
    if (next.length > 3) next = next.slice(1);
    dispatch({ type: "SET_COMPARED", ids: next });
  };

  const airaTake = buildAiraTake(scored, best?.pocket.id);

  useEffect(() => {
    speak(airaTake);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airaTake]);

  const saveComparison = () => {
    track("decision_summary_viewed");
    next();
  };

  useVoiceCommands([
    { labels: ["save", "continue", "next", "save comparison"], action: saveComparison },
    ...projectPockets.filter((p) => p.availability !== "sold").map((p) => ({
      labels: [p.name],
      action: () => toggle(p.id),
    })),
  ]);

  return (
    <ScreenShell showStages={false} title="Compare pockets">
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <h1 className="font-serif text-2xl text-forest-900">Compare Pockets</h1>
        <p className="mt-1 text-sm text-forest-900/50">Which one fits you better?</p>

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {projectPockets.filter((p) => p.availability !== "sold").map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                ids.includes(p.id) ? "border-forest-800 bg-forest-800 text-ivory-100" : "border-forest-900/10 text-forest-900/50"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 overflow-auto no-scrollbar">
          <table className="w-full border-separate border-spacing-y-1.5 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-ivory-100 text-left text-[11px] font-medium text-forest-900/40" />
                {scored.map(({ pocket }) => (
                  <th key={pocket.id} className="min-w-[76px] px-1 pb-1 text-center">
                    <span className="block text-xs font-semibold text-forest-900">{pocket.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key} className="rounded-xl bg-white shadow-card">
                  <td className="rounded-l-xl px-2.5 py-2.5 text-[11px] font-medium text-forest-900/50">{row.label}</td>
                  {scored.map(({ pocket }) => (
                    <td key={pocket.id} className="px-1 py-2.5 text-center text-[13px] font-medium text-forest-900">
                      {row.get(pocket)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="rounded-xl bg-forest-800/5 shadow-card">
                <td className="rounded-l-xl px-2.5 py-2.5 text-[11px] font-semibold text-forest-800">Profile fit</td>
                {scored.map(({ pocket, score }) => (
                  <td key={pocket.id} className="px-1 py-2.5 text-center">
                    <span className={cn("text-sm font-bold", pocket.id === best?.pocket.id ? "text-forest-800" : "text-forest-900/60")}>
                      {score}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <motion.div
            key={airaTake}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl2 border border-gold-500/25 bg-gold-50 p-4"
          >
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold-600">
              <Sparkles className="h-3 w-3" /> Aira&rsquo;s take
            </div>
            <p className="text-sm text-forest-900/80">{airaTake}</p>
          </motion.div>
        </div>

        <Button
          size="lg"
          className="mt-3 w-full"
          onClick={saveComparison}
        >
          Save comparison
        </Button>
      </div>
    </ScreenShell>
  );
}

function buildAiraTake(scored: { pocket: Pocket; score: number }[], bestId?: string) {
  if (!scored.length) return "Select a couple of pockets to compare.";
  const sorted = scored.slice().sort((a, b) => b.score - a.score);
  const [first, ...rest] = sorted;
  let text = `${first.pocket.name} is the strongest overall fit for your stated priorities.`;
  rest.forEach((r) => {
    if (r.pocket.sizeSqft > first.pocket.sizeSqft && r.pocket.price < first.pocket.price) {
      text += ` ${r.pocket.name} offers better value and a larger plot but weaker accessibility.`;
    } else if (r.pocket.roadAccess > first.pocket.roadAccess) {
      text += ` ${r.pocket.name} provides stronger accessibility but sits closer to the upper end of a typical budget.`;
    }
  });
  return text;
}
