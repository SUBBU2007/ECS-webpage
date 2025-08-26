import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8 glow-primary">
            <div className="text-4xl">🔍</div>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">404</h1>
          <p className="text-xl text-muted-foreground mb-8">Oops! Page not found</p>
          <a 
            href="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth shadow-card glow-primary"
          >
            Return to Home
          </a>
        </div>
      </div>
  );
};

export default NotFound;
