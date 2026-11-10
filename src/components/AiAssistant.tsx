import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Minimize2,
  Maximize2,
  RefreshCw,
  HelpCircle,
  FileText,
  ShieldAlert,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Building2,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { User } from '../types';
import { getRoleDefinition } from '../rbac/rbacPolicy';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiAssistantProps {
  currentUser: User;
  onPreFillDraft?: (draft: {
    actionType?: string;
    issueDescription?: string;
    policyReference?: string;
    correctiveAction?: string;
  }) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  'What sanction is proportionate for repeated unexcused absence?',
  'What are the mandatory steps before issuing a Final Written Warning?',
  'How do I structure an objective 60-day Performance Improvement Plan (PIP)?',
  'What essential evidence is required before filing a Demotion order?',
  'Explain the fair hearing rights of bank staff under HR policy.',
  'How do I document serious cash shortage or dual-control breaches?',
];

export const AiAssistant: React.FC<AiAssistantProps> = ({
  currentUser,
  onPreFillDraft,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const roleDef = getRoleDefinition(currentUser.Role);
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Greetings, **${currentUser.FullName}**! I am your **CoopBank AI Disciplinary & HR Regulations Assistant**.\n\nI can help you review policy guidelines, assess sanction proportionality across the bank's 13 districts, format incident findings, draft corrective actions, and prepare compliance documentation.\n\nYou can also speak with me using the **Voice Microphone** button below, or listen to responses with **Text-to-Speech**.\n\nHow can I assist you with disciplinary or performance matters today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      // Stop speech if modal closes
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeakingId(null);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsListening(false);
      }
    }
  }, [isOpen, messages]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  if (!isOpen) return null;

  // Speech Recognition (Voice Input)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Voice speech recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition failed to start:', err);
      setIsListening(false);
      setErrorMessage('Could not initialize microphone access. Check browser permissions.');
    }
  };

  // Text-to-Speech (Voice Output)
  const toggleSpeech = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setErrorMessage('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner speech reading
    const cleanText = text
      .replace(/[*#_`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isLoading) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const roleDef = getRoleDefinition(currentUser.Role);
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userContext: {
            userName: currentUser.FullName,
            roleName: roleDef.name,
            districtName: currentUser.DistrictID || 'Bank-Wide Oversight',
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get a response from the AI assistant.');
      }

      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response returned from the model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      setErrorMessage(
        err?.message ||
          'Failed to reach the AI assistant. If your API key was recently added, verify it in Settings > Secrets.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
    }
    const roleDef = getRoleDefinition(currentUser.Role);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Conversation restarted. Ready to assist **${currentUser.FullName}** (${roleDef.name}). Ask me about sanction guidelines, documentation rules, or specific scenarios.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 shadow-2xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
        isExpanded
          ? 'inset-4 md:inset-10 rounded-2xl'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[460px] h-[630px] max-h-[88vh] rounded-2xl'
      }`}
    >
      {/* Header */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-t-2xl flex items-center justify-between border-b border-blue-800/60 shadow-xs shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/40 border border-blue-400/40 flex items-center justify-center text-blue-200 shadow-inner">
            <Bot className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 leading-tight">
              <span>CoopBank AI Assistant</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-800/80 text-blue-300 border border-blue-600 font-mono">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-[11px] text-blue-300/90 leading-tight mt-0.5">
              HR Disciplinary Regulations & Policy Advisor
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800/50 rounded-lg transition"
            title="Restart conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800/50 rounded-lg transition hidden sm:inline-flex"
            title={isExpanded ? 'Collapse' : 'Expand window'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800/50 rounded-lg transition"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      {messages.length <= 2 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Recommended inquiries:</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const isSpeaking = isSpeakingId === m.id;

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn group`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                <span>{isUser ? currentUser.FullName : 'CoopBank Advisor'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700/70 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans space-y-2">
                  {m.content}
                </div>

                {/* Assistant message action bar */}
                {!isUser && (
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      {/* Read aloud button */}
                      <button
                        onClick={() => toggleSpeech(m.id, m.content)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition ${
                          isSpeaking
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                        }`}
                        title={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3 h-3 text-amber-500 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Read</span>
                          </>
                        )}
                      </button>

                      {/* Copy message button */}
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition"
                        title="Copy text to clipboard"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Pre-fill into report draft button if callback exists */}
                    {onPreFillDraft && (
                      <button
                        onClick={() => {
                          onPreFillDraft({
                            issueDescription: m.content.slice(0, 1500),
                            policyReference: 'Bank HR Regulations & Disciplinary Guidelines',
                          });
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition"
                        title="Apply guidance to a new Report Draft"
                      >
                        <span>Apply to Draft</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5 animate-fadeIn">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl rounded-bl-xs text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 shadow-sm">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Analyzing bank regulations and case precedent with Gemini...</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl shrink-0">
        {/* Voice recording status indicator banner */}
        {isListening && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-[11px] flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>Listening to your voice... Speak now</span>
            </div>
            <button
              onClick={toggleListening}
              className="text-[10px] font-bold underline hover:text-red-900 dark:hover:text-red-100"
            >
              Done
            </button>
          </div>
        )}

        <div className="relative flex items-end bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-inner transition">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Ask about bank disciplinary sanction ladders, PIPs, hearing rules, or click Mic to speak... (Enter to send)"
            className="w-full bg-transparent resize-none border-none outline-none text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 p-1.5 max-h-24 scrollbar-thin"
          />

          <div className="flex items-center space-x-1 shrink-0 ml-1">
            {/* Microphone Voice button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition ${
                isListening
                  ? 'bg-red-600 text-white shadow-md animate-pulse'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isListening ? 'Stop listening' : 'Speak using microphone'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:hover:bg-blue-600 transition shadow-sm"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 px-1">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-purple-500" />
            <span>CoopBank HR Grounded • Voice & Text</span>
          </span>
          <span>Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  );
};
