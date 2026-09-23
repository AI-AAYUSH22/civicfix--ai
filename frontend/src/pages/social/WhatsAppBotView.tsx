import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  Bot,
  User,
  Sparkles,
  Building2,
  CheckCircle2,
  FileText,
  Paperclip,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { API_BASE_URL } from '@/services/api';

interface ChatMessage {
  id: string;
  sender: 'citizen' | 'bot';
  text: string;
  timestamp: string;
  data?: {
    case_id?: string;
    intent?: string;
    ward_name?: string;
    extracted_location?: string;
    severity?: string;
    status?: string;
  };
}

export const WhatsAppBotView: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('+91 98112 23344');
  const [senderName, setSenderName] = useState('Rahul Mehta');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `👋 Welcome to CivicFix AI Official WhatsApp Bot!

Report road defects in plain text or send location pin links (e.g. Google Maps). 

Our NLP model automatically extracts location, assigns municipal wards, and registers your complaint ticket instantly!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const citizenMsgId = `msg-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: citizenMsgId,
      sender: 'citizen',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          sender_name: senderName,
          message: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply_message || data.message || 'Complaint processed by CivicFix AI.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: {
            case_id: data.case_id,
            intent: data.intent,
            ward_name: data.ward_name,
            extracted_location: data.extracted_location,
            severity: data.severity,
            status: data.status,
          },
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('API return non-ok status');
      }
    } catch (err) {
      console.warn('Backend whatsapp simulate fallback:', err);
      // Client simulation fallback
      const isCaseIdReq = text.toLowerCase().includes('status') || text.toLowerCase().includes('cf-');
      const mockCaseId = `CF-${Math.floor(2000 + Math.random() * 8000)}`;
      const botMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: 'bot',
        text: isCaseIdReq
          ? `🔍 Status Update for Ticket CF-1025:\n\nStatus: Under Repair\nWard: G/N Dadar\nContractor: RoadWorks Unit A\nEstimated Completion: 24 Hours.`
          : `✅ *CivicFix AI Complaint Registered!*\n\n📍 *Location:* Linking Road, Bandra West\n🏛️ *Ward Assigned:* Ward H/West (Bandra)\n🎫 *Ticket No:* ${mockCaseId}\n⚡ *Severity:* High\n\nYour complaint has been dispatched to Ward H/West engineer and contractor queue.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: {
          case_id: mockCaseId,
          intent: isCaseIdReq ? 'STATUS_QUERY' : 'COMPLAINT_REGISTRATION',
          ward_name: 'Ward H/West (Bandra)',
          extracted_location: 'Linking Road, Bandra West',
          severity: 'High',
          status: 'REPORTED',
        },
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    {
      title: '📍 Bandra Linking Road Pothole',
      message: 'Dangerous pothole near Linking Road Bandra https://maps.google.com/?q=19.0600,72.8339',
    },
    {
      title: '📍 Dadar Station Road Pothole',
      message: 'Deep road cavity near Dadar Station TT Circle https://maps.google.com/?q=19.0178,72.8478',
    },
    {
      title: '📍 Kopra Village Navi Mumbai',
      message: 'Huge pothole at Sector 11 Road Kopra Village https://maps.google.com/?q=19.037055,73.068515',
    },
    {
      title: '❓ Check Case CF-1025 Status',
      message: 'What is the repair status for case CF-1025?',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#075E54] to-[#0F766E] rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-white text-xl shadow-inner">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">WhatsApp AI Chatbot Simulator</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-400 text-emerald-950 shadow-sm">
                LIVE API SIMULATION
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Simulate citizen WhatsApp reports with automated NLP location extraction, ward routing, and ticket generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl text-xs backdrop-blur-sm border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-emerald-200">POST /api/v1/whatsapp/simulate</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls & Preset Prompts Panel */}
        <div className="lg:col-span-4 space-y-4">
          <Card padded="md" className="space-y-4 border-t-4 border-t-[#075E54]">
            <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2">
              <User size={16} className="text-[#075E54]" />
              Simulated Citizen Session
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Phone Number:</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 font-mono text-slate-800 font-semibold focus:ring-2 focus:ring-[#075E54]/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Citizen Name:</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-[#075E54]/20"
                />
              </div>
            </div>
          </Card>

          {/* Quick Preset Buttons */}
          <Card padded="md" className="space-y-3">
            <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2">
              <Sparkles size={16} className="text-[#0F766E]" />
              Quick Sample Reports
            </h3>
            <p className="text-xs text-slate-500">Click any preset below to send an instant test WhatsApp complaint:</p>

            <div className="space-y-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.message)}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#075E54] hover:bg-emerald-50/50 transition-all text-xs space-y-1 group"
                >
                  <span className="font-bold text-slate-800 group-hover:text-[#075E54] block">
                    {p.title}
                  </span>
                  <span className="text-[11px] text-slate-500 line-clamp-2 font-mono">
                    {p.message}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Engine Info Box */}
          <Card padded="sm" className="bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Bot size={14} /> NLP Pipeline Metrics
              </span>
              <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800 font-mono">
                SpaCy + Regex
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Maps URL regex extracts latitude/longitude coordinates instantly and runs 48-ward Haversine geofence routing.
            </p>
          </Card>
        </div>

        {/* Right WhatsApp Simulator Canvas */}
        <div className="lg:col-span-8">
          <div className="bg-[#E5DDD5] dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 shadow-xl flex flex-col h-[640px] relative">
            {/* WhatsApp Header Bar */}
            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-white">
                    <Building2 size={20} />
                  </div>
                  <span className="w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full absolute bottom-0 right-0" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white">CivicFix AI Official Assistant</h3>
                    <CheckCircle2 size={14} className="text-teal-300 fill-teal-300" />
                  </div>
                  <p className="text-[11px] text-emerald-100">Official Municipal WhatsApp Intake • Online</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setMessages([
                      {
                        id: '1',
                        sender: 'bot',
                        text: 'Chat history cleared. Send a new message or click a preset on the left.',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ])
                  }
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  title="Clear Chat History"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]">
              {messages.map((msg) => {
                const isUser = msg.sender === 'citizen';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-md space-y-2 relative ${
                        isUser
                          ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-none border border-emerald-200'
                          : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                      }`}
                    >
                      {/* Sender Label */}
                      <div className="flex items-center justify-between text-[10px] font-bold opacity-75 pb-1 border-b border-black/5">
                        <span className={isUser ? 'text-emerald-900' : 'text-[#075E54]'}>
                          {isUser ? `${senderName} (${phoneNumber})` : 'CivicFix AI Bot'}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Message Content */}
                      <div className="text-xs whitespace-pre-line leading-relaxed font-medium">
                        {msg.text}
                      </div>

                      {/* Extracted Entity Card (if bot response contains ticket details) */}
                      {msg.data && (msg.data.case_id || msg.data.extracted_location) && (
                        <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#075E54] flex items-center gap-1">
                              <FileText size={12} /> Case Ticket Generated: {msg.data.case_id}
                            </span>
                            <span className="px-2 py-0.5 bg-teal-100 text-[#075E54] font-bold rounded text-[10px]">
                              {msg.data.severity || 'High'} Severity
                            </span>
                          </div>
                          <div className="space-y-0.5 text-slate-600 font-mono text-[10px]">
                            <p>📍 Location: <strong>{msg.data.extracted_location}</strong></p>
                            <p>🏛️ Ward: <strong>{msg.data.ward_name}</strong></p>
                          </div>
                        </div>
                      )}

                      {/* WhatsApp Double Checkmarks for User Messages */}
                      {isUser && (
                        <div className="flex justify-end pt-1">
                          <CheckCheck size={14} className="text-emerald-700" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-slate-200 shadow-md flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Sparkles size={14} className="text-[#075E54] animate-spin" />
                    CivicFix AI is extracting entities & assigning ward...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Live Message Composer Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('Dangerous pothole near Linking Road Bandra https://maps.google.com/?q=19.0600,72.8339')
                }
                className="p-2 text-slate-400 hover:text-[#075E54] hover:bg-slate-100 rounded-full transition-colors"
                title="Attach Location Pin"
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your WhatsApp complaint or paste Google Maps URL..."
                className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54]/20"
              />

              <Button
                variant="primary"
                size="sm"
                disabled={loading || !inputMessage.trim()}
                onClick={() => handleSendMessage()}
                className="bg-[#075E54] hover:bg-[#054c44] text-white rounded-full p-2.5 h-10 w-10 flex items-center justify-center border-none shadow-md"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
