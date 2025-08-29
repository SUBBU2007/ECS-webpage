import { Link } from 'react-router-dom';
import { Users, Settings, ArrowRight, Clock, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


const Landing = () => {
  

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">Smart Queue</span>
          </div>
          <div className="flex items-center gap-4"></div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8 glow-primary">
            <Users className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Smart Queue Management System
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Streamline your customer service with our intelligent queue management solution. 
            Reduce wait times, improve customer satisfaction, and optimize your operations.
          </p>

          {/* Portal Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <Card className="bg-gradient-card shadow-elevated border-border hover:scale-105 transition-bounce group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:glow-primary transition-smooth">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">Customer Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Get your queue token and track your position in real-time
                </p>
                <Button variant="default" size="lg" asChild className="w-full">
                  <Link to="/customer" className="flex items-center justify-center gap-2">
                    Enter Customer Portal
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-elevated border-border hover:scale-105 transition-bounce group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-smooth">
                  <Settings className="w-8 h-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">Admin Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Manage the queue and access comprehensive analytics
                </p>
                <Button variant="secondary" size="lg" asChild className="w-full">
                  <Link to="/admin" className="flex items-center justify-center gap-2">
                    Enter Admin Portal
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-success" />
              </div>
              <CardTitle className="text-xl">Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Live queue status with estimated wait times and instant notifications
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-warning" />
              </div>
              <CardTitle className="text-xl">Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Comprehensive statistics to optimize your service operations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Secure & Reliable</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Built with enterprise-grade security and persistent data storage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-6 text-foreground">Why Choose Smart Queue?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50%</div>
              <div className="text-muted-foreground">Reduced Wait Times</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success mb-2">95%</div>
              <div className="text-muted-foreground">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-warning mb-2">24/7</div>
              <div className="text-muted-foreground">System Availability</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;