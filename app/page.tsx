"use client";

import { AnimatePresence, motion } from "framer-motion";
import { JourneyProvider, useJourney } from "@/lib/journey-context";
import { AiraProvider } from "@/lib/aira-context";
import { DeviceFrame } from "@/components/device-frame";
import { AiraPanel } from "@/components/aira-panel";
import { DemoControls } from "@/components/demo-controls";
import { Screen01Welcome } from "@/components/screens/screen-01-welcome";
import { Screen02BuyerProfile } from "@/components/screens/screen-02-buyer-profile";
import { Screen03ProfileSummary } from "@/components/screens/screen-03-profile-summary";
import { Screen04ProjectMatch } from "@/components/screens/screen-04-project-match";
import { Screen05ProjectWalkthrough } from "@/components/screens/screen-05-project-walkthrough";
import { Screen06LandLayout } from "@/components/screens/screen-06-land-layout";
import { Screen07TokenKyc } from "@/components/screens/screen-07-token-kyc";
import { Screen08AccessUnlocked } from "@/components/screens/screen-08-access-unlocked";
import { Screen09PocketFinder } from "@/components/screens/screen-09-pocket-finder";
import { Screen10PocketMap } from "@/components/screens/screen-10-pocket-map";
import { Screen11PocketDetail } from "@/components/screens/screen-11-pocket-detail";
import { Screen12ComparePockets } from "@/components/screens/screen-12-compare-pockets";
import { Screen13DecisionConfidence } from "@/components/screens/screen-13-decision-confidence";
import { Screen14AdvisorHandoff } from "@/components/screens/screen-14-advisor-handoff";

const SCREEN_COMPONENTS = {
  welcome: Screen01Welcome,
  "buyer-profile": Screen02BuyerProfile,
  "profile-summary": Screen03ProfileSummary,
  "project-match": Screen04ProjectMatch,
  "project-walkthrough": Screen05ProjectWalkthrough,
  "land-layout": Screen06LandLayout,
  "token-kyc": Screen07TokenKyc,
  "access-unlocked": Screen08AccessUnlocked,
  "pocket-finder": Screen09PocketFinder,
  "pocket-map": Screen10PocketMap,
  "pocket-detail": Screen11PocketDetail,
  "compare-pockets": Screen12ComparePockets,
  "decision-confidence": Screen13DecisionConfidence,
  "advisor-handoff": Screen14AdvisorHandoff,
} as const;

function JourneyScreen() {
  const { currentScreen } = useJourney();
  const Screen = SCREEN_COMPONENTS[currentScreen];

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="h-full w-full"
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
      <DemoControls />
      <AiraPanel />
    </div>
  );
}

export default function Home() {
  return (
    <JourneyProvider>
      <AiraProvider>
        <DeviceFrame>
          <JourneyScreen />
        </DeviceFrame>
      </AiraProvider>
    </JourneyProvider>
  );
}
