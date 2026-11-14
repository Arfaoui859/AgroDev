import { useCallback, useEffect, useState } from 'react';
import { getFarms, getFields } from '../api/client';
import { Farm, Field } from '../types';

interface UseFarmsFields {
  farms: Farm[];
  fields: Field[];
  loadingFarms: boolean;
  loadingFields: boolean;
  error: string | null;
  /** Reload the farm list (after creating a farm). */
  reloadFarms: () => Promise<Farm[]>;
  /** Load the plots of a farm and return them (after creating a plot). */
  loadFields: (farmId: string) => Promise<Field[]>;
}

/**
 * Shared loader for the caller's farms and the plots of the selected farm.
 * Both the soil and crop screens need exactly this, so it lives in one place.
 * Reads are RLS-scoped to the signed-in account by the gateway.
 */
export function useFarmsFields(): UseFarmsFields {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadFarms = useCallback(async () => {
    setLoadingFarms(true);
    const res = await getFarms();
    setFarms(res.data);
    setError(res.error);
    setLoadingFarms(false);
    return res.data;
  }, []);

  const loadFields = useCallback(async (farmId: string) => {
    setLoadingFields(true);
    const res = await getFields(farmId);
    setFields(res.data);
    setError(res.error);
    setLoadingFields(false);
    return res.data;
  }, []);

  useEffect(() => {
    (async () => {
      await reloadFarms();
    })();
  }, [reloadFarms]);

  return { farms, fields, loadingFarms, loadingFields, error, reloadFarms, loadFields };
}
