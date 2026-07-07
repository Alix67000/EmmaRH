import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AbsenceType } from '../types';

export function useAbsenceTypes() {
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('absence_types')
          .select('*')
          .order('name', { ascending: true });
          
        if (error) throw error;
        setAbsenceTypes(data || []);
      } catch (err) {
        console.error('Error fetching absence types:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
  }, []);

  return { absenceTypes, loading };
}
