import { waitUntil } from "cloudflare:workers";
import {
  CHATGPT_LANGUAGE_CODE,
  CHATGPT_LOCATION_CODE,
} from "@/server/lib/dataforseo";
import { invalidFieldName } from "@/server/lib/dataforseo/envelope";
import { buildCacheKey, getCached, setCached } from "@/server/lib/r2-cache";
import type { AiPromptResearchSource } from "@/shared/ai-visibility";

// A rejected market stays rejected for at least as long as research is cached.
const REJECTED_TTL_SECONDS = 24 * 60 * 60;

/**
 * DataForSEO has ChatGPT prompt data only in US English. Elsewhere it has the
 * market's Google AI Overview queries, which are local where ChatGPT's are not.
 */
export function researchSource(
  market: { locationCode: number; languageCode: string } | null | undefined,
): AiPromptResearchSource {
  if (
    !market ||
    (market.locationCode === CHATGPT_LOCATION_CODE &&
      market.languageCode === CHATGPT_LANGUAGE_CODE)
  )
    return {
      platform: "chat_gpt",
      locationCode: CHATGPT_LOCATION_CODE,
      languageCode: CHATGPT_LANGUAGE_CODE,
    };
  return {
    platform: "google",
    locationCode: market.locationCode,
    languageCode: market.languageCode,
  };
}

/** LLM Mentions covers Google only in some markets and rejects the rest. */
export function isRejectedMarketError(error: unknown) {
  const field = error instanceof Error ? invalidFieldName(error.message) : null;
  return field === "location_code" || field === "language_code";
}

// Shared across organizations: the market, not the customer, is rejected.
const rejectedKey = (source: AiPromptResearchSource) =>
  buildCacheKey("ai-visibility:prompt-research-unsupported", { ...source });

/**
 * Remembers a rejected market, so research skips the failed search, which
 * DataForSEO may bill, instead of repeating it before every fallback.
 */
export async function wasMarketRejected(source: AiPromptResearchSource) {
  return !!(await getCached(await rejectedKey(source)));
}

export async function rememberRejectedMarket(source: AiPromptResearchSource) {
  const key = await rejectedKey(source);
  waitUntil(
    setCached(key, true, REJECTED_TTL_SECONDS).catch((error) => {
      console.error(
        "ai-visibility.prompt-research.unsupported-cache-write-failed",
        error,
      );
    }),
  );
}
