import { useCallback, useState } from 'react';
import { invokeFn, EdgeFunctionError } from '../lib/api';

// One hook powering every AI tool UI (mirror of the web useAiTool). Calls the
// metered `ai-generate` edge fn with the caller's session JWT via invokeFn.
// ai-generate returns HTTP 200 with `{ error }` for known cases — invokeFn
// throws those as EdgeFunctionError, so we map them back here and surface
// `limitReached` separately for the upgrade prompt.

export interface AiGenerateArgs {
  tool: string;
  campaignId?: string;
  inputs?: Record<string, unknown>;
}

export function useAiTool() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState<{ upgrade: string } | null>(null);

  const generate = useCallback(async ({ tool, campaignId, inputs }: AiGenerateArgs): Promise<string | null> => {
    setLoading(true);
    setError('');
    setLimitReached(null);
    try {
      const data = await invokeFn<{ text?: string; remaining?: number }>('ai-generate', {
        tool,
        campaignId,
        inputs,
      });
      setResult(data?.text || '');
      if (typeof data?.remaining !== 'undefined') setRemaining(data.remaining ?? null);
      return data?.text || '';
    } catch (e: any) {
      const code = e instanceof EdgeFunctionError ? e.data?.error : undefined;
      // `subscription_required` is ai-generate's answer for a FREE creator:
      // the tool is not part of that tier at all, as opposed to
      // `ai_limit_reached`, which is a paid allowance that ran out. It was
      // unmapped, so it fell through to the generic "Couldn't generate right
      // now. Please try again." — telling a free creator to retry something
      // that can never succeed. Both mean "you need a plan", and the callers
      // already render an upgrade panel off limitReached.
      if (code === 'ai_limit_reached' || code === 'subscription_required') {
        setLimitReached({
          upgrade: e.data?.upgrade || (code === 'subscription_required' ? 'starter' : 'pro'),
        });
        return null;
      }
      // Friendlier copy for the common config states.
      const friendly =
        code === 'ai_disabled'
          ? 'AI is currently turned off. Please try again later.'
          : code === 'ai_key_missing' || code === 'ai_config_missing'
            ? "AI isn't configured yet. Please contact support."
            : "Couldn't generate right now. Please try again.";
      setError(friendly);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, result, remaining, error, limitReached, generate, setResult, setError };
}
