
import React, { useState, useEffect } from 'react';
import { ProviderConfig, Identity, Theme } from '../types';
import { clearLogs, resetIdentity, saveIdentity } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: ProviderConfig[];
  onUpdateProvider: (provider: ProviderConfig) => void;
  onAddProvider: (provider: ProviderConfig) => void;
  onDeleteProvider: (id: string) => void;
  identity: Identity | null;
  onUpdateIdentity: (identity: Identity) => void;
}

const IconServer = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconFingerprint = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm10 6c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6z"></path></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconMic = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const IconAlert = () => <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, providers, onUpdateProvider, onAddProvider, onDeleteProvider, identity, onUpdateIdentity
}) => {
  const [activeTab, setActiveTab] = useState<string>("identity");
  const [isIdentityModified, setIsIdentityModified] = useState(false);
  const [localIdentity, setLocalIdentity] = useState<Identity | null>(identity);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [newTag, setNewTag] = useState({ philosophy: '', constraints: '' });

  useEffect(() => {
    if (isOpen) {
      setLocalIdentity(identity);
      setValidationErrors({});
    }
  }, [isOpen, identity]);

  if (!isOpen) return null;

  const currentProvider = providers.find(p => p.id === activeTab);
  const isIdentityTab = activeTab === "identity";

  const handleUpdateLocalIdentity = (updates: any) => {
    if (!localIdentity) return;
    setLocalIdentity(prev => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        if (updates.theme) {
            onUpdateIdentity(next);
        }
        setIsIdentityModified(true);
        return next;
    });
  };

  const addTag = (type: 'philosophy' | 'constraints') => {
    if (!newTag[type].trim() || !localIdentity) return;
    const currentList = localIdentity.coreTraits[type];
    handleUpdateLocalIdentity({
      coreTraits: { ...localIdentity.coreTraits, [type]: [...currentList, newTag[type].trim()] }
    });
    setNewTag(prev => ({ ...prev, [type]: '' }));
  };

  const removeTag = (type: 'philosophy' | 'constraints', index: number) => {
    if (!localIdentity) return;
    const nextList = [...localIdentity.coreTraits[type]];
    nextList.splice(index, 1);
    handleUpdateLocalIdentity({
      coreTraits: { ...localIdentity.coreTraits, [type]: nextList }
    });
  };

  const saveIdentityMatrix = async () => {
    if (localIdentity) {
      const errors: Record<string, string> = {};
      if (!localIdentity.displayName.trim()) errors.displayName = "Designation required";
      if (!localIdentity.coreTraits.tone.trim()) errors.tone = "Operational tone required";

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      await saveIdentity({ ...localIdentity, lastActiveAt: Date.now() });
      onUpdateIdentity(localIdentity);
      setIsIdentityModified(false);
      setValidationErrors({});
      alert("IDENTITY RECOMPILED: Matrix updated.");
    }
  };

  const handleToggleProvider = (provider: ProviderConfig) => {
    const isEnabling = !provider.enabled;
    if (isEnabling) {
        const errors: Record<string, string> = {};
        if (!provider.baseUrl.trim()) errors.baseUrl = "Endpoint required for uplink";
        if (!provider.apiKey.trim()) errors.apiKey = "Secure Token required for authentication";

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
    }
    onUpdateProvider({ ...provider, enabled: !provider.enabled });
    setValidationErrors({});
  };

  const handlePurgeMemory = async () => {
    if (confirm("CONFIRM: WIPE EPISODIC MEMORY (LOGS)?")) {
        await clearLogs();
        window.location.reload();
    }
  };

  const handleFactoryReset = async () => {
    if (confirm("CRITICAL: FULL IDENTITY RESET. THIS CANNOT BE UNDONE.")) {
        if (identity) await resetIdentity(identity.id);
        await clearLogs();
        window.location.reload();
    }
  };

  const ValidationError = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
        <div className="flex items-center space-x-1 mt-1.5 text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
            <IconAlert />
            <span className="text-[9px] uppercase font-bold tracking-tighter">{message}</span>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-[900px] h-[700px] bg-steel-950 border border-steel-700 shadow-2xl flex flex-col font-mono text-sm relative overflow-hidden chamfer-sm">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-steel-700 via-neon to-steel-700 opacity-50"></div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-steel-800 bg-steel-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <IconServer />
            <h2 className="text-steel-100 font-bold uppercase tracking-widest text-sm">System Configuration</h2>
          </div>
          <button onClick={onClose} className="text-steel-500 hover:text-white transition-colors text-[10px] uppercase px-3 py-1 border border-steel-800 rounded-sm">
            [ESC] Close
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-steel-800 bg-steel-900/30 overflow-y-auto custom-scrollbar">
            <div className="p-3 text-[9px] text-steel-500 uppercase font-bold tracking-widest px-6 mt-2">Continuity</div>
            <button onClick={() => { setActiveTab("identity"); setValidationErrors({}); }} className={`w-full text-left px-6 py-4 flex items-center justify-between border-l-2 transition-all ${isIdentityTab ? 'bg-steel-800/80 text-white border-neon' : 'text-steel-400 border-transparent'}`}>
                <span>Identity Matrix</span>
                <IconFingerprint />
            </button>
            <div className="p-3 text-[9px] text-steel-500 uppercase font-bold tracking-widest px-6 mt-4">Modules</div>
            {providers.map(p => (
              <button key={p.id} onClick={() => { setActiveTab(p.id); setValidationErrors({}); }} className={`w-full text-left px-6 py-4 flex items-center justify-between border-l-2 transition-all ${activeTab === p.id ? 'bg-steel-800/80 text-white border-neon' : 'text-steel-400 border-transparent'}`}>
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{p.name}</span>
                  <span className="text-[8px] text-steel-600 truncate uppercase">{p.type}</span>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${p.enabled ? 'bg-neon shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-steel-600'}`}></div>
              </button>
            ))}
          </div>

          <div className="flex-1 bg-steel-950 p-10 overflow-y-auto custom-scrollbar">
            {isIdentityTab && localIdentity && (
                 <div className="space-y-10 max-w-xl animate-in fade-in duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Identity Matrix</h3>
                            <p className="text-[10px] text-steel-500 mt-1 uppercase tracking-widest">Version: {localIdentity.version}.0 | Linked: {new Date(localIdentity.createdAt).toLocaleDateString()}</p>
                        </div>
                        {isIdentityModified && (
                            <button onClick={saveIdentityMatrix} className="px-4 py-1.5 bg-neon/10 border border-neon text-neon text-[10px] font-bold uppercase hover:bg-neon hover:text-black transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)]">Recompile</button>
                        )}
                    </div>
                    
                    <div className="space-y-8">
                        {/* Theme Protocol Selector */}
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase text-steel-500 font-bold">Visual Protocol</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['STEEL', 'TITANIUM', 'BRUTALIST', 'LIGHT'] as Theme[]).map(t => (
                                    <button 
                                        key={t} 
                                        onClick={() => handleUpdateLocalIdentity({ theme: t })}
                                        className={`py-2 text-[9px] font-bold uppercase border rounded-sm transition-all ${
                                            localIdentity.theme === t 
                                            ? 'border-neon text-neon bg-neon/5 shadow-[0_0_10px_rgba(0,255,65,0.1)]' 
                                            : 'border-steel-800 text-steel-600 hover:border-steel-700 hover:text-steel-400'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Voice Protocol Settings */}
                        <div className="space-y-4 pt-4 border-t border-steel-800/50">
                            <div className="flex items-center space-x-2 text-neon/60">
                                <IconMic />
                                <label className="text-[9px] uppercase font-bold">Voice Protocol</label>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase text-steel-500">Synthetic Voice</label>
                                    <select 
                                        value={localIdentity.voicePreferences.preferredVoiceName}
                                        onChange={(e) => handleUpdateLocalIdentity({ voicePreferences: { ...localIdentity.voicePreferences, preferredVoiceName: e.target.value } })}
                                        className="w-full bg-steel-900 border border-steel-800 text-steel-100 p-2 text-[10px] outline-none focus:border-neon"
                                    >
                                        {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase text-steel-500">Multimodal Uplink Model</label>
                                    <input 
                                        type="text" 
                                        value={localIdentity.voicePreferences.modelId}
                                        onChange={(e) => handleUpdateLocalIdentity({ voicePreferences: { ...localIdentity.voicePreferences, modelId: e.target.value } })}
                                        className="w-full bg-steel-900 border border-steel-800 text-steel-100 p-2 text-[10px] outline-none focus:border-neon"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase text-steel-500 font-bold">Designation</label>
                                <input 
                                    type="text" value={localIdentity.displayName}
                                    onChange={(e) => handleUpdateLocalIdentity({ displayName: e.target.value })}
                                    className={`w-full bg-steel-900 border text-steel-100 p-3 text-xs outline-none focus:border-neon transition-all ${validationErrors.displayName ? 'border-red-900/50' : 'border-steel-800'}`}
                                />
                                <ValidationError message={validationErrors.displayName} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase text-steel-500 font-bold">Core Tone</label>
                                <input 
                                    type="text" value={localIdentity.coreTraits.tone}
                                    onChange={(e) => handleUpdateLocalIdentity({ coreTraits: { ...localIdentity.coreTraits, tone: e.target.value } })}
                                    className={`w-full bg-steel-900 border text-steel-100 p-3 text-xs outline-none focus:border-neon transition-all ${validationErrors.tone ? 'border-red-900/50' : 'border-steel-800'}`}
                                />
                                <ValidationError message={validationErrors.tone} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[9px] uppercase text-steel-500 font-bold">Philosophical Anchors</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {localIdentity.coreTraits.philosophy.map((p, i) => (
                                    <span key={i} className="flex items-center space-x-2 px-2 py-1 bg-steel-900 border border-steel-800 text-[10px] text-steel-300">
                                        <span>{p}</span>
                                        <button onClick={() => removeTag('philosophy', i)} className="hover:text-red-500"><IconX /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex space-x-2">
                                <input 
                                    type="text" value={newTag.philosophy}
                                    onChange={(e) => setNewTag(prev => ({ ...prev, philosophy: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && addTag('philosophy')}
                                    placeholder="Add philosophical anchor..."
                                    className="flex-1 bg-steel-900 border border-steel-800 text-steel-100 p-2 text-[10px] outline-none focus:border-neon"
                                />
                                <button onClick={() => addTag('philosophy')} className="px-3 bg-steel-800 border border-steel-700 hover:text-white transition-all"><IconPlus /></button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[9px] uppercase text-steel-500 font-bold">Identity Constraints</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {localIdentity.coreTraits.constraints.map((c, i) => (
                                    <span key={i} className="flex items-center space-x-2 px-2 py-1 bg-steel-900 border border-steel-800 text-[10px] text-steel-300">
                                        <span>{c}</span>
                                        <button onClick={() => removeTag('constraints', i)} className="hover:text-red-500"><IconX /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex space-x-2">
                                <input 
                                    type="text" value={newTag.constraints}
                                    onChange={(e) => setNewTag(prev => ({ ...prev, constraints: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && addTag('constraints')}
                                    placeholder="Add constraint..."
                                    className="flex-1 bg-steel-900 border border-steel-800 text-steel-100 p-2 text-[10px] outline-none focus:border-neon"
                                />
                                <button onClick={() => addTag('constraints')} className="px-3 bg-steel-800 border border-steel-700 hover:text-white transition-all"><IconPlus /></button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <label className="text-[9px] uppercase text-steel-500 font-bold">Cognitive Profile</label>
                            {['verbosity', 'creativity', 'riskTolerance'].map((key) => (
                                <div key={key} className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] uppercase tracking-widest">
                                        <span className="text-steel-400">{key}</span>
                                        <span className="text-neon">{((localIdentity.cognitiveProfile as any)[key] * 100).toFixed(0)}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="1" step="0.1" 
                                        value={(localIdentity.cognitiveProfile as any)[key]}
                                        onChange={(e) => handleUpdateLocalIdentity({ cognitiveProfile: { ...localIdentity.cognitiveProfile, [key]: parseFloat(e.target.value) } })}
                                        className="w-full h-1 bg-steel-800 appearance-none cursor-pointer accent-neon"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-10 flex space-x-6">
                         <button onClick={handlePurgeMemory} className="flex-1 py-3 border border-steel-800 text-steel-500 hover:text-white hover:bg-steel-900 transition-all text-[10px] uppercase font-bold flex items-center justify-center space-x-2"><IconTrash /><span>Purge Memory Logs</span></button>
                         <button onClick={handleFactoryReset} className="flex-1 py-3 border border-red-900/40 text-red-800 hover:bg-red-950/20 transition-all text-[10px] uppercase font-bold">Terminal Reset</button>
                    </div>
                 </div>
            )}

            {currentProvider && !isIdentityTab && (
              <div className="space-y-10 max-w-xl animate-in fade-in duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase">{currentProvider.name}</h3>
                    <p className="text-[10px] text-steel-500 uppercase tracking-widest">Protocol Stack: {currentProvider.type}</p>
                  </div>
                  <button onClick={() => handleToggleProvider(currentProvider)} className={`px-4 py-1.5 border text-[10px] font-bold uppercase transition-all ${currentProvider.enabled ? 'border-neon text-neon bg-neon/10' : 'border-steel-700 text-steel-500'}`}>
                    {currentProvider.enabled ? 'Uplink Established' : 'Link Terminated'}
                  </button>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] uppercase text-steel-500 font-bold">Provider Endpoint</label>
                        <input 
                            type="text" value={currentProvider.baseUrl}
                            onChange={(e) => {
                                onUpdateProvider({...currentProvider, baseUrl: e.target.value});
                                if (validationErrors.baseUrl) setValidationErrors({});
                            }}
                            className={`w-full bg-steel-900 border text-steel-100 p-3 text-xs outline-none focus:border-neon ${validationErrors.baseUrl ? 'border-red-900/50' : 'border-steel-800'}`}
                        />
                        <ValidationError message={validationErrors.baseUrl} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] uppercase text-steel-500 font-bold">Secure Access Key</label>
                        <input 
                            type="password" value={currentProvider.apiKey}
                            onChange={(e) => {
                                onUpdateProvider({...currentProvider, apiKey: e.target.value});
                                if (validationErrors.apiKey) setValidationErrors({});
                            }}
                            placeholder="REDACTED_SECURE_TOKEN"
                            className={`w-full bg-steel-900 border text-steel-100 p-3 text-xs outline-none focus:border-neon ${validationErrors.apiKey ? 'border-red-900/50' : 'border-steel-800'}`}
                        />
                        <ValidationError message={validationErrors.apiKey} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] uppercase text-steel-500 font-bold">Selected Model Path</label>
                        <select 
                            value={currentProvider.selectedModelId}
                            onChange={(e) => onUpdateProvider({...currentProvider, selectedModelId: e.target.value})}
                            className="w-full bg-steel-900 border border-steel-800 text-steel-100 p-3 text-xs outline-none focus:border-neon"
                        >
                            {currentProvider.models.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
