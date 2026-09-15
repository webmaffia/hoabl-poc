"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiraOrb } from "@/components/aira-orb";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { track } from "@/lib/analytics";

const BENEFITS = [
  "Understand the project clearly",
  "Explore the right project",
  "Find suitable pockets",
  "Make a confident decision",
];

export function Screen01Welcome() {
  const { next } = useJourney();
  const { speak } = useAira();

  useEffect(() => {
    speak(
      "I'll understand what you're looking for, explore the relevant project with you, and help you evaluate the right pocket."
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    track("sales_call_completed");
    track("aira_started");
    next();
  };

  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto"
      >
        <AiraOrb size={112} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-5 text-center"
      >
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
          HoABL &middot; Land for a better tomorrow
        </div>
        <h1 className="text-balance font-serif text-[26px] leading-[1.15] text-forest-900">
          You&rsquo;ve spoken with our advisor. Now let Aira help you take the next step.
        </h1>
      </motion.div>

      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-8 space-y-3"
      >
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-2.5 text-[15px] text-forest-900/85">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-800/10 text-forest-800">
              <Check className="h-3 w-3" />
            </span>
            {b}
          </li>
        ))}
      </motion.ul>

      <div className="mt-auto pt-8">
        <Button size="lg" className="w-full" onClick={handleStart}>
          Start with Aira &rarr;
        </Button>
        <p className="mt-3 text-center text-xs text-forest-900/45">No commitment. Just clarity.</p>
      </div>
    </div>
  );
}
