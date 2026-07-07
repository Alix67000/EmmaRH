import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Absence } from '../types';

export function useAbsences() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbsences = async () => {
      try {
        const { data, error } = await supabase
          .from('absences')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setAbsences(data || []);
      } catch (err) {
        console.error('Error fetching absences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAbsences();
  }, []);

  return { absences, loading };
}
