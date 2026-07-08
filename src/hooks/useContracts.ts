import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ContractRenewal } from '../types';

export function useContracts() {
  const [contracts, setContracts] = useState<ContractRenewal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data, error } = await supabase
          .from('contract_renewals')
          .select('*')
          .order('date_debut', { ascending: true });

        if (error) throw error;
        setContracts(data || []);
      } catch (err) {
        console.error('Error fetching contracts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  return { contracts, loading };
}
