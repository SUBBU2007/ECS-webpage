import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseError } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface QueueToken {
  id: string;
  number: number;
  status: 'waiting' | 'serving' | 'served' | 'skipped';
  created_at: string;
  served_at?: string;
  updated_at: string;
}

export interface QueueStats {
  tokensServedToday: number;
  peakQueueSize: number;
  totalWaitTime: number; // in minutes
  tokensProcessed: number; // for calculating average
}

export const useQueue = () => {
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueueToken[]>([]);
  const [currentServing, setCurrentServing] = useState<number | null>(null);
  const [nextTokenNumber, setNextTokenNumber] = useState(1);
  const [currentToken, setCurrentToken] = useState<QueueToken | null>(null); // This might need rethinking with DB

  // State for live queue data from camera
  const [liveQueueCount, setLiveQueueCount] = useState(0);
  const [liveEstimatedWaitTime, setLiveEstimatedWaitTime] = useState(0);

  const [stats, setStats] = useState<QueueStats>({
    tokensServedToday: 0,
    peakQueueSize: 0,
    totalWaitTime: 0,
    tokensProcessed: 0
  });

  // Effect for fetching live queue data
  useEffect(() => {
    const fetchLiveQueueData = async () => {
      try {
        // This will be proxied to the Flask server in development
        const response = await fetch('/api/queue');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Update live queue count and estimated wait time
        setLiveQueueCount(data.count);
        // Assuming 2 minutes average service time per person
        setLiveEstimatedWaitTime(data.count * 2);

      } catch (error) {
        console.error("Failed to fetch live queue data:", error);
        // Optionally, you could set an error state here
      }
    };

    // Fetch immediately and then set an interval
    fetchLiveQueueData();
    const intervalId = setInterval(fetchLiveQueueData, 4000); // Fetch every 4 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Effect to display a persistent error if Supabase client fails to initialize
  useEffect(() => {
    if (supabaseError) {
      toast({
        title: 'Error: Application is not connected to the backend.',
        description: 'Please contact support. The app will not function correctly.',
        variant: 'destructive',
        duration: Infinity, // Keep the toast visible
      });
    }
  }, [supabaseError, toast]);

  // Effect for fetching initial data and setting up real-time subscriptions
  useEffect(() => {
    if (!supabase) return; // Don't run if Supabase client is not available

    const channel = supabase.channel('queue-updates');

    const fetchInitialData = async () => {
      try {
      // Fetch waiting list
      const { data: queueData, error: queueError } = await supabase
        .from('tokens')
        .select('*')
        .in('status', ['waiting', 'serving'])
        .order('number', { ascending: true });

      if (queueError) console.error('Error fetching queue:', queueError);
      else setQueue(queueData as QueueToken[]);

      // Fetch system state
      const { data: stateData, error: stateError } = await supabase
        .from('system_state')
        .select('*')
        .limit(1)
        .single();

      if (stateError) console.error('Error fetching system state:', stateError);
      else {
        setCurrentServing(stateData.current_serving_number);
        setNextTokenNumber(stateData.next_token_number);
      }

      // TODO: Fetch and calculate stats
      } catch (error) {
        console.error("An unexpected error occurred during data fetch:", error);
        toast({
          title: 'Error Fetching Data',
          description: 'Could not load queue data from the database.',
          variant: 'destructive',
        });
      }
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, fetchInitialData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_state' }, fetchInitialData)
      .subscribe();

    fetchInitialData();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get a new token
  const getToken = useCallback(async () => {
    if (!supabase) return null;
    // The next token number is now sourced from the database state
    const { data: newToken, error: insertError } = await supabase
      .from('tokens')
      .insert({ number: nextTokenNumber, status: 'waiting' })
      .select()
      .single();

    if (insertError) {
      console.error('Error getting token:', insertError);
      return null;
    }

    // Increment the next token number in the system state
    const { error: updateError } = await supabase
      .from('system_state')
      .update({ next_token_number: nextTokenNumber + 1 })
      .eq('id', 1);

    if (updateError) {
      console.error('Error updating next token number:', updateError);
      // Note: This could lead to an inconsistent state, needs robust handling
    }

    // The real-time listener will update the local state.
    // We can set the "currentToken" locally for immediate UI feedback if needed.
    setCurrentToken(newToken as QueueToken);
    return newToken as QueueToken;
  }, [nextTokenNumber]);

  // Serve next token
  const serveNext = useCallback(async () => {
    if (!supabase) return null;
    const nextToken = queue.find(t => t.status === 'waiting');
    if (!nextToken) return null;

    // Update token status
    const { data: servedToken, error: updateError } = await supabase
      .from('tokens')
      .update({ status: 'serving', served_at: new Date().toISOString() })
      .eq('id', nextToken.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error serving next token:', updateError);
      return null;
    }

    // Update system state
    await supabase
      .from('system_state')
      .update({ current_serving_number: servedToken.number })
      .eq('id', 1);

    return servedToken as QueueToken;
  }, [queue]);

  // Skip current token
  const skipToken = useCallback(async () => {
    if (!supabase) return null;
    const nextToken = queue.find(t => t.status === 'waiting');
    if (!nextToken) return null;

    const { data: skippedToken, error } = await supabase
      .from('tokens')
      .update({ status: 'skipped' })
      .eq('id', nextToken.id)
      .select()
      .single();

    if (error) {
      console.error('Error skipping token:', error);
      return null;
    }

    return skippedToken as QueueToken;
  }, [queue]);

  // Reset queue (not stats)
  const resetQueue = useCallback(async () => {
    if (!supabase) return;
    // This will set all 'waiting' and 'serving' tokens to 'skipped'
    const { error } = await supabase
      .from('tokens')
      .update({ status: 'skipped' })
      .in('status', ['waiting', 'serving']);

    if (error) console.error('Error resetting queue:', error);

    // Also reset the current serving number in system state
    await supabase
      .from('system_state')
      .update({ current_serving_number: null })
      .eq('id', 1);

  }, []);

  // Reset daily stats only
  const resetStats = useCallback(() => {
    // This would now involve a more complex DB operation to clear historical data.
    // For now, we just clear the local stats object.
    const newStats = {
      tokensServedToday: 0,
      peakQueueSize: 0,
      totalWaitTime: 0,
      tokensProcessed: 0
    };
    setStats(newStats);
  }, []);

  // The original getEstimatedWaitTime was based on token history.
  // This is replaced by the live camera-based estimation.
  // We can leave a placeholder or remove it.

  return {
    // Queue state
    queue,
    currentServing,
    nextTokenNumber,
    currentToken,
    queueLength: queue.length, // From token system
    liveQueueCount,           // From camera feed
    
    // Stats
    stats, // Note: This is not updated from DB yet
    liveEstimatedWaitTime,    // From camera feed
    
    // Actions
    getToken,
    serveNext,
    skipToken,
    resetQueue,
    resetStats,
  };
};