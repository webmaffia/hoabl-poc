"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, MessageCircle, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { POCKETS, PROJECT, getPocketById } from "@/lib/data";
import { rankPockets } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// A lightweight "send me my plan" moment — just name + mobile, not the full
// KYC form — that packages everything the buyer has already told Aira into
// a document and (in this demo) simulates delivering it over WhatsApp.
// Original design, inspired by the reference the user shared but built with
// this app's own data, avatar, and brand.

const PLAN_SECTIONS = (pocketName: string, projectName: string) => [
  "Your profile, restated",
  `${projectName} — the pockets that fit`,
  `${pocketName} — pricing, all-in`,
  "Payment schedule, with your chosen booking %",
  "Indicative EMI at a glance",
  "Trust check — verified vs. to-confirm facts",
  "Location & connectivity",
  "What happens if you want to exit",
  "Your advisor — direct line",
];

export function Screen15IdentityCapture() {
  const { next, buyerProfile, pocketPreferences, activePocketId } = useJourney();
  const { speak } = useAira();
  const [step, setStep] = useState<"capture" | "sending" | "sent">("capture");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sentAt, setSentAt] = useState<{ genSeconds: number; deliveredLabel: string } | null>(null);

  const ranked = useMemo(() => rankPockets(POCKETS, buyerProfile, pocketPreferences), [buyerProfile, pocketPreferences]);
  const pocket = getPocketById(activePocketId || "") || ranked[0]?.pocket || POCKETS[0];

  useEffect(() => {
    speak("So I can send this to you and we can pick up right where we left off — what's your name and mobile number?");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mobileValid = /^\d{10}$/.test(mobile);
  const canSend = name.trim().length > 0 && mobileValid && otpSent;

  const sendOtp = () => {
    if (!mobileValid) return;
    setOtpSent(true);
    track("identity_otp_sent");
  };

  const submit = () => {
    if (!canSend) return;
    track("identity_captured", { hasName: !!name.trim() });
    setStep("sending");
    const startedAt = Date.now();
    setTimeout(() => {
      const genSeconds = Math.round((Date.now() - startedAt) / 1000 + 5.2 * 10) / 10; // feels realistic without being slow to demo
      const deliveredLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setSentAt({ genSeconds, deliveredLabel });
      setStep("sent");
      track("plan_sent_whatsapp");
      speak("Sent — your plan is on its way to you on WhatsApp, in the same conversation as before.");
    }, 1200);
  };

  useVoiceCommands(
    step === "capture"
      ? [
          { labels: ["send otp"], action: sendOtp },
          { labels: ["verify", "send my plan", "continue", "next"], action: submit },
        ]
      : step === "sent"
      ? [{ labels: ["continue", "next", "what happens next"], action: next }]
      : []
  );

  return (
    <ScreenShell showStages title="Send my plan">
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-5 pb-5 pt-4">
        <AnimatePresence mode="wait">
          {step !== "sent" ? (
            <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Value moment</p>
              <h1 className="mt-1 text-balance font-serif text-2xl leading-tight text-forest-900">
                So I can send this to you and pick up where we left off.
              </h1>

              <div className="mt-4 flex items-center gap-3 rounded-xl2 border border-forest-900/8 bg-white p-3.5 shadow-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-800/8 text-forest-800">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-forest-900">
                    Your plan — {PROJECT.name}, {pocket.name}
                  </p>
                  <p className="truncate text-xs text-forest-900/50">
                    Matched pockets, pricing, payment schedule, trust documents.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-forest-900/60">Name</span>
                  <input
                    className="field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-forest-900/60">Mobile</span>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3.5 py-2.5",
                      otpSent ? "border-forest-700 bg-forest-700/5" : "border-forest-900/12 bg-white"
                    )}
                  >
                    <span className="text-sm text-forest-900/50">+91</span>
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm text-forest-900 outline-none"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value.replace(/\D/g, ""));
                        setOtpSent(false);
                      }}
                      placeholder="98204 41234"
                    />
                    {otpSent ? (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-forest-700">
                        OTP sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!mobileValid}
                        onClick={sendOtp}
                        className="shrink-0 text-xs font-semibold text-gold-600 disabled:opacity-30"
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                </label>
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-forest-900/40">
                <ShieldCheck className="h-3.5 w-3.5" /> Demo — no real OTP or message is sent.
              </p>

              <Button size="lg" className="mt-5 w-full" disabled={!canSend || step === "sending"} onClick={submit}>
                {step === "sending" ? "Sending…" : "Verify & send my plan →"}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-700 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <h1 className="font-serif text-xl text-forest-900">Sent. Promise kept.</h1>
              </div>
              {sentAt && (
                <p className="mt-1 text-[11px] text-forest-900/40">
                  Generated in {sentAt.genSeconds}s &middot; delivered {sentAt.deliveredLabel}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3 rounded-xl2 border border-forest-900/8 bg-white p-3.5 shadow-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-800/8 text-forest-800">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-forest-900">
                    {name || "Your"} — {PROJECT.name.replace(/\s+/g, "")} plan.pdf
                  </p>
                  <p className="text-xs text-forest-900/50">{PLAN_SECTIONS(pocket.name, PROJECT.name).length} pages &middot; built for your brief</p>
                </div>
              </div>

              <div className="mt-4 divide-y divide-forest-900/6 overflow-hidden rounded-xl2 border border-forest-900/8 bg-white shadow-card">
                {PLAN_SECTIONS(pocket.name, PROJECT.name).map((s, i) => (
                  <div key={s} className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-forest-900/80">
                    <span className="w-5 shrink-0 font-mono text-[11px] text-forest-900/30">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    {s}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl2 border border-forest-700/20 bg-forest-700/5 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-semibold text-forest-900">Delivered on WhatsApp</p>
                </div>
                <p className="mt-1.5 text-xs text-forest-900/60">
                  To +91 {mobile}, in this same conversation — still Aira, picking up where we left off.
                </p>
                <Button variant="secondary" size="sm" className="mt-3 w-full">
                  Continue on WhatsApp
                </Button>
              </div>

              <Button size="lg" className="mt-4 w-full" onClick={next}>
                What happens next &rarr;
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(12, 31, 23, 0.12);
          background: white;
          padding: 0.65rem 0.9rem;
          font-size: 0.9rem;
          color: #0c1f17;
        }
        .field:focus {
          outline: none;
          border-color: #235534;
        }
      `}</style>
    </ScreenShell>
  );
}
