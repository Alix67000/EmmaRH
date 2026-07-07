import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('last_name', { ascending: true });
          
        if (error) throw error;
        setEmployees(data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return { employees, loading };
}
