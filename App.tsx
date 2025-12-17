
// @google/genai guidelines: Use process.env.API_KEY
// Master Consultant "Jeomangi": Jeomanji here Sir, Reporting Systems and Modular Identity Continuity at 100%.

import React, { useState, useEffect, useRef } from 'react';
import { Identity, ProviderConfig, Message, AppState, Artifact, Theme, PriorityLevel, AgentOutput } from './types';
import { bootstrapCortex, saveProviderConfig, deleteProviderConfig, getLogs, saveMessage, saveArtifact, searchSemanticMemory, saveIdentity } from './services/db';
import { SettingsModal } from './components/SettingsModal';
import { ArtifactDeck } from './components/ArtifactDeck';
import { runAgentTeam, devMasterCompile } from './services/agents';
import { startLiveBridge, stopLiveBridge } from './services/live';
import { compileIdentity } from './services/compiler';

const IconCpu = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const IconMic = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>;
const IconWifi = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
);
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

export default function App() {
  const [booting, setBooting] = useState(true);
  const [appState, setAppState] = useState<AppState>({ 
    isOnline: true, 
    activeProviderId: 'provider_openrouter', 
    showSettings: false, 
    theme: 'STEEL', 
    isLiveActive: false,
    isDictating: false,
    currentPriority: 'NORMAL'
  });
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [partialAgentOutputs, setPartialAgentOutputs] = useState<AgentOutput[]>([]);
  
  const [agentPulse, setAgentPulse] = useState({
    Architect: 'IDLE',
    Engineer: 'IDLE',
    Critic: 'IDLE',
    Researcher: 'IDLE'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isDictatingRef = useRef(false);
  const activeProvider = providers.find(p => p.id === appState.activeProviderId);

  useEffect(() => { document.body.setAttribute('data-theme', appState.theme); }, [appState.theme]);

  useEffect(() => {
    const bootSequence = async () => {
      try {
        const { identity: loadedIdentity, providers: loadedProviders } = await bootstrapCortex();
        setIdentity(loadedIdentity);
        setProviders(loadedProviders);
        setAppState(prev => ({ ...prev, theme: loadedIdentity.theme || 'STEEL' }));
        const history = await getLogs();
        setMessages(history);
        // Intentional delay for industrial boot aesthetics
        setTimeout(() => setBooting(false), 1200);
      } catch (e) {
        console.error("CRITICAL BOOT FAILURE", e);
        setBooting(false);
      }
    };
    bootSequence();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    isDictatingRef.current = appState.isDictating;
  }, [appState.isDictating]);

  const toggleLiveBridge = async (dictationOnly = false) => {
    if (!appState.isLiveActive) {
      if (!activeProvider?.apiKey && appState.isOnline) {
        alert("CRITICAL: Provider API Key missing for Live Bridge.");
        return;
      }
      
      const compiled = compileIdentity(identity!, appState.currentPriority);
      setAppState(prev => ({ 
        ...prev, 
        isLiveActive: true, 
        isDictating: dictationOnly 
      }));
      
      try {
        await startLiveBridge(
          process.env.API_KEY || activeProvider?.apiKey || '',
          compiled.systemDirectives,
          identity?.voicePreferences.preferredVoiceName || 'Zephyr',
          identity?.voicePreferences.modelId || 'gemini-2.5-flash-native-audio-preview-09-2025',
          (text, role) => {
            if (role === 'user' && isDictatingRef.current) {
                setInputValue(prev => prev + (prev ? " " : "") + text);
            } else {
                const msg: Message = { 
                    id: crypto.randomUUID(), 
                    role: role === 'model' ? 'assistant' : 'user', 
                    content: text, 
                    timestamp: Date.now(), 
                    isTranscription: true, 
                    priority: appState.currentPriority 
                };
                setMessages(prev => [...prev, msg]);
                saveMessage(msg);
            }
          }
        );
      } catch (e) {
        console.error("Live Bridge Failure", e);
        setAppState(prev => ({ ...prev, isLiveActive: false, isDictating: false }));
      }
    } else {
      if (dictationOnly && appState.isDictating) {
          setAppState(prev => ({ ...prev, isDictating: false }));
          stopLiveBridge();
          setAppState(prev => ({ ...prev, isLiveActive: false }));
      } else if (dictationOnly && !appState.isDictating) {
          setAppState(prev => ({ ...prev, isDictating: true }));
      } else {
          stopLiveBridge();
          setAppState(prev => ({ ...prev, isLiveActive: false, isDictating: false }));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing || !identity || !activeProvider) return;

    const task = inputValue;
    const priority = appState.currentPriority;
    const newUserMsg: Message = { id: crypto.randomUUID(), role: 'user', content: task, timestamp: Date.now(), priority };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");
    setIsProcessing(true);
    setPartialAgentOutputs([]);
    await saveMessage(newUserMsg);

    const updatedIdentity = { ...identity, lastActiveAt: Date.now() };
    setIdentity(updatedIdentity);
    await saveIdentity(updatedIdentity);

    setAgentPulse({ Architect: 'ACTIVE', Engineer: 'ACTIVE', Critic: 'ACTIVE', Researcher: 'ACTIVE' });

    try {
      const memoryContext = await searchSemanticMemory(task);
      const augmentedTask = `${task}\n\n[SEMANTIC CONTEXT]\n${memoryContext}`;
      
      const outputs = await runAgentTeam(
        augmentedTask, 
        updatedIdentity, 
        activeProvider, 
        appState.isOnline, 
        priority,
        (partial) => {
          setPartialAgentOutputs(prev => [...prev, partial]);
          setAgentPulse(pulse => ({ ...pulse, [partial.role]: 'COMPLETE' }));
        }
      );

      const artifact = await devMasterCompile(task, outputs, updatedIdentity, activeProvider, appState.isOnline, priority);
      
      await saveArtifact(artifact);
      setCurrentArtifact(artifact);

      const sysMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: `Synthesis Vaulted: ${artifact.title} (Priority: ${priority})`, timestamp: Date.now() };
      setMessages(prev => [...prev, sysMsg]);
      await saveMessage(sysMsg);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `UPLINK FAILURE: ${e.message}`, timestamp: Date.now() }]);
    } finally {
      setIsProcessing(false);
      setAgentPulse({ Architect: 'IDLE', Engineer: 'IDLE', Critic: 'IDLE', Researcher: 'IDLE' });
    }
  };

  const handleThemeSwitch = async (t: Theme) => {
    setAppState(prev => ({ ...prev, theme: t }));
    if (identity) {
      const updated = { ...identity, theme: t, lastActiveAt: Date.now() };
      setIdentity(updated);
      await saveIdentity(updated);
    }
  };

  const handleUpdateIdentity = async (updated: Identity) => {
    setIdentity(updated);
    if (updated.theme !== appState.theme) {
        setAppState(prev => ({ ...prev, theme: updated.theme }));
    }
  };

  if (booting) {
      return (
          <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center font-mono animate-in fade-in duration-700">
              <div className="w-48 h-1 bg-steel-900 overflow-hidden relative mb-4">
                  <div className="absolute inset-0 bg-neon/40 animate-[shimmer_2s_infinite]"></div>
              </div>
              <div className="text-[10px] text-neon tracking-[1em] uppercase animate-pulse">Cold Steel™© OS</div>
              <div className="text-[8px] text-steel-700 mt-4 uppercase tracking-widest">PHASE_1_BOOT: [CONTINUITY_ANCHORED]</div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-steel-950 theme-transition overflow-hidden selection:bg-neon/30">
      {/* HEADER PROTOCOL */}
      <header className="h-14 border-b border-steel-800 bg-steel-950 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-3 text-steel-300">
                <IconCpu />
                <span className="font-mono text-[11px] font-bold tracking-[0.4em] uppercase">Cold Steel <span className="text-neon/50 text-[8px] ml-1">v1.0</span></span>
            </div>
            
            <div className="flex items-center bg-steel-900/30 border border-steel-800 p-0.5 rounded-sm">
                {(['STEEL', 'TITANIUM', 'BRUTALIST', 'LIGHT'] as Theme[]).map(t => (
                    <button 
                        key={t} 
                        onClick={() => handleThemeSwitch(t)} 
                        title={`Toggle ${t} protocol`}
                        className={`px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest transition-all duration-300 relative group ${
                          appState.theme === t 
                          ? 'text-neon bg-steel-800/80' 
                          : 'text-steel-600 hover:text-steel-300'
                        }`}
                    >
                        {t}
                        {appState.theme === t && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neon animate-pulse"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex items-center space-x-6">
            <button 
              onClick={() => toggleLiveBridge(false)}
              className={`flex items-center space-x-2 px-3 py-1.5 border rounded-sm font-mono text-[9px] uppercase tracking-widest transition-all duration-500 ${
                appState.isLiveActive && !appState.isDictating
                ? 'border-neon bg-neon text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]' 
                : 'border-steel-800 text-steel-500 hover:border-steel-600 hover:text-steel-300'
              }`}
            >
              <IconMic />
              <span>{appState.isLiveActive && !appState.isDictating ? 'Bridge Active' : 'Voice Link'}</span>
              {appState.isLiveActive && !appState.isDictating && <div className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></div>}
            </button>

            <div className="flex items-center space-x-2 border-l border-steel-800 pl-6 h-8">
              <button 
                onClick={() => setAppState(prev => ({...prev, isOnline: !prev.isOnline}))} 
                className={`group flex items-center space-x-3 px-4 py-1.5 rounded-sm border transition-all duration-500 font-mono ${
                  appState.isOnline 
                  ? 'border-neon/20 text-neon bg-neon/5 status-glow' 
                  : 'border-steel-800 text-steel-700 bg-transparent'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <div className={`w-10 h-10 absolute rounded-full opacity-10 transition-all duration-1000 ${appState.isOnline ? 'bg-neon animate-pulse scale-150' : 'bg-transparent scale-0'}`}></div>
                  {appState.isOnline ? <IconWifi /> : <IconLock />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                    {appState.isOnline ? "Online" : "Airlock"}
                </span>
              </button>
            </div>
            
            <button onClick={() => setAppState(prev => ({...prev, showSettings: true}))} className="text-steel-600 hover:text-white transition-all p-1 hover:bg-steel-800/50 rounded-sm">
              <IconSettings />
            </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* STREAM PANEL */}
        <div className="w-1/2 flex flex-col border-r border-steel-900 bg-panel-bg/20 relative overflow-hidden theme-transition">
            <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar scroll-smooth">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-steel-900 select-none">
                         <div className="font-mono text-[10px] tracking-[1.2em] uppercase opacity-30">Awaiting Directive</div>
                    </div>
                )}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-400`}>
                        <div className={`max-w-[92%] py-2 ${
                          msg.role === 'user' 
                          ? 'text-white border-r-2 border-neon/40 pr-5 text-right' 
                          : 'text-steel-300 font-mono border-l-2 border-neon pl-5'
                        }`}>
                            <div className="flex items-center space-x-2 text-[8px] uppercase font-bold tracking-[0.2em] text-steel-600 mb-1.5">
                              <span>{msg.role}</span>
                              {msg.priority && <span className={`px-1 rounded-sm text-[7px] ml-2 ${
                                msg.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                                msg.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-500' :
                                msg.priority === 'LOW' ? 'bg-blue-500/20 text-blue-500' : 'bg-steel-800 text-steel-400'
                              }`}>{msg.priority}</span>}
                              {msg.isTranscription && <span className="text-neon bg-neon/10 px-1.5 border border-neon/20 rounded-sm text-[7px]">AUD_STREAM</span>}
                            </div>
                            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.isTranscription ? 'italic opacity-90' : ''}`}>
                              {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* COMMAND DECK */}
            <div className="p-6 bg-steel-950/80 border-t border-steel-900 backdrop-blur-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`flex-1 relative flex items-center transition-all duration-300 ${appState.isDictating ? 'shadow-[0_0_20px_rgba(0,255,65,0.1)]' : ''}`}>
                      <input type="text" disabled={isProcessing} value={inputValue} 
                          onChange={(e) => setInputValue(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                          placeholder={appState.isDictating ? "Synthetic capture active... Speak now." : appState.isLiveActive ? "Listening for bridge directive..." : "Enter directive..."} 
                          className={`w-full bg-steel-950 border rounded-sm px-5 py-4 text-white outline-none font-mono text-sm placeholder:text-steel-800 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pr-28 ${
                            appState.isDictating ? 'border-neon ring-1 ring-neon/10' : 'border-steel-800 focus:border-neon/40'
                          }`} />
                      
                      <div className="absolute right-4 flex items-center space-x-4">
                          <button 
                            onClick={() => toggleLiveBridge(true)} 
                            title="Toggle Dictation Capture"
                            className={`transition-all duration-300 p-1.5 rounded-sm hover:bg-steel-800/40 ${appState.isDictating ? 'text-neon animate-pulse' : 'text-steel-700 hover:text-steel-400'}`}
                          >
                              <IconMic />
                          </button>
                          <button onClick={handleSendMessage} disabled={isProcessing || !inputValue.trim()} className={`transition-all p-1.5 rounded-sm hover:bg-steel-800/40 ${inputValue.trim() ? 'text-neon' : 'text-steel-800'}`}>
                              <IconSend />
                          </button>
                      </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1 shrink-0">
                    <span className="text-[7px] uppercase font-bold text-steel-700 tracking-widest text-center">Priority_Gating</span>
                    <div className="flex border border-steel-800 rounded-sm overflow-hidden bg-steel-950 shadow-inner">
                      {(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as PriorityLevel[]).map(p => (
                        <button 
                          key={p} 
                          onClick={() => setAppState(prev => ({...prev, currentPriority: p}))}
                          className={`px-2.5 py-2 text-[8px] font-mono font-bold transition-all border-r border-steel-800 last:border-0 ${
                            appState.currentPriority === p 
                            ? (p === 'CRITICAL' ? 'bg-red-500 text-black' : p === 'HIGH' ? 'bg-amber-500 text-black' : p === 'LOW' ? 'bg-blue-500 text-black' : 'bg-neon text-black')
                            : 'text-steel-700 hover:bg-steel-900 hover:text-steel-400'
                          }`}
                        >
                          {p.substring(0, 1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center font-mono text-[9px] uppercase tracking-[0.2em] text-steel-600 px-1">
                    <div className="flex space-x-6">
                        {['Architect', 'Engineer', 'Critic', 'Researcher'].map(agent => (
                          <div key={agent} className="flex items-center space-x-2">
                              <span className="opacity-40">{agent.substring(0, 4)}:</span>
                              <span className={(agentPulse as any)[agent] === 'ACTIVE' || (agentPulse as any)[agent] === 'COMPLETE' ? "text-neon font-bold" : "opacity-20"}>
                                {(agentPulse as any)[agent]}
                              </span>
                          </div>
                        ))}
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="opacity-40">Continuity_Link:</span>
                        <span className="text-neon/80 tracking-widest uppercase">Phase_1_Active</span>
                    </div>
                </div>
            </div>
        </div>

        {/* ARTIFACT PANEL */}
        <div className="w-1/2 bg-steel-950 relative overflow-hidden theme-transition">
             <ArtifactDeck artifact={currentArtifact} isProcessing={isProcessing} partialOutputs={partialAgentOutputs} />
        </div>
      </main>

      <SettingsModal 
        isOpen={appState.showSettings} 
        onClose={() => setAppState(prev => ({...prev, showSettings: false}))} 
        providers={providers} 
        onUpdateProvider={async (p) => { await saveProviderConfig(p); setProviders(prev => prev.map(o => o.id === p.id ? p : o)); }} 
        onAddProvider={async (p) => { await saveProviderConfig(p); setProviders(prev => [...prev, p]); }} 
        onDeleteProvider={async (id) => { await deleteProviderConfig(id); setProviders(prev => prev.filter(p => p.id !== id)); }} 
        identity={identity} 
        onUpdateIdentity={handleUpdateIdentity}
      />
    </div>
  );
}
