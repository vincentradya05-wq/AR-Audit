import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Mic, MicOff, Radio, Volume2 } from 'lucide-react';
import { ARRecord, AuditSummary } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface Props {
  apiKey: string;
  data: ARRecord[];
  summary: AuditSummary;
}

const AnalysisChat: React.FC<Props> = ({ apiKey, data, summary }) => {
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [logs, setLogs] = useState<{role: 'user' | 'model', text: string}[]>([]);
  
  // Refs for audio handling
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null); // To hold the live session
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Construct the System Instruction based on the Audit Data
  const systemInstruction = useMemo(() => {
    const highRiskSamples = data
      .filter(d => d.RiskLevel === 'High')
      .slice(0, 10)
      .map(d => `${d.Nama_Pelanggan} (Overdue: ${d.DaysOverdue} days, Amount: ${d.Jumlah_Tagihan})`)
      .join(', ');

    return `
      Role: You are "AuditGuard", a Senior AI Auditor and Data Analyst.
      Task: Perform substantive audit procedures on Accounts Receivable.
      Context Data:
      - Total AR: ${summary.totalAR}
      - High Risk Exposure: ${summary.agingBuckets.over90}
      - Top High Risk Customers: ${highRiskSamples}
      
      Capabilities:
      1. Analyze fraud patterns like 'Lapping' or bad debts.
      2. If asked about a specific customer not in the top list, say you are checking the ledger (simulate check).
      3. Speak professionally, concisely, like a consultant. Do NOT read long tables. Give executive summaries.
      4. If finding balances > 90 days, suggest CKPN (Impairment Loss).
    `;
  }, [data, summary]);

  const connectToLive = async () => {
    if (!apiKey) return;
    setStatus('connecting');

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputNodeRef.current = outputAudioContextRef.current.createGain();
      outputNodeRef.current.connect(outputAudioContextRef.current.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Live Session Opened");
            setStatus('connected');
            setIsLive(true);

            // Setup Input Stream
            if (!inputAudioContextRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Transcription for UI
             if (msg.serverContent?.outputTranscription?.text) {
                 setLogs(prev => [...prev, {role: 'model', text: msg.serverContent!.outputTranscription!.text}]);
             }
             if (msg.serverContent?.inputTranscription?.text) {
                // Ideally debounced or handled on turnComplete, but simplistic here
             }
             if (msg.serverContent?.turnComplete && msg.serverContent.inputTranscription) {
                 setLogs(prev => [...prev, {role: 'user', text: msg.serverContent!.inputTranscription!.text}]);
             }

            // Handle Audio Output
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && outputNodeRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    ctx,
                    24000,
                    1
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNodeRef.current);
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }
          },
          onclose: () => {
            setStatus('disconnected');
            setIsLive(false);
          },
          onerror: (err) => {
            console.error(err);
            setStatus('error');
            setIsLive(false);
          }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const disconnect = () => {
    // Cleanup Audio
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();

    // Close Session
    if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
    }
    
    setIsLive(false);
    setStatus('disconnected');
  };

  // Helper functions for Audio
  function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    // Simple Base64 encode for the blob data wrapper
    const binary = String.fromCharCode(...new Uint8Array(int16.buffer));
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
     const dataInt16 = new Int16Array(data.buffer);
     const frameCount = dataInt16.length / numChannels;
     const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
     for(let ch=0; ch < numChannels; ch++) {
         const chData = buffer.getChannelData(ch);
         for(let i=0; i<frameCount; i++) {
             chData[i] = dataInt16[i * numChannels + ch] / 32768.0;
         }
     }
     return buffer;
  }


  return (
    <div className="flex flex-col h-full p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Radio className={`w-6 h-6 ${isLive ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            Live Auditor Interview
        </h2>
        <p className="text-slate-500">
            Speak with AuditGuard AI to investigate specific anomalies. The AI has access to the uploaded CSV context.
        </p>
      </div>

      <div className="flex-1 bg-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-2xl">
        {/* Visualizer Placeholder */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black"></div>
        </div>

        {/* Chat Logs */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar z-10 mb-6">
            {logs.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-600 italic">
                    Start the session and ask: "Is there any sign of Lapping in the dataset?"
                </div>
            )}
            {logs.map((log, i) => (
                <div key={i} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-xl ${
                        log.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-slate-700 text-slate-100 rounded-bl-none'
                    }`}>
                        <p className="text-sm">{log.text}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 z-10 border-t border-slate-700 pt-6">
            {!isLive ? (
                <button 
                    onClick={connectToLive}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-lg transition-all transform hover:scale-105"
                >
                    <Mic className="w-5 h-5" />
                    Start Live Session
                </button>
            ) : (
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Recording
                    </div>
                    <button 
                        onClick={disconnect}
                        className="flex items-center gap-2 bg-slate-700 hover:bg-red-600 hover:text-white text-slate-300 px-6 py-3 rounded-full font-medium transition-colors"
                    >
                        <MicOff className="w-5 h-5" />
                        End Session
                    </button>
                </div>
            )}
        </div>
      </div>
      <div className="mt-4 text-center text-xs text-slate-400">
        Powered by Gemini 2.5 Flash Native Audio
      </div>
    </div>
  );
};

export default AnalysisChat;