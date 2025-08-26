import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/customer', label: 'Customer', icon: Users },
    { path: '/admin', label: 'Admin', icon: Settings },
    { path: '/admin/stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <nav className="bg-gradient-card border-b border-border shadow-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Smart Queue
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              
              return (
                <Button
                  key={path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className="transition-smooth"
                >
                  <Link to={path} className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;