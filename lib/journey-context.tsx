"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";
import {
  AdvisorContext,
  BuyerProfile,
  Concern,
  ConfidenceLevel,
  KycStatus,
  PaymentStatus,
  PocketPreferenceTag,
} from "./types";
import { PROJECT } from "./data";
import { track } from "./analytics";

export const SCREEN_ORDER = [
  "welcome",
  "buyer-profile",
  "profile-summary",
  "project-match",
  "project-walkthrough",
  "land-layout",
  "pocket-finder",
  "pocket-map",
  "pocket-detail",
  "compare-pockets",
  "decision-confidence",
  // A lightweight "send me my plan" moment — name + mobile, no full KYC —
  // before the heavier token payment + KYC step.
  "identity-capture",
  // Token payment + KYC now happen once the buyer has actually decided,
  // right before handing off to a human advisor — rather than gating pocket
  // browsing behind payment up front.
  "token-kyc",
  "access-unlocked",
  "advisor-handoff",
] as const;

export type ScreenId = (typeof SCREEN_ORDER)[number];

interface JourneyState {
  screenIndex: number;
  buyerProfile: BuyerProfile;
  pocketPreferences: PocketPreferenceTag[];
  pocketsViewed: string[];
  shortlistedPockets: string[];
  comparedPockets: string[];
  activePocketId: string | null;
  questionsAsked: string[];
  concerns: Concern[];
  confidenceLevel: ConfidenceLevel | null;
  kycStatus: KycStatus;
  tokenPaymentStatus: PaymentStatus;
}

const initialBuyerProfile: BuyerProfile = {
  purpose: null,
  budgetLabel: null,
  budgetMin: null,
  budgetMax: null,
  location: null,
  horizon: null,
  riskComfort: null,
  plotPreference: null,
  expectedPurpose: null,
  priorities: [],
};

const initialState: JourneyState = {
  screenIndex: 0,
  buyerProfile: initialBuyerProfile,
  pocketPreferences: [],
  pocketsViewed: [],
  shortlistedPockets: [],
  comparedPockets: [],
  activePocketId: null,
  questionsAsked: [],
  concerns: [],
  confidenceLevel: null,
  kycStatus: "not_started",
  tokenPaymentStatus: "not_started",
};

type Action =
  | { type: "GO_TO"; screen: ScreenId }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "UPDATE_PROFILE"; patch: Partial<BuyerProfile> }
  | { type: "SET_POCKET_PREFERENCES"; prefs: PocketPreferenceTag[] }
  | { type: "VIEW_POCKET"; id: string }
  | { type: "TOGGLE_SHORTLIST"; id: string }
  | { type: "SET_COMPARED"; ids: string[] }
  | { type: "SET_ACTIVE_POCKET"; id: string | null }
  | { type: "ASK_QUESTION"; question: string }
  | { type: "ADD_CONCERN"; concern: Concern }
  | { type: "SET_CONFIDENCE"; level: ConfidenceLevel }
  | { type: "SET_KYC"; status: KycStatus }
  | { type: "SET_PAYMENT"; status: PaymentStatus }
  | { type: "RESET" };

function reducer(state: JourneyState, action: Action): JourneyState {
  switch (action.type) {
    case "GO_TO": {
      const idx = SCREEN_ORDER.indexOf(action.screen);
      return { ...state, screenIndex: idx === -1 ? state.screenIndex : idx };
    }
    case "NEXT":
      return { ...state, screenIndex: Math.min(state.screenIndex + 1, SCREEN_ORDER.length - 1) };
    case "BACK":
      return { ...state, screenIndex: Math.max(state.screenIndex - 1, 0) };
    case "UPDATE_PROFILE":
      return { ...state, buyerProfile: { ...state.buyerProfile, ...action.patch } };
    case "SET_POCKET_PREFERENCES":
      return { ...state, pocketPreferences: action.prefs };
    case "VIEW_POCKET":
      return {
        ...state,
        pocketsViewed: state.pocketsViewed.includes(action.id)
          ? state.pocketsViewed
          : [...state.pocketsViewed, action.id],
      };
    case "TOGGLE_SHORTLIST": {
      const has = state.shortlistedPockets.includes(action.id);
      return {
        ...state,
        shortlistedPockets: has
          ? state.shortlistedPockets.filter((id) => id !== action.id)
          : [...state.shortlistedPockets, action.id],
      };
    }
    case "SET_COMPARED":
      return { ...state, comparedPockets: action.ids };
    case "SET_ACTIVE_POCKET":
      return { ...state, activePocketId: action.id };
    case "ASK_QUESTION":
      return { ...state, questionsAsked: [...state.questionsAsked, action.question] };
    case "ADD_CONCERN":
      return {
        ...state,
        concerns: state.concerns.includes(action.concern)
          ? state.concerns
          : [...state.concerns, action.concern],
      };
    case "SET_CONFIDENCE":
      return { ...state, confidenceLevel: action.level };
    case "SET_KYC":
      return { ...state, kycStatus: action.status };
    case "SET_PAYMENT":
      return { ...state, tokenPaymentStatus: action.status };
    case "RESET":
      track("demo_reset");
      return initialState;
    default:
      return state;
  }
}

interface JourneyContextValue extends JourneyState {
  currentScreen: ScreenId;
  dispatch: React.Dispatch<Action>;
  goTo: (screen: ScreenId) => void;
  next: () => void;
  back: () => void;
  advisorContext: AdvisorContext;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const currentScreen = SCREEN_ORDER[state.screenIndex];

  const value = useMemo<JourneyContextValue>(() => {
    const advisorContext: AdvisorContext = {
      buyerProfile: state.buyerProfile,
      projectViewed: PROJECT.name,
      pocketsViewed: state.pocketsViewed,
      shortlistedPockets: state.shortlistedPockets,
      comparedPockets: state.comparedPockets,
      questionsAsked: state.questionsAsked,
      concerns: state.concerns,
      confidenceLevel: state.confidenceLevel,
      kycStatus: state.kycStatus,
      tokenPaymentStatus: state.tokenPaymentStatus,
      currentStage: currentScreen,
    };
    return {
      ...state,
      currentScreen,
      dispatch,
      goTo: (screen: ScreenId) => dispatch({ type: "GO_TO", screen }),
      next: () => dispatch({ type: "NEXT" }),
      back: () => dispatch({ type: "BACK" }),
      advisorContext,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, currentScreen]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used within a JourneyProvider");
  return ctx;
}
