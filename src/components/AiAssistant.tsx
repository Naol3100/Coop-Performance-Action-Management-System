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
        content: `Greetings, **${currentUser.FullName}**! I am your **CoopBank AI Disciplinary & HR Regulations Assistant**.\n\nI can help you review policy guidelines, assess sanction proportionality across the bank's 13 districts, format incident findings, draft corrective actions, and prepare compliance documentation.\n\nHow can I assist you with disciplinary or performance matters today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isLoading) return;

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
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[92vw] sm:w-[440px] h-[600px] max-h-[88vh] rounded-2xl'
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
              <span>CoopBank AI Disciplinary Advisor</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-800/80 text-blue-300 border border-blue-600 font-mono">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-[11px] text-blue-300/90 leading-tight mt-0.5">
              HR Regulations & Case Sanction Guidance
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
            {SUGGESTED_QUESTIONS.slice(0, 3).map((q, idx) => (
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn`}
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
              <span>Analyzing bank regulations and case precedent...</span>
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
        <div className="relative flex items-end bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-inner transition">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Ask about bank disciplinary sanction ladders, fair hearing rules, or evidence templates... (Enter to send)"
            className="w-full bg-transparent resize-none border-none outline-none text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 p-1.5 max-h-24 scrollbar-thin"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:hover:bg-blue-600 transition shrink-0 ml-1 shadow-sm"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 px-1">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-purple-500" />
            <span>CoopBank Policy Grounded</span>
          </span>
          <span>Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  );
};
