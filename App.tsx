import { Switch, Route } from "wouter";
import { queryClient } from "/lib/queryClient";
import { QueryClientProvider } from "/tanstack/react-query";
import { Toaster } from "/components/ui/toaster";
import { TooltipProvider } from "/components/ui/tooltip";
import { useState } from "react";
import Dashboard from "/pages/dashboard";
import Onboarding from "/pages/onboarding";
import Training from "/pages/training";
import NotFound from "/pages/not-found";
import type { User } from "/lib/types";

function Router() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('salesai-user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleUserLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('salesai-user', JSON.stringify(userData));
  };

  const handleUserLogout = () => {
    setUser(null);
    localStorage.removeItem('salesai-user');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('salesai-user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return <Onboarding onUserLogin={handleUserLogin} />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard user={user} onLogout={handleUserLogout} onUserUpdate={handleUserUpdate} />} />
      <Route path="/training" component={() => <Training user={user} onLogout={handleUserLogout} onUserUpdate={handleUserUpdate} />} />
      <Route path="/training/:scenarioId" component={({ params }) => 
        <Training user={user} onLogout={handleUserLogout} onUserUpdate={handleUserUpdate} scenarioId={parseInt(params.scenarioId)} />
      } />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
