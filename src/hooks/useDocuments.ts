import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Document } from '../types';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .order('date_expiration', { ascending: true, nullsFirst: false });
          
        if (error) throw error;
        setDocuments(data || []);
      } catch (err) {
        console.error('Error fetching documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  return { documents, loading };
}
