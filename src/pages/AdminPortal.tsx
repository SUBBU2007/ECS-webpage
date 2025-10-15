// import { useState } from 'react';
// import { Play, Settings } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { useToast } from '@/hooks/use-toast';
// import { useQueue } from '@/hooks/useQueue';
// import Navigation from '@/components/Navigation';
// import CountersDisplay from '@/components/CountersDisplay';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// const AdminPortal = () from {
//   const { toast } = useToast();
//   const { countersData, isLoading, error, serveNext } = useQueue();
//   const [isProcessing, setIsProcessing] = useState<number | null>(null);

//   const handleServeNext = async (counterId: number, queueLength: number) => {
//     if (queueLength === 0) {
//       toast({
//         title: "No tokens in queue",
//         description: "There are no customers waiting to be served at this counter.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsProcessing(counterId);
//     const servedToken = await serveNext(counterId);
//     if (servedToken) {
//       toast({
//         title: "Next customer served",
//         description: `Token #${servedToken.token_number} is now being served.`,
//       });
//     }
//     setIsProcessing(null);
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <Navigation />
      
//       <div className="container mx-auto px-6 py-8">
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
//             Admin Portal
//           </h1>
//           <p className="text-xl text-muted-foreground">
//             Manage the queue and serve customers efficiently
//           </p>
//         </div>

//         {/* Display all counters */}
//         <CountersDisplay counters={countersData} isLoading={isLoading} error={error} />

//         <div className="max-w-6xl mx-auto mt-8">
//           <Card className="bg-gradient-card shadow-elevated border-border">
//             <CardHeader>
//               <CardTitle className="text-2xl flex items-center gap-2">
//                 <Settings className="w-6 h-6" />
//                 Queue Management
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <Tabs defaultValue={countersData[0]?.id.toString() || ''} className="w-full">
//                 <TabsList className="grid w-full grid-cols-3">
//                    {countersData.map(counter => (
//                     <TabsTrigger key={counter.id} value={counter.id.toString()}>
//                       {counter.name}
//                     </TabsTrigger>
//                   ))}
//                 </TabsList>

//                 {countersData.map(counter => (
//                   <TabsContent key={counter.id} value={counter.id.toString()}>
//                     <div className="mt-4">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* Action Panel */}
//                         <div className="flex flex-col gap-4">
//                            <Button
//                             variant="secondary"
//                             size="lg"
//                             onClick={() => handleServeNext(counter.id, counter.queue.length)}
//                             disabled={isProcessing === counter.id || counter.queue.length === 0}
//                             className="flex-col h-24 transition-bounce bg-success text-success-foreground hover:bg-success/90"
//                           >
//                             <Play className="w-8 h-8 mb-1" />
//                             <span className="text-md">Serve Next</span>
//                             {counter.queue.length > 0 && (
//                               <span className="text-sm opacity-80">Token #{counter.queue[0]?.token_number}</span>
//                             )}
//                           </Button>
//                            {/* Add other actions like skip or reset here if needed */}
//                         </div>

//                         {/* Queue List */}
//                         <div>
//                           <h3 className="text-lg font-semibold mb-2">
//                             Queue ({counter.queue.length} waiting)
//                           </h3>
//                           {counter.queue.length > 0 ? (
//                             <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
//                               {counter.queue.map((token, index) => (
//                                 <div
//                                   key={token.id}
//                                   className={`
//                                     bg-muted/50 rounded-lg p-3 text-center border
//                                     ${index === 0 ? 'border-success bg-success/10' : 'border-border'}
//                                   `}
//                                 >
//                                   <div className={`font-bold text-lg ${index === 0 ? 'text-success' : 'text-foreground'}`}>
//                                     #{token.token_number}
//                                   </div>
//                                 </div>
//                               ))}
//                             </div>
//                           ) : (
//                             <div className="text-center text-muted-foreground py-8">
//                               <div className="text-4xl mb-2">🎉</div>
//                               <p>Queue is empty!</p>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </TabsContent>
//                 ))}
//               </Tabs>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminPortal;

import { useState } from 'react';
import { Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQueue } from '@/hooks/useQueue';
import Navigation from '@/components/Navigation';
import CountersDisplay from '@/components/CountersDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminPortal = () => {
  const { toast } = useToast();
  const { countersData, isLoading, error, serveNext } = useQueue();
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  const handleServeNext = async (counterId: number, queueLength: number) => {
    if (queueLength === 0) {
      toast({
        title: "No tokens in queue",
        description: "There are no customers waiting to be served at this counter.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(counterId);
    const servedToken = await serveNext(counterId);
    if (servedToken) {
      toast({
        title: "Next customer served",
        description: `Token #${servedToken.token_number} is now being served.`,
      });
    }
    setIsProcessing(null);
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

        <CountersDisplay counters={countersData} isLoading={isLoading} error={error} />
        
        <div className="max-w-6xl mx-auto mt-8">
          <Card className="bg-gradient-card shadow-elevated border-border">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Queue Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {countersData && countersData.length > 0 && (
                <Tabs defaultValue={countersData[0].id.toString()} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    {countersData.map(counter => (
                      <TabsTrigger key={counter.id} value={counter.id.toString()}>
                        {counter.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {countersData.map(counter => (
                    <TabsContent key={counter.id} value={counter.id.toString()}>
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Action Panel */}
                          <div className="flex flex-col gap-4">
                            <Button
                              variant="secondary"
                              size="lg"
                              onClick={() => handleServeNext(counter.id, counter.queue.length)}
                              disabled={isProcessing === counter.id || counter.queue.length === 0}
                              className="flex-col h-24 transition-bounce bg-success text-success-foreground hover:bg-success/90"
                            >
                              <Play className="w-8 h-8 mb-1" />
                              <span className="text-md">Serve Next</span>
                              {counter.queue.length > 0 && (
                                <span className="text-sm opacity-80">Token #{counter.queue[0]?.token_number}</span>
                              )}
                            </Button>
                          </div>

                          {/* Queue List */}
                          <div>
                            <h3 className="text-lg font-semibold mb-2">
                              Queue ({counter.queue.length} waiting)
                            </h3>
                            {counter.queue.length > 0 ? (
                              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {counter.queue.map((token, index) => (
                                  <div
                                    key={token.id}
                                    className={`
                                      bg-muted/50 rounded-lg p-3 text-center border
                                      ${index === 0 ? 'border-success bg-success/10' : 'border-border'}
                                    `}
                                  >
                                    <div className={`font-bold text-lg ${index === 0 ? 'text-success' : 'text-foreground'}`}>
                                      #{token.token_number}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground py-8">
                                <div className="text-4xl mb-2">🎉</div>
                                <p>Queue is empty!</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;