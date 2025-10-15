import { useState, useMemo } from 'react';
import { Ticket, Clock, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import Navigation from '@/components/Navigation';
import CountersDisplay from '@/components/CountersDisplay'; // A new component to display all counters

const CustomerPortal = () => {
  const { toast } = useToast();
  const { countersData, isLoading, error, currentToken, getToken } = useQueue();

  const [isGettingToken, setIsGettingToken] = useState(false);
  const [selectedCounterId, setSelectedCounterId] = useState<number | null>(null);

  const handleGetToken = async () => {
    if (!selectedCounterId) {
      toast({
        title: "Selection Needed",
        description: "Please select a counter to get a token.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingToken(true);
    const newToken = await getToken(selectedCounterId);
    if (newToken) {
      toast({
        title: "Token Issued",
        description: `Your token #${newToken.token_number} for the ${selectedCounter?.name} queue has been issued.`,
      });
    }
    setIsGettingToken(false);
  };

  const selectedCounter = useMemo(() =>
    countersData.find(c => c.id === selectedCounterId),
    [countersData, selectedCounterId]
  );

  // Find the counter and queue related to the user's current token
  const tokenCounter = useMemo(() =>
    currentToken ? countersData.find(c => c.id === currentToken.counterId) : null,
    [countersData, currentToken]
  );

  const currentPosition = useMemo(() => {
    if (!currentToken || !tokenCounter) return null;
    const userToken = tokenCounter.queue.find(token => token.token_number === currentToken.number);
    return userToken ? tokenCounter.queue.indexOf(userToken) + 1 : null;
  }, [currentToken, tokenCounter]);


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

        {/* Display all counters */}
        <CountersDisplay counters={countersData} isLoading={isLoading} error={error} />


        <div className="max-w-2xl mx-auto mt-8">
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
                  First, select the service you need, then click the button to get your token.
                </p>

                {/* Counter Selection Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="w-full max-w-xs mb-8">
                      {selectedCounter ? selectedCounter.name : "Select a Counter"}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full max-w-xs">
                    {countersData.map(counter => (
                      <DropdownMenuItem key={counter.id} onSelect={() => setSelectedCounterId(counter.id)}>
                        {counter.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="hero"
                  size="xl"
                  onClick={handleGetToken}
                  disabled={isGettingToken || !selectedCounterId}
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
            // Card to display when user has a token
            <div className="space-y-6">
              <Card className="bg-gradient-card shadow-elevated border-border">
                <CardHeader className="text-center pb-6">
                   <div className="w-16 h-16 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-4 pulse-glow">
                    <Ticket className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Your Token for {tokenCounter?.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-6xl font-bold mb-4 text-accent token-bounce">
                    #{currentToken.number}
                  </div>
                  
                  {currentPosition !== null && currentPosition > 0 && (
                     <div className="bg-muted/50 rounded-lg p-4 mb-4">
                       <div className="flex items-center justify-center gap-4 text-sm">
                        <div>
                          <div className="text-2xl font-bold text-primary">{currentPosition}</div>
                          <div className="text-muted-foreground">Position in Queue</div>
                        </div>
                         {tokenCounter?.camera_data && (
                           <div className="border-l border-border pl-4">
                             <div className="text-2xl font-bold text-warning">{tokenCounter.camera_data.estimated_wait_time} min</div>
                             <div className="text-muted-foreground">Estimated Wait</div>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                  {currentPosition === 1 && (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                      <div className="text-success font-semibold flex items-center justify-center gap-2">
                        <Clock className="w-5 h-5" />
                        You're next! Please be ready.
                      </div>
                    </div>
                  )}

                  {tokenCounter?.current_token_id === currentToken.number && (
                    <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground">
                      <div className="text-xl font-bold mb-2">🎉 You're being served!</div>
                      <div className="text-primary-foreground/80">
                        Please proceed to the {tokenCounter.name} counter.
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
