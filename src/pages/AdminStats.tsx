import { BarChart3, Users, Clock, TrendingUp, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
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

const AdminStats = () => {
  const { toast } = useToast();
  const {
    stats,
    averageWaitTime,
    resetStats
  } = useQueue();

  const handleResetStats = () => {
    resetStats();
    toast({
      title: "Statistics reset",
      description: "Daily statistics have been cleared. Current queue is preserved.",
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
            Admin Statistics
          </h1>
          <p className="text-xl text-muted-foreground">
            Daily performance metrics and analytics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-muted-foreground flex items-center gap-2">
                <Users className="w-5 h-5" />
                Tokens Served Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2 text-success">
                {stats.tokensServedToday}
              </div>
              <div className="text-sm text-muted-foreground">
                Customers served
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Peak Queue Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2 text-warning">
                {stats.peakQueueSize}
              </div>
              <div className="text-sm text-muted-foreground">
                Maximum waiting
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-muted-foreground flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Average Wait Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2 text-primary">
                {averageWaitTime > 0 ? formatTime(averageWaitTime) : '--'}
              </div>
              <div className="text-sm text-muted-foreground">
                Per customer
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Total Wait Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2 text-accent">
                {stats.totalWaitTime > 0 ? formatTime(Math.round(stats.totalWaitTime)) : '--'}
              </div>
              <div className="text-sm text-muted-foreground">
                Cumulative time
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-gradient-card shadow-elevated border-border">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Service Efficiency</div>
                    <div className="text-sm text-muted-foreground">Tokens processed vs. peak queue</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {stats.peakQueueSize > 0 
                      ? Math.round((stats.tokensServedToday / stats.peakQueueSize) * 100) 
                      : 0}%
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Processing Rate</div>
                    <div className="text-sm text-muted-foreground">Average tokens per hour</div>
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {averageWaitTime > 0 ? Math.round(60 / averageWaitTime) : 0}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Queue Status</div>
                    <div className="text-sm text-muted-foreground">Current system state</div>
                  </div>
                  <div className="text-lg font-bold text-accent">
                    {stats.tokensServedToday > 0 ? 'Active' : 'Idle'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elevated border-border">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Wait Time Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.tokensProcessed === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-bold mb-2">No Data Yet</h3>
                    <p className="text-muted-foreground">
                      Statistics will appear once customers start being served.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {formatTime(averageWaitTime)}
                      </div>
                      <div className="text-primary">Average Wait Time</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-success">
                          {Math.round(stats.totalWaitTime)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Minutes</div>
                      </div>
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-warning">
                          {stats.tokensProcessed}
                        </div>
                        <div className="text-sm text-muted-foreground">Customers</div>
                      </div>
                    </div>

                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <div className="text-sm text-accent font-medium mb-2">Performance Tip</div>
                      <div className="text-sm text-muted-foreground">
                        {averageWaitTime > 10 
                          ? "Consider optimizing service time to reduce wait times."
                          : "Great job! Wait times are well managed."
                        }
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reset Statistics */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Reset Daily Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Reset all daily statistics including tokens served, peak queue size, and wait times. 
                This will not affect the current queue or customers waiting.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Statistics
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gradient-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Confirm Statistics Reset
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently reset all daily statistics to zero. 
                      The current queue and waiting customers will not be affected. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetStats} className="bg-destructive hover:bg-destructive/90">
                      Reset Statistics
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;