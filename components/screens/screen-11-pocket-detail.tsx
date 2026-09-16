"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, GitCompare, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { TrustBadge } from "@/components/trust/trust-badge";
import { VerifiedInfo, ConfirmWithHoabl } from "@/components/trust/trust-sections";
import { LiveViewerBadge, ScarcityBadge } from "@/components/urgency-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { POCKETS, getPocketById } from "@/lib/data";
import { rankPockets } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn, formatLakh, formatINR, computeEmi } from "@/lib/utils";

export function Screen11PocketDetail() {
  const { activePocketId, dispatch, goTo, buyerProfile, pocketPreferences, shortlistedPockets } = useJourney();
  const { speak } = useAira();

  const ranked = useMemo(() => rankPockets(POCKETS, buyerProfile, pocketPreferences), [buyerProfile, pocketPreferences]);
  const fallbackId = ranked[0]?.pocket.id;
  const pocketId = activePocketId || fallbackId;
  const pocket = getPocketById(pocketId || "") || POCKETS[0];
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

  const compare = () => {
    dispatch({ type: "SET_COMPARED", ids: Array.from(new Set([pocket.id, ...ranked.slice(0, 3).map((r) => r.pocket.id)])).slice(0, 3) });
    track("pocket_compared", { pocketId: pocket.id });
    goTo("compare-pockets");
  };

  useVoiceCommands([
    { labels: ["shortlist", "save", "like"], action: shortlist },
    { labels: ["compare", "compare pockets"], action: compare },
    { labels: ["view on map", "map", "back to map"], action: () => goTo("pocket-map") },
  ]);

  return (
    <ScreenShell showStages={false} title="Pocket detail">
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
        </motion.div>

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

        <PaymentPlan price={pocket.price} />

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

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Button variant="outline" onClick={() => goTo("pocket-map")}>
            <Map className="h-4 w-4" /> View on map
          </Button>
          <Button onClick={compare}>
            <GitCompare className="h-4 w-4" /> Compare
          </Button>
        </div>
      </div>
    </ScreenShell>
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

type PlanType = "clp" | "downpayment" | "subvention";

const PLAN_LABELS: Record<PlanType, string> = {
  clp: "CLP",
  downpayment: "Down payment",
  subvention: "Subvention",
};

const PLAN_RANGE: Record<PlanType, { min: number; max: number; default: number }> = {
  clp: { min: 10, max: 40, default: 20 },
  downpayment: { min: 50, max: 90, default: 60 },
  subvention: { min: 10, max: 30, default: 20 },
};

const PLAN_NOTE: Record<PlanType, string> = {
  clp: "Paid in stages as construction and infrastructure progress.",
  downpayment: "Most of the amount is paid upfront, ahead of agreement registration.",
  subvention: "The developer covers interest on the financed portion until possession, under this scheme.",
};

function buildSchedule(plan: PlanType, bookingPct: number): { label: string; pct: number }[] {
  if (plan === "downpayment") {
    return [
      { label: "On booking", pct: bookingPct },
      { label: "Balance before registration", pct: 100 - bookingPct },
    ];
  }
  if (plan === "subvention") {
    return [
      { label: "On booking", pct: bookingPct },
      { label: "On possession", pct: 100 - bookingPct },
    ];
  }
  // Construction Linked Plan: booking % is adjustable, the remaining stages
  // scale proportionally to their original weights (registration 15,
  // development 25, infrastructure 20, possession 20 — summing to 80 at the
  // default 20% booking), with rounding remainder absorbed into the last
  // stage so the total always reconciles to exactly 100%.
  const rest = 100 - bookingPct;
  const weights = [15, 25, 20, 20];
  const scaled = weights.map((w) => Math.round((w / 80) * rest));
  scaled[scaled.length - 1] += rest - scaled.reduce((a, b) => a + b, 0);
  const [registration, development, infra, possession] = scaled;
  return [
    { label: "On booking", pct: bookingPct },
    { label: "Agreement registration", pct: registration },
    { label: "Land development", pct: development },
    { label: "Infrastructure", pct: infra },
    { label: "On possession", pct: possession },
  ];
}

function PaymentPlan({ price }: { price: number }) {
  const [plan, setPlan] = useState<PlanType>("clp");
  const [bookingPct, setBookingPct] = useState(PLAN_RANGE.clp.default);

  const range = PLAN_RANGE[plan];
  const schedule = useMemo(() => buildSchedule(plan, bookingPct), [plan, bookingPct]);
  const dueNow = Math.round((price * bookingPct) / 100);
  const financed = price - dueNow;
  const emi = computeEmi(financed, 8.75, 15);

  const selectPlan = (p: PlanType) => {
    setPlan(p);
    setBookingPct(PLAN_RANGE[p].default);
  };

  useVoiceCommands([
    { labels: ["clp", "construction linked plan"], action: () => selectPlan("clp") },
    { labels: ["down payment", "downpayment"], action: () => selectPlan("downpayment") },
    { labels: ["subvention"], action: () => selectPlan("subvention") },
  ]);

  return (
    <div className="mt-5 rounded-xl2 border border-forest-900/8 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-forest-900/45">Payment plan</span>
        <TrustBadge kind="interpretation" />
      </div>

      <div className="flex rounded-full bg-forest-900/5 p-1">
        {(Object.keys(PLAN_LABELS) as PlanType[]).map((p) => (
          <button
            key={p}
            onClick={() => selectPlan(p)}
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
              plan === p ? "bg-white text-forest-900 shadow-card" : "text-forest-900/45"
            )}
          >
            {PLAN_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-forest-900/50">Payment on booking</span>
          <span className="font-serif text-lg text-forest-900">{bookingPct}%</span>
        </div>
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={5}
          value={bookingPct}
          onChange={(e) => setBookingPct(Number(e.target.value))}
          className="w-full accent-gold-500"
        />
        <div className="flex justify-between text-[10px] text-forest-900/35">
          <span>{range.min}%</span>
          <span>{range.max}%</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-forest-900/5 px-3 py-2.5">
        <span className="text-sm font-medium text-forest-900/70">Due now</span>
        <span className="font-serif text-lg text-forest-900">{formatINR(dueNow)}</span>
      </div>

      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-forest-900/40">
        {PLAN_LABELS[plan]} schedule
      </p>
      <div className="space-y-1.5">
        {schedule.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-sm">
            <span className="text-forest-900/75">{s.label}</span>
            <span className="flex items-baseline gap-2">
              <span className="text-xs text-forest-900/40">{s.pct}%</span>
              <span className="font-medium text-forest-900">{formatINR(Math.round((price * s.pct) / 100))}</span>
            </span>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between border-t border-forest-900/8 pt-1.5 text-sm font-semibold">
          <span className="text-forest-900">Total</span>
          <span className="text-forest-900">{formatLakh(price)}</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-forest-900/40">{PLAN_NOTE[plan]}</p>

      {financed > 0 && (
        <div className="mt-4 rounded-xl border border-forest-800/15 bg-forest-800/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forest-900/45">Indicative EMI</p>
          <p className="mt-0.5 font-serif text-2xl text-forest-900">
            {formatINR(emi)} <span className="font-sans text-sm font-normal text-forest-900/50">/ month</span>
          </p>
          <p className="mt-1 text-[11px] text-forest-900/50">
            On {formatLakh(financed)} financed &middot; 15 years &middot; 8.75%
          </p>
          <p className="mt-1 text-[10px] text-forest-900/35">
            Indicative only — not a loan approval or an offer. Rates vary by lender and profile; please consult your
            advisor.
          </p>
        </div>
      )}
    </div>
  );
}
