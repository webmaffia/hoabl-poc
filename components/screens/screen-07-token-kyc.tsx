"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ShieldCheck, CreditCard, Landmark, Smartphone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { getPocketById } from "@/lib/data";
import { rankPockets } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const RESERVATION_SECONDS = 15 * 60;

function ReservationTimer() {
  const [seconds, setSeconds] = useState(RESERVATION_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;

  return (
    <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-gold-50 px-3 py-1.5 text-xs font-medium text-gold-700">
      <Clock className="h-3.5 w-3.5" />
      Your shortlisted pockets are held for {mm}:{ss.toString().padStart(2, "0")}
    </div>
  );
}

const BENEFITS = [
  "₹45,000 fully refundable as per applicable HoABL terms",
  "Locks in your chosen pocket at today's terms",
  "Complete KYC",
  "Hands you off to a HoABL advisor with full context",
  "Continue toward purchase after verification",
];

const KYC_CHECKLIST = ["PAN card", "Aadhaar card", "Address proof", "Selfie verification"];

type PayMethod = "upi" | "netbanking" | "card";

interface KycForm {
  fullName: string;
  pan: string;
  aadhaar: string;
  dob: string;
  mobile: string;
  email: string;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_REGEX = /^\d{4}\s?\d{4}\s?\d{4}$/;

export function Screen07TokenKyc() {
  const { next, dispatch, activePocketId, selectedProject, projectPockets, buyerProfile, pocketPreferences } = useJourney();
  const { speak } = useAira();
  const [step, setStep] = useState<"overview" | "kyc" | "payment">("overview");

  const ranked = useMemo(
    () => rankPockets(projectPockets, buyerProfile, pocketPreferences),
    [projectPockets, buyerProfile, pocketPreferences]
  );
  const pocket = getPocketById(activePocketId || "") || ranked[0]?.pocket || projectPockets[0];

  useEffect(() => {
    speak(
      `This fully refundable token locks in ${pocket.name} at ${selectedProject.name} for you, at today's price, while I walk you through a quick KYC — nobody else can book it out from under you in the meantime.`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Pre-filled with valid dummy data so the demo flow doesn't require typing
  // — passes the same validation as real input would.
  const [form, setForm] = useState<KycForm>({
    fullName: "Rahul Sharma",
    pan: "ABCDE1234F",
    aadhaar: "1234 5678 9012",
    dob: "1990-05-14",
    mobile: "9876543210",
    email: "rahul.sharma@example.com",
  });
  const [selfieDone, setSelfieDone] = useState(false);
  const [method, setMethod] = useState<PayMethod>("upi");
  const [touched, setTouched] = useState(false);

  const errors: Partial<Record<keyof KycForm, string>> = {};
  if (touched) {
    if (!form.fullName.trim()) errors.fullName = "Required";
    if (!PAN_REGEX.test(form.pan.toUpperCase())) errors.pan = "Format: ABCDE1234F";
    if (!AADHAAR_REGEX.test(form.aadhaar)) errors.aadhaar = "12-digit Aadhaar";
    if (!form.mobile.match(/^\d{10}$/)) errors.mobile = "10-digit mobile";
    if (!form.email.match(/^\S+@\S+\.\S+$/)) errors.email = "Valid email";
  }
  const kycValid =
    form.fullName.trim() &&
    PAN_REGEX.test(form.pan.toUpperCase()) &&
    AADHAAR_REGEX.test(form.aadhaar) &&
    form.mobile.match(/^\d{10}$/) &&
    form.email.match(/^\S+@\S+\.\S+$/) &&
    selfieDone;

  const startFlow = () => {
    track("token_cta_clicked");
    track("kyc_started");
    setStep("kyc");
    speak("Let's get your KYC out of the way quickly — name, PAN, Aadhaar, mobile, email, and a quick selfie check. It's a fast, standard verification, and nothing here is stored or sent anywhere in this demo.");
  };

  const submitKyc = () => {
    setTouched(true);
    if (!kycValid) return;
    track("kyc_completed");
    setStep("payment");
    speak(`KYC verified. All that's left is the ₹45,000 refundable token to lock in ${pocket.name} — pick whichever's fastest for you: UPI, net banking, or card.`);
  };

  const pay = () => {
    track("token_payment_started", { method });
    dispatch({ type: "SET_KYC", status: "verified" });
    dispatch({ type: "SET_PAYMENT", status: "processing" });
    next();
  };

  useVoiceCommands(
    step === "overview"
      ? [{ labels: ["pay", "start", "continue", "pay and complete kyc"], action: startFlow }]
      : step === "kyc"
      ? [{ labels: ["continue", "next", "submit", "continue to payment"], action: submitKyc }]
      : [
          { labels: ["upi"], action: () => setMethod("upi") },
          { labels: ["net banking", "netbanking", "bank"], action: () => setMethod("netbanking") },
          { labels: ["card", "credit card", "debit card"], action: () => setMethod("card") },
          { labels: ["pay", "pay now", "pay 45000"], action: pay },
        ]
  );

  return (
    <ScreenShell showBack={step === "overview"} showStages={false} title="Token & KYC">
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <AnimatePresence mode="wait">
          {step === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col">
              <h1 className="text-balance font-serif text-2xl leading-tight text-forest-900">
                Secure your chosen pocket
              </h1>

              <div className="mt-4 rounded-xl2 border border-forest-900/8 bg-white p-5 text-center shadow-card">
                <p className="font-serif text-4xl text-forest-900">₹45,000</p>
                <p className="mt-1 text-sm font-medium text-gold-600">Fully Refundable Token</p>
                <p className="mt-3 text-sm text-forest-900/60">
                  Pay ₹45,000 and complete KYC to lock in your pocket before you meet your advisor.
                </p>
                <ReservationTimer />
              </div>

              <div className="mt-4 flex-1 overflow-y-auto no-scrollbar">
                <ul className="space-y-2">
                  {BENEFITS.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-forest-900/80">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-800" />
                      {b}
                    </li>
                  ))}
                </ul>

                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-forest-900/40">KYC checklist</p>
                <div className="grid grid-cols-2 gap-2">
                  {KYC_CHECKLIST.map((k) => (
                    <div
                      key={k}
                      className="flex items-center gap-2 rounded-lg border border-forest-900/8 px-3 py-2 text-xs font-medium text-forest-900/80"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-forest-800/10 text-forest-800">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      {k}
                    </div>
                  ))}
                </div>

                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-forest-900/40">Payment methods</p>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-forest-800">
                  <span className="flex items-center gap-1.5 rounded-full bg-forest-800/8 px-3 py-1.5">
                    <Smartphone className="h-3 w-3" /> UPI
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-forest-800/8 px-3 py-1.5">
                    <Landmark className="h-3 w-3" /> Net Banking
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-forest-800/8 px-3 py-1.5">
                    <CreditCard className="h-3 w-3" /> Debit/Credit Card
                  </span>
                </div>
              </div>

              <Button size="lg" className="mt-4 w-full" onClick={startFlow}>
                Pay ₹45,000 &amp; Complete KYC &rarr;
              </Button>
              <p className="mt-2 text-center text-[11px] text-forest-900/40">
                Prototype/demo — no real payment will be processed.
              </p>
            </motion.div>
          )}

          {step === "kyc" && (
            <motion.div key="kyc" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex h-full flex-col">
              <div className="mb-1 flex items-center gap-1.5 text-forest-800">
                <ShieldCheck className="h-4 w-4" />
                <h1 className="font-serif text-xl text-forest-900">Complete your KYC</h1>
              </div>
              <p className="mb-4 text-xs text-forest-900/45">Demo form — nothing is submitted or stored.</p>

              <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pb-2">
                <Field label="Full name" error={errors.fullName}>
                  <input className="field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="As per PAN" />
                </Field>
                <Field label="PAN" error={errors.pan} hint="ABCDE1234F">
                  <input className="field uppercase" maxLength={10} value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
                </Field>
                <Field label="Aadhaar" error={errors.aadhaar} hint="XXXX XXXX 1234">
                  <input className="field" maxLength={14} value={form.aadhaar} onChange={(e) => setForm({ ...form, aadhaar: e.target.value })} placeholder="1234 5678 9012" />
                </Field>
                <Field label="Date of birth">
                  <input type="date" className="field field-date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                </Field>
                <Field label="Mobile" error={errors.mobile}>
                  <input className="field" maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} placeholder="9876543210" />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
                </Field>

                <button
                  onClick={() => setSelfieDone(true)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-card",
                    selfieDone ? "border-forest-800 bg-forest-800/5 text-forest-800" : "border-dashed border-forest-900/20 text-forest-900/60"
                  )}
                >
                  Selfie verification
                  <span>{selfieDone ? "Verification simulated ✓" : "Tap to simulate"}</span>
                </button>
              </div>

              <Button size="lg" className="mt-3 w-full" onClick={submitKyc}>
                Continue to payment &rarr;
              </Button>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div key="payment" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex h-full flex-col">
              <h1 className="font-serif text-xl text-forest-900">Pay the refundable token</h1>
              <p className="mt-1 text-sm text-forest-900/55">₹45,000 &middot; fully refundable</p>

              <div className="mt-5 space-y-2.5">
                <PayOption icon={Smartphone} label="UPI (Recommended)" active={method === "upi"} onClick={() => setMethod("upi")} />
                <PayOption icon={Landmark} label="Net Banking" active={method === "netbanking"} onClick={() => setMethod("netbanking")} />
                <PayOption icon={CreditCard} label="Debit / Credit Card" active={method === "card"} onClick={() => setMethod("card")} />
              </div>

              <div className="mt-auto flex items-center gap-1.5 pb-2 text-[11px] text-forest-900/40">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% secure &middot; Refundable &middot; Trusted &middot; Demo transaction
              </div>
              <Button size="lg" className="w-full" onClick={pay}>
                Pay ₹45,000 &rarr;
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .field {
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
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
        .field-date {
          -webkit-appearance: none;
          appearance: none;
          display: block;
        }
        .field-date::-webkit-date-and-time-value {
          text-align: left;
        }
        .field-date::-webkit-calendar-picker-indicator {
          margin-left: 0.5rem;
          padding: 0;
        }
      `}</style>
    </ScreenShell>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-forest-900/60">
        {label}
        {hint && <span className="text-forest-900/30">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-red-600">{error}</span>}
    </label>
  );
}

function PayOption({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
        active ? "border-forest-800 bg-forest-800/5 text-forest-900" : "border-forest-900/10 bg-white text-forest-900/70"
      )}
    >
      <Icon className="h-4 w-4 text-forest-800" />
      {label}
      {active && <Check className="ml-auto h-4 w-4 text-forest-800" />}
    </button>
  );
}
