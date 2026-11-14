import { useCallback, useEffect, useState } from 'react';
import { AICapabilitiesResponse, AICapability } from '../types';
import { capabilityMap, getAICapabilities } from '../api/client';

/**
 * Loads the platform's AI capability discovery document and exposes it as a
 * lookup. Screens use it to enable/disable features and to render the honest
 * engine behind each one, instead of assuming an endpoint exists.
 */
export function useAICapabilities() {
  const [data, setData] = useState<AICapabilitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAICapabilities();
    setData(res.data);
    setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const byId: Record<string, AICapability> = capabilityMap(data);

  return { data, byId, loading, error, reload: load };
}
