import { useCallback, useRef, useState } from 'react';
import { API_BASE, GENERATE_PATH } from '../lib/api';
import { budgetToLegacyAmount, dateRangeForRequest } from '../lib/legacyAdapter';
import type { GenerationStatus, Itinerary, SSEMeta, TripRequest } from '../types';

interface SSEState {
  status: GenerationStatus;
  meta: SSEMeta | null;
  tokens: string;
  itinerary: Itinerary | null;
  error: string | null;
}

const INITIAL: SSEState = {
  status: 'idle',
  meta: null,
  tokens: '',
  itinerary: null,
  error: null,
};

function parseEventBlock(block: string): { event: string; data: string } | null {
  const event = block.match(/^event:\s*(.+)$/m)?.[1]?.trim() ?? 'message';
  const data = block.match(/^data:\s*(.+)$/m)?.[1]?.trim();
  return data ? { event, data } : null;
}

export function useSSEItinerary() {
  const [state, setState] = useState<SSEState>(INITIAL);
  const abort = useRef<AbortController | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generate = useCallback(async (request: TripRequest) => {
    abort.current?.abort();
    if (timeout.current) clearTimeout(timeout.current);
    const ctrl = new AbortController();
    abort.current = ctrl;
    timeout.current = setTimeout(() => ctrl.abort(), 75_000);
    setState({ ...INITIAL, status: 'connecting' });

    try {
      const { startDate, endDate } = dateRangeForRequest(request);
      const res = await fetch(`${API_BASE}${GENERATE_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: request.destination,
          startDate,
          endDate,
          budget: budgetToLegacyAmount(request.budget),
          interests: request.interests,
          travelStyle: request.travelStyle,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string; message?: string } | null;
        throw new Error(body?.message ?? body?.error ?? `HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type') ?? '';
      let itinerary: Itinerary | null = null;

      if (contentType.includes('application/json')) {
        const payload = await res.json() as { itinerary?: Itinerary } | Itinerary;
        if ('itinerary' in payload) itinerary = payload.itinerary ?? null;
        else itinerary = payload as Itinerary;
      } else {
        if (!res.body) throw new Error('Backend returned an empty streaming response.');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamDone = false;

        while (!streamDone) {
          const chunk = await reader.read();
          buffer += decoder.decode(chunk.value ?? new Uint8Array(), { stream: !chunk.done });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';

          for (const block of blocks) {
            const event = parseEventBlock(block);
            if (!event) continue;
            const data = JSON.parse(event.data) as { text?: string; itinerary?: Itinerary; message?: string };
            if (event.event === 'meta') {
              setState((s) => ({ ...s, status: 'enriching', meta: data as SSEMeta }));
            } else if (event.event === 'token') {
              setState((s) => ({ ...s, status: 'streaming', tokens: s.tokens + (data.text ?? '') }));
            } else if (event.event === 'done') {
              itinerary = data.itinerary ?? null;
              streamDone = true;
            } else if (event.event === 'error') {
              throw new Error(data.message ?? 'Backend stream failed.');
            }
          }
          if (chunk.done) break;
        }
      }

      if (!itinerary) throw new Error('Backend returned an invalid itinerary payload.');
      setState((s) => ({ ...s, status: 'parsing' }));
      if (timeout.current) clearTimeout(timeout.current);
      setState({
        ...INITIAL,
        status: 'done',
        itinerary,
        meta: {
          tripId: itinerary.tripId,
          ragChunksUsed: itinerary.meta.ragChunksUsed,
          weatherDataUsed: itinerary.meta.weatherDataUsed,
          promptVersion: itinerary.meta.promptVersion,
        },
      });
    } catch (err) {
      if (timeout.current) clearTimeout(timeout.current);
      if ((err as Error).name === 'AbortError') {
        setState((s) => ({ ...s, status: 'error', error: 'Planner backend timed out after 75 seconds. Please try again.' }));
        return;
      }
      setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : String(err) }));
    }
  }, []);

  const cancel = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    setState(INITIAL);
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    setState(INITIAL);
  }, []);

  return { ...state, generate, cancel, reset };
}
