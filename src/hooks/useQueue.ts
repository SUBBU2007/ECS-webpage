import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseError } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

// New interfaces to match the database schema
export interface Counter {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Token {
  id: string;
  number: number;
  status: 'waiting' | 'serving' | 'served' | 'skipped';
  created_at: string;
  updated_at: string;
  served_at?: string;
  served_by_counter_id?: number;
}

export const useQueue = () => {
  const { toast } = useToast();

  // State for the multi-counter system
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<number | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<Token[]>([]);
  const [servingTokens, setServingTokens] = useState<Token[]>([]);
  const [nextTokenNumber, setNextTokenNumber] = useState(1);

  // State for live queue data from camera (preserved)
  const [liveQueueCount, setLiveQueueCount] = useState(0);
  const [liveEstimatedWaitTime, setLiveEstimatedWaitTime] = useState(0);

  // Effect to display a persistent error if Supabase client fails to initialize
  useEffect(() => {
    if (supabaseError) {
      toast({
        title: 'Error: Application is not connected to the backend.',
        description: 'Please check your environment credentials and database status.',
        variant: 'destructive',
        duration: Infinity,
      });
    }
  }, [supabaseError, toast]);

  // Main effect for fetching all data and setting up real-time subscriptions
  useEffect(() => {
    if (!supabase) return;

    const fetchAllData = async () => {
      try {
        // Fetch all active counters
        const { data: countersData, error: countersError } = await supabase
          .from('counters')
          .select('*')
          .eq('is_active', true)
          .order('id');
        if (countersError) throw countersError;
        setCounters(countersData || []);

        // Fetch all tokens that are currently waiting or being served
        const { data: tokensData, error: tokensError } = await supabase
          .from('tokens')
          .select('*')
          .in('status', ['waiting', 'serving'])
          .order('number', { ascending: true });
        if (tokensError) throw tokensError;
        setWaitingQueue(tokensData?.filter(t => t.status === 'waiting') || []);
        setServingTokens(tokensData?.filter(t => t.status === 'serving') || []);

        // Fetch the next token number
        const { data: stateData, error: stateError } = await supabase
          .from('system_state')
          .select('next_token_number')
          .limit(1)
          .single();
        if (stateError) throw stateError;
        setNextTokenNumber(stateData.next_token_number);

      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
          title: 'Error Fetching Data',
          description: 'Could not load queue data. Please ensure migrations are applied.',
          variant: 'destructive',
        });
      }
    };

    // Set up a single channel to listen to all relevant table changes
    const channel = supabase.channel('multi-counter-queue');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counters' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_state' }, fetchAllData)
      .subscribe();

    fetchAllData();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Effect for fetching live queue data (preserved)
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


  // --- ACTIONS ---

  const selectCounter = (counterId: number) => {
    setSelectedCounterId(counterId);
  };

  const getToken = useCallback(async () => {
    if (!supabase) return null;

    const { data: newToken, error: insertError } = await supabase
      .from('tokens')
      .insert({ number: nextTokenNumber, status: 'waiting' })
      .select()
      .single();

    if (insertError) {
      console.error('Error getting token:', insertError);
      toast({ title: "Error", description: "Could not issue a token. Please try again.", variant: "destructive" });
      return null;
    }

    await supabase
      .from('system_state')
      .update({ next_token_number: nextTokenNumber + 1 })
      .eq('id', 1);

    toast({ title: "Token Issued", description: `Your token #${newToken.number} has been issued.` });
    return newToken as Token;
  }, [nextTokenNumber, toast]);

  const serveNext = useCallback(async (counterId: number) => {
    if (!supabase) return null;

    const nextToken = waitingQueue[0];
    if (!nextToken) {
      toast({ title: "No tokens in queue", variant: "destructive" });
      return null;
    }

    const { data: servedToken, error } = await supabase
      .from('tokens')
      .update({ status: 'serving', served_by_counter_id: counterId })
      .eq('id', nextToken.id)
      .select()
      .single();

    if (error) {
      console.error('Error serving next token:', error);
      return null;
    }
    return servedToken as Token;
  }, [waitingQueue, toast]);

  const markAsServed = useCallback(async (tokenId: string) => {
    if (!supabase) return null;

    const { data: servedToken, error } = await supabase
      .from('tokens')
      .update({ status: 'served', served_at: new Date().toISOString() })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) {
      console.error('Error marking token as served:', error);
      return null;
    }
    return servedToken as Token;
  }, []);

  const returnToQueue = useCallback(async (tokenId: string) => {
    if (!supabase) return null;

    const { data: returnedToken, error } = await supabase
      .from('tokens')
      .update({ status: 'waiting', served_by_counter_id: null })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) {
      console.error('Error returning token to queue:', error);
      return null;
    }
    return returnedToken as Token;
  }, []);


  return {
    // State
    counters,
    selectedCounterId,
    waitingQueue,
    servingTokens,
    liveQueueCount,
    liveEstimatedWaitTime,

    // Actions
    selectCounter,
    getToken,
    serveNext,
    markAsServed,
    returnToQueue,
  };
};