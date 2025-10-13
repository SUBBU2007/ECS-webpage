import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Counter } from '@/integrations/supabase/types';

const API_BASE_URL = 'http://localhost:3001/api';

export const useQueue = () => {
  const [countersData, setCountersData] = useState<Counter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<{ number: number; counterId: number } | null>(null);


  const fetchQueueStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/token/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Counter[] = await response.json();
      setCountersData(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch queue status.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for initial data fetch and real-time subscription
  useEffect(() => {
    // Fetch initial data
    fetchQueueStatus();

    // Set up Supabase real-time listener
    const channel = supabase.channel('qms-channel');

    const subscription = channel
      .on('broadcast', { event: 'DB_CHANGE' }, (payload) => {
        console.log('Database change received!', payload);
        // Refetch data when a change is detected
        fetchQueueStatus();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to real-time channel!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Real-time channel error.');
          setError('Connection to real-time server failed.');
        }
        if (status === 'TIMED_OUT') {
          console.warn('Real-time connection timed out.');
          setError('Real-time connection timed out.');
        }
      });

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchQueueStatus]);

    // Get a new token for a specific counter
  const getToken = useCallback(async (counterId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/token/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterId }),
      });
      if (!response.ok) {
        throw new Error('Failed to get token.');
      }
      const newToken = await response.json();
      setCurrentToken({ number: newToken.token_number, counterId: newToken.counter_id });
      // The real-time listener will handle updating the queue display
      return newToken;
    } catch (e: any) {
      setError(e.message || 'An error occurred while getting a token.');
      console.error(e);
      return null;
    }
  }, []);

  // Serve the next token for a specific counter
  const serveNext = useCallback(async (counterId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/token/serve/${counterId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        if (response.status === 404) {
          // Handle the case where there are no tokens in the queue
          console.log(`No tokens to serve for counter ${counterId}.`);
          return null;
        }
        throw new Error('Failed to serve next token.');
      }
      const servedToken = await response.json();
      // The real-time listener will handle updating the queue display
      return servedToken;
    } catch (e: any) {
      setError(e.message || 'An error occurred while serving the next token.');
      console.error(e);
      return null;
    }
  }, []);


  return {
    countersData,
    isLoading,
    error,
    currentToken,
    getToken,
    serveNext,
    fetchQueueStatus, // Exposing this might be useful for manual refresh
  };
};
