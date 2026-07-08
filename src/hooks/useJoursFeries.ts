import { useState, useEffect } from 'react';

const CACHE_PREFIX = 'emmarh_jours_feries_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const ZONE = 'alsace-moselle';

interface CacheEntry {
  data: Record<string, string>;
  fetchedAt: number;
}

async function fetchYear(year: number): Promise<Record<string, string>> {
  const cacheKey = `${CACHE_PREFIX}${year}`;
  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const cached: CacheEntry = JSON.parse(cachedRaw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data;
      }
    }
  } catch {
    // ignore cache errors
  }

  const res = await fetch(`https://calendrier.api.gouv.fr/jours-feries/${ZONE}/${year}.json`);
  if (!res.ok) throw new Error("Impossible de récupérer les jours fériés");
  const data: Record<string, string> = await res.json();

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data, fetchedAt: Date.now() } as CacheEntry));
  } catch {
    // ignore cache errors (quota, etc.)
  }

  return data;
}

/**
 * Récupère automatiquement les jours fériés français (zone Alsace-Moselle,
 * qui inclut Vendredi Saint et le 2e jour de Noël en plus du calendrier national)
 * depuis l'API officielle calendrier.api.gouv.fr. Aucune date n'est codée en dur :
 * tout est calculé dynamiquement, avec un cache local de 24h pour limiter les appels.
 */
export function useJoursFeries() {
  const [joursFeries, setJoursFeries] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      // On couvre large (année passée à +2 ans) pour gérer les absences à cheval sur le nouvel an
      const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

      try {
        const results = await Promise.all(years.map((y) => fetchYear(y).catch(() => ({}))));
        if (cancelled) return;
        const merged = new Set<string>();
        results.forEach((yearData) => {
          Object.keys(yearData).forEach((date) => merged.add(date));
        });
        setJoursFeries(merged);
      } catch (err) {
        console.error('Erreur lors du chargement des jours fériés:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { joursFeries, loading };
}
