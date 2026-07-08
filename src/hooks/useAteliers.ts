import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Atelier } from '../types';

export function useAteliers() {
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAteliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ateliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setAteliers(data || []);
    } catch (err) {
      console.error('Error fetching ateliers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAteliers();
  }, [fetchAteliers]);

  return { ateliers, loading, refetch: fetchAteliers };
}
