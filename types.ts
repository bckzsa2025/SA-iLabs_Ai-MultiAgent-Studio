
export type PriorityLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Identity {
  id: string;
  displayName: string;
  version: number;
  createdAt: number;
  lastActiveAt: number;
  theme: Theme;
  coreTraits: {
    tone: string;
    philosophy: string[];
    constraints: string[];
  };
  cognitiveProfile: {
    verbosity: number;
    creativity: number;
    riskTolerance: number;
  };
  voicePreferences: {
    preferredVoiceName: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
    modelId: string;
  };
}

export interface Model {
  id: string;
  name: string;
  isFree: boolean;
}

export type ProviderType = 'OPENROUTER' | 'OPENAI' | 'LOCAL' | 'STANDARD_REMOTE';
export type Theme = 'STEEL' | 'TITANIUM' | 'BRUTALIST' | 'LIGHT';

export interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  models: Model[];
  selectedModelId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isTranscription?: boolean;
  priority?: PriorityLevel;
}

export interface AgentOutput {
  role: 'Architect' | 'Engineer' | 'Critic' | 'Researcher';
  content: string;
  status: 'pending' | 'complete' | 'error';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Artifact {
  id: string;
  title: string;
  content: string;
  agentOutputs: AgentOutput[];
  timestamp: number;
  groundingSources?: GroundingSource[];
  priority?: PriorityLevel;
}

export interface AppState {
  isOnline: boolean;
  activeProviderId: string;
  showSettings: boolean;
  theme: Theme;
  isLiveActive: boolean;
  isRecording?: boolean;
  isDictating: boolean;
  currentPriority: PriorityLevel;
}
