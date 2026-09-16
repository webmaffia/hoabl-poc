/**
 * Lightweight analytics abstraction for the POC.
 * Events are logged to the console and kept in memory (accessible via getEvents()).
 * Swap `track`'s implementation for PostHog/GA/Segment later without touching call sites.
 */

export type AnalyticsEvent =
  | "sales_call_completed"
  | "aira_started"
  | "profile_question_answered"
  | "profile_completed"
  | "project_recommended"
  | "project_selected"
  | "project_walkthrough_started"
  | "project_walkthrough_completed"
  | "land_layout_previewed"
  | "token_cta_clicked"
  | "kyc_started"
  | "kyc_completed"
  | "token_payment_started"
  | "token_payment_completed"
  | "access_unlocked"
  | "pocket_finder_started"
  | "pocket_preference_selected"
  | "pocket_viewed"
  | "pocket_shortlisted"
  | "pocket_compared"
  | "aira_question_asked"
  | "confidence_selected"
  | "concern_selected"
  | "decision_summary_viewed"
  | "advisor_handoff_clicked"
  | "identity_otp_sent"
  | "identity_captured"
  | "plan_sent_whatsapp"
  | "remaining_payment_completed"
  | "demo_reset";

interface LoggedEvent {
  event: AnalyticsEvent;
  properties?: Record<string, unknown>;
  timestamp: string;
}

const eventLog: LoggedEvent[] = [];

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  const entry: LoggedEvent = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  };
  eventLog.push(entry);
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, properties ?? {});
  }
}

export function getEvents(): LoggedEvent[] {
  return [...eventLog];
}

export function clearEvents() {
  eventLog.length = 0;
}
