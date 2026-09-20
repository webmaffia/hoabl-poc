"use client";

import { AnimatePresence, motion } from "framer-motion";
import { JourneyProvider, useJourney } from "@/lib/journey-context";
import { AiraProvider } from "@/lib/aira-context";
import { VoiceCommandProvider, useVoice } from "@/lib/voice-command-context";
import { DeviceFrame } from "@/components/device-frame";
import { AiraPanel } from "@/components/aira-panel";
import { AiraChatDock } from "@/components/aira-chat-dock";
import { AiraExpandedPanel } from "@/components/aira-expanded-panel";
import { AiraCtaBar } from "@/components/aira-cta-bar";
import { DemoControls } from "@/components/demo-controls";
import { cn } from "@/lib/utils";
import { Screen01Welcome } from "@/components/screens/screen-01-welcome";
import { Screen02BuyerProfile } from "@/components/screens/screen-02-buyer-profile";
import { Screen04ProjectMatch } from "@/components/screens/screen-04-project-match";
import { Screen05ProjectWalkthrough } from "@/components/screens/screen-05-project-walkthrough";
import { Screen07TokenKyc } from "@/components/screens/screen-07-token-kyc";
import { Screen08AccessUnlocked } from "@/components/screens/screen-08-access-unlocked";
import { Screen10PocketMap } from "@/components/screens/screen-10-pocket-map";
import { Screen11PocketDetail } from "@/components/screens/screen-11-pocket-detail";
import { Screen14AdvisorHandoff } from "@/components/screens/screen-14-advisor-handoff";
import { Screen15IdentityCapture } from "@/components/screens/screen-15-identity-capture";
import { Screen16SelectProject } from "@/components/screens/screen-16-select-project";
import { Screen17PaymentPlan } from "@/components/screens/screen-17-payment-plan";
import { Screen18AiProcessing } from "@/components/screens/screen-18-ai-processing";

const SCREEN_COMPONENTS = {
  welcome: Screen01Welcome,
  "buyer-profile": Screen02BuyerProfile,
  "project-match": Screen04ProjectMatch,
  "project-walkthrough": Screen05ProjectWalkthrough,
  "token-kyc": Screen07TokenKyc,
  "access-unlocked": Screen08AccessUnlocked,
  "pocket-map": Screen10PocketMap,
  "pocket-detail": Screen11PocketDetail,
  "payment-plan": Screen17PaymentPlan,
  "advisor-handoff": Screen14AdvisorHandoff,
  "identity-capture": Screen15IdentityCapture,
  "select-project": Screen16SelectProject,
  "ai-processing": Screen18AiProcessing,
} as const;

function JourneyScreen() {
  const { currentScreen } = useJourney();
  const { mode, avatarExpanded, callActive } = useVoice();
  const Screen = SCREEN_COMPONENTS[currentScreen];
  // Screen 1 already has Aira as a full-width hero (see Screen01Welcome) —
  // the floating draggable widget and mic/chat bar would be redundant
  // clutter over it, so they only appear from screen 2 onward.
  const showAiraControls = currentScreen !== "welcome";
  // "talk" (Aira full-screen) is the default everywhere Aira controls show.
  // Both chat and the expanded avatar (tapping the small floating widget)
  // take over the whole frame — the same full-screen "video call"
  // presentation as the opening profiling questions (see
  // Screen02BuyerProfile) — since both are meant to feel like talking to
  // Aira directly, not a small dock tacked onto the current screen.
  const chatFullScreen = showAiraControls && mode === "chat";
  const avatarFullScreen = showAiraControls && mode !== "chat" && avatarExpanded;
  // Pocket detail is presented as a full-screen popup (slide up, closed with
  // an explicit X) rather than the usual left/right screen-to-screen slide.
  const isPopup = currentScreen === "pocket-detail";

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative h-full w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={isPopup ? { opacity: 1, y: "100%" } : { opacity: 0, x: 24 }}
            animate={isPopup ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
            exit={isPopup ? { opacity: 1, y: "100%" } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={cn("no-scrollbar h-full w-full overflow-y-auto", showAiraControls && "pb-16")}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
        <DemoControls />
        {showAiraControls && (
          <>
            <AiraCtaBar />
            {!callActive && <AiraPanel />}
          </>
        )}
      </div>

      {avatarFullScreen && (
        <div className="absolute inset-0 z-40">
          <AiraExpandedPanel />
        </div>
      )}

      {chatFullScreen && (
        <div className="absolute inset-0 z-40">
          <AiraChatDock />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <JourneyProvider>
      <AiraProvider>
        <VoiceCommandProvider>
          <DeviceFrame>
            <JourneyScreen />
          </DeviceFrame>
        </VoiceCommandProvider>
      </AiraProvider>
    </JourneyProvider>
  );
}
