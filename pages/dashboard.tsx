import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Play, 
  Shuffle, 
  ChevronRight, 
  Handshake, 
  Phone, 
  Users,
  Zap,
  TrendingUp,
  Home,
  ChartBar,
  User as UserIcon
} from "lucide-react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/navigation/navbar";
import StatsOverview from "@/components/progress/stats-overview";
import ScenarioCard from "@/components/training/scenario-card";
import type { User, Scenario, TrainingSession } from "@/lib/types";
import { ROLES } from "@/lib/types";

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function Dashboard({ user, onLogout, onUserUpdate }: DashboardProps) {
  const handleRoleChange = (newRole: string) => {
    if (onUserUpdate) {
      onUserUpdate({ ...user, role: newRole });
    }
  };
  const [location, navigate] = useLocation();

  const { data: scenarios = [] } = useQuery<Scenario[]>({
    queryKey: ['/api/scenarios', { role: user.role, industry: user.industry }],
    queryFn: async () => {
      const response = await fetch(`/api/scenarios?role=${user.role}&industry=${user.industry}`);
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      return response.json();
    },
  });

  const { data: recentSessions = [] } = useQuery<TrainingSession[]>({
    queryKey: ['/api/training/sessions/user', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/training/sessions/user/${user.id}?limit=3`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
  });

  const roleConfig = ROLES.find(r => r.value === user.role);

  const handleStartRandomScenario = () => {
    navigate('/training');
  };

  const handleStartScenario = (scenarioId: number) => {
    navigate(`/training/${scenarioId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} onLogout={onLogout} onRoleChange={handleRoleChange} />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:top-16 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
          <div className="flex-1 flex flex-col min-h-0 pt-6 pb-4">
            <div className="px-6 mb-6">
              <div className="bg-gradient-to-r from-primary to-purple-600 p-4 rounded-lg text-white">
                <div className="text-sm opacity-90">Current Role</div>
                <div className="font-semibold">{roleConfig?.label || user.role}</div>
                <div className="text-xs opacity-75 mt-1">{user.industry}</div>
              </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
              <Link href="/">
                <a className="bg-primary text-white group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  <BarChart3 className="mr-3 h-4 w-4" />
                  Dashboard
                </a>
              </Link>
              
              <Link href="/training">
                <a className="text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  <Play className="mr-3 h-4 w-4" />
                  Live Training
                </a>
              </Link>
              
              <a href="#" className="text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                <TrendingUp className="mr-3 h-4 w-4" />
                Progress Analytics
              </a>
              
              <a href="#" className="text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                <ChartBar className="mr-3 h-4 w-4" />
                Session History
              </a>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Dashboard Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Welcome back, {user.firstName}!
                  </h1>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Continue your sales training journey and track your progress.
                  </p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <Button onClick={() => navigate('/training')}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Training
                  </Button>
                  
                  <Button variant="outline" onClick={handleStartRandomScenario}>
                    <Shuffle className="mr-2 h-4 w-4" />
                    Random Scenario
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview user={user} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Quick Training */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Quick Training</CardTitle>
                    <Zap className="h-5 w-5 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scenarios.slice(0, 3).map((scenario) => (
                      <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        onClick={() => handleStartScenario(scenario.id)}
                      />
                    ))}
                    
                    {scenarios.length === 0 && (
                      <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                        No scenarios available for your role and industry.
                      </div>
                    )}

                    <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/training')}>
                      View All Scenarios
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Progress */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Progress</CardTitle>
                    <BarChart3 className="h-5 w-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSessions.length > 0 ? (
                      recentSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {session.scenarioTitle}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(session.completedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-green-500">{session.score}%</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Score</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                        No training sessions yet. Start your first session!
                      </div>
                    )}

                    <Button variant="outline" className="w-full mt-4">
                      View Full History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Role-Specific Modules */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Role-Specific Training Modules</CardTitle>
                  <Button variant="link" className="text-sm">
                    Switch Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* AE Module */}
                  <Card className="border hover:border-purple-500 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                          <Handshake className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">Account Executive</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Deal Closing Focus</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Discovery Calls</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">8/10</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Objection Handling</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">6/8</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Closing Techniques</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">4/6</span>
                        </div>
                      </div>
                      <Progress value={75} className="mt-4" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">75% Complete</p>
                    </CardContent>
                  </Card>

                  {/* SDR Module */}
                  <Card className="border hover:border-orange-500 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3">
                          <Phone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">Sales Development</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Prospecting & Qualification</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Cold Calling</span>
                          <span className="text-orange-600 dark:text-orange-400 font-medium">12/15</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Email Sequences</span>
                          <span className="text-orange-600 dark:text-orange-400 font-medium">8/10</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Lead Qualification</span>
                          <span className="text-orange-600 dark:text-orange-400 font-medium">5/8</span>
                        </div>
                      </div>
                      <Progress value={70} className="mt-4" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">70% Complete</p>
                    </CardContent>
                  </Card>

                  {/* CSM Module */}
                  <Card className="border hover:border-green-500 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                          <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">Customer Success</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Retention & Expansion</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Renewal Calls</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">9/12</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Upselling</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">6/9</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Churn Prevention</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">4/7</span>
                        </div>
                      </div>
                      <Progress value={68} className="mt-4" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">68% Complete</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-2">
        <div className="flex justify-around">
          <button className="flex flex-col items-center py-2 text-primary">
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button 
            className="flex flex-col items-center py-2 text-slate-400"
            onClick={() => navigate('/training')}
          >
            <Play className="h-5 w-5" />
            <span className="text-xs mt-1">Train</span>
          </button>
          <button className="flex flex-col items-center py-2 text-slate-400">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs mt-1">Progress</span>
          </button>
          <button className="flex flex-col items-center py-2 text-slate-400">
            <UserIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
