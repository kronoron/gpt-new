import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Play, 
  Shuffle, 
  Star,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Home,
  User as UserIcon
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navigation/navbar";
import ConversationInterface from "@/components/training/conversation-interface";
import ScenarioCard from "@/components/training/scenario-card";
import type { User, Scenario, ConversationMessage } from "@/lib/types";

interface TrainingProps {
  user: User;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: User) => void;
  scenarioId?: number;
}

export default function Training({ user, onLogout, onUserUpdate, scenarioId }: TrainingProps) {
  const handleRoleChange = (newRole: string) => {
    if (onUserUpdate) {
      onUserUpdate({ ...user, role: newRole });
    }
  };
  const [location, navigate] = useLocation();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isRandomScenario, setIsRandomScenario] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionResults, setSessionResults] = useState<{
    score: number;
    feedback: string;
    conversation: ConversationMessage[];
  } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: scenarios = [] } = useQuery<Scenario[]>({
    queryKey: ['/api/scenarios', { role: user.role, industry: user.industry }],
    queryFn: async () => {
      const response = await fetch(`/api/scenarios?role=${user.role}&industry=${user.industry}`);
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      return response.json();
    },
  });

  const { data: specificScenario } = useQuery<Scenario>({
    queryKey: ['/api/scenarios', scenarioId],
    queryFn: async () => {
      const response = await fetch(`/api/scenarios/${scenarioId}`);
      if (!response.ok) throw new Error('Failed to fetch scenario');
      return response.json();
    },
    enabled: !!scenarioId,
  });

  const generateRandomScenarioMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scenarios/random', {
        role: user.role,
        industry: user.industry,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const randomScenario: Scenario = {
        id: 0, // Random scenarios don't have IDs
        title: data.title,
        description: data.description,
        role: user.role,
        industry: user.industry,
        difficulty: 'intermediate',
        estimatedDuration: 15,
        scenario: {
          context: data.context,
          initialMessage: data.initialMessage,
          objectives: data.objectives,
        },
      };
      setSelectedScenario(randomScenario);
      setIsRandomScenario(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate random scenario. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveSessionMutation = useMutation({
    mutationFn: async (sessionData: {
      userId: number;
      scenarioType: string;
      scenarioTitle: string;
      score: number;
      feedback: string;
      conversation: ConversationMessage[];
      duration: number;
    }) => {
      const response = await apiRequest('POST', '/api/training/sessions', sessionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions/user', user.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', user.id] });
      toast({
        title: "Session Saved",
        description: "Your training session has been saved successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeConversationMutation = useMutation({
    mutationFn: async ({ scenario, conversation }: { scenario: Scenario; conversation: ConversationMessage[] }) => {
      const response = await apiRequest('POST', '/api/training/analyze', {
        scenario: scenario.scenario,
        conversation,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSessionResults({
        score: data.overallScore,
        feedback: data.feedback,
        conversation: sessionResults?.conversation || [],
      });
    },
  });

  // Set selected scenario from URL param
  useState(() => {
    if (specificScenario && !selectedScenario) {
      setSelectedScenario(specificScenario);
    }
  });

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsRandomScenario(false);
    setShowResults(false);
  };

  const handleStartRandomScenario = () => {
    generateRandomScenarioMutation.mutate();
  };

  const handleSessionEnd = async (conversation: ConversationMessage[], finalScore: number) => {
    if (!selectedScenario) return;

    setSessionResults({
      score: finalScore,
      feedback: "",
      conversation,
    });

    // Analyze conversation for detailed feedback
    analyzeConversationMutation.mutate({
      scenario: selectedScenario,
      conversation,
    });

    // Save session to database
    const duration = conversation.length * 30; // Rough estimate
    saveSessionMutation.mutate({
      userId: user.id,
      scenarioType: selectedScenario.role,
      scenarioTitle: selectedScenario.title,
      score: finalScore,
      feedback: "Session completed successfully",
      conversation,
      duration,
    });

    setShowResults(true);
  };

  const handleBackToScenarios = () => {
    setSelectedScenario(null);
    setShowResults(false);
    setSessionResults(null);
    navigate('/training');
  };

  const handleStartNewSession = () => {
    setShowResults(false);
    setSessionResults(null);
  };

  if (showResults && sessionResults) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar user={user} onLogout={onLogout} onRoleChange={handleRoleChange} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Session Complete!</CardTitle>
                <div className="flex items-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <span className="text-2xl font-bold text-primary">{sessionResults.score}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="mb-4">
                  {sessionResults.score >= 80 ? (
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  ) : sessionResults.score >= 60 ? (
                    <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
                  ) : (
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {sessionResults.score >= 80 ? "Excellent Work!" : 
                   sessionResults.score >= 60 ? "Good Job!" : "Keep Practicing!"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  You completed the "{selectedScenario?.title}" scenario
                </p>
              </div>

              <Separator />

              {sessionResults.feedback && (
                <div>
                  <h4 className="font-semibold mb-2">Detailed Feedback</h4>
                  <p className="text-slate-700 dark:text-slate-300">{sessionResults.feedback}</p>
                </div>
              )}

              <div className="flex space-x-4">
                <Button onClick={handleStartNewSession} className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Start New Session
                </Button>
                <Button variant="outline" onClick={handleBackToScenarios} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Scenarios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedScenario) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar user={user} onLogout={onLogout} onRoleChange={handleRoleChange} />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBackToScenarios}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scenarios
            </Button>
          </div>

          <ConversationInterface
            scenario={selectedScenario}
            onSessionEnd={handleSessionEnd}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Training Scenarios</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Select a scenario to practice your {user.role} skills in the {user.industry} industry.
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Button 
                onClick={handleStartRandomScenario}
                disabled={generateRandomScenarioMutation.isPending}
              >
                <Shuffle className="mr-2 h-4 w-4" />
                {generateRandomScenarioMutation.isPending ? "Generating..." : "Random Scenario"}
              </Button>
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onClick={() => handleSelectScenario(scenario)}
            />
          ))}
        </div>

        {scenarios.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No scenarios available
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                There are no training scenarios available for your role and industry combination.
              </p>
              <Button onClick={handleStartRandomScenario}>
                <Shuffle className="mr-2 h-4 w-4" />
                Generate Random Scenario
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-2">
        <div className="flex justify-around">
          <button 
            className="flex flex-col items-center py-2 text-slate-400"
            onClick={() => navigate('/')}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center py-2 text-primary">
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
