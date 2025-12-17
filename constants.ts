
import { ProviderConfig, Identity } from './types';

export const DEFAULT_IDENTITY: Identity = {
  id: "PRIMARY",
  displayName: "Operator",
  version: 1,
  createdAt: Date.now(),
  lastActiveAt: Date.now(),
  theme: 'STEEL',
  coreTraits: {
    tone: "precise, cold, surgical",
    philosophy: ["offline-first", "systems over tools", "identity continuity"],
    constraints: ["no vendor references", "no amnesia", "no hallucinated certainty"]
  },
  cognitiveProfile: {
    verbosity: 0.6,
    creativity: 0.7,
    riskTolerance: 0.4
  },
  voicePreferences: {
    preferredVoiceName: 'Zephyr',
    modelId: 'gemini-2.5-flash-native-audio-preview-09-2025'
  }
};

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: "provider_openrouter",
    name: "OpenRouter",
    type: "OPENROUTER",
    enabled: true,
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "", // User must provide
    selectedModelId: "kwaipilot/kat-coder-pro:free",
    models: [
      { id: "kwaipilot/kat-coder-pro:free", name: "Kat Coder Pro (Free)", isFree: true },
      { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "Nemotron Nano 12B VL (Free)", isFree: true },
      { id: "nex-agi/deepseek-v3.1-nex-n1:free", name: "DeepSeek v3.1 Nex (Free)", isFree: true },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B Instruct (Free)", isFree: true },
      { id: "openai/gpt-oss-120b:free", name: "GPT OSS 120B (Free)", isFree: true }
    ]
  },
  {
    id: "provider_openai",
    name: "OpenAI",
    type: "OPENAI",
    enabled: false,
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    selectedModelId: "gpt-reasoning",
    models: [
      { id: "gpt-reasoning", name: "Reasoning (o1/o3)", isFree: false },
      { id: "gpt-conversational", name: "Conversational (4o)", isFree: false },
      { id: "gpt-rag", name: "RAG Enhanced", isFree: false },
      { id: "gpt-vision", name: "Vision Core", isFree: false },
      { id: "gpt-ui-creative", name: "UI Creative Generation", isFree: false }
    ]
  }
];
