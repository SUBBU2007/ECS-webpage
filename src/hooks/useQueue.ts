// import { useState, useEffect, useCallback } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { Counter } from '@/integrations/supabase/types';

// const API_BASE_URL = 'http://localhost:3001/api';

// export const useQueue = () => {
//   const [countersData, setCountersData] = useState<Counter[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentToken, setCurrentToken] = useState<{ number: number; counterId: number } | null>(null);


//   const fetchQueueStatus = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(`${API_BASE_URL}/token/status`);
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data: Counter[] = await response.json();
//       setCountersData(data);
//       setError(null);
//     } catch (e: any) {
//       setError(e.message || 'Failed to fetch queue status.');
//       console.error(e);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // Effect for initial data fetch and real-time subscription
//   useEffect(() => {
//     // Fetch initial data
//     fetchQueueStatus();

//     // Set up Supabase real-time listener
//     const channel = supabase.channel('qms-channel');

//     const subscription = channel
//       .on('broadcast', { event: 'DB_CHANGE' }, (payload) => {
//         console.log('Database change received!', payload);
//         // Refetch data when a change is detected
//         fetchQueueStatus();
//       })
//       .subscribe((status) => {
//         if (status === 'SUBSCRIBED') {
//           console.log('Connected to real-time channel!');
//         }
//         if (status === 'CHANNEL_ERROR') {
//           console.error('Real-time channel error.');
//           setError('Connection to real-time server failed.');
//         }
//         if (status === 'TIMED_OUT') {
//           console.warn('Real-time connection timed out.');
//           setError('Real-time connection timed out.');
//         }
//       });

//     // Cleanup subscription on component unmount
//     return () => {
//       supabase.removeChannel(subscription);
//     };
//   }, [fetchQueueStatus]);

//     // Get a new token for a specific counter
//   const getToken = useCallback(async (counterId: number) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/token/create`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ counterId }),
//       });
//       if (!response.ok) {
//         throw new Error('Failed to get token.');
//       }
//       const newToken = await response.json();
//       setCurrentToken({ number: newToken.token_number, counterId: newToken.counter_id });
//       // The real-time listener will handle updating the queue display
//       return newToken;
//     } catch (e: any) {
//       setError(e.message || 'An error occurred while getting a token.');
//       console.error(e);
//       return null;
//     }
//   }, []);

//   // Serve the next token for a specific counter
//   const serveNext = useCallback(async (counterId: number) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/token/serve/${counterId}`, {
//         method: 'POST',
//       });
//       if (!response.ok) {
//         if (response.status === 404) {
//           // Handle the case where there are no tokens in the queue
//           console.log(`No tokens to serve for counter ${counterId}.`);
//           return null;
//         }
//         throw new Error('Failed to serve next token.');
//       }
//       const servedToken = await response.json();
//       // The real-time listener will handle updating the queue display
//       return servedToken;
//     } catch (e: any) {
//       setError(e.message || 'An error occurred while serving the next token.');
//       console.error(e);
//       return null;
//     }
//   }, []);


//   return {
//     countersData,
//     isLoading,
//     error,
//     currentToken,
//     getToken,
//     serveNext,
//     fetchQueueStatus, // Exposing this might be useful for manual refresh
//   };
// };

import { useState, useEffect, useCallback, useMemo } from 'react';

// --- Type Definitions ---
// Moved from the deleted supabase directory to make this file self-contained.
export interface Token {
  id: number;
  token_number: number;
  status: 'waiting' | 'serving' | 'served' | 'skipped';
  created_at: string;
}

export interface CameraData {
  people_count: number;
  estimated_wait_time: number;
}

export interface Counter {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  current_token_number: number | null;
  camera_data: CameraData;
  queue: Token[];
}

export interface Stats {
  tokensServedToday: number;
  peakQueueSize: number;
  totalWaitTime: number; // in minutes
  tokensProcessed: number;
}


// --- Mock Data ---
// This will be the initial state if nothing is in localStorage
const initialCounters: Counter[] = [
  {
    id: 1,
    name: 'General Inquiry',
    description: 'For all general questions and information.',
    is_active: true,
    current_token_number: null,
    camera_data: { people_count: 3, estimated_wait_time: 15 },
    queue: [],
  },
  {
    id: 2,
    name: 'Technical Support',
    description: 'For technical assistance and troubleshooting.',
    is_active: true,
    current_token_number: null,
    camera_data: { people_count: 1, estimated_wait_time: 5 },
    queue: [],
  },
  {
    id: 3,
    name: 'Billing',
    description: 'For payments and billing inquiries.',
    is_active: true,
    current_token_number: null,
    camera_data: { people_count: 2, estimated_wait_time: 10 },
    queue: [],
  },
];

const initialStats: Stats = {
  tokensServedToday: 0,
  peakQueueSize: 0,
  totalWaitTime: 0,
  tokensProcessed: 0,
};

const LOCAL_STORAGE_KEY = 'multi_counter_queue_state';
const STATS_LOCAL_STORAGE_KEY = 'multi_counter_stats_state';
const TOKEN_LOCAL_STORAGE_KEY = 'multi_counter_token_state';


export const useQueue = () => {
  const [countersData, setCountersData] = useState<Counter[]>([]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [currentToken, setCurrentToken] = useState<{ id: number; number: number; counterId: number } | null>(null);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      // Load counters data
      const savedCounters = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedCounters) {
        setCountersData(JSON.parse(savedCounters));
      } else {
        setCountersData(initialCounters);
      }
      // Load stats data
      const savedStats = localStorage.getItem(STATS_LOCAL_STORAGE_KEY);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      } else {
        setStats(initialStats);
      }
      // Load token data
      const savedToken = localStorage.getItem(TOKEN_LOCAL_STORAGE_KEY);
      if (savedToken) {
        setCurrentToken(JSON.parse(savedToken));
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      setCountersData(initialCounters);
      setStats(initialStats);
    }
    setIsLoading(false);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    // We don't want to save during the initial load
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(countersData));
        localStorage.setItem(STATS_LOCAL_STORAGE_KEY, JSON.stringify(stats));
        if (currentToken) {
          localStorage.setItem(TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(currentToken));
        } else {
          localStorage.removeItem(TOKEN_LOCAL_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }
  }, [countersData, stats, isLoading, currentToken]);

  // Fetch real camera API data for dynamic wait times
  useEffect(() => {
    const fetchCameraData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/queue');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        setCountersData(prevCounters =>
          prevCounters.map(counter => {
            const apiData = data.find((d: any) => d.counterId === counter.id);
            if (apiData) {
              const peopleCount = apiData.peopleCount;
              const estimatedWaitTime = peopleCount * 5; // 5 mins per person
              return {
                ...counter,
                camera_data: {
                  people_count: peopleCount,
                  estimated_wait_time: estimatedWaitTime,
                },
              };
            }
            return counter;
          })
        );
      } catch (error) {
        console.error("Failed to fetch camera data:", error);
      }
    };

    const interval = setInterval(fetchCameraData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Get a new token for a specific counter
  const getToken = useCallback((counterId: number) => {
    const counter = countersData.find(c => c.id === counterId);
    if (!counter) {
      return Promise.resolve(null);
    }

    const lastTokenNumber = counter.queue.length > 0 ? counter.queue[counter.queue.length - 1].token_number : 0;
    const newToken = {
      id: Date.now(),
      token_number: lastTokenNumber + 1,
      status: 'waiting' as const,
      created_at: new Date().toISOString(),
    };

    const newQueueSize = counter.queue.length + 1;
    setStats(prevStats => ({
      ...prevStats,
      peakQueueSize: Math.max(prevStats.peakQueueSize, newQueueSize),
    }));

    setCountersData(prevCounters =>
      prevCounters.map(c =>
        c.id === counterId
          ? { ...c, queue: [...c.queue, newToken] }
          : c
      )
    );

    setCurrentToken({ id: newToken.id, number: newToken.token_number, counterId: counterId });

    return Promise.resolve(newToken);
  }, [countersData, setCountersData, setStats, setCurrentToken]);

  // Serve the next token for a specific counter
  const serveNext = useCallback((counterId: number) => {
    const counter = countersData.find(c => c.id === counterId);
    if (!counter || counter.queue.length === 0) {
      return Promise.resolve(null);
    }

    const servedToken = counter.queue[0];

    const waitTime = (new Date().getTime() - new Date(servedToken.created_at).getTime()) / (1000 * 60);
    setStats(prevStats => ({
      ...prevStats,
      tokensServedToday: prevStats.tokensServedToday + 1,
      totalWaitTime: prevStats.totalWaitTime + waitTime,
      tokensProcessed: prevStats.tokensProcessed + 1,
    }));

    setCountersData(prevCounters =>
      prevCounters.map(c => {
        if (c.id === counterId) {
          return {
            ...c,
            queue: c.queue.slice(1),
            current_token_number: servedToken.token_number,
          };
        }
        return c;
      })
    );

    // If the served token is the user's current token, clear it
    if (currentToken && currentToken.id === servedToken.id) {
      setCurrentToken(null);
    }

    return Promise.resolve(servedToken);
  }, [countersData, setCountersData, setStats, currentToken, setCurrentToken]);

  const averageWaitTime = useMemo(() => {
    if (stats.tokensProcessed === 0) {
      return 0;
    }
    return Math.round(stats.totalWaitTime / stats.tokensProcessed);
  }, [stats.totalWaitTime, stats.tokensProcessed]);

  const resetStats = useCallback(() => {
    setStats(initialStats);
  }, []);

  return {
    countersData,
    isLoading,
    error: null,
    currentToken,
    getToken,
    serveNext,
    stats,
    averageWaitTime,
    resetStats,
  };
};