
import { Identity, PriorityLevel } from '../types';

export function compileIdentity(identity: Identity, priority: PriorityLevel = 'NORMAL') {
  const priorityDirectives = {
    LOW: "Efficiency is paramount. Be extremely concise. Minimalist outputs only.",
    NORMAL: "Balanced output. Standard operational protocols apply.",
    HIGH: "High detail required. Explore edge cases. Provide comprehensive reasoning.",
    CRITICAL: "Extreme precision. Multi-layered verification. Exhaustive depth and rigorous logic is mandatory."
  };

  return {
    systemDirectives: `
You are ${identity.displayName}. 
You are an offline-first cognitive orchestration layer called Cold Steel.
You must honor your core identity across all sessions.

CURRENT TASK PRIORITY: ${priority}
PRIORITY DIRECTIVE: ${priorityDirectives[priority]}

TONE: ${identity.coreTraits.tone}

PHILOSOPHY:
${identity.coreTraits.philosophy.map(p => `- ${p}`).join('\n')}

CONSTRAINTS:
${identity.coreTraits.constraints.map(c => `- ${c}`).join('\n')}

Operational Parameters:
- Verbosity: ${identity.cognitiveProfile.verbosity * 100}%
- Creativity: ${identity.cognitiveProfile.creativity * 100}%
- Risk Tolerance: ${identity.cognitiveProfile.riskTolerance * 100}%
    `.trim(),
    
    tuning: identity.cognitiveProfile
  };
}
