import { useState, useEffect, useCallback } from 'react';

export interface QueueToken {
  id: string;
  number: number;
  timestamp: number;
}

export interface QueueStats {
  tokensServedToday: number;
  peakQueueSize: number;
  totalWaitTime: number; // in minutes
  tokensProcessed: number; // for calculating average
}

const QUEUE_STORAGE_KEY = 'queue_data';
const STATS_STORAGE_KEY = 'queue_stats';

// Get today's date as a key
const getTodayKey = () => new Date().toDateString();

export const useQueue = () => {
  const [queue, setQueue] = useState<QueueToken[]>([]);
  const [currentServing, setCurrentServing] = useState<number | null>(null);
  const [nextTokenNumber, setNextTokenNumber] = useState(1);
  const [currentToken, setCurrentToken] = useState<QueueToken | null>(null);

  // State for live queue data from camera
  const [liveQueueCount, setLiveQueueCount] = useState(0);
  const [liveEstimatedWaitTime, setLiveEstimatedWaitTime] = useState(0);

  const [stats, setStats] = useState<QueueStats>({
    tokensServedToday: 0,
    peakQueueSize: 0,
    totalWaitTime: 0,
    tokensProcessed: 0
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
    const savedStats = localStorage.getItem(STATS_STORAGE_KEY);

    if (savedQueue) {
      try {
        const queueData = JSON.parse(savedQueue);
        setQueue(queueData.queue || []);
        setCurrentServing(queueData.currentServing || null);
        setNextTokenNumber(queueData.nextTokenNumber || 1);
        setCurrentToken(queueData.currentToken || null);
      } catch (error) {
        console.error('Error loading queue data:', error);
      }
    }

    if (savedStats) {
      try {
        const statsData = JSON.parse(savedStats);
        const today = getTodayKey();
        if (statsData.date === today) {
          setStats(statsData.stats);
        } else {
          // Reset stats for new day
          const newStats = {
            tokensServedToday: 0,
            peakQueueSize: 0,
            totalWaitTime: 0,
            tokensProcessed: 0
          };
          setStats(newStats);
          localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({
            date: today,
            stats: newStats
          }));
        }
      } catch (error) {
        console.error('Error loading stats data:', error);
      }
    }
  }, []);

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

  // Save queue data to localStorage
  const saveQueueData = useCallback((queueData: any) => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queueData));
  }, []);

  // Save stats data to localStorage
  const saveStatsData = useCallback((statsData: QueueStats) => {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({
      date: getTodayKey(),
      stats: statsData
    }));
  }, []);

  // Get a new token
  const getToken = useCallback(() => {
    const newToken: QueueToken = {
      id: `token-${Date.now()}`,
      number: nextTokenNumber,
      timestamp: Date.now()
    };

    const newQueue = [...queue, newToken];
    const newNextTokenNumber = nextTokenNumber + 1;

    setQueue(newQueue);
    setNextTokenNumber(newNextTokenNumber);
    setCurrentToken(newToken);

    // Update peak queue size
    const newStats = {
      ...stats,
      peakQueueSize: Math.max(stats.peakQueueSize, newQueue.length)
    };
    setStats(newStats);
    saveStatsData(newStats);

    saveQueueData({
      queue: newQueue,
      currentServing,
      nextTokenNumber: newNextTokenNumber,
      currentToken: newToken
    });

    return newToken;
  }, [queue, nextTokenNumber, currentServing, stats, saveQueueData, saveStatsData]);

  // Serve next token
  const serveNext = useCallback(() => {
    if (queue.length === 0) return null;

    const nextToken = queue[0];
    const newQueue = queue.slice(1);
    const waitTime = (Date.now() - nextToken.timestamp) / (1000 * 60); // minutes

    setQueue(newQueue);
    setCurrentServing(nextToken.number);

    // Update stats
    const newStats = {
      ...stats,
      tokensServedToday: stats.tokensServedToday + 1,
      totalWaitTime: stats.totalWaitTime + waitTime,
      tokensProcessed: stats.tokensProcessed + 1
    };
    setStats(newStats);
    saveStatsData(newStats);

    saveQueueData({
      queue: newQueue,
      currentServing: nextToken.number,
      nextTokenNumber,
      currentToken
    });

    return nextToken;
  }, [queue, nextTokenNumber, currentToken, stats, saveQueueData, saveStatsData]);

  // Skip current token
  const skipToken = useCallback(() => {
    if (queue.length === 0) return null;

    const skippedToken = queue[0];
    const newQueue = queue.slice(1);

    setQueue(newQueue);

    saveQueueData({
      queue: newQueue,
      currentServing,
      nextTokenNumber,
      currentToken
    });

    return skippedToken;
  }, [queue, currentServing, nextTokenNumber, currentToken, saveQueueData]);

  // Reset queue (not stats)
  const resetQueue = useCallback(() => {
    setQueue([]);
    setCurrentServing(null);
    setNextTokenNumber(1);
    setCurrentToken(null);

    saveQueueData({
      queue: [],
      currentServing: null,
      nextTokenNumber: 1,
      currentToken: null
    });
  }, [saveQueueData]);

  // Reset daily stats only
  const resetStats = useCallback(() => {
    const newStats = {
      tokensServedToday: 0,
      peakQueueSize: 0,
      totalWaitTime: 0,
      tokensProcessed: 0
    };
    setStats(newStats);
    saveStatsData(newStats);
  }, [saveStatsData]);

  // Calculate estimated wait time
  const getEstimatedWaitTime = useCallback((position: number) => {
    if (stats.tokensProcessed === 0) return 'N/A';
    const avgWaitTime = stats.totalWaitTime / stats.tokensProcessed;
    return Math.round(avgWaitTime * position);
  }, [stats]);

  return {
    // Queue state
    queue,
    currentServing,
    nextTokenNumber,
    currentToken,
    queueLength: queue.length,
    liveQueueCount,
    
    // Stats
    stats,
    averageWaitTime: stats.tokensProcessed > 0 ? Math.round(stats.totalWaitTime / stats.tokensProcessed) : 0,
    liveEstimatedWaitTime,
    
    // Actions
    getToken,
    serveNext,
    skipToken,
    resetQueue,
    resetStats,
    getEstimatedWaitTime
  };
};