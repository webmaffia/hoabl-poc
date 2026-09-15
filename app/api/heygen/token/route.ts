import { NextResponse } from "next/server";

/**
 * Server-side session-token exchange for HeyGen's LiveAvatar Web SDK
 * (https://docs.liveavatar.com — the actively-supported successor to the
 * deprecated "Interactive Avatar" API).
 *
 * The real API key (HEYGEN_API_KEY, from https://app.liveavatar.com/developers)
 * and the avatar id (HEYGEN_AVATAR_ID, a UUID from your LiveAvatar dashboard)
 * never reach the browser — they're read here, server-side, and exchanged for
 * a short-lived session_token via POST /v1/sessions/token. Only that token is
 * sent back to the client, which hands it to `LiveAvatarSession`.
 *
 * We request "FULL" mode, deliberately with no `llm_configuration_id`: Aira's
 * "brain" is this app's own scripted screen content (see lib/aira-context.tsx
 * `speak()`), not a HeyGen-hosted conversational agent — we only use the
 * session to puppet the avatar's video/voice via `session.repeat(text)`.
 *
 * IMPORTANT: this is NOT "LITE" mode. LITE mode has no built-in TTS at all —
 * HeyGen's own docs describe it as "you handle the conversational
 * orchestration — STT, LLM, TTS" (i.e. bring your own ElevenLabs/OpenAI/
 * Gemini voice pipeline). We don't have one wired in, so a LITE session's
 * `repeat()` calls sent successfully with zero errors but produced no audio
 * at all — confirmed by measuring the actual WebRTC audio track. FULL mode
 * has a documented "default avatar voice" (used automatically when no
 * `voice_id` is set) and is what actually turns text into speech here.
 *
 * FULL mode additionally requires exactly one of `avatar_persona` or
 * `voice_agent` — both reference a resource that only exists once created
 * in the LiveAvatar dashboard (there's no API to create one). Set whichever
 * one your account has via HEYGEN_VOICE_AGENT_ID or HEYGEN_CONTEXT_ID.
 */
export async function POST() {
  const apiKey = process.env.HEYGEN_API_KEY;
  const avatarId = process.env.HEYGEN_AVATAR_ID;
  const voiceAgentId = process.env.HEYGEN_VOICE_AGENT_ID;
  const contextId = process.env.HEYGEN_CONTEXT_ID;

  if (!apiKey || !avatarId) {
    return NextResponse.json(
      { error: "HEYGEN_API_KEY / HEYGEN_AVATAR_ID not configured" },
      { status: 501 }
    );
  }

  if (!voiceAgentId && !contextId) {
    return NextResponse.json(
      {
        error:
          "FULL mode needs a voice_agent or context resource from your LiveAvatar dashboard. Set HEYGEN_VOICE_AGENT_ID or HEYGEN_CONTEXT_ID in .env.local.",
      },
      { status: 501 }
    );
  }

  try {
    const res = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "FULL",
        avatar_id: avatarId,
        is_sandbox: process.env.HEYGEN_SANDBOX === "true",
        ...(voiceAgentId
          ? { voice_agent: { id: voiceAgentId } }
          : { avatar_persona: { context_id: contextId } }),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `LiveAvatar token request failed: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    const token = data?.data?.session_token;

    if (!token) {
      return NextResponse.json({ error: "LiveAvatar response missing session_token" }, { status: 502 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error contacting LiveAvatar" },
      { status: 502 }
    );
  }
}
