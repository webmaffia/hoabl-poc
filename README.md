# HoABL AI Land Advisor — Aira (Prototype)

An interactive, mobile-first product prototype for HoABL's AI-guided land decision
experience. This is **not** a property marketplace — it is a 14-screen guided journey
where "Aira," an AI land advisor, takes a post-sales-call customer from understanding
a project through pocket selection, trade-off comparison, and decision confidence,
before handing off to a human HoABL advisor with full context.

This is a **clickable demo**. No real payments, no real KYC submission, no real land
purchase — everything is simulated with local, in-memory state.

## 1. What was built

The complete 14-screen golden path, in the required order, all with working CTAs and
no dead ends:

1. Welcome (after sales call)
2. AI buyer profile (conversational, not a form)
3. Buyer profile summary
4. AI project match ("Aira recommends Project X")
5. Project walkthrough (7 guided sections: location, connectivity, development vision,
   amenities, land layout, pocket logic, things to consider)
6. Land layout & preview (locked plot-level detail, pre-token)
7. ₹45,000 refundable token + mock KYC
8. Simulated KYC/payment success → access unlocked
9. AI pocket finder (choose up to 3 preferences)
10. AI pocket map (My matches / All pockets / Infrastructure tabs, legend, tappable pockets)
11. Pocket detail (profile suitability score, strengths, trade-offs, trust labels)
12. Compare pockets (2–3 side by side, Aira's transparent take)
13. Decision confidence (+ concern flow + decision summary)
14. Human advisor handoff (auto-shared context, no "please repeat yourself")

Also built:

- **A persistent, always-on Aira** (`lib/aira-context.tsx` + `components/aira-panel.tsx`)
  — one HeyGen LiveAvatar session for the whole journey, pinned at the top of every
  screen (never torn down/reconnected between screens), with a live/connecting/fallback
  status pill, a speaking-ring animation, and a caption line. Every screen just calls
  `useAira().speak("...")` — Aira genuinely narrates the journey rather than sitting in
  a one-off card per screen.
- **A real chat-style buyer profile** (screen 2): a scrolling message thread with
  typing indicators and bubbles, not a step-by-step form — Aira asks, you tap a chip,
  your answer appears as a chat bubble, Aira "types" the next question.
- A **trust layer** (`components/trust/*`): `TrustBadge`, `VerifiedInfo`,
  `AIInterpretation`, `ConfirmWithHoabl` — used throughout so Aira never sounds more
  certain than the underlying (fictional, demo) data actually is.
- A deterministic **profile-suitability scoring engine** (`lib/recommendation.ts`) —
  explicitly labeled "profile suitability," never a financial prediction.
- **Sales-engine / demand signals** (`components/urgency-badge.tsx`,
  `lib/urgency.ts`): a "Only N plots left" badge driven by each pocket's real
  `availability`/`plotsLeft` state (not fabricated), a gently-ticking "N viewing now"
  demo signal, a reservation countdown on the token/KYC screen, and a demand banner on
  the land-layout preview — tasteful pressure, not casino-style urgency.
- 8 fictional demo pockets across 4 zones with price, size, access, privacy, amenity
  proximity, view, trade-offs and verified facts (`lib/data.ts`).
- A lightweight **analytics abstraction** (`lib/analytics.ts`) logging every event in
  the funnel from `sales_call_completed` through `advisor_handoff_clicked`.
- A discreet **Demo Mode** control (bottom-right gear icon) with **Reset demo**.
- Desktop presentation: a centered phone-frame view of the mobile app with journey
  context alongside it; the phone-first UI expands full-bleed below `lg` breakpoint.

## 2. How to run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000 (Next.js will pick the next free port if 3000 is busy).

To build for production:

```bash
npm run build
npm run start
```

> **Windows/PowerShell users:** if your shell has `NODE_ENV` permanently set to
> `production` (some environments do), `next dev` will misbehave (Tailwind won't
> compile). If you see a 500 error mentioning `globals.css`, run:
> `$env:NODE_ENV = 'development'; npm run dev` (PowerShell) or
> `NODE_ENV=development npm run dev` (bash).

## 3. Environment variables

Copy `.env.local.example` to `.env.local`:

```
HEYGEN_API_KEY=
HEYGEN_AVATAR_ID=
HEYGEN_SANDBOX=true
```

All are optional. The app runs fully without them (Aira falls back to the local
animated portrait). **Note both vars are server-only (no `NEXT_PUBLIC_` prefix) — see
below for why, and for where each value comes from.**

## 4. How the HeyGen integration works

Aira is powered by **HeyGen's LiveAvatar Web SDK** (`@heygen/liveavatar-web-sdk`,
https://docs.liveavatar.com) — the actively-maintained product HeyGen has been
migrating developers to (the older "Interactive Avatar" `@heygen/streaming-avatar`
package is deprecated and, as of this build, ships with no actual code on npm, so it
was not usable).

**Where credentials come from:** create an avatar and grab an API key at
https://app.liveavatar.com/developers — **this is a different dashboard/account than
the classic app.heygen.com Enterprise streaming API**, so a key from there won't work
here. `HEYGEN_AVATAR_ID` is the UUID of the avatar you create in that dashboard.

**Why no `NEXT_PUBLIC_` vars:** both the API key and avatar id are read only inside
`app/api/heygen/token/route.ts`, a server route. On mount, the client
(`lib/aira-context.tsx`) calls that route, which does:

```
POST https://api.liveavatar.com/v1/sessions/token
headers: { "X-API-KEY": HEYGEN_API_KEY }
body:    { mode: "FULL", avatar_id: HEYGEN_AVATAR_ID, is_sandbox }
```

and returns only the resulting short-lived `session_token` to the browser — the real
key never ships in client JS. The client then does:

```ts
const session = new LiveAvatarSession(sessionToken);
session.on(SessionEvent.SESSION_STREAM_READY, () => session.attach(videoEl));
await session.start();
session.repeat("text for Aira to say");   // called from useAira().speak()
await session.stop();                     // on unmount
```

We request `mode: "FULL"` but deliberately omit `llm_configuration_id` — Aira's
"brain" here is this app's own scripted screen content, not a HeyGen-hosted LLM
agent; we only use the session to puppet the avatar's video/voice via `.repeat(text)`,
relying on the avatar's built-in default voice for text-to-speech.

**Note:** an earlier version of this integration used `mode: "LITE"`, which looked
right (no agent config needed, simplest option) but is actually the wrong choice for
this use case — LiveAvatar's own docs describe LITE mode as "you handle the
conversational orchestration — STT, LLM, TTS" (bring your own ElevenLabs/OpenAI/Gemini
voice pipeline). With no such pipeline attached, `.repeat(text)` sent successfully with
zero errors but produced no audio at all (confirmed by measuring the actual WebRTC
audio track). `FULL` mode is the one with a documented "default avatar voice" used
automatically when no `voice_id` is set — that's what actually produces speech.

If the token route 501s (no key configured) or the session fails to connect for any
reason, `lib/aira-context.tsx` catches it and flips to `status: "fallback"` — the
persistent `<AiraPanel />` then shows the local animated portrait instead. The app
never breaks without HeyGen credentials, and every screen calls the same
`useAira().speak(text)` regardless of which mode is active.

Credentials are never hardcoded — they only ever come from `process.env.HEYGEN_API_KEY`
/ `process.env.HEYGEN_AVATAR_ID`, read server-side only.

## 5. Where mock KYC/payment logic lives

Both live entirely client-side in
`components/screens/screen-07-token-kyc.tsx`:

- **KYC**: a local form (`fullName`, `pan`, `aadhaar`, `dob`, `mobile`, `email`) with
  regex-based mock validation (PAN: `ABCDE1234F` pattern, Aadhaar: 12 digits) and a
  "Selfie verification" button that just flips a boolean — labeled "Verification
  simulated." Nothing is sent anywhere.
- **Payment**: a method picker (UPI / Net Banking / Card) with a "Pay ₹45,000 →"
  button. Clicking it dispatches `SET_KYC: verified` and `SET_PAYMENT: processing`,
  then advances to `screen-08-access-unlocked.tsx`, which runs a timed sequence (KYC
  verification → Payment processing → Payment successful → Access unlocked) purely
  with `setTimeout` and local component state, then marks `SET_PAYMENT: completed`.
- Every payment/KYC screen is explicitly labeled "Demo transaction" / "Prototype/demo"
  in the UI.

Journey-wide state (buyer profile, KYC/payment status, shortlist, comparisons,
concerns, confidence, etc.) lives in `lib/journey-context.tsx`, a single React
Context + `useReducer` — intentionally dependency-free for a POC of this size.

## 6. Replacing mock payment with a real provider later

1. Swap the `pay()` handler in `screen-07-token-kyc.tsx` for a real checkout call
   (e.g. Razorpay order creation via a server route you'd add under `app/api/`).
2. Replace the client-only `SET_PAYMENT`/`SET_KYC` dispatches with state driven by
   webhook/callback confirmation instead of a local timer.
3. Keep `screen-08-access-unlocked.tsx`'s UI (the step sequence) — just drive its
   `stepIdx` from real async status instead of the demo `setTimeout` loop.
4. Route KYC data server-side to your actual KYC provider (e.g. Digilocker/PAN
   verification APIs) instead of the local regex checks.

## 7. How analytics events are structured

`lib/analytics.ts` exports `track(event, properties?)`. Every event is timestamped
and pushed into an in-memory log (`getEvents()`), and also `console.log`'d in the
browser so you can watch the funnel live while clicking through the demo. The full
event vocabulary (from `sales_call_completed` to `advisor_handoff_clicked`) is typed
as the `AnalyticsEvent` union, so adding a new event is a one-line type change.

To go to production analytics, replace the body of `track()` with a call to
PostHog/GA/Segment — every call site in the screens stays the same.

## Known npm audit findings

`npm audit` will report a couple of high/critical advisories against `next@14.2.35`
(self-hosted server-side issues — image optimizer, request smuggling, etc. — see
https://nextjs.org/blog/security-update-2025-12-11) and its bundled `postcss`. Fixing
them requires a Next.js 15/16 major upgrade, which is out of scope for this POC (it
would touch App Router internals across all 14 screens). Not a concern for local
`npm run dev` use; flag before any real deployment.

## Design notes

- Palette: deep forest green (`forest-*`), warm ivory (`ivory-*`), and a restrained
  gold accent (`gold-*`) — defined in `tailwind.config.ts`.
- The trust layer is the most important structural idea in this prototype: every
  Aira claim is tagged **Verified**, **Aira's interpretation**, or **Confirm with
  HoABL** — Aira is never allowed to sound more certain than the underlying (demo)
  data.
- All project/pocket data in `lib/data.ts` is explicitly fictional demo content.
