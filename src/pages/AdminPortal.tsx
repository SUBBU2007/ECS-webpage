import { useState } from 'react';
import { Play, SkipForward, RotateCcw, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import QueueDisplay from '@/components/QueueDisplay';
import Navigation from '@/components/Navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const AdminPortal = () => {
  const { toast } = useToast();
  const {
    queue,
    currentServing,
    queueLength, // from token system
    liveQueueCount, // from camera
    serveNext,
    skipToken,
    resetQueue
  } = useQueue();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleServeNext = async () => {
    if (queueLength === 0) {
      toast({
        title: "No tokens in queue",
        description: "There are no customers waiting to be served.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const servedToken = await serveNext();
    if (servedToken) {
      toast({
        title: "Next customer served",
        description: `Token #${servedToken.number} is now being served.`,
      });
    }
    setIsProcessing(false);
  };

  const handleSkipToken = async () => {
    if (queueLength === 0) {
      toast({
        title: "No tokens to skip",
        description: "There are no customers in the queue to skip.",
        variant: "destructive",
      });
      return;
    }

    const skippedToken = await skipToken();
    if (skippedToken) {
      toast({
        title: "Token skipped",
        description: `Token #${skippedToken.number} has been skipped.`,
      });
    }
  };

  const handleResetQueue = async () => {
    await resetQueue();
    toast({
      title: "Queue reset",
      description: "The queue has been cleared. Daily stats are preserved.",
    });
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

        {/* Queue Status Display */}
        <QueueDisplay
          currentServing={currentServing}
          queueLength={liveQueueCount}
          nextToken={queue[0]?.number}
          showNextToken={true}
        />

        {/* Admin Controls */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-card shadow-elevated border-border mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Queue Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Serve Next */}
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleServeNext}
                  disabled={isProcessing || queueLength === 0}
                  className="flex-col h-20 transition-bounce bg-success text-success-foreground hover:bg-success/90"
                >
                  <Play className="w-6 h-6 mb-1" />
                  <span className="text-sm">Serve Next</span>
                  {queueLength > 0 && (
                    <span className="text-xs opacity-80">Token #{queue[0]?.number}</span>
                  )}
                </Button>

                {/* Skip Token */}
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleSkipToken}
                  disabled={queueLength === 0}
                  className="flex-col h-20 transition-bounce bg-warning text-warning-foreground hover:bg-warning/90"
                >
                  <SkipForward className="w-6 h-6 mb-1" />
                  <span className="text-sm">Skip Token</span>
                  {queueLength > 0 && (
                    <span className="text-xs opacity-80">Skip #{queue[0]?.number}</span>
                  )}
                </Button>

                {/* Reset Queue */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="flex-col h-20 transition-bounce"
                    >
                      <RotateCcw className="w-6 h-6 mb-1" />
                      <span className="text-sm">Reset Queue</span>
                      <span className="text-xs opacity-80">Clear all</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gradient-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Confirm Queue Reset
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all tokens from the current queue. 
                        Daily statistics will be preserved. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetQueue} className="bg-destructive hover:bg-destructive/90">
                        Reset Queue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Current Queue List */}
          {queueLength > 0 && (
            <Card className="bg-gradient-card shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-xl">Current Queue ({queueLength} waiting)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {queue.map((token, index) => (
                    <div
                      key={token.id}
                      className={`
                        bg-muted/50 rounded-lg p-3 text-center border
                        ${index === 0 
                          ? 'border-success bg-success/10 pulse-glow' 
                          : 'border-border'
                        }
                      `}
                    >
                      <div className={`font-bold text-lg ${index === 0 ? 'text-success' : 'text-foreground'}`}>
                        #{token.number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(token.created_at).toLocaleTimeString()}
                      </div>
                      {index === 0 && (
                        <div className="text-xs text-success font-medium mt-1">
                          Next
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {queueLength === 0 && (
            <Card className="bg-gradient-card shadow-card border-border">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Queue is Empty!</h3>
                <p className="text-muted-foreground">
                  No customers are currently waiting. Great job!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;