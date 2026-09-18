"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Download, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface BrochureModalProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  brochureUrl: string;
}

// Downloads the brochure PDF that already lives in public/ — same file the
// video/hero-image fallback pattern in the walkthrough screen uses, just
// triggered as a download instead of rendered inline.
function downloadBrochure(url: string, projectName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-brochure.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function BrochureModal({ open, onClose, projectName, brochureUrl }: BrochureModalProps) {
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const mobileValid = /^\d{10}$/.test(mobile);

  const close = () => {
    onClose();
    setTimeout(() => {
      setMobile("");
      setSubmitting(false);
      setDone(false);
    }, 200);
  };

  const submit = () => {
    if (!mobileValid || submitting) return;
    track("brochure_mobile_submitted", { project: projectName });
    setSubmitting(true);
    // Demo — no real lead API yet; simulates a brief verification delay
    // before handing over the file, matching the identity-capture screen's pattern.
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      downloadBrochure(brochureUrl, projectName);
      track("brochure_downloaded", { project: projectName, mobile });
    }, 900);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex items-end justify-center bg-forest-950/50 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-md rounded-t-3xl border border-forest-900/8 bg-white p-5 pb-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
                {done ? "Brochure ready" : "Download brochure"}
              </p>
              <button
                type="button"
                onClick={close}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-900/5 text-forest-900/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!done ? (
              <>
                <h2 className="mt-1.5 text-balance font-serif text-xl leading-tight text-forest-900">
                  Get the {projectName} brochure on your number
                </h2>
                <p className="mt-1 text-sm text-forest-900/60">
                  Enter your mobile number to download the brochure PDF.
                </p>

                <label className="mt-4 block">
                  <span className="mb-1 block text-xs font-medium text-forest-900/60">Mobile</span>
                  <div className="flex items-center gap-2 rounded-xl border border-forest-900/12 bg-white px-3.5 py-2.5">
                    <span className="text-sm text-forest-900/50">+91</span>
                    <input
                      className="min-w-0 flex-1 bg-transparent text-base text-forest-900 outline-none"
                      maxLength={10}
                      inputMode="numeric"
                      autoFocus
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="98204 41234"
                    />
                  </div>
                </label>

                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-forest-900/40">
                  <ShieldCheck className="h-3.5 w-3.5" /> We'll only use this to share the brochure.
                </p>

                <Button
                  size="lg"
                  className="mt-5 w-full"
                  disabled={!mobileValid || submitting}
                  onClick={submit}
                >
                  {submitting ? (
                    "Preparing your brochure…"
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Download brochure
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-2 py-4 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-700 text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold text-forest-900">Your brochure is downloading</p>
                <p className={cn("text-xs text-forest-900/50")}>Sent to +91 {mobile}</p>
                <Button size="md" variant="outline" className="mt-3 w-full" onClick={close}>
                  Done
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
