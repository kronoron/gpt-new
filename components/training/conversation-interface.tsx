import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, StopCircle, User, Minimize2, Mic, MicOff, Volume2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ConversationMessage, Scenario, ScenarioResponse } from "@/lib/types";

interface ConversationInterfaceProps {
  scenario: Scenario;
  onSessionEnd: (conversation: ConversationMessage[], finalScore: number) => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export default function ConversationInterface({ 
  scenario, 
  onSessionEnd, 
  onMinimize,
  isMinimized = false 
}: ConversationInterfaceProps) {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>();
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setUserInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Voice Recognition Error",
            description: "There was an issue with voice recognition. Please try again.",
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Initialize speech synthesis
      if ('speechSynthesis' in window) {
        speechSynthesisRef.current = window.speechSynthesis;
      }
    }
  }, [toast]);

  useEffect(() => {
    if (isSessionActive) {
      startTimeRef.current = Date.now();
      const timer = setInterval(() => {
        if (startTimeRef.current) {
          setSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      // Start with empty conversation - user makes the first move
      setConversation([]);

      return () => clearInterval(timer);
    }
  }, [isSessionActive, scenario]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await apiRequest('POST', '/api/training/message', {
        scenarioId: scenario.id,
        conversation,
        userMessage: message
      });
      return response.json() as Promise<ScenarioResponse>;
    },
    onSuccess: (data) => {
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, aiMessage]);
      setCurrentScore(data.score);

      if (data.isComplete) {
        handleEndSession();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const sendRandomMessageMutation = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await apiRequest('POST', '/api/training/random-message', {
        scenario: scenario.scenario,
        conversation,
        userMessage: message
      });
      return response.json() as Promise<ScenarioResponse>;
    },
    onSuccess: (data) => {
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, aiMessage]);
      setCurrentScore(data.score);

      if (data.isComplete) {
        handleEndSession();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Voice functionality methods
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      speechSynthesisRef.current.speak(utterance);
    }
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      toast({
        title: "Voice Mode Enabled",
        description: "Click the microphone to speak your responses. AI replies will be spoken aloud.",
      });
    } else {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      if (isListening) {
        stopListening();
      }
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim() || sendMessageMutation.isPending || sendRandomMessageMutation.isPending) return;

    const userMessage: ConversationMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    
    if (scenario.id) {
      sendMessageMutation.mutate({ message: userInput });
    } else {
      sendRandomMessageMutation.mutate({ message: userInput });
    }
    
    setUserInput("");
  };

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    const finalScore = currentScore || 50;
    onSessionEnd(conversation, finalScore);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 z-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Training Session</CardTitle>
            <Button variant="ghost" size="icon" onClick={onMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {scenario.title} • {formatTime(sessionDuration)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live AI Training Session</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-success bg-opacity-10 text-success">
              {isSessionActive ? 'Active' : 'Ready'}
            </Badge>
            {onMinimize && (
              <Button variant="ghost" size="icon" onClick={onMinimize}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!isSessionActive ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">{scenario.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{scenario.description}</p>
            <div className="mb-6">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                <strong>Context:</strong> {scenario.scenario.context}
              </p>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Objectives:</strong>
                <ul className="list-disc list-inside mt-1">
                  {scenario.scenario.objectives.map((obj, index) => (
                    <li key={index}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Button onClick={handleStartSession} className="bg-primary hover:bg-blue-700">
              Start Training Session
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 h-80 overflow-y-auto mb-4">
              <div className="space-y-4">
                {conversation.map((message, index) => (
                  <div key={index} className={`flex items-start ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`flex-1 max-w-xs ${message.role === 'user' ? 'order-1' : ''}`}>
                      <div className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-primary text-white ml-auto' 
                          : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 ${
                        message.role === 'user' ? 'text-right' : ''
                      }`}>
                        {message.role === 'user' ? 'You' : 'AI Prospect'} • Just now
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center ml-3 order-2">
                        <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="flex items-center space-x-3 mb-4">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your response..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={sendMessageMutation.isPending || sendRandomMessageMutation.isPending}
              />
              {/* Voice Mode Toggle */}
              {speechSupported && (
                <Button
                  variant={isVoiceMode ? "default" : "outline"}
                  size="icon"
                  onClick={toggleVoiceMode}
                  title={isVoiceMode ? "Disable voice mode" : "Enable voice mode"}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
              
              {/* Microphone Button */}
              {speechSupported && isVoiceMode && (
                <Button
                  variant={isListening ? "destructive" : "secondary"}
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  disabled={sendMessageMutation.isPending || sendRandomMessageMutation.isPending}
                  title={isListening ? "Stop listening" : "Start speaking"}
                  className={isListening ? "animate-pulse" : ""}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}

              <Button 
                onClick={handleSendMessage} 
                disabled={!userInput.trim() || sendMessageMutation.isPending || sendRandomMessageMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleEndSession}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-4">
                <span>Scenario: <strong>{scenario.title}</strong></span>
                <span>Duration: <strong>{formatTime(sessionDuration)}</strong></span>
              </div>
              <div className="flex items-center">
                <span>Real-time Score: </span>
                <span className="ml-2 font-semibold text-success">{currentScore}%</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
