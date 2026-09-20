"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, Map, Route, Eye, Lock, Landmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { TrustBadge } from "@/components/trust/trust-badge";
import { VerifiedInfo, ConfirmWithHoabl } from "@/components/trust/trust-sections";
import { LiveViewerBadge, ScarcityBadge } from "@/components/urgency-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { getPocketById } from "@/lib/data";
import { rankPockets } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn, formatLakh } from "@/lib/utils";

export function Screen11PocketDetail() {
  const { activePocketId, dispatch, goTo, buyerProfile, pocketPreferences, shortlistedPockets, projectPockets } = useJourney();
  const { speak } = useAira();

  const ranked = useMemo(
    () => rankPockets(projectPockets, buyerProfile, pocketPreferences),
    [projectPockets, buyerProfile, pocketPreferences]
  );
  const fallbackId = ranked[0]?.pocket.id;
  const pocketId = activePocketId || fallbackId;
  const pocket = getPocketById(pocketId || "") || projectPockets[0];
  const score = ranked.find((r) => r.pocket.id === pocket.id)?.score ?? 0;
  const isShortlisted = shortlistedPockets.includes(pocket.id);
  const topAlt = ranked.find((r) => r.pocket.id !== pocket.id)?.pocket;

  useEffect(() => {
    if (!activePocketId && fallbackId) dispatch({ type: "SET_ACTIVE_POCKET", id: fallbackId });
    dispatch({ type: "VIEW_POCKET", id: pocket.id });
    speak(
      topAlt
        ? `This looks like a strong fit if ${topPriorityPhrase(pocketPreferences)} matters more to you than ${topAlt.name}'s advantages.`
        : "This looks like a strong fit for your stated priorities."
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pocket.id]);

  const shortlist = () => {
    dispatch({ type: "TOGGLE_SHORTLIST", id: pocket.id });
    track("pocket_shortlisted", { pocketId: pocket.id });
  };

  const viewPaymentPlan = () => {
    track("pocket_compared", { pocketId: pocket.id });
    goTo("payment-plan");
  };

  useVoiceCommands([
    { labels: ["shortlist", "save", "like"], action: shortlist },
    { labels: ["payment plan", "continue", "next"], action: viewPaymentPlan },
    { labels: ["view on map", "map", "back to map"], action: () => goTo("pocket-map") },
  ]);

  return (
    <ScreenShell showStages={false} title="Pocket detail" onClose={() => goTo("pocket-map")}>
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-5 pb-5 pt-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-2xl text-forest-900">{pocket.name}</h1>
              <p className="text-sm text-forest-900/50">{pocket.description.split(".")[0]} &middot; {pocket.zone}</p>
            </div>
            <button
              onClick={shortlist}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                isShortlisted ? "border-red-400 bg-red-50 text-red-500" : "border-forest-900/10 text-forest-900/40"
              )}
            >
              <Heart className={cn("h-4 w-4", isShortlisted && "fill-red-500")} />
            </button>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-serif text-3xl text-forest-900">{formatLakh(pocket.price)}</span>
            <span className="text-sm text-forest-900/50">{pocket.sizeSqft.toLocaleString()} sq.ft.</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ScarcityBadge pocket={pocket} />
            {pocket.availability !== "sold" && <LiveViewerBadge seed={pocket.id} />}
          </div>

          {pocket.strengths.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {pocket.strengths.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-1 text-[11px] font-semibold text-gold-700"
                >
                  <Sparkles className="h-3 w-3" /> {s}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <FeatureRow pocket={pocket} />

        <InvestmentForecast price={pocket.price} />

        <div className="mt-5 rounded-xl2 border border-forest-900/8 bg-white p-4 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-forest-900/45">
              Suitability for you
            </span>
            <TrustBadge kind="interpretation" />
          </div>
          <div className="flex items-end gap-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="font-serif text-4xl text-forest-900"
            >
              {score}
            </motion.span>
            <span className="pb-1 text-sm text-forest-900/40">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-forest-900/8">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gold-500"
            />
          </div>
          <p className="mt-2 text-[11px] text-forest-900/40">
            &ldquo;Profile suitability&rdquo; — a transparent match to your stated preferences, not a financial prediction.
          </p>
        </div>

        <Section title="Why it may suit you">
          <ul className="space-y-1.5">
            {pocket.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-forest-900/80">
                <span className="mt-1 text-forest-800">✓</span> {s}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Trade-offs">
          <ul className="space-y-1.5">
            {pocket.tradeoffs.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-forest-900/70">
                <span className="mt-1 text-gold-600">△</span> {s}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Verified" trust>
          <VerifiedInfo items={pocket.verifiedFacts} />
        </Section>
        <div className="mt-3">
          <ConfirmWithHoabl items={["Current availability", "Specific development timelines", "Applicable documentation"]} />
        </div>

        <ComparisonSection pocket={pocket} score={score} ranked={ranked} />

        <div className="mt-5">
          <Button variant="outline" className="w-full" onClick={() => goTo("pocket-map")}>
            <Map className="h-4 w-4" /> View on map
          </Button>
          <Button size="lg" className="mt-2.5 w-full" onClick={viewPaymentPlan}>
            View payment plan &rarr;
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}

const COMPARE_ROWS: { key: string; label: string; get: (p: import("@/lib/types").Pocket) => string }[] = [
  { key: "price", label: "Price", get: (p) => formatLakh(p.price) },
  { key: "size", label: "Size (sq.ft.)", get: (p) => p.sizeSqft.toLocaleString() },
  { key: "road", label: "Road access", get: (p) => compareTier(p.roadAccess) },
  { key: "privacy", label: "Privacy", get: (p) => compareTier(p.privacy) },
  { key: "amenity", label: "Amenity proximity", get: (p) => compareTier(p.amenityProximity) },
];

function compareTier(v: number) {
  if (v >= 80) return "High";
  if (v >= 55) return "Medium";
  return "Low";
}

/** Shows how this pocket stacks up against its top alternatives, inline —
 * replaces the separate compare-pockets screen so buyers see the trade-offs
 * without leaving the pocket they're actually looking at. */
function ComparisonSection({
  pocket,
  score,
  ranked,
}: {
  pocket: import("@/lib/types").Pocket;
  score: number;
  ranked: { pocket: import("@/lib/types").Pocket; score: number }[];
}) {
  const others = ranked.filter((r) => r.pocket.id !== pocket.id).slice(0, 2);
  const scored = [{ pocket, score }, ...others];
  if (others.length === 0) return null;

  return (
    <div className="mt-5 rounded-xl2 border border-forest-900/8 bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-forest-900/45">
          Compare with alternatives
        </span>
        <TrustBadge kind="interpretation" />
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[280px] border-separate border-spacing-y-1.5 text-sm">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-medium text-forest-900/40" />
              {scored.map(({ pocket: p }) => (
                <th key={p.id} className="min-w-[76px] px-1 pb-1 text-center">
                  <span className="block text-xs font-semibold text-forest-900">{p.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.key} className="rounded-xl bg-forest-900/[0.02]">
                <td className="rounded-l-xl px-2.5 py-2 text-[11px] font-medium text-forest-900/50">{row.label}</td>
                {scored.map(({ pocket: p }) => (
                  <td key={p.id} className="px-1 py-2 text-center text-[13px] font-medium text-forest-900">
                    {row.get(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="rounded-xl bg-forest-800/5">
              <td className="rounded-l-xl px-2.5 py-2 text-[11px] font-semibold text-forest-800">Profile fit</td>
              {scored.map(({ pocket: p, score: s }, i) => (
                <td key={p.id} className="px-1 py-2 text-center">
                  <span className={cn("text-sm font-bold", i === 0 ? "text-forest-800" : "text-forest-900/60")}>
                    {s}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-gold-500/25 bg-gold-50 p-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
        <p className="text-sm text-forest-900/80">
          {scored[0].pocket.name} leads on profile fit here — {others[0].pocket.name} is the next best trade-off.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children, trust }: { title: string; children: React.ReactNode; trust?: boolean }) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/40">{title}</p>
      </div>
      {children}
    </div>
  );
}

function topPriorityPhrase(prefs: string[]) {
  const map: Record<string, string> = {
    road_access: "accessibility",
    corner_plot: "having a corner plot",
    larger_plot: "plot size",
    near_amenity: "amenity proximity",
    better_view: "the view",
    more_privacy: "privacy",
    investment_potential: "investment potential",
    lower_entry_price: "the lowest entry price",
  };
  return prefs.length ? map[prefs[0]] || "your priorities" : "accessibility";
}

const FEATURE_CHIPS = [
  { icon: Route, key: "roadAccess" as const, high: "Strong road access", low: "Road access" },
  { icon: Eye, key: "view" as const, high: "Great view", low: "Standard view" },
  { icon: Lock, key: "privacy" as const, high: "High privacy", low: "Some privacy" },
  { icon: Landmark, key: "amenityProximity" as const, high: "Near amenities", low: "Amenities nearby" },
];

/** A row of small icon chips summarizing this pocket's own scored attributes (not invented facts). */
function FeatureRow({ pocket }: { pocket: import("@/lib/types").Pocket }) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {FEATURE_CHIPS.map(({ icon: Icon, key, high, low }) => {
        const value = pocket[key];
        return (
          <div
            key={key}
            className="flex flex-col items-center gap-1 rounded-xl border border-forest-900/8 bg-white px-1.5 py-2.5 text-center shadow-card"
          >
            <Icon className="h-4 w-4 text-forest-800" />
            <span className="text-[9px] font-medium leading-tight text-forest-900/75">
              {value >= 70 ? high : low}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const FORECAST_POINTS = [
  { label: "Now", growth: 0 },
  { label: "1 Year", growth: 0.15 },
  { label: "3 Years", growth: 0.41 },
  { label: "5 Years", growth: 0.8 },
];

/**
 * An illustrative, animated growth projection — clearly marked as Aira's
 * interpretation (not a verified fact or a guarantee), consistent with the
 * app's trust-layer pattern elsewhere.
 */
function InvestmentForecast({ price }: { price: number }) {
  const values = FORECAST_POINTS.map((p) => Math.round(price * (1 + p.growth)));
  const max = Math.max(...values);

  return (
    <div className="mt-4 rounded-xl2 border border-forest-900/8 bg-white p-4 shadow-card">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-forest-900/45">
          AI investment forecast
        </span>
        <TrustBadge kind="interpretation" />
      </div>

      <div className="mt-3 flex items-end gap-2" style={{ height: 96 }}>
        {FORECAST_POINTS.map((p, i) => (
          <div key={p.label} className="flex h-full flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-[10px] font-semibold text-forest-900">{formatLakh(values[i])}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((values[i] / max) * 100, 6)}%` }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: "easeOut" }}
              className={cn(
                "w-full rounded-t-md",
                i === 0 ? "bg-forest-900/20" : "bg-gradient-to-t from-gold-600 to-gold-400"
              )}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {FORECAST_POINTS.map((p) => (
          <div key={p.label} className="flex-1 text-center">
            <p className="text-[10px] text-forest-900/50">{p.label}</p>
            {p.growth > 0 && (
              <p className="text-[9px] font-semibold text-forest-700">+{Math.round(p.growth * 100)}%</p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-forest-900/40">
        Aira&rsquo;s projection, based on comparable growth patterns in the region — not a guarantee or financial
        advice.
      </p>
    </div>
  );
}
