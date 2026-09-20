"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, ShieldCheck, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { getPocketById } from "@/lib/data";
import { rankPockets } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// A lightweight "send me my plan" moment — just name + mobile, not the full
// KYC form — that packages everything the buyer has already told Aira into
// a document and (in this demo) simulates delivering it over WhatsApp.
// One screen throughout: the code-box input appears inline once a code is
// sent, rather than navigating to a separate step.

const OTP_LENGTH = 6;
const DEMO_OTP = "123456";

export function Screen15IdentityCapture() {
  const { next, buyerProfile, pocketPreferences, activePocketId, selectedProject, projectPockets } = useJourney();
  const { speak } = useAira();
  const [step, setStep] = useState<"idle" | "sending">("idle");
  const [showSentToast, setShowSentToast] = useState(false);
  // Pre-filled with valid dummy data so the demo flow doesn't require typing.
  const [name, setName] = useState("Rohan Kulkarni");
  const [mobile, setMobile] = useState("9820441234");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const ranked = useMemo(
    () => rankPockets(projectPockets, buyerProfile, pocketPreferences),
    [projectPockets, buyerProfile, pocketPreferences]
  );
  const pocket = getPocketById(activePocketId || "") || ranked[0]?.pocket || projectPockets[0];

  useEffect(() => {
    speak("So I can send this to you and we can pick up right where we left off — what's your name and mobile number?");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mobileValid = /^\d{10}$/.test(mobile);
  const nameValid = name.trim().length > 0;
  const otpValue = otp.join("");
  const otpComplete = otpValue.length === OTP_LENGTH;

  const sendCode = () => {
    if (!mobileValid || !nameValid) return;
    track("identity_otp_sent");
    setOtpSent(true);
    speak("Sending your verification code now — it'll auto-fill in just a second, no need to type anything.");
    // Simulate the code arriving and auto-filling, digit by digit, the way a
    // real SMS auto-read would — rather than making the buyer type it in.
    DEMO_OTP.split("").forEach((digit, i) => {
      setTimeout(() => {
        setOtp((prev) => {
          const next = [...prev];
          next[i] = digit;
          return next;
        });
      }, 700 + i * 140);
    });
  };

  const handleMobileChange = (value: string) => {
    setMobile(value.replace(/\D/g, ""));
    setOtpSent(false);
    setOtp(Array(OTP_LENGTH).fill(""));
  };

  const handleOtpChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const submit = () => {
    if (!otpComplete || step === "sending") return;
    track("identity_captured", { hasName: !!name.trim() });
    setStep("sending");
    setTimeout(() => {
      track("plan_sent_whatsapp");
      speak("Sent — your plan is on its way to you on WhatsApp, in the same conversation as before.");
      setShowSentToast(true);
      setTimeout(next, 1600);
    }, 1200);
  };

  useEffect(() => {
    if (otpComplete) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue]);

  useVoiceCommands([
    { labels: ["send otp", "send code"], action: sendCode },
    { labels: ["verify", "send my plan", "continue", "next"], action: submit },
  ]);

  return (
    <ScreenShell showStages title="Send my plan">
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-7 pb-5 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex w-full max-w-[320px] flex-col items-center text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-800/8 text-forest-800">
            <Smartphone className="h-6 w-6" />
          </span>

          <h1 className="mt-4 text-balance font-serif text-2xl leading-tight text-forest-900">
            Let&rsquo;s get your plan to you
          </h1>
          <p className="mt-1.5 text-sm text-forest-900/50">
            Add your details and we&rsquo;ll text you a quick code to confirm it&rsquo;s you.
          </p>

          <div className="mt-5 flex w-full items-center gap-3 rounded-xl2 border border-forest-900/8 bg-white p-3.5 text-left shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-800/8 text-forest-800">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-forest-900">
                Your plan — {selectedProject.name}, {pocket.name}
              </p>
              <p className="text-xs leading-snug text-forest-900/50">
                Matched pockets, pricing, payment schedule, trust documents.
              </p>
            </div>
          </div>

          <div className="mt-5 w-full space-y-3 text-left">
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
              <span className="mb-1 block text-xs font-medium text-forest-900/60">Mobile number</span>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3.5 py-2.5",
                  otpSent ? "border-forest-700 bg-forest-700/5" : "border-forest-900/12 bg-white"
                )}
              >
                <span className="text-sm text-forest-900/50">+91</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-base text-forest-900 outline-none"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="98204 41234"
                />
                {otpSent ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-forest-700">
                    Code sent
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!mobileValid || !nameValid}
                    onClick={sendCode}
                    className="shrink-0 text-xs font-semibold text-gold-600 disabled:opacity-30"
                  >
                    Send code
                  </button>
                )}
              </div>
            </label>
          </div>

          <AnimatePresence>
            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full overflow-hidden"
              >
                <div className="mt-5">
                  <span className="mb-1 block text-left text-xs font-medium text-forest-900/60">Verification code</span>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        className={cn(
                          "h-12 w-10 rounded-xl border text-center text-lg font-semibold text-forest-900 outline-none transition-colors",
                          digit ? "border-forest-700 bg-forest-700/5" : "border-forest-900/15 bg-white"
                        )}
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        disabled={step === "sending"}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-forest-900/40">
                    {otpComplete ? "Verified automatically." : "Auto-verifying via SMS…"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-forest-900/40">
            <ShieldCheck className="h-3.5 w-3.5" /> Demo — no real code or message is sent.
          </p>

          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={!otpSent || !otpComplete || step === "sending"}
            onClick={submit}
          >
            {step === "sending" ? "Verifying…" : "Verify & send my plan →"}
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showSentToast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="absolute inset-x-5 bottom-20 z-20 flex items-center gap-2.5 rounded-2xl border border-forest-700/20 bg-forest-900 px-4 py-3 shadow-elevated"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ivory-50">Plan sent successfully</p>
              <p className="truncate text-xs text-ivory-100/60">Delivered on WhatsApp to +91 {mobile}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(12, 31, 23, 0.12);
          background: white;
          padding: 0.65rem 0.9rem;
          font-size: 16px;
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
