import { Clock, Users, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface QueueDisplayProps {
  currentServing: number | null;
  queueLength: number;
  nextToken?: number;
  estimatedWaitTime?: string | number;
  showNextToken?: boolean;
}

const QueueDisplay = ({ 
  currentServing, 
  queueLength, 
  nextToken, 
  estimatedWaitTime,
  showNextToken = true 
}: QueueDisplayProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Now Serving */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg text-muted-foreground flex items-center justify-center gap-2">
            <Hash className="w-5 h-5" />
            Now Serving
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`text-4xl font-bold mb-2 ${currentServing ? 'text-success pulse-glow' : 'text-muted-foreground'}`}>
            {currentServing || '--'}
          </div>
          <div className="text-sm text-muted-foreground">
            Current Token
          </div>
        </CardContent>
      </Card>

      {/* Next Token */}
      {showNextToken && (
        <Card className="bg-gradient-card shadow-card border-border">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg text-muted-foreground flex items-center justify-center gap-2">
              <Hash className="w-5 h-5" />
              Next Token
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold mb-2 text-warning">
              {nextToken || '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              Up Next
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiting Count */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg text-muted-foreground flex items-center justify-center gap-2">
            <Users className="w-5 h-5" />
            In Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`text-4xl font-bold mb-2 ${queueLength > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
            {queueLength}
          </div>
          <div className="text-sm text-muted-foreground">
            Waiting
          </div>
        </CardContent>
      </Card>

      {/* Estimated Wait Time */}
      {estimatedWaitTime && (
        <Card className="bg-gradient-card shadow-card border-border md:col-span-3">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg text-muted-foreground flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              Estimated Wait Time
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold mb-2 text-accent">
              {typeof estimatedWaitTime === 'number' 
                ? `${estimatedWaitTime} min` 
                : estimatedWaitTime
              }
            </div>
            <div className="text-sm text-muted-foreground">
              Based on current queue
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QueueDisplay;