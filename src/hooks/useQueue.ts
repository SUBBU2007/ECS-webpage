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

import { useState, useEffect, useCallback } from 'react';

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
  current_token_id: number | null;
  camera_data: CameraData;
  queue: Token[];
}


// --- Mock Data ---
// This will be the initial state if nothing is in localStorage
const initialCounters: Counter[] = [
  {
    id: 1,
    name: 'General Inquiry',
    description: 'For all general questions and information.',
    is_active: true,
    current_token_id: null,
    camera_data: { people_count: 3, estimated_wait_time: 15 },
    queue: [],
  },
  {
    id: 2,
    name: 'Technical Support',
    description: 'For technical assistance and troubleshooting.',
    is_active: true,
    current_token_id: null,
    camera_data: { people_count: 1, estimated_wait_time: 5 },
    queue: [],
  },
  {
    id: 3,
    name: 'Billing',
    description: 'For payments and billing inquiries.',
    is_active: true,
    current_token_id: null,
    camera_data: { people_count: 2, estimated_wait_time: 10 },
    queue: [],
  },
];

const LOCAL_STORAGE_KEY = 'multi_counter_queue_state';

export const useQueue = () => {
  const [countersData, setCountersData] = useState<Counter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentToken, setCurrentToken] = useState<{ number: number; counterId: number } | null>(null);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        setCountersData(JSON.parse(savedState));
      } else {
        // If no saved state, initialize with mock data
        setCountersData(initialCounters);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      setCountersData(initialCounters);
    }
    setIsLoading(false);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    // We don't want to save during the initial load
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(countersData));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }
  }, [countersData, isLoading]);

  // Get a new token for a specific counter
  const getToken = useCallback((counterId: number) => {
    let newToken: Token | null = null;
    setCountersData(prevCounters => {
      const newCounters = prevCounters.map(counter => {
        if (counter.id === counterId) {
          const lastTokenNumber = counter.queue.length > 0 ? counter.queue[counter.queue.length - 1].token_number : 0;
          newToken = {
            id: Date.now(), // Use timestamp for unique ID in mock setup
            token_number: lastTokenNumber + 1,
            status: 'waiting',
            created_at: new Date().toISOString(),
          };
          return {
            ...counter,
            queue: [...counter.queue, newToken],
          };
        }
        return counter;
      });
      return newCounters;
    });

    if (newToken) {
        setCurrentToken({ number: newToken.token_number, counterId: counterId });
    }
    return Promise.resolve(newToken);
  }, []);

  // Serve the next token for a specific counter
  const serveNext = useCallback((counterId: number) => {
    let servedToken: Token | null = null;
    setCountersData(prevCounters => {
        const newCounters = prevCounters.map(counter => {
            if (counter.id === counterId && counter.queue.length > 0) {
                servedToken = counter.queue[0];
                const newQueue = counter.queue.slice(1);
                return {
                    ...counter,
                    queue: newQueue,
                    current_token_id: servedToken.id,
                };
            }
            return counter;
        });
        return newCounters;
    });
    return Promise.resolve(servedToken);
  }, []);

  return {
    countersData,
    isLoading,
    error: null,
    currentToken,
    getToken,
    serveNext,
  };
};