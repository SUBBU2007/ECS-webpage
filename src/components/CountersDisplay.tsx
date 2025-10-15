import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Counter } from "@/integrations/supabase/types";
import { Users, Clock, Ticket } from "lucide-react";

interface CountersDisplayProps {
  counters: Counter[];
  isLoading: boolean;
  error: string | null;
}

const CountersDisplay = ({ counters, isLoading, error }: CountersDisplayProps) => {
  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading counter information...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {counters.map((counter) => (
        <Card key={counter.id} className="bg-gradient-card shadow-elevated border-border">
          <CardHeader>
            <CardTitle className="text-xl text-center">{counter.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-4">
              <div className="text-5xl font-bold text-primary">
                {counter.current_token_id ? `#${counter.queue.find(t => t.id === counter.current_token_id)?.token_number || '...'}` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">Now Serving</div>
            </div>
            <div className="flex justify-around text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{counter.queue.length} in queue</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>~{counter.camera_data.estimated_wait_time} min wait</span>
              </div>
               <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                <span>Next: #{counter.queue[0]?.token_number || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CountersDisplay;
