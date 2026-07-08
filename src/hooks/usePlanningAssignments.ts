import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PlanningAssignment } from '../types';

export function usePlanningAssignments(startDate: string, endDate: string) {
  const [assignments, setAssignments] = useState<PlanningAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('planning_assignments')
        .select('*')
        .gte('jour', startDate)
        .lte('jour', endDate);

      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error('Error fetching planning assignments:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const upsertAssignment = async (
    employeeId: string,
    jour: string,
    periode: 'matin' | 'apres_midi',
    atelierId: string | null
  ) => {
    const { error } = await supabase
      .from('planning_assignments')
      .upsert(
        [{ employee_id: employeeId, jour, periode, atelier_id: atelierId, updated_at: new Date().toISOString() }],
        { onConflict: 'employee_id,jour,periode' }
      );
    if (error) throw error;
    await fetchAssignments();
  };

  return { assignments, loading, upsertAssignment, refetch: fetchAssignments };
}
