
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

let nextStartTime = 0;
let audioContext: AudioContext | null = null;
let outputNode: GainNode | null = null;
let sources = new Set<AudioBufferSourceNode>();
let activeSession: any = null;

export const startLiveBridge = async (
  apiKey: string, 
  systemInstruction: string, 
  voiceName: string,
  modelId: string,
  onTranscription: (text: string, role: 'user' | 'model') => void
) => {
  const ai = new GoogleGenAI({ apiKey });
  
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  outputNode = audioContext.createGain();
  outputNode.connect(audioContext.destination);

  const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  let currentInputTranscription = '';
  let currentOutputTranscription = '';

  const sessionPromise = ai.live.connect({
    model: modelId || 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        const source = inputContext.createMediaStreamSource(stream);
        const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createPcmBlob(inputData);
          sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputContext.destination);
      },
      onmessage: async (message: LiveServerMessage) => {
        // Handle Transcription Streams
        if (message.serverContent?.outputTranscription) {
          currentOutputTranscription += message.serverContent.outputTranscription.text;
        } else if (message.serverContent?.inputTranscription) {
          currentInputTranscription += message.serverContent.inputTranscription.text;
        }

        if (message.serverContent?.turnComplete) {
          if (currentInputTranscription) onTranscription(currentInputTranscription, 'user');
          if (currentOutputTranscription) onTranscription(currentOutputTranscription, 'model');
          currentInputTranscription = '';
          currentOutputTranscription = '';
        }

        // Handle Audio Output
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && audioContext && outputNode) {
          nextStartTime = Math.max(nextStartTime, audioContext.currentTime);
          const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputNode);
          source.start(nextStartTime);
          nextStartTime += audioBuffer.duration;
          sources.add(source);
          source.onended = () => sources.delete(source);
        }

        if (message.serverContent?.interrupted) {
          sources.forEach(s => s.stop());
          sources.clear();
          nextStartTime = 0;
          currentInputTranscription = '';
          currentOutputTranscription = '';
        }
      },
      onclose: () => console.log("Live bridge terminated."),
      onerror: (e) => console.error("Live bridge error:", e)
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction,
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' } }
      }
    }
  });

  activeSession = await sessionPromise;
  return activeSession;
};

export const stopLiveBridge = () => {
  if (activeSession) {
    activeSession.close();
    activeSession = null;
  }
  sources.forEach(s => {
    try { s.stop(); } catch(e) {}
  });
  sources.clear();
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
};

function decode(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

function createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
