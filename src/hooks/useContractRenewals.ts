import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ContractRenewal } from '../types';

export function useContractRenewals(employeeId: string | undefined) {
  const [renewals, setRenewals] = useState<ContractRenewal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRenewals = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('contract_renewals')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setRenewals(data || []);
    } catch (err) {
      console.error('Error fetching contract renewals:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchRenewals();
  }, [fetchRenewals]);

  return { renewals, loading, refetch: fetchRenewals };
}
