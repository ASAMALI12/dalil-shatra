import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  X, 
  Bot, 
  User, 
  Zap, 
  BrainCircuit, 
  Lightbulb, 
  Copy, 
  Check,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { ChatMessage, ChatModel, ChatRoleConfig } from '../types';

interface StoryAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  theme: string;
  onApplyThemeSuggestion?: (newTheme: string) => void;
}

const ROLES: ChatRoleConfig[] = [
  {
    id: 'co-creator',
    name: 'Coloring Story Co-Creator',
    description: 'Generates fun page scenarios, storyline arcs, and cohesive 5-page themes.',
    icon: '🎨',
    systemInstruction: 'You are an enthusiastic children’s coloring book co-creator. You suggest creative 5-page story arcs, fun characters, and exciting adventures tailored for kids. Always describe black-and-white thick line art scenes with high contrast.',
  },
  {
    id: 'rhyme-writer',
    name: 'Rhyme & Storyteller',
    description: 'Writes joyful rhyming captions and playful story narration for each page.',
    icon: '📖',
    systemInstruction: 'You are a warm, witty children’s book poet. You craft simple, memorable, 1-2 sentence rhyming captions for coloring pages that celebrate the child as the main hero.',
  },
  {
    id: 'line-art-stylist',
    name: 'Line Art & Age Stylist',
    description: 'Recommends line thicknesses, simple shapes for toddlers, and engaging details.',
    icon: '🖍️',
    systemInstruction: 'You are an expert art educator specializing in early childhood coloring ergonomics. You provide suggestions on line thickness, open coloring spaces, and age-appropriate scene elements.',
  },
];

export const StoryAssistantDrawer: React.FC<StoryAssistantDrawerProps> = ({
  isOpen,
  onClose,
  childName,
  theme,
  onApplyThemeSuggestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hi there! I'm your Coloring Studio AI Assistant. I can help you and **${childName || 'your child'}** brainstorm incredible 5-page coloring book themes, create rhyming page captions, or design special friendly characters for "${theme || 'your adventure'}". What kind of world should we imagine today?`,
      timestamp: Date.now(),
      suggestions: [
        `Give me 3 magical twist ideas for "${theme || 'Space Dinosaurs'}"`,
        `Write a 5-page story outline for ${childName || 'my child'}`,
        'Suggest funny captions for a Toddler coloring book',
        'How can we make line art easier for small hands?',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ChatModel>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<ChatRoleConfig>(ROLES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          model: selectedModel,
          systemInstruction: selectedRole.systemInstruction,
          childName: childName || 'Explorer',
          theme: theme || 'Adventure',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `Oops! I couldn't reach the coloring workshop right now (${err.message}). Please try again in a moment.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-100 bg-amber-500/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-lg text-white shadow-xs">
            <span>{selectedRole.icon}</span>
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-800">
              Coloring Co-Creator AI
            </h3>
            <p className="text-xs text-slate-500">
              Role: <span className="font-semibold text-amber-700">{selectedRole.name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Adjust Model & Persona"
            className={`rounded-xl p-2 transition-colors ${
              showConfig ? 'bg-amber-200 text-amber-900' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Sliders className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Model & Persona Configuration Drawer */}
      {showConfig && (
        <div className="border-b border-slate-200 bg-slate-50 p-4 text-xs">
          {/* Model Selector */}
          <div className="mb-3">
            <label className="mb-1.5 flex items-center justify-between font-display font-bold uppercase tracking-wider text-slate-500">
              <span>Gemini Model</span>
              <span className="font-sans text-[10px] font-normal text-slate-400">Task Specific</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`flex flex-col items-center rounded-xl p-2 text-center transition-all ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'border border-amber-500 bg-amber-50 font-bold text-amber-900 shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Zap className="mb-1 h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px]">Flash-Lite</span>
                <span className="text-[9px] text-slate-400">Fast Tasks</span>
              </button>

              <button
                onClick={() => setSelectedModel('gemini-3.5-flash')}
                className={`flex flex-col items-center rounded-xl p-2 text-center transition-all ${
                  selectedModel === 'gemini-3.5-flash'
                    ? 'border border-amber-500 bg-amber-50 font-bold text-amber-900 shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="mb-1 h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[11px]">3.5-Flash</span>
                <span className="text-[9px] text-slate-400">General</span>
              </button>

              <button
                onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
                className={`flex flex-col items-center rounded-xl p-2 text-center transition-all ${
                  selectedModel === 'gemini-3.1-pro-preview'
                    ? 'border border-amber-500 bg-amber-50 font-bold text-amber-900 shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BrainCircuit className="mb-1 h-3.5 w-3.5 text-purple-600" />
                <span className="text-[11px]">3.1-Pro</span>
                <span className="text-[9px] text-slate-400">Complex</span>
              </button>
            </div>
          </div>

          {/* Persona Role Selection */}
          <div>
            <label className="mb-1.5 block font-display font-bold uppercase tracking-wider text-slate-500">
              Assistant Role & System Instruction
            </label>
            <div className="space-y-1.5">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r)}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-2 text-left transition-all ${
                    selectedRole.id === r.id
                      ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-400'
                      : 'border-slate-200 bg-white hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{r.icon}</span>
                  <div>
                    <div className="font-bold text-slate-800">{r.name}</div>
                    <div className="text-[11px] text-slate-500">{r.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Scrollable Thread */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="mb-1 flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
              {msg.role === 'user' ? (
                <>
                  <span>You</span>
                  <User className="h-3 w-3" />
                </>
              ) : (
                <>
                  <Bot className="h-3 w-3 text-amber-600" />
                  <span className="font-medium text-slate-600">{selectedRole.name}</span>
                </>
              )}
            </div>

            <div
              className={`group relative max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-amber-600 text-white rounded-br-xs'
                  : 'border border-slate-100 bg-slate-50 text-slate-800 rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {msg.role === 'model' && (
                <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-400">
                  <span className="font-mono text-[9px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => copyToClipboard(msg.text, msg.id)}
                    className="flex items-center gap-1 hover:text-slate-600"
                    title="Copy text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips on initial prompt */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 pl-1">
                {msg.suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s)}
                    className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/70 px-3 py-1 text-[11px] font-medium text-amber-900 transition-all hover:bg-amber-100 active:scale-95"
                  >
                    <Lightbulb className="h-3 w-3 text-amber-600" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
            <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
            <span>Thinking with {selectedModel}...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask for ideas, captions, or scenes for ${childName || 'the book'}...`}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs transition-all hover:bg-amber-700 active:scale-95 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
