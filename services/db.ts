import { Identity, ProviderConfig, Message, Artifact } from '../types';
import { DEFAULT_IDENTITY, DEFAULT_PROVIDERS } from '../constants';

const DB_NAME = "cold_steel_identity_db";
const DB_VERSION = 4; // Incremented for schema alignment

let dbInstance: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      
      // Core Identity Store
      if (!db.objectStoreNames.contains("identities")) {
        db.createObjectStore("identities", { keyPath: "id" });
      }
      
      // Provider Module Store
      if (!db.objectStoreNames.contains("provider_configs")) {
        db.createObjectStore("provider_configs", { keyPath: "id" });
      }

      // Memory Logs (Episodic)
      if (!db.objectStoreNames.contains("logs")) {
        db.createObjectStore("logs", { keyPath: "id" });
      }

      // Artifact Vault (Semantic)
      if (!db.objectStoreNames.contains("artifacts")) {
        db.createObjectStore("artifacts", { keyPath: "id" });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.error("CRITICAL: Memory Cortex offline.", e);
      reject("IndexedDB initialization failed");
    };
  });
};

/**
 * Ensures the identity matrix and provider modules are initialized.
 */
export const bootstrapCortex = async (): Promise<{ identity: Identity, providers: ProviderConfig[] }> => {
  await initDB();
  
  let identity = await getIdentity("PRIMARY");
  if (!identity) {
    console.warn("IDENTITY AMNESIA DETECTED: Restoring primary anchor...");
    identity = DEFAULT_IDENTITY;
    await saveIdentity(identity);
  }

  let providers = await getProviderConfigs();
  if (providers.length === 0) {
    console.warn("MODULE VOID DETECTED: Injecting default provider stack...");
    providers = DEFAULT_PROVIDERS;
    for (const p of providers) {
      await saveProviderConfig(p);
    }
  }

  return { identity, providers };
};

export const saveIdentity = async (identity: Identity): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("identities", "readwrite");
    tx.objectStore("identities").put(identity);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getIdentity = async (id: string): Promise<Identity | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("identities", "readonly");
    const req = tx.objectStore("identities").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const resetIdentity = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("identities", "readwrite");
    tx.objectStore("identities").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveProviderConfig = async (config: ProviderConfig): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("provider_configs", "readwrite");
    tx.objectStore("provider_configs").put(config);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteProviderConfig = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("provider_configs", "readwrite");
    tx.objectStore("provider_configs").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getProviderConfigs = async (): Promise<ProviderConfig[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("provider_configs", "readonly");
    const req = tx.objectStore("provider_configs").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const saveMessage = async (msg: Message): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("logs", "readwrite");
    tx.objectStore("logs").put(msg);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getLogs = async (): Promise<Message[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("logs", "readonly");
    const req = tx.objectStore("logs").getAll();
    req.onsuccess = () => {
      const sorted = (req.result as Message[]).sort((a, b) => a.timestamp - b.timestamp);
      resolve(sorted);
    };
    req.onerror = () => reject(req.error);
  });
};

export const searchSemanticMemory = async (query: string): Promise<string> => {
  const logs = await getLogs();
  const artifacts = await getArtifacts();
  
  const keywords = query.toLowerCase().split(' ').filter(k => k.length > 3);
  
  const relevantArtifacts = artifacts.filter(a => 
    keywords.some(k => a.title.toLowerCase().includes(k) || a.content.toLowerCase().includes(k))
  ).slice(0, 3);

  const relevantLogs = logs.filter(l => 
    l.role === 'user' && keywords.some(k => l.content.toLowerCase().includes(k))
  ).slice(0, 5);

  if (relevantArtifacts.length === 0 && relevantLogs.length === 0) return "No relevant semantic history found.";

  return `
RELEVANT MEMORY FRAGMENTS:
${relevantArtifacts.map(a => `[ARTIFACT: ${a.title}] ${a.content.substring(0, 100)}...`).join('\n')}
${relevantLogs.map(l => `[USER PREVIOUSLY STATED]: ${l.content}`).join('\n')}
  `.trim();
};

export const clearLogs = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("logs", "readwrite");
    tx.objectStore("logs").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveArtifact = async (artifact: Artifact): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("artifacts", "readwrite");
    tx.objectStore("artifacts").put(artifact);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getArtifacts = async (): Promise<Artifact[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("artifacts", "readonly");
    const req = tx.objectStore("artifacts").getAll();
    req.onsuccess = () => {
      const sorted = (req.result as Artifact[]).sort((a, b) => b.timestamp - a.timestamp);
      resolve(sorted);
    };
    req.onerror = () => reject(req.error);
  });
};
