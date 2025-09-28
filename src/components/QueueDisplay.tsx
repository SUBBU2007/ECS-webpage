import { Clock, Users, Monitor, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Counter, Token } from '@/hooks/useQueue';

interface QueueDisplayProps {
  servingTokens: Token[];
  counters: Counter[];
  waitingCount: number;
  liveQueueCount: number;
  liveEstimatedWaitTime: number;
}

const QueueDisplay = ({ 
  servingTokens,
  counters,
  waitingCount,
  liveQueueCount,
  liveEstimatedWaitTime,
}: QueueDisplayProps) => {

  const getServingTokenForCounter = (counterId: number): Token | undefined => {
    return servingTokens.find(t => t.served_by_counter_id === counterId);
  };

  return (
    <div className="space-y-8">
      {/* Now Serving Section */}
      <Card className="bg-gradient-card shadow-elevated border-border">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Monitor className="w-6 h-6 text-primary" />
            Now Serving
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {counters.map(counter => {
              const token = getServingTokenForCounter(counter.id);
              return (
                <div key={counter.id} className="p-3 bg-muted/50 rounded-lg border text-center">
                  <h4 className="font-semibold text-sm text-muted-foreground">{counter.name}</h4>
                  <div className={`text-3xl font-bold mt-1 ${token ? 'text-success' : 'text-muted-foreground/50'}`}>
                    {token ? `#${token.number}` : 'Idle'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Waiting & Live Count */}
        <Card className="bg-gradient-card shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5" />
              In Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around items-center pt-2">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{waitingCount}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Ticket className="w-4 h-4" />
                With Token
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">{liveQueueCount}</div>
              <div className="text-sm text-muted-foreground">
                In Line (Live)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Wait Time */}
        <Card className="bg-gradient-card shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Estimated Wait Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-center">
              <div className="text-4xl font-bold text-warning">
                {liveEstimatedWaitTime} min
              </div>
              <div className="text-sm text-muted-foreground">
                Based on live queue
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QueueDisplay;