
import React, { useState, useEffect } from 'react';
import { Artifact, AgentOutput } from '../types';
import { getArtifacts } from '../services/db';

interface ArtifactDeckProps {
  artifact: Artifact | null;
  isProcessing: boolean;
  partialOutputs?: AgentOutput[];
}

const IconHistory = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconExternalLink = () => <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;

export const ArtifactDeck: React.FC<ArtifactDeckProps> = ({ artifact: currentArtifact, isProcessing, partialOutputs = [] }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Artifact[]>([]);

  useEffect(() => {
    if (showHistory) getArtifacts().then(setHistory);
  }, [showHistory]);

  if (isProcessing) {
    return (
      <div className="flex flex-col h-full bg-steel-950 scanline relative overflow-hidden">
        <div className="p-10 border-b border-steel-900 bg-steel-950 shrink-0">
          <div className="flex flex-col space-y-2">
            <h3 className="text-neon text-[10px] tracking-[0.5em] uppercase animate-pulse">Cognitive Synthesis Active</h3>
            <p className="text-steel-600 text-[8px] uppercase tracking-widest font-mono">Stream: Monitoring Agent Uplink Channels</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
            {partialOutputs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                     <div className="w-8 h-8 border border-steel-800 border-t-neon rounded-full animate-spin"></div>
                     <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Negotiating Handshakes...</span>
                </div>
            )}
            {partialOutputs.map((agent, i) => (
                <div key={i} className="animate-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center space-x-3 mb-2">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                            agent.role === 'Architect' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' :
                            agent.role === 'Engineer' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' :
                            agent.role === 'Critic' ? 'border-rose-500/30 text-rose-500 bg-rose-500/5' : 
                            'border-amber-500/30 text-amber-500 bg-amber-500/5'
                        }`}>{agent.role}</span>
                        <div className="h-px flex-1 bg-steel-900"></div>
                        <span className="text-[7px] font-mono text-neon/40 uppercase">Channel_Established</span>
                    </div>
                    <div className="font-mono text-[11px] text-steel-400 p-4 border-l border-steel-800 bg-steel-900/10 whitespace-pre-wrap leading-relaxed italic">
                        {agent.content}
                    </div>
                </div>
            ))}
        </div>

        <div className="p-6 border-t border-steel-900 flex justify-between items-center bg-steel-950 shrink-0">
            <div className="flex space-x-3">
                {['ARCH', 'ENGR', 'CRTC', 'RSRCH'].map((tag, i) => (
                    <div key={i} className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm border ${
                        partialOutputs.some(o => o.role.startsWith(tag.substring(0, 3))) 
                        ? 'border-neon/40 text-neon bg-neon/5 animate-pulse' 
                        : 'border-steel-900 text-steel-800'
                    }`}>[{tag}]</div>
                ))}
            </div>
            <div className="text-[8px] font-mono text-steel-700 animate-pulse">VAULTING_IN_PROGRESS...</div>
        </div>
      </div>
    );
  }

  if (!currentArtifact) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-steel-950 text-steel-800/40 select-none">
        <div className="relative mb-6">
            <div className="w-16 h-16 border border-steel-900 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 border border-steel-900 rounded-full flex items-center justify-center opacity-50">
                    <div className="w-4 h-4 border border-steel-900 rounded-full"></div>
                </div>
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-steel-900 rounded-full"></div>
        </div>
        <h3 className="text-xl font-bold tracking-[0.5em] uppercase">Artifact Deck</h3>
        <p className="text-[9px] font-mono mt-3 uppercase tracking-widest opacity-60">Awaiting system synthesis</p>
        <button onClick={() => setShowHistory(true)} className="mt-12 px-6 py-2 border border-steel-900 hover:border-steel-700 hover:text-white transition-all text-[9px] uppercase tracking-widest font-bold flex items-center space-x-2">
            <IconHistory />
            <span>Open Vault</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-steel-950 animate-in fade-in duration-500 overflow-hidden">
      <div className="p-10 border-b border-steel-900 bg-steel-950 shrink-0">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center space-x-2 mb-2">
                    <span className="text-[9px] font-mono text-neon font-bold tracking-[0.4em] uppercase block">Artifact Vaulted</span>
                    {currentArtifact.priority && (
                        <span className={`px-2 py-0.5 rounded-sm text-[7px] font-mono font-bold border ${
                            currentArtifact.priority === 'CRITICAL' ? 'border-red-500/40 text-red-500 bg-red-500/5' :
                            currentArtifact.priority === 'HIGH' ? 'border-amber-500/40 text-amber-500 bg-amber-500/5' :
                            currentArtifact.priority === 'LOW' ? 'border-blue-500/40 text-blue-500 bg-blue-500/5' : 'border-steel-800 text-steel-500'
                        }`}>{currentArtifact.priority} PRIORITY</span>
                    )}
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">{currentArtifact.title}</h2>
            </div>
            <div className="text-[8px] font-mono text-steel-700 uppercase text-right leading-relaxed">
                Vault_ID: {currentArtifact.id.substring(0, 8)}<br/>
                Sync: {new Date(currentArtifact.timestamp).toLocaleTimeString()}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px bg-steel-900 shrink-0 border-b border-steel-900">
        {currentArtifact.agentOutputs.map((agent, i) => (
            <div key={i} className="p-3 bg-steel-950/50 group hover:bg-steel-900/40 transition-all cursor-default relative overflow-hidden">
                <div className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${
                    agent.role === 'Architect' ? 'text-blue-500' :
                    agent.role === 'Engineer' ? 'text-emerald-500' :
                    agent.role === 'Critic' ? 'text-rose-500' : 'text-amber-500'
                }`}>{agent.role}</div>
                <div className="w-full h-0.5 bg-steel-900 mt-2">
                    <div className={`h-full animate-pulse ${
                        agent.status === 'complete' ? 'bg-neon opacity-40' : 'bg-red-500'
                    }`} style={{width: '100%'}}></div>
                </div>
            </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-xl mx-auto space-y-8">
            <div className="font-mono text-xs text-steel-300 whitespace-pre-wrap leading-relaxed bg-steel-900/20 p-6 border-l-2 border-steel-800">
                {currentArtifact.content}
            </div>

            {currentArtifact.groundingSources && currentArtifact.groundingSources.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-steel-900">
                    <h4 className="text-[9px] font-mono font-bold uppercase tracking-widest text-steel-500">Validation Sources (Grounding)</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {currentArtifact.groundingSources.map((source, idx) => (
                            <a 
                                key={idx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-steel-900/30 border border-steel-800 hover:border-neon/30 transition-all group"
                            >
                                <span className="text-[10px] text-steel-400 group-hover:text-steel-200 truncate pr-4">{source.title}</span>
                                <span className="text-steel-700 group-hover:text-neon transition-colors"><IconExternalLink /></span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="p-6 bg-steel-950 border-t border-steel-900 flex justify-between items-center shrink-0">
        <span className="text-[8px] text-steel-700 font-mono uppercase tracking-[0.5em]">Identity Continuity: Verified</span>
        <button 
            onClick={() => setShowHistory(true)}
            className="text-[8px] text-steel-600 hover:text-neon uppercase tracking-widest font-mono transition-colors"
        >
            [Access Vault Archive]
        </button>
      </div>

      {showHistory && (
          <div className="absolute inset-0 z-50 bg-steel-950/95 backdrop-blur-sm p-10 animate-in fade-in slide-in-from-right-10 duration-300">
              <div className="flex justify-between items-center mb-10 border-b border-steel-800 pb-4">
                  <h3 className="text-xl font-bold uppercase tracking-widest text-white">Artifact Archive</h3>
                  <button onClick={() => setShowHistory(false)} className="text-steel-500 hover:text-white uppercase text-[10px]">[Close]</button>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[80%] custom-scrollbar pr-4">
                  {history.length === 0 ? (
                      <div className="text-steel-800 text-xs font-mono uppercase">Archive empty.</div>
                  ) : history.map(h => (
                      <div key={h.id} className="p-4 border border-steel-900 hover:border-steel-700 bg-steel-900/20 cursor-default">
                          <div className="flex justify-between text-[10px] mb-2 font-mono">
                              <span className="text-neon">{h.title}</span>
                              <span className="text-steel-600">{new Date(h.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] mt-1">
                              <div className="text-steel-500 truncate w-2/3">{h.content.substring(0, 100)}...</div>
                              {h.priority && <span className="text-[7px] text-steel-700 border border-steel-800 px-1 rounded-sm">{h.priority}</span>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
