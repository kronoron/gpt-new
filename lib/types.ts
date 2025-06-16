export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  industry: string;
  overallScore: number;
  sessionsCompleted: number;
  trainingHours: number;
  createdAt: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ScenarioResponse {
  response: string;
  score: number;
  feedback: string;
  isComplete: boolean;
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  role: string;
  industry: string;
  difficulty: string;
  estimatedDuration: number;
  scenario: {
    context: string;
    initialMessage: string;
    objectives: string[];
  };
}

export interface TrainingSession {
  id: number;
  userId: number;
  scenarioType: string;
  scenarioTitle: string;
  score: number;
  feedback: string;
  conversation: ConversationMessage[];
  duration: number;
  completedAt: string;
}

export const ROLES = [
  { value: 'AE', label: 'Account Executive', color: 'role-ae' },
  { value: 'SDR', label: 'Sales Development Rep', color: 'role-sdr' },
  { value: 'CSM', label: 'Customer Success Manager', color: 'role-csm' },
  { value: 'AM', label: 'Account Manager', color: 'role-am' },
] as const;

export const INDUSTRIES = [
  { value: 'SaaS', label: 'SaaS Technology' },
  { value: 'fintech', label: 'Financial Technology' },
  { value: 'medical', label: 'Healthcare & Medical' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail & E-commerce' },
] as const;
