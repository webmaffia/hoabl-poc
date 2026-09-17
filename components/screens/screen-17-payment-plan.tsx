"use client";

import { useEffect, useMemo, useState } from "react";
import { ScreenShell } from "@/components/screen-shell";
import { TrustBadge } from "@/components/trust/trust-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { getPocketById } from "@/lib/data";
import { rankPockets } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn, formatLakh, formatINR, computeEmi } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

export function Screen17PaymentPlan() {
  const { activePocketId, next, buyerProfile, pocketPreferences, projectPockets } = useJourney();
  const { speak } = useAira();
  const [plan, setPlan] = useState<PlanType>("clp");
  const [bookingPct, setBookingPct] = useState(PLAN_RANGE.clp.default);

  const ranked = useMemo(
    () => rankPockets(projectPockets, buyerProfile, pocketPreferences),
    [projectPockets, buyerProfile, pocketPreferences]
  );
  const fallbackId = ranked[0]?.pocket.id;
  const pocket = getPocketById(activePocketId || fallbackId || "") || projectPockets[0];
  const price = pocket.price;

  const range = PLAN_RANGE[plan];
  const schedule = useMemo(() => buildSchedule(plan, bookingPct), [plan, bookingPct]);
  const dueNow = Math.round((price * bookingPct) / 100);
  const financed = price - dueNow;
  const emi = computeEmi(financed, 8.75, 15);

  useEffect(() => {
    speak(`Here's how payment works for ${pocket.name}. Pick a plan and I'll show you the schedule.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pocket.id]);

  const selectPlan = (p: PlanType) => {
    setPlan(p);
    setBookingPct(PLAN_RANGE[p].default);
  };

  const getMyPlan = () => {
    track("decision_summary_viewed");
    next();
  };

  useVoiceCommands([
    { labels: ["clp", "construction linked plan"], action: () => selectPlan("clp") },
    { labels: ["down payment", "downpayment"], action: () => selectPlan("downpayment") },
    { labels: ["subvention"], action: () => selectPlan("subvention") },
    { labels: ["get my plan", "secure this", "continue", "next"], action: getMyPlan },
  ]);

  return (
    <ScreenShell showStages={false} title="Payment plan">
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-5 pb-5 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{pocket.name}</p>
        <h1 className="mt-1 font-serif text-2xl text-forest-900">Choose your payment plan</h1>
        <p className="mt-1 text-sm text-forest-900/50">
          {formatLakh(price)} &middot; {pocket.sizeSqft.toLocaleString()} sq.ft.
        </p>

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
                Indicative only — not a loan approval or an offer. Rates vary by lender and profile; please consult
                your advisor.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5">
          <Button size="lg" className="w-full" onClick={getMyPlan}>
            Get my plan &amp; secure this &rarr;
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
}
