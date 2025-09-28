import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseError } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// This interface is now sourced from the database schema
export interface Token {
  id: string;
  number: number;
  status: 'waiting' | 'serving' | 'served' | 'skipped';
  created_at: string;
  updated_at: string;
  served_at?: string;
  served_by_counter_id?: number;
}

// The hook provides a simplified, single-queue interface
export const useQueue = () => {
  const { toast } = useToast();

  // State for the simplified UI
  const [queue, setQueue] = useState<Token[]>([]);
  const [currentServing, setCurrentServing] = useState<number | null>(null);
  const [nextTokenNumber, setNextTokenNumber] = useState(1);
  const [currentToken, setCurrentToken] = useState<Token | null>(null);

  // State for the live camera feed
  const [liveQueueCount, setLiveQueueCount] = useState(0);
  const [liveEstimatedWaitTime, setLiveEstimatedWaitTime] = useState(0);

  // --- Effects ---

  // Effect to show a persistent error if the Supabase client fails to initialize
  useEffect(() => {
    if (supabaseError) {
      toast({
        title: 'Error: Application not connected to backend',
        description: 'Please check environment credentials and database status.',
        variant: 'destructive',
        duration: Infinity,
      });
    }
  }, [supabaseError, toast]);

  // Main effect for fetching data from Supabase and setting up real-time listeners
  useEffect(() => {
    if (!supabase) return;

    const fetchAndProcessData = async () => {
      try {
        const { data: tokensData, error: tokensError } = await supabase
          .from('tokens')
          .select('*')
          .in('status', ['waiting', 'serving'])
          .order('number', { ascending: true });
        if (tokensError) throw tokensError;

        setQueue(tokensData?.filter(t => t.status === 'waiting') || []);
        const servingToken = tokensData?.find(t => t.status === 'serving');
        setCurrentServing(servingToken?.number || null);

        const { data: stateData, error: stateError } = await supabase
          .from('system_state')
          .select('next_token_number')
          .limit(1).single();
        if (stateError) throw stateError;
        setNextTokenNumber(stateData.next_token_number);

      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({ title: 'Error Fetching Data', variant: 'destructive' });
      }
    };

    const channel = supabase.channel('single-queue-updates');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, fetchAndProcessData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_state' }, fetchAndProcessData)
      .subscribe();

    fetchAndProcessData();
    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  // Effect for fetching live data from the camera feed
  useEffect(() => {
    const fetchLiveQueueData = async () => {
      try {
        const response = await fetch('/api/queue');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setLiveQueueCount(data.count);
        setLiveEstimatedWaitTime(data.count * 2);
      } catch (error) {
        console.error("Failed to fetch live queue data:", error);
      }
    };
    fetchLiveQueueData();
    const intervalId = setInterval(fetchLiveQueueData, 4000);
    return () => clearInterval(intervalId);
  }, []);


  // --- Actions ---

  const getToken = useCallback(async () => {
    if (!supabase) return null;

    // Invoke the secure Edge Function to handle token creation
    const { data, error } = await supabase.functions.invoke('get-token');

    if (error) {
      toast({ title: "Error", description: "Could not issue a token. Please try again.", variant: "destructive" });
      console.error("Error invoking get-token function:", error);
      return null;
    }

    // The Edge Function returns the newly created token record
    const newToken = data;
    setCurrentToken(newToken);
    return newToken;
  }, [toast]);

  const serveNext = useCallback(async () => {
    if (!supabase) return null;
    const nextToken = queue[0];
    if (!nextToken) {
      toast({ title: "No tokens in queue", variant: "destructive" });
      return null;
    }
    const { data: counter } = await supabase.from('counters').select('id').limit(1).single();
    if (!counter) {
      toast({ title: "No counters available", description: "Please add a counter in the database.", variant: "destructive" });
      return null;
    }
    const { data, error } = await supabase
      .from('tokens')
      .update({ status: 'serving', served_by_counter_id: counter.id })
      .eq('id', nextToken.id)
      .select().single();
    if (error) {
      console.error('Error serving next token:', error);
      return null;
    }
    return data;
  }, [queue, toast]);

  const skipToken = useCallback(async () => {
    if (!supabase) return null;
    const nextToken = queue[0];
    if (!nextToken) return null;
    const { data, error } = await supabase
      .from('tokens')
      .update({ status: 'skipped' })
      .eq('id', nextToken.id)
      .select().single();
    if (error) {
      console.error('Error skipping token:', error);
      return null;
    }
    return data;
  }, [queue]);

  const resetQueue = useCallback(async () => {
    if (!supabase) return;
    await supabase.from('tokens').update({ status: 'skipped' }).eq('status', 'waiting');
  }, []);

  return {
    queue,
    queueLength: queue.length,
    currentServing,
    nextToken: queue[0],
    currentToken,
    liveQueueCount,
    liveEstimatedWaitTime,
    getToken,
    serveNext,
    skipToken,
    resetQueue,
  };
};