"use client";

import { AnimatePresence, motion } from "framer-motion";
import { JourneyProvider, useJourney } from "@/lib/journey-context";
import { AiraProvider } from "@/lib/aira-context";
import { VoiceCommandProvider, useVoice } from "@/lib/voice-command-context";
import { DeviceFrame } from "@/components/device-frame";
import { AiraPanel } from "@/components/aira-panel";
import { AiraChatDock } from "@/components/aira-chat-dock";
import { AiraCtaBar } from "@/components/aira-cta-bar";
import { DemoControls } from "@/components/demo-controls";
import { cn } from "@/lib/utils";
import { Screen01Welcome } from "@/components/screens/screen-01-welcome";
import { Screen02BuyerProfile } from "@/components/screens/screen-02-buyer-profile";
import { Screen03ProfileSummary } from "@/components/screens/screen-03-profile-summary";
import { Screen04ProjectMatch } from "@/components/screens/screen-04-project-match";
import { Screen05ProjectWalkthrough } from "@/components/screens/screen-05-project-walkthrough";
import { Screen07TokenKyc } from "@/components/screens/screen-07-token-kyc";
import { Screen08AccessUnlocked } from "@/components/screens/screen-08-access-unlocked";
import { Screen09PocketFinder } from "@/components/screens/screen-09-pocket-finder";
import { Screen10PocketMap } from "@/components/screens/screen-10-pocket-map";
import { Screen11PocketDetail } from "@/components/screens/screen-11-pocket-detail";
import { Screen12ComparePockets } from "@/components/screens/screen-12-compare-pockets";
import { Screen13DecisionConfidence } from "@/components/screens/screen-13-decision-confidence";
import { Screen14AdvisorHandoff } from "@/components/screens/screen-14-advisor-handoff";
import { Screen15IdentityCapture } from "@/components/screens/screen-15-identity-capture";
import { Screen16SelectProject } from "@/components/screens/screen-16-select-project";
import { Screen18AiProcessing } from "@/components/screens/screen-18-ai-processing";

const SCREEN_COMPONENTS = {
  welcome: Screen01Welcome,
  "buyer-profile": Screen02BuyerProfile,
  "profile-summary": Screen03ProfileSummary,
  "project-match": Screen04ProjectMatch,
  "project-walkthrough": Screen05ProjectWalkthrough,
  "token-kyc": Screen07TokenKyc,
  "access-unlocked": Screen08AccessUnlocked,
  "pocket-finder": Screen09PocketFinder,
  "pocket-map": Screen10PocketMap,
  "pocket-detail": Screen11PocketDetail,
  "compare-pockets": Screen12ComparePockets,
  "decision-confidence": Screen13DecisionConfidence,
  "advisor-handoff": Screen14AdvisorHandoff,
  "identity-capture": Screen15IdentityCapture,
  "select-project": Screen16SelectProject,
  "ai-processing": Screen18AiProcessing,
} as const;

function JourneyScreen() {
  const { currentScreen } = useJourney();
  const { mode } = useVoice();
  const Screen = SCREEN_COMPONENTS[currentScreen];
  // Screen 1 already has Aira as a full-width hero (see Screen01Welcome) —
  // the floating draggable widget and mic/chat bar would be redundant
  // clutter over it, so they only appear from screen 2 onward.
  const showAiraControls = currentScreen !== "welcome";
  // "talk" (Aira full-screen) is the default everywhere Aira controls show;
  // the 50/50 chat split is only entered when the user explicitly opts in.
  const splitForChat = showAiraControls && mode === "chat";

  return (
    <div className="flex h-full w-full flex-col">
      <div className={cn("relative w-full overflow-hidden transition-[height] duration-300", splitForChat ? "h-1/2" : "h-full")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
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
            <AiraPanel />
          </>
        )}
      </div>

      {splitForChat && (
        <div className="h-1/2 w-full">
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
