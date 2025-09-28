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
    counters,
    waitingQueue,
    servingTokens,
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

    const allTokens = [...waitingQueue, ...servingTokens];
    const updatedToken = allTokens.find(t => t.id === myToken.id);

    if (updatedToken) {
      setMyToken(updatedToken);
    } else {
      // My token is no longer in waiting or serving, maybe it was served/skipped
      // For simplicity, we just clear it. A more robust solution might check 'served' status.
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setMyToken(null);
    }
  }, [waitingQueue, servingTokens, myToken]);


  const handleGetToken = async () => {
    setIsGettingToken(true);
    const newToken = await getToken();
    if (newToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newToken));
      setMyToken(newToken);
    }
    setIsGettingToken(false);
  };

  const myPosition = myToken ? waitingQueue.findIndex(t => t.id === myToken.id) + 1 : null;
  const myServingCounter = myToken?.status === 'serving'
    ? counters.find(c => c.id === myToken.served_by_counter_id)
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

        {/* Queue Status Display */}
        <QueueDisplay
          servingTokens={servingTokens}
          counters={counters}
          waitingCount={waitingQueue.length}
          liveEstimatedWaitTime={liveEstimatedWaitTime}
          liveQueueCount={liveQueueCount}
        />

        {/* Token Management */}
        <div className="max-w-2xl mx-auto">
          {!myToken ? (
            /* Get Token Card */
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
            /* Current Token Display */
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
                  
                  {myPosition && myPosition > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="text-2xl font-bold text-primary">{myPosition}</div>
                      <div className="text-muted-foreground">Position in Queue</div>
                    </div>
                  )}

                  {myServingCounter && (
                    <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground">
                      <div className="text-xl font-bold mb-2">🎉 You're being served!</div>
                      <div className="text-primary-foreground/80">
                        Please proceed to <span className="font-bold">{myServingCounter.name}</span>.
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