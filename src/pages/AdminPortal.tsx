import { useState } from 'react';
import { Play, Check, Undo, Settings, Users, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQueue, Token, Counter } from '@/hooks/useQueue';
import Navigation from '@/components/Navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const AdminPortal = () => {
  const { toast } = useToast();
  const {
    counters,
    selectedCounterId,
    waitingQueue,
    servingTokens,
    selectCounter,
    serveNext,
    markAsServed,
    returnToQueue,
  } = useQueue();

  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Store token ID

  const handleServeNext = async () => {
    if (!selectedCounterId) {
      toast({ title: "No counter selected", description: "Please select a counter to serve from.", variant: "destructive" });
      return;
    }
    if (waitingQueue.length === 0) {
      toast({ title: "No tokens in queue", variant: "destructive" });
      return;
    }
    await serveNext(selectedCounterId);
  };

  const handleAction = async (action: 'serve' | 'return', tokenId: string) => {
    setIsProcessing(tokenId);
    if (action === 'serve') {
      await markAsServed(tokenId);
      toast({ title: "Token served", description: "The customer has been served." });
    } else {
      await returnToQueue(tokenId);
      toast({ title: "Token returned", description: "The token is now back in the waiting queue." });
    }
    setIsProcessing(null);
  };

  const getCounterName = (counterId: number): string => {
    return counters.find(c => c.id === counterId)?.name || 'Unknown Counter';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage the queue and serve customers efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Controls & Waiting Queue */}
          <div className="lg:col-span-2 space-y-8">
            {/* Now Serving Section */}
            <Card className="bg-gradient-card shadow-elevated border-border">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MonitorSmartphone className="w-6 h-6" />
                  Now Serving
                </CardTitle>
              </CardHeader>
              <CardContent>
                {counters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {counters.map(counter => {
                      const servingToken = servingTokens.find(t => t.served_by_counter_id === counter.id);
                      return (
                        <div key={counter.id} className="p-4 bg-muted/50 rounded-lg border">
                          <h3 className="font-bold text-lg mb-2">{counter.name}</h3>
                          {servingToken ? (
                            <div className="flex flex-col items-center justify-center bg-background p-4 rounded-md">
                              <div className="text-4xl font-bold text-success pulse-glow mb-2">#{servingToken.number}</div>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="success" onClick={() => handleAction('serve', servingToken.id)} disabled={isProcessing === servingToken.id}>
                                  <Check className="w-4 h-4 mr-2" /> Done
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleAction('return', servingToken.id)} disabled={isProcessing === servingToken.id}>
                                  <Undo className="w-4 h-4 mr-2" /> Return
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground p-4">Idle</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active counters.</p>
                )}
              </CardContent>
            </Card>

            {/* Waiting Queue List */}
            <Card className="bg-gradient-card shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Waiting Queue ({waitingQueue.length} waiting)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {waitingQueue.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {waitingQueue.map((token, index) => (
                      <div
                        key={token.id}
                        className={`p-3 text-center border rounded-lg bg-muted/50 ${index === 0 ? 'border-success bg-success/10' : 'border-border'}`}
                      >
                        <div className={`font-bold text-lg ${index === 0 ? 'text-success' : 'text-foreground'}`}>#{token.number}</div>
                        <div className="text-xs text-muted-foreground">{new Date(token.created_at).toLocaleTimeString()}</div>
                        {index === 0 && <div className="text-xs text-success font-medium mt-1">Next</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold mb-2">Queue is Empty!</h3>
                    <p className="text-muted-foreground">No customers are currently waiting.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Counter Selection & Actions */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="bg-gradient-card shadow-elevated border-border">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Select Your Counter</Label>
                  <RadioGroup
                    value={selectedCounterId?.toString()}
                    onValueChange={(value) => selectCounter(parseInt(value))}
                    className="space-y-2"
                  >
                    {counters.map(counter => (
                      <div key={counter.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={counter.id.toString()} id={`counter-${counter.id}`} />
                        <Label htmlFor={`counter-${counter.id}`} className="text-lg">{counter.name}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <Button
                  size="lg"
                  onClick={handleServeNext}
                  disabled={!selectedCounterId || waitingQueue.length === 0}
                  className="w-full flex-col h-24 transition-bounce bg-success text-success-foreground hover:bg-success/90"
                >
                  <Play className="w-8 h-8 mb-1" />
                  <span className="text-lg">Serve Next Token</span>
                  {waitingQueue.length > 0 && <span className="text-sm opacity-80">#{waitingQueue[0].number}</span>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;