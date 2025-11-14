import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, GroundingSource } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { startChat, findProductInSheet } from '../services/geminiService';
import { MicIcon, PaperclipIcon, SendIcon, LoadingSpinner } from './Icons';
// FIX: The `LiveSession` type is not exported from the `@google/genai` package.
// Defining a local interface for the live session object to ensure type safety.
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Chat, GenerateContentResponse, Part } from '@google/genai';

interface LiveSession {
  sendRealtimeInput(input: { media: Blob }): void;
  close(): void;
}

// Base64 and Audio Decoding/Encoding functions required for Live API
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-md p-3 rounded-2xl ${isUser ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700'}`}>
        {msg.parts.map((part, index) => (
          <div key={index}>
            {part.text && <p className="text-sm" dangerouslySetInnerHTML={{ __html: part.text.replace(/\n/g, '<br />')}}></p>}
            {part.image && (
              <img
                src={`data:${part.image.mimeType};base64,${part.image.base64}`}
                alt="User upload"
                className="mt-2 rounded-lg max-w-full h-auto"
              />
            )}
          </div>
        ))}
        {msg.groundingSources && msg.groundingSources.length > 0 && !isUser && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sources:</h4>
                <ul className="space-y-1 text-xs">
                    {msg.groundingSources.map((source, index) => (
                        <li key={index} className="truncate">
                            <a
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                                title={source.title}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
                                {source.title || new URL(source.uri).hostname}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
        <span className="text-xs opacity-70 block text-right mt-1">{msg.timestamp}</span>
      </div>
    </div>
  );
};


const SkincareChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ file: File; base64: string; mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  useEffect(() => {
    setChat(startChat());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      setImage({ file, base64, mimeType: file.type });
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !image) || isLoading || !chat) return;

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
    
    let promptText = input.trim();
    // If an image is uploaded without any text, add a default prompt for skin analysis.
    if (image && !promptText) {
      promptText = "আমার ত্বকের এই ছবিটি বিশ্লেষণ করুন এবং উপযুক্ত পণ্যের পরামর্শ দিন।";
    }

    if (promptText) userMessage.parts.push({ text: promptText });
    if (image) userMessage.parts.push({ image: { base64: image.base64, mimeType: image.mimeType } });

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    setImage(null);

    try {
      const messageForApi: Part[] = userMessage.parts.map((part) => {
        if (part.image) {
          return {
            inlineData: {
              data: part.image.base64,
              mimeType: part.image.mimeType,
            },
          };
        }
        return { text: part.text! };
      });

      let response: GenerateContentResponse = await chat.sendMessage({
        message: messageForApi,
      });

      // Handle function calling
      while (response.functionCalls && response.functionCalls.length > 0) {
        const toolResponseParts: Part[] = [];
        
        for (const functionCall of response.functionCalls) {
          if (functionCall.name === 'findProduct') {
            const productName = functionCall.args.productName as string;
            // Simulate calling the tool/function
            const productDetails = findProductInSheet(productName);
            
            toolResponseParts.push({
              functionResponse: {
                name: 'findProduct',
                response: productDetails || { error: 'Product not found in database.' },
              },
            });
          }
        }
        
        // Send the tool response back to the model
        response = await chat.sendMessage({ message: toolResponseParts });
      }
      
      const responseText = response.text;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      let sources: GroundingSource[] = [];

      if (groundingChunks) {
          sources = groundingChunks
              .filter(chunk => chunk.web && chunk.web.uri)
              .map(chunk => ({
                  title: chunk.web.title,
                  uri: chunk.web.uri
              }));
      }

      const modelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: responseText }],
        timestamp: new Date().toLocaleTimeString(),
        groundingSources: sources.length > 0 ? sources : undefined,
      };
      setMessages((prev) => [...prev, modelMessage]);

    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: "দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।" }],
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      if (liveSessionRef.current) {
        liveSessionRef.current.close();
        liveSessionRef.current = null;
      }
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
      if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
      if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
      if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
      sessionPromiseRef.current = null;
      setIsRecording(false);
      if(input.trim()) handleSend(); // Send transcribed text if any
    } else {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        let nextStartTime = 0;
        const sources = new Set<AudioBufferSourceNode>();
        let currentInputTranscription = '';

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        sessionPromiseRef.current = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: `তুমি একজন বন্ধুত্বপূর্ণ AI স্কিনকেয়ার সহকারী। তুমি শুধু বাংলায় কথা বলবে।`,
            inputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              setIsRecording(true);
              const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
              scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
              
              scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessorRef.current);
              scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.inputTranscription?.text) {
                currentInputTranscription += message.serverContent.inputTranscription.text;
                setInput(currentInputTranscription);
              }
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current!.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                const sourceNode = outputAudioContextRef.current!.createBufferSource();
                sourceNode.buffer = audioBuffer;
                sourceNode.connect(outputAudioContextRef.current!.destination);
                sourceNode.addEventListener('ended', () => sources.delete(sourceNode));
                sourceNode.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
                sources.add(sourceNode);
              }
            },
            onerror: (e: ErrorEvent) => { console.error('Live session error:', e); setIsRecording(false); },
            onclose: (e: CloseEvent) => { setIsRecording(false); }
          }
        });
        liveSessionRef.current = await sessionPromiseRef.current;
      } catch (error) {
        console.error("Failed to start recording:", error);
        alert("Could not start recording. Please ensure microphone permissions are granted.");
      }
    }
  }, [isRecording, input, handleSend]);

  return (
    <div className="flex flex-col h-full bg-yellow-100/50 dark:bg-gray-800/50 p-4">
      <div className="flex-1 overflow-y-auto pr-2">
        {messages.map((msg, index) => (
          <MessageBubble key={`${msg.timestamp}-${index}`} msg={msg} />
        ))}
        {isLoading && (
            <div className="flex justify-start mb-4">
                <div className="max-w-md p-3 rounded-2xl bg-white dark:bg-gray-700 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-300"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {image && (
        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg mb-2 relative">
          <img src={`data:${image.mimeType};base64,${image.base64}`} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
          <button onClick={() => setImage(null)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">&times;</button>
        </div>
      )}

      <div className="mt-4 flex items-center bg-white dark:bg-gray-700 rounded-full shadow-lg p-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
          <PaperclipIcon className="w-6 h-6" />
        </button>
        <button
          onClick={toggleRecording}
          className={`p-2 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'}`}
        >
          <MicIcon className="w-6 h-6" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isRecording ? "শুনছি..." : "আপনার ত্বক সম্পর্কে জিজ্ঞাসা করুন..."}
          className="flex-1 bg-transparent focus:outline-none px-4 text-gray-800 dark:text-gray-200"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={(!input.trim() && !image) || isLoading}
          className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-700"
        >
          {isLoading ? <LoadingSpinner /> : <SendIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default SkincareChat;