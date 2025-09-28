import { useState } from 'react';
import { Play, SkipForward, RotateCcw, Settings, AlertTriangle, Users } from 'lucide-react';
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
    queueLength,
    currentServing,
    nextToken,
    serveNext,
    skipToken,
    resetQueue,
    liveQueueCount,
  } = useQueue();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleServeNext = async () => {
    if (queueLength === 0) {
      toast({ title: "No tokens in queue", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const servedToken = await serveNext();
      if (servedToken) {
        toast({
          title: "Next customer served",
          description: `Token #${servedToken.number} is now being served.`,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipToken = async () => {
    if (queueLength === 0) return;
    setIsProcessing(true);
    try {
      const skipped = await skipToken();
      if (skipped) {
        toast({ title: "Token skipped", description: `Token #${skipped.number} has been skipped.` });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetQueue = async () => {
    setIsProcessing(true);
    try {
      await resetQueue();
      toast({ title: "Queue reset", description: "The token queue has been cleared." });
    } finally {
      setIsProcessing(false);
    }
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

        <QueueDisplay
          currentServing={currentServing}
          queueLength={liveQueueCount}
          nextToken={nextToken?.number}
          showNextToken={true}
        />

        <div className="max-w-4xl mx-auto mt-8">
          <Card className="bg-gradient-card shadow-elevated border-border mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Queue Management
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleServeNext}
                  disabled={isProcessing || queueLength === 0}
                  className="h-20 flex-col transition-bounce bg-success text-success-foreground hover:bg-success/90"
                >
                  <Play className="w-6 h-6 mb-1" />
                  <span>Serve Next (#{nextToken?.number || '--'})</span>
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleSkipToken}
                  disabled={isProcessing || queueLength === 0}
                  className="h-20 flex-col transition-bounce bg-warning text-warning-foreground hover:bg-warning/90"
                >
                  <SkipForward className="w-6 h-6 mb-1" />
                  <span>Skip Token</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="h-20 flex-col transition-bounce"
                      disabled={isProcessing || queueLength === 0}
                    >
                      <RotateCcw className="w-6 h-6 mb-1" />
                      <span>Reset Queue</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will clear all waiting tokens from the queue. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetQueue}>Reset</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {queueLength > 0 ? (
            <Card className="bg-gradient-card shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Waiting Queue ({queueLength} waiting)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {queue.map((token, index) => (
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
              </CardContent>
            </Card>
          ) : (
             <Card className="bg-gradient-card shadow-card border-border">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Queue is Empty!</h3>
                <p className="text-muted-foreground">No customers are currently waiting.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;