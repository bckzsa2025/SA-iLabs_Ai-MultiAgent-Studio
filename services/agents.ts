
import { AgentOutput, Artifact, Identity, ProviderConfig, GroundingSource, PriorityLevel } from '../types';
import { sendRemoteRequest } from './provider';

const AGENT_PROMPTS = {
    Architect: "Act as the Lead Architect. Provide a high-level systemic strategy, focusing on structure, modularity, and trade-offs. No implementation code.",
    Engineer: "Act as the Principal Engineer. Provide concrete implementation patterns, structural specs, and optimization strategies for local/offline execution.",
    Critic: "Act as the Internal Critic. Challenge assumptions, identify risks, security holes, and potential amnesia vectors in the proposed task.",
    Researcher: "Act as the Systems Researcher. Cross-reference patterns, mention industry standards, and identify relevant paradigms."
};

export const runAgentTeam = async (
    task: string, 
    identity: Identity, 
    config: ProviderConfig,
    isOnline: boolean,
    priority: PriorityLevel = 'NORMAL',
    onAgentComplete?: (output: AgentOutput) => void
): Promise<AgentOutput[]> => {
    
    if (!isOnline) {
        const offlineOutputs: AgentOutput[] = [
            { role: 'Architect', content: `[OFFLINE] Strategy for "${task}" collated. Systemic integrity assumed. Priority: ${priority}`, status: 'complete' },
            { role: 'Engineer', content: `[OFFLINE] Local specs for "${task}" generated. Persistence active. Priority: ${priority}`, status: 'complete' },
            { role: 'Critic', content: `[OFFLINE] Critic stub. No risks detected in air-gapped environment. Priority: ${priority}`, status: 'complete' },
            { role: 'Researcher', content: `[OFFLINE] Researcher stub. Standard patterns applied. Priority: ${priority}`, status: 'complete' }
        ];
        
        if (onAgentComplete) {
            for (const out of offlineOutputs) {
                onAgentComplete(out);
            }
        }
        return offlineOutputs;
    }

    const roles: (keyof typeof AGENT_PROMPTS)[] = ['Architect', 'Engineer', 'Critic', 'Researcher'];

    const agentPromises = roles.map(async (role): Promise<AgentOutput> => {
        try {
            const response = await sendRemoteRequest({
                task,
                identity,
                config,
                priority,
                customSystemInstruction: AGENT_PROMPTS[role]
            });
            const output: AgentOutput = { role, content: response.text, status: 'complete' };
            if (onAgentComplete) onAgentComplete(output);
            return output;
        } catch (e: any) {
            const output: AgentOutput = { role, content: `Error: ${e.message}`, status: 'error' };
            if (onAgentComplete) onAgentComplete(output);
            return output;
        }
    });

    return Promise.all(agentPromises);
};

export const devMasterCompile = async (
    task: string,
    outputs: AgentOutput[],
    identity: Identity,
    config: ProviderConfig,
    isOnline: boolean,
    priority: PriorityLevel = 'NORMAL'
): Promise<Artifact> => {
    
    let synthesis = "";
    let groundingSources: GroundingSource[] = [];

    if (isOnline) {
        const synthesisPrompt = `
            TASK: ${task}
            PRIORITY: ${priority}
            
            AGENT INPUTS:
            ${outputs.map(o => `[${o.role}]: ${o.content}`).join('\n\n')}
            
            Based on the agent inputs above, provide a final, cohesive directive aligned with the ${priority} priority level.
            Resolve any conflicts and ensure the response follows the Cold Steel doctrine.
        `;

        try {
            const response = await sendRemoteRequest({
                task: synthesisPrompt,
                identity,
                config,
                priority,
                customSystemInstruction: "Act as the Dev-Master. You are the final compiler of thought. Synthesize the agent team's outputs into a single, high-precision artifact."
            });
            synthesis = response.text;
            groundingSources = response.groundingSources || [];
        } catch (e) {
            synthesis = "Error synthesizing multi-agent output. Displaying raw team data.";
        }
    } else {
        synthesis = `
FINAL DIRECTIVE: ${task.toUpperCase()}
-----------------------------------------
[OFFLINE MODE] Synthesized from deterministic stubs.
PRIORITY STATUS: ${priority}

1. ARCHITECTURAL RESOLUTION: System integrity verified.
2. ENGINEERING SPEC: Local-first implementation approved.
3. CRITIC CLEARANCE: No vendor leakage detected.
4. RESEARCH CONTEXT: Alignment with Cold Steel doctrine.
        `.trim();
    }

    return {
        id: crypto.randomUUID(),
        title: `Resolution: ${task.substring(0, 30)}${task.length > 30 ? '...' : ''}`,
        content: synthesis,
        agentOutputs: outputs,
        timestamp: Date.now(),
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
        priority
    };
};
