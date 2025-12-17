
import { GoogleGenAI } from "@google/genai";
import { ProviderConfig, Identity, GroundingSource, PriorityLevel } from "../types";
import { compileIdentity } from "./compiler";

export interface ProviderRequest {
    task: string;
    identity: Identity;
    config: ProviderConfig;
    priority?: PriorityLevel;
    customSystemInstruction?: string;
}

export interface EnhancedResponse {
    text: string;
    groundingSources?: GroundingSource[];
}

export const sendRemoteRequest = async (req: ProviderRequest): Promise<EnhancedResponse> => {
    const { task, identity, config, customSystemInstruction, priority = 'NORMAL' } = req;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const compiled = compileIdentity(identity, priority);
    
    let modelName = 'gemini-3-flash-preview';
    if (config.selectedModelId === 'gpt-reasoning' || priority === 'CRITICAL' || priority === 'HIGH') {
        modelName = 'gemini-3-pro-preview';
    } else if (config.selectedModelId.includes('gemini')) {
        modelName = config.selectedModelId.split(':')[0];
    } else {
        modelName = customSystemInstruction ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    }

    const systemInstruction = customSystemInstruction 
        ? `${compiled.systemDirectives}\n\nSPECIAL AGENT DIRECTIVE:\n${customSystemInstruction}`
        : compiled.systemDirectives;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: task,
            config: {
                systemInstruction,
                temperature: identity.cognitiveProfile.creativity,
                topP: 0.95,
                // Enable search grounding for high priority or complex tasks
                tools: (modelName.includes('pro') || priority === 'CRITICAL') ? [{ googleSearch: {} }] : undefined
            },
        });

        const text = response.text || "No response content generated.";
        
        // Extract Grounding Chunks if available
        const sources: GroundingSource[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({ title: chunk.web.title, uri: chunk.web.uri });
                }
            });
        }

        return { text, groundingSources: sources.length > 0 ? sources : undefined };
    } catch (error: any) {
        console.error("Provider Uplink Failure:", error);
        throw new Error(`[UPLINK ERROR] ${error.message || 'Unknown provider error'}`);
    }
};
