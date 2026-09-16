"use client";

import React from "react";
import { HOABL_LOGO_URL } from "@/lib/brand";

export function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-forest-950 lg:flex lg:items-center lg:justify-center lg:py-10">
      {/* Desktop presentation: journey context + phone + info panel */}
      <div className="hidden lg:flex lg:w-full lg:max-w-6xl lg:items-center lg:justify-center lg:gap-10 lg:px-8">
        <aside className="w-64 shrink-0 text-ivory-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HOABL_LOGO_URL} alt="The House of Abhinandan Lodha" className="mb-3 h-11 w-auto" />
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            AI Prototype
          </div>
          <h1 className="font-serif text-2xl leading-tight text-ivory-50">
            AI Land Advisor
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ivory-200/70">
            An AI-guided land decision experience. Aira helps a buyer understand a
            project, find the right pocket, see trade-offs clearly, and hand off to
            a human advisor with full context.
          </p>
          <div className="mt-6 space-y-2 text-xs text-ivory-200/50">
            <p>This is a clickable product prototype.</p>
            <p>No real payments. No real KYC. No real transactions.</p>
          </div>
        </aside>

        <div className="relative">
          <div className="relative rounded-[2.5rem] border-[10px] border-forest-900 bg-forest-900 shadow-elevated">
            <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-forest-900" />
            <div className="h-[812px] w-[375px] overflow-hidden rounded-[1.75rem] bg-ivory-100">
              {children}
            </div>
          </div>
        </div>

        <aside className="w-64 shrink-0" />
      </div>

      {/* Mobile / small viewport: full-bleed app */}
      <div className="h-dvh w-full bg-ivory-100 lg:hidden">{children}</div>
    </div>
  );
}
