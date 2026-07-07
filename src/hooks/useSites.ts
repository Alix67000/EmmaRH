import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Site } from '../types';

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('*')
          .order('name', { ascending: true });
          
        if (error) throw error;
        setSites(data || []);
      } catch (err) {
        console.error('Error fetching sites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  return { sites, loading };
}
