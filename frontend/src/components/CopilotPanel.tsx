'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  Smile,
  Paperclip,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Search,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Download,
  FileText,
  User,
  Smartphone,
  CreditCard,
  Scale,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { TransactionDrilldown, CopilotInvestigation, CopilotChatResponse } from '@/types';
import { fetchCopilotChat, fetchCopilotSuggestions } from '@/lib/api';

interface CopilotPanelProps {
  transaction: TransactionDrilldown;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isVoiceNote?: boolean;
  voiceDuration?: string;
  investigation?: CopilotInvestigation;
  engineUsed?: string;
  quickActionStatus?: string;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ transaction }) => {
  const txn = transaction.transaction;
  const txnId = txn.transaction_id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial greeting and automatic forensic summary
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      setIsLoading(true);
      try {
        const time = formatTime();
        const initialRes: CopilotChatResponse = await fetchCopilotChat(
          txnId,
          'Provide comprehensive fraud triage and forensic risk assessment.'
        );

        if (isMounted) {
          const botMsg: ChatMessage = {
            id: 'msg-init',
            sender: 'bot',
            text:
              initialRes?.investigation?.executive_summary ||
              `Hello! I am your SentraAI Fraud Copilot powered by Groq. I have analyzed transaction ${txnId} ($${(txn.amount_usd_equiv || 0).toLocaleString()} USD via ${txn.channel}). How can I assist your investigation?`,
            timestamp: time,
            investigation: initialRes?.investigation,
            engineUsed: initialRes?.engine || 'Groq (openai/gpt-oss-120b)',
          };
          setMessages([botMsg]);
        }
      } catch (err: any) {
        if (isMounted) {
          setMessages([
            {
              id: 'msg-err',
              sender: 'bot',
              text: `Hello! I am ready to triage transaction ${txnId}. Ask me any forensic question or select a quick action below.`,
              timestamp: formatTime(),
              engineUsed: 'Deterministic Synthesizer',
            },
          ]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initChat();

    return () => {
      isMounted = false;
    };
  }, [txnId]);

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt !== undefined ? customPrompt : inputText;
    if (!promptToSend.trim() || isLoading) return;

    const userTime = formatTime();
    const newMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: newMsgId,
      sender: 'user',
      text: promptToSend,
      timestamp: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (customPrompt === undefined) setInputText('');
    setIsLoading(true);

    try {
      const res: CopilotChatResponse = await fetchCopilotChat(txnId, promptToSend);
      const botTime = formatTime();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text:
          res?.investigation?.executive_summary ||
          `Investigation completed for ${txnId}. No additional anomalies found.`,
        timestamp: botTime,
        investigation: res?.investigation,
        engineUsed: res?.engine || 'Groq (openai/gpt-oss-120b)',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `I encountered an issue analyzing that specific query. Telemetry confirms ${txn.channel} transaction of $${txn.amount_usd_equiv} USD with score ${transaction.alert_evaluation.alert_score}/100.`,
          timestamp: formatTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recording simulation
  const handleToggleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      const duration = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds || 4}`;

      const voiceMsg: ChatMessage = {
        id: `usr-voice-${Date.now()}`,
        sender: 'user',
        text: '🎙️ Voice query: "Summarize the customer spending baseline and verify device trust."',
        isVoiceNote: true,
        voiceDuration: duration,
        timestamp: formatTime(),
      };
      setMessages((prev) => [...prev, voiceMsg]);

      // Trigger automatic reply to voice query
      handleSendMessage('Summarize the customer spending baseline and verify device trust.');
    }
  };

  const toggleExpand = (msgId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleApplyAction = (msgId: string, actionName: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, quickActionStatus: `Applied: ${actionName}` } : m
      )
    );
    alert(`Analyst Action Executed: [${actionName}] applied to core transaction ${txnId}.`);
  };

  return (
    <div className="flex flex-col h-[680px] bg-[#EFEAE2] rounded-xl overflow-hidden border border-gray-300 shadow-lg font-sans relative">
      {/* 1. WHATSAPP HEADER */}
      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Avatar with Status */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-700 border-2 border-white flex items-center justify-center text-white font-bold shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full" />
          </div>

          {/* Contact Details */}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-wide">SentraAI Copilot</h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-800 text-emerald-100 font-semibold">
                Groq AI
              </span>
            </div>
            <p className="text-[11px] text-emerald-100 flex items-center gap-1">
              {isLoading ? (
                <span className="text-amber-200 font-medium animate-pulse">typing...</span>
              ) : (
                <span>online &bull; Context: <strong className="font-mono text-white">{txnId}</strong></span>
              )}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3 text-emerald-100">
          <button
            onClick={() => alert("Initiating secure encrypted VoIP line to Compliance Office...")}
            className="p-1.5 hover:bg-emerald-800 rounded-full transition-colors cursor-pointer"
            title="Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert("Initiating SAR Video Briefing Session...")}
            className="p-1.5 hover:bg-emerald-800 rounded-full transition-colors cursor-pointer"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setMessages([]);
              handleSendMessage('Restart case investigation');
            }}
            className="p-1.5 hover:bg-emerald-800 rounded-full transition-colors cursor-pointer"
            title="Restart Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CHAT MESSAGES CANVAS */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3.5"
        style={{
          backgroundColor: '#EFEAE2',
          backgroundImage: `radial-gradient(#d1c7b7 0.75px, transparent 0.75px)`,
          backgroundSize: '16px 16px',
        }}
      >
        {/* Centered Encryption Pill */}
        <div className="flex justify-center">
          <div className="bg-[#FFEECD] text-[#54656F] text-[11px] px-3 py-1 rounded-lg border border-[#F0DFA8] shadow-2xs flex items-center gap-1.5 max-w-md text-center">
            <span>🔒 Messages are encrypted under Central Bank of Congo (BCC) &amp; ISO 27001 standards.</span>
          </div>
        </div>

        {/* Date Pill */}
        <div className="flex justify-center">
          <span className="bg-white/80 text-gray-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-md shadow-2xs">
            TODAY
          </span>
        </div>

        {/* Messages Loop */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const inv = msg.investigation;
          const isExpanded = !!expandedCards[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 shadow-xs relative text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#D9FDD3] text-gray-900 rounded-tr-none border border-[#C2EBC0]'
                    : 'bg-white text-gray-900 rounded-tl-none border border-gray-200'
                }`}
              >
                {/* Voice Note Player (if voice message) */}
                {msg.isVoiceNote ? (
                  <div className="flex items-center gap-3 py-1 pr-2">
                    <button
                      onClick={() =>
                        setIsPlayingAudio(isPlayingAudio === msg.id ? null : msg.id)
                      }
                      className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                    >
                      {isPlayingAudio === msg.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 space-y-1">
                      {/* Waveform graphic */}
                      <div className="flex items-center gap-1 h-4">
                        {[40, 70, 30, 90, 60, 80, 50, 95, 45, 65, 30, 75, 50].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              isPlayingAudio === msg.id ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'
                            }`}
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>Voice Note</span>
                        <span>{msg.voiceDuration || '0:06'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Text */
                  <div className="space-y-2">
                    {!isUser && msg.engineUsed && (
                      <div className="flex items-center justify-between pb-1 border-b border-gray-100 text-[10px] text-gray-400">
                        <span className="font-semibold text-emerald-700">⚡ {msg.engineUsed}</span>
                        <span className="font-mono">{txnId}</span>
                      </div>
                    )}

                    <p className="whitespace-pre-line text-gray-800 font-normal">{msg.text}</p>

                    {/* Structured Section 12 Investigation Cards (if available) */}
                    {inv && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 space-y-2">
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="bg-gray-50 p-2 rounded border border-gray-100">
                            <span className="text-gray-400 block text-[9px] uppercase font-bold">Severity</span>
                            <span className="font-bold text-red-600 font-mono">
                              {transaction.alert_evaluation.alert_severity} ({transaction.alert_evaluation.alert_score}/100)
                            </span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border border-gray-100">
                            <span className="text-gray-400 block text-[9px] uppercase font-bold">Amount / Median</span>
                            <span className="font-bold text-gray-800 font-mono">
                              {txn.amount_to_median_ratio}x (${txn.amount_usd_equiv.toLocaleString()} USD)
                            </span>
                          </div>
                        </div>

                        {/* Collapsible Deep Details */}
                        {isExpanded ? (
                          <div className="space-y-2 text-[11px] pt-1">
                            {/* Triggered Rules */}
                            {inv.triggered_rules && inv.triggered_rules.length > 0 && (
                              <div className="bg-red-50/60 p-2.5 rounded border border-red-100">
                                <span className="font-bold text-red-700 flex items-center gap-1 mb-1">
                                  <ShieldAlert className="w-3.5 h-3.5" /> Triggered Rules
                                </span>
                                <div className="space-y-1">
                                  {inv.triggered_rules.map((r, idx) => (
                                    <div key={idx} className="flex items-start gap-1.5">
                                      <span className="font-mono font-bold text-red-700">{r.rule_code}:</span>
                                      <span className="text-gray-700">{r.rule_name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Counter Evidence */}
                            {inv.counter_evidence && inv.counter_evidence.length > 0 && (
                              <div className="bg-emerald-50/60 p-2.5 rounded border border-emerald-100">
                                <span className="font-bold text-emerald-700 flex items-center gap-1 mb-1">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Mitigating Factors
                                </span>
                                <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                                  {inv.counter_evidence.map((c, idx) => (
                                    <li key={idx}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Recommended Action */}
                            {inv.recommended_analyst_action && (
                              <div className="bg-blue-50/70 p-2.5 rounded border border-blue-200">
                                <span className="font-bold text-blue-900 block mb-1">
                                  🎯 Recommended Action: {inv.recommended_analyst_action.action}
                                </span>
                                <p className="text-gray-700 mb-2">{inv.recommended_analyst_action.rationale}</p>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  <button
                                    onClick={() => handleApplyAction(msg.id, 'TEMPORARY DEBIT HOLD')}
                                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] cursor-pointer"
                                  >
                                    Freeze Txn
                                  </button>
                                  <button
                                    onClick={() => handleApplyAction(msg.id, 'STEP-UP AUTHENTICATION')}
                                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer"
                                  >
                                    Step-Up Auth
                                  </button>
                                  <button
                                    onClick={() => handleApplyAction(msg.id, 'SAR REGULATORY FILING')}
                                    className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] cursor-pointer"
                                  >
                                    Draft SAR
                                  </button>
                                  <button
                                    onClick={() => handleApplyAction(msg.id, 'MARK LEGITIMATE')}
                                    className="px-2.5 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-[10px] cursor-pointer"
                                  >
                                    Dismiss Alert
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Expand / Collapse Button */}
                        <button
                          onClick={() => toggleExpand(msg.id)}
                          className="w-full py-1 text-center text-[10px] font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <span>Show less forensic data</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>View complete forensic dossier &amp; rules</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>

                        {msg.quickActionStatus && (
                          <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            ✓ {msg.quickActionStatus}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bubble Footer: Timestamp & Checkmarks */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400">
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2.5 shadow-xs border border-gray-200 flex items-center gap-1.5 text-xs text-gray-500">
              <span className="font-semibold text-emerald-700 mr-1">SentraAI</span>
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. INTERACTIVE QUICK-REPLY CHIPS */}
      <div className="bg-[#F0F2F5] px-3 py-2 border-t border-gray-200 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
        <button
          onClick={() => handleSendMessage('Why was this alert triggered? Break down the primary risk rules.')}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-800 font-medium shrink-0 transition-all cursor-pointer shadow-2xs"
        >
          🔍 Why triggered?
        </button>
        <button
          onClick={() => handleSendMessage('Check customer 90-day baseline and median spending ratio.')}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-800 font-medium shrink-0 transition-all cursor-pointer shadow-2xs"
        >
          👤 Customer 360
        </button>
        <button
          onClick={() => handleSendMessage('Inspect device link graph: Is this hardware shared with other customer accounts?')}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-800 font-medium shrink-0 transition-all cursor-pointer shadow-2xs"
        >
          📱 Device &amp; Mule Check
        </button>
        <button
          onClick={() => handleSendMessage('Draft an official SAR (Suspicious Activity Report) narrative for BCC compliance.')}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-800 font-medium shrink-0 transition-all cursor-pointer shadow-2xs"
        >
          📝 Draft SAR Filing
        </button>
        <button
          onClick={() => handleSendMessage('What counter-evidence or mitigating factors support marking this as a false positive?')}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-800 font-medium shrink-0 transition-all cursor-pointer shadow-2xs"
        >
          ⚖️ Mitigating Factors
        </button>
      </div>

      {/* 4. ATTACHMENT MENU POPUP */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-4 bg-white rounded-xl shadow-xl border border-gray-200 p-2 text-xs space-y-1 z-20 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => {
              setShowAttachMenu(false);
              handleSendMessage(`Attached Account Statement for ${transaction.customer.customer_id}. Verify inflow consistency.`);
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg flex items-center gap-2 text-gray-700 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Attach Bank Statement</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              handleSendMessage(`Attached KYC National ID Document. Verify customer identity authenticity.`);
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg flex items-center gap-2 text-gray-700 cursor-pointer"
          >
            <User className="w-4 h-4 text-blue-600" />
            <span>Attach KYC Dossier</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              handleSendMessage(`Attached Device Telemetry Logs for ${txnId}.`);
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg flex items-center gap-2 text-gray-700 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Attach Device Logs</span>
          </button>
        </div>
      )}

      {/* 5. WHATSAPP COMPOSER / INPUT BAR */}
      <div className="bg-[#F0F2F5] px-3 py-2.5 flex items-center gap-2 border-t border-gray-200">
        {/* Emoji Button */}
        <button
          onClick={() => setInputText((prev) => prev + ' 🛡️ ')}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          title="Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Attachment Button */}
        <button
          onClick={() => setShowAttachMenu((prev) => !prev)}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            showAttachMenu ? 'bg-emerald-100 text-emerald-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
          title="Attach Document"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Recording or Text Input */}
        {isRecording ? (
          <div className="flex-1 flex items-center gap-2 bg-red-50 text-red-700 px-3.5 py-2 rounded-full border border-red-200 text-xs animate-pulse">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full" />
            <span className="font-semibold">Recording Voice Note... 0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}</span>
            <span className="text-gray-400 text-[10px] ml-auto">Click mic to send</span>
          </div>
        ) : (
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type a message or forensic query..."
            className="flex-1 bg-white text-gray-900 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-[#075E54] text-xs placeholder:text-gray-400 shadow-2xs"
          />
        )}

        {/* Send Button or Mic Button */}
        {inputText.trim().length > 0 ? (
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-[#00A884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        ) : (
          <button
            onClick={handleToggleVoiceRecord}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
              isRecording ? 'bg-red-600 text-white animate-bounce' : 'bg-[#00A884] hover:bg-[#008f6f] text-white'
            }`}
            title="Voice Note"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
