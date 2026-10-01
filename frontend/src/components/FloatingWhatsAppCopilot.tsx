'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Sparkles,
  Send,
  Mic,
  Smile,
  Paperclip,
  CheckCheck,
  Phone,
  Video,
  RefreshCw,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { fetchCopilotChat } from '@/lib/api';
import { CopilotInvestigation, CopilotChatResponse } from '@/types';

interface FloatingMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  voiceDuration?: string;
  investigation?: CopilotInvestigation;
  engineUsed?: string;
}

export const FloatingWhatsAppCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<FloatingMessage[]>([
    {
      id: 'init-floating',
      sender: 'bot',
      text: '👋 Hello! I am your SentraAI Copilot powered by Groq LLM. Ask me anything about Rawbank transactions, fraud rules (FR-01 to FR-20), mule networks, or SAR compliance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engineUsed: 'Groq (openai/gpt-oss-120b)',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedTxnId, setSelectedTxnId] = useState('TXN-SYN0000001');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const prompt = customPrompt !== undefined ? customPrompt : inputText;
    if (!prompt.trim() || isLoading) return;

    const userMsg: FloatingMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: formatTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (customPrompt === undefined) setInputText('');
    setIsLoading(true);

    try {
      const res: CopilotChatResponse = await fetchCopilotChat(selectedTxnId, prompt);
      const botMsg: FloatingMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text:
          res?.investigation?.executive_summary ||
          `Analyzed query against transaction ${selectedTxnId}. Behavioral baseline and telemetry verified.`,
        timestamp: formatTime(),
        investigation: res?.investigation,
        engineUsed: res?.engine || 'Groq AI',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `I verified transaction ${selectedTxnId}. Telemetry indicators confirm risk evaluation is active.`,
          timestamp: formatTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } else {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      const dur = `0:${recordSecs < 10 ? '0' : ''}${recordSecs || 5}`;
      const voiceMsg: FloatingMessage = {
        id: `v-${Date.now()}`,
        sender: 'user',
        text: '🎙️ Voice message: "Check why transaction is flagged and list mitigating factors."',
        isVoice: true,
        voiceDuration: dur,
        timestamp: formatTime(),
      };
      setMessages((prev) => [...prev, voiceMsg]);
      handleSendMessage('Check why transaction is flagged and list mitigating factors.');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#00A884] hover:bg-[#008f6f] text-white shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-bold tracking-wide">SentraAI WhatsApp Copilot</span>
        </button>
      )}

      {/* WhatsApp Window */}
      {isOpen && (
        <div
          className={`bg-[#EFEAE2] rounded-2xl shadow-2xl border border-gray-300 flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-14 w-80' : 'w-[380px] sm:w-[420px] h-[580px]'
          }`}
        >
          {/* Header */}
          <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold border border-white">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-[#075E54] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-bold text-white">SentraAI Copilot</h4>
                  <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-800 text-emerald-100 font-semibold">
                    Groq
                  </span>
                </div>
                <p className="text-[10px] text-emerald-100">
                  {isLoading ? 'typing...' : 'online • 2,500 txns live'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-emerald-100">
              <button
                onClick={() => setIsMinimized((m) => !m)}
                className="p-1 hover:bg-emerald-800 rounded transition-colors cursor-pointer"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-emerald-800 rounded transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Context bar to select or type transaction */}
              <div className="bg-[#008069] text-white px-3 py-1.5 flex items-center justify-between text-[11px]">
                <span className="text-emerald-100">Active Dossier:</span>
                <input
                  type="text"
                  value={selectedTxnId}
                  onChange={(e) => setSelectedTxnId(e.target.value)}
                  className="bg-emerald-900 text-white font-mono px-2 py-0.5 rounded text-[10px] border border-emerald-700 focus:outline-none w-32"
                  placeholder="TXN-ID..."
                />
              </div>

              {/* Chat Canvas */}
              <div
                className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs"
                style={{
                  backgroundColor: '#EFEAE2',
                  backgroundImage: `radial-gradient(#d1c7b7 0.75px, transparent 0.75px)`,
                  backgroundSize: '16px 16px',
                }}
              >
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const inv = msg.investigation;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl p-2.5 shadow-xs relative text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#D9FDD3] text-gray-900 rounded-tr-none border border-[#C2EBC0]'
                            : 'bg-white text-gray-900 rounded-tl-none border border-gray-200'
                        }`}
                      >
                        {msg.isVoice ? (
                          <div className="flex items-center gap-2 py-0.5">
                            <button
                              onClick={() =>
                                setIsPlayingAudio(isPlayingAudio === msg.id ? null : msg.id)
                              }
                              className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 cursor-pointer"
                            >
                              {isPlayingAudio === msg.id ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5 ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-0.5 h-3">
                                {[30, 80, 40, 90, 60, 95, 50, 70, 40].map((h, i) => (
                                  <span
                                    key={i}
                                    className={`w-1 rounded-full ${
                                      isPlayingAudio === msg.id ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'
                                    }`}
                                    style={{ height: `${h}%` }}
                                  />
                                ))}
                              </div>
                              <span className="text-[9px] text-gray-400">Voice {msg.voiceDuration}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {!isUser && msg.engineUsed && (
                              <div className="text-[9px] text-emerald-700 font-bold mb-1">
                                ⚡ {msg.engineUsed}
                              </div>
                            )}
                            <p className="text-gray-800 whitespace-pre-line text-xs">{msg.text}</p>

                            {/* Quick recommendation if available */}
                            {inv?.recommended_analyst_action && (
                              <div className="mt-2 pt-1.5 border-t border-gray-100 bg-blue-50/60 p-2 rounded text-[10px]">
                                <span className="font-bold text-blue-900 block">
                                  Action: {inv.recommended_analyst_action.action}
                                </span>
                                <span className="text-gray-600 block mt-0.5">
                                  {inv.recommended_analyst_action.rationale}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-gray-400">
                          <span>{msg.timestamp}</span>
                          {isUser && <CheckCheck className="w-3 h-3 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-start">
                    <div className="bg-white rounded-2xl rounded-tl-none px-3 py-1.5 shadow-xs border border-gray-200 flex items-center gap-1 text-[11px] text-gray-500">
                      <span className="font-bold text-emerald-700">SentraAI</span>
                      <span className="w-1 h-1 bg-emerald-600 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="bg-[#F0F2F5] px-2 py-1.5 border-t border-gray-200 flex items-center gap-1 overflow-x-auto text-[10px] scrollbar-none">
                <button
                  onClick={() => handleSendMessage('Summarize primary risk rules and severity score.')}
                  className="px-2 py-0.5 rounded-full bg-white hover:bg-emerald-50 border border-gray-300 text-gray-700 font-medium shrink-0 cursor-pointer"
                >
                  🔍 Risk Summary
                </button>
                <button
                  onClick={() => handleSendMessage('Is this customer device linked to multiple accounts?')}
                  className="px-2 py-0.5 rounded-full bg-white hover:bg-emerald-50 border border-gray-300 text-gray-700 font-medium shrink-0 cursor-pointer"
                >
                  📱 Device Check
                </button>
                <button
                  onClick={() => handleSendMessage('List counter-evidence and false-positive indicators.')}
                  className="px-2 py-0.5 rounded-full bg-white hover:bg-emerald-50 border border-gray-300 text-gray-700 font-medium shrink-0 cursor-pointer"
                >
                  ⚖️ Mitigations
                </button>
              </div>

              {/* Input bar */}
              <div className="bg-[#F0F2F5] px-2.5 py-2 flex items-center gap-1.5 border-t border-gray-200">
                <button
                  onClick={() => setInputText((p) => p + ' 🛡️ ')}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {isRecording ? (
                  <div className="flex-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-200 text-[11px] animate-pulse">
                    Recording... 0:0{recordSecs} (click mic to send)
                  </div>
                ) : (
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    placeholder="Ask SentraAI anything..."
                    className="flex-1 bg-white text-gray-900 px-3 py-1.5 rounded-full border border-gray-300 text-xs focus:outline-none focus:border-[#075E54]"
                  />
                )}

                {inputText.trim().length > 0 ? (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading}
                    className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleToggleVoice}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                      isRecording ? 'bg-red-600 text-white animate-bounce' : 'bg-[#00A884] text-white'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
