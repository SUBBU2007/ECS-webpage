import { useState, useEffect } from 'react';
import { Ticket, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQueue, Token } from '@/hooks/useQueue';
import QueueDisplay from '@/components/QueueDisplay';
import Navigation from '@/components/Navigation';

const TOKEN_STORAGE_KEY = 'customer_token';

const CustomerPortal = () => {
  const { toast } = useToast();
  const {
    queue,
    currentServing,
    nextToken,
    getToken,
    liveQueueCount,
    liveEstimatedWaitTime,
  } = useQueue();

  const [myToken, setMyToken] = useState<Token | null>(null);
  const [isGettingToken, setIsGettingToken] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
      try {
        setMyToken(JSON.parse(savedToken));
      } catch (e) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }, []);

  // Effect to update myToken details from the live queue data
  useEffect(() => {
    if (!myToken) return;

    const isBeingServed = currentServing === myToken.number;
    const isInWaitingQueue = queue.some(t => t.id === myToken.id);

    if (isBeingServed) {
      if (myToken.status !== 'serving') {
        setMyToken(prev => prev ? { ...prev, status: 'serving' } : null);
      }
    } else if (isInWaitingQueue) {
      if (myToken.status !== 'waiting') {
        setMyToken(prev => prev ? { ...prev, status: 'waiting' } : null);
      }
    } else {
      // If it's not waiting and not being served, it's "stale" and can be cleared.
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setMyToken(null);
    }
  }, [queue, currentServing, myToken]);


  const handleGetToken = async () => {
    setIsGettingToken(true);
    try {
      const newToken = await getToken();
      if (newToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newToken));
        setMyToken(newToken);
        toast({
          title: "Token Issued",
          description: `Your token #${newToken.number} has been issued.`,
        });
      }
    } finally {
      setIsGettingToken(false);
    }
  };

  const myPosition = myToken && myToken.status === 'waiting'
    ? queue.findIndex(t => t.id === myToken.id) + 1
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Customer Portal
          </h1>
          <p className="text-xl text-muted-foreground">
            Get your queue token and track your wait time
          </p>
        </div>

        <QueueDisplay
          currentServing={currentServing}
          queueLength={liveQueueCount}
          nextToken={nextToken?.number}
          estimatedWaitTime={liveEstimatedWaitTime}
        />

        <div className="max-w-2xl mx-auto">
          {!myToken ? (
            <Card className="bg-gradient-card shadow-elevated border-border">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 glow-primary">
                  <Ticket className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Get Your Queue Token</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-8">
                  Click the button below to get your queue token and join the line.
                </p>
                <Button variant="hero" size="xl" onClick={handleGetToken} disabled={isGettingToken}>
                  {isGettingToken ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Ticket className="w-5 h-5" />}
                  {isGettingToken ? 'Getting Token...' : 'Get Token'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-gradient-card shadow-elevated border-border">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-4 pulse-glow">
                    <Ticket className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Your Token</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-6xl font-bold mb-4 text-accent token-bounce">
                    #{myToken.number}
                  </div>
                  <div className="text-muted-foreground mb-6">
                    Issued at {new Date(myToken.created_at).toLocaleTimeString()}
                  </div>
                  
                  {myToken.status === 'waiting' && myPosition && myPosition > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="text-2xl font-bold text-primary">{myPosition}</div>
                      <div className="text-muted-foreground">Position in Queue</div>
                    </div>
                  )}

                  {myToken.status === 'serving' && (
                    <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground">
                      <div className="text-xl font-bold mb-2">🎉 You're being served!</div>
                      <div className="text-primary-foreground/80">
                        Please proceed to the counter.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;