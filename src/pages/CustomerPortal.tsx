import { useState } from 'react';
import { Ticket, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import QueueDisplay from '@/components/QueueDisplay';
import Navigation from '@/components/Navigation';

const CustomerPortal = () => {
  const { toast } = useToast();
  const {
    queue,
    currentServing,
    currentToken,
    getToken,
    getEstimatedWaitTime,
    liveQueueCount,
    liveEstimatedWaitTime,
  } = useQueue();

  const [isGettingToken, setIsGettingToken] = useState(false);

  const handleGetToken = () => {
    setIsGettingToken(true);
    setTimeout(() => {
      const newToken = getToken();
      toast({
        title: "Token Issued",
        description: `Your token #${newToken.number} has been issued.`,
      });
      setIsGettingToken(false);
    }, 500);
  };

  const currentPosition = currentToken
    ? queue.findIndex(token => token.id === currentToken.id) + 1
    : null;

  const estimatedWait = currentPosition
    ? getEstimatedWaitTime(currentPosition)
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
          nextToken={queue[0]?.number}
          estimatedWaitTime={liveEstimatedWaitTime}
        />

        <div className="max-w-2xl mx-auto">
          {!currentToken ? (
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
                <Button
                  variant="hero"
                  size="xl"
                  onClick={handleGetToken}
                  disabled={isGettingToken}
                  className="w-full max-w-xs token-bounce"
                >
                  {isGettingToken ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Getting Token...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-5 h-5" />
                      Get Token
                    </>
                  )}
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
                    #{currentToken.number}
                  </div>
                  <div className="text-muted-foreground mb-6">
                    Issued at {new Date(currentToken.timestamp).toLocaleTimeString()}
                  </div>
                  
                  {currentPosition !== null && currentPosition > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-center gap-4 text-sm">
                        <div>
                          <div className="text-2xl font-bold text-primary">{currentPosition}</div>
                          <div className="text-muted-foreground">Position in Queue</div>
                        </div>
                        {estimatedWait && estimatedWait !== 'N/A' && (
                          <div className="border-l border-border pl-4">
                            <div className="text-2xl font-bold text-warning">{estimatedWait} min</div>
                            <div className="text-muted-foreground">Estimated Wait</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentPosition === 0 && (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                      <div className="text-success font-semibold flex items-center justify-center gap-2">
                        <Clock className="w-5 h-5" />
                        You're next! Please be ready.
                      </div>
                    </div>
                  )}

                  {currentServing === currentToken.number && (
                    <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground">
                      <div className="text-xl font-bold mb-2">🎉 You're being served!</div>
                      <div className="text-primary-foreground/80">
                        Please proceed to the service counter.
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