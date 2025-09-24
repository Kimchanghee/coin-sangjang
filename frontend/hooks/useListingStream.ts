'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ListingEvent } from '@/types/listings';

interface UseListingStreamOptions {
  fallbackEvents?: ListingEvent[];
}

interface UseListingStreamResult {
  events: ListingEvent[];
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  refresh: () => Promise<void>;
}

const MAX_EVENTS = 50;

export function useListingStream(
  apiBase: string,
  options?: UseListingStreamOptions,
): UseListingStreamResult {
  const fallbackEvents = useMemo(
    () => options?.fallbackEvents ?? [],
    [options?.fallbackEvents],
  );
  const [events, setEvents] = useState<ListingEvent[]>(fallbackEvents);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/listings/recent`);
      if (!response.ok) {
        throw new Error(`failed to fetch listings: ${response.status}`);
      }
      const data = (await response.json()) as ListingEvent[];
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
        setLastSyncedAt(new Date().toISOString());
      } else if (fallbackEvents.length > 0) {
        setEvents((prev) => (prev.length > 0 ? prev : fallbackEvents));
      }
    } catch (err) {
      console.warn('[listing-stream] failed to load recent listings', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load recent listing events.',
      );
      if (fallbackEvents.length > 0) {
        setEvents((prev) => (prev.length > 0 ? prev : fallbackEvents));
      }
    } finally {
      setLoading(false);
    }
  }, [apiBase, fallbackEvents]);

  useEffect(() => {
    void fetchRecent();
  }, [fetchRecent]);

  useEffect(() => {
    const streamUrl = `${apiBase}/listings/stream`;
    let source: EventSource | null = null;

    try {
      source = new EventSource(streamUrl, { withCredentials: false });
      source.onopen = () => setConnected(true);
      source.onerror = () => setConnected(false);
      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as ListingEvent;
          setEvents((prev) => {
            const next = [payload, ...prev];
            const unique = new Map<string, ListingEvent>();
            for (const item of next) {
              const key =
                item.id ?? `${item.source}-${item.symbol}-${item.announcedAt}`;
              if (!unique.has(key)) {
                unique.set(key, item);
              }
            }
            return Array.from(unique.values()).slice(0, MAX_EVENTS);
          });
          setLastSyncedAt(new Date().toISOString());
        } catch (err) {
          console.warn('[listing-stream] invalid payload', err);
        }
      };
    } catch (err) {
      console.warn('[listing-stream] event source unavailable', err);
      setConnected(false);
    }

    return () => {
      source?.close();
    };
  }, [apiBase]);

  return {
    events,
    connected,
    loading,
    error,
    lastSyncedAt,
    refresh: fetchRecent,
  };
}
