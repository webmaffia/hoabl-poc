export type Purpose = "investment" | "personal" | "both";
export type RiskComfort = "conservative" | "moderate" | "aggressive";
export type PlotPreference = "corner" | "larger" | "standard" | "interior";

export type PocketPreferenceTag =
  | "road_access"
  | "corner_plot"
  | "larger_plot"
  | "near_amenity"
  | "better_view"
  | "more_privacy"
  | "investment_potential"
  | "lower_entry_price";

export interface BuyerProfile {
  purpose: Purpose | null;
  budgetLabel: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  location: string | null;
  horizon: string | null;
  riskComfort: RiskComfort | null;
  plotPreference: PlotPreference | null;
  expectedPurpose: string | null;
  priorities: string[];
}

export interface VerifiedFact {
  label: string;
  value: string;
}

export interface Pocket {
  id: string;
  name: string;
  zone: "North Pocket" | "Central Park" | "West Pocket" | "East Pocket";
  price: number;
  sizeSqft: number;
  roadAccess: number; // 1-100
  privacy: number; // 1-100
  amenityProximity: number; // 1-100
  view: number; // 1-100
  entryPriceScore: number; // 1-100 (higher = lower price / better value)
  availability: "available" | "limited" | "sold";
  plotsLeft?: number; // only meaningful when availability === "limited"
  coordinates: { x: number; y: number }; // percentage position on layout
  description: string;
  tradeoffs: string[];
  strengths: string[];
  verifiedFacts: VerifiedFact[];
}

export interface Project {
  id: string;
  name: string;
  location: string;
  heroImage?: string;
  tagline: string;
  verified: VerifiedFact[];
  needsConfirmation: string[];
  brochureUrl?: string;
}

export type ConfidenceLevel = "unsure" | "almost" | "confident" | "ready";

export type Concern =
  | "price"
  | "location"
  | "development"
  | "plot_choice"
  | "legal"
  | "investment_potential"
  | "something_else";

export type KycStatus = "not_started" | "in_progress" | "verified";
export type PaymentStatus = "not_started" | "processing" | "completed";

export interface AdvisorContext {
  buyerProfile: BuyerProfile;
  projectViewed: string;
  pocketsViewed: string[];
  shortlistedPockets: string[];
  comparedPockets: string[];
  questionsAsked: string[];
  concerns: Concern[];
  confidenceLevel: ConfidenceLevel | null;
  kycStatus: KycStatus;
  tokenPaymentStatus: PaymentStatus;
  currentStage: string;
}
