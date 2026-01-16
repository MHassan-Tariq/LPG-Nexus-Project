"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Maximize2, Minimize2, Trash2, Users, TrendingUp, Package, FileText, AlertTriangle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: any;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  query: string;
}

const quickActions: QuickAction[] = [
  { id: "customers", label: "Total Customers", icon: <Users className="h-4 w-4" />, query: "How many total customers do we have?" },
  { id: "sales", label: "Today's Sales", icon: <TrendingUp className="h-4 w-4" />, query: "What are today's total sales?" },
  { id: "inventory", label: "Inventory Status", icon: <Package className="h-4 w-4" />, query: "Show me the current inventory status" },
  { id: "payments", label: "Pending Payments", icon: <FileText className="h-4 w-4" />, query: "Show all pending payments" },
  { id: "lowstock", label: "Low Stock Alerts", icon: <AlertTriangle className="h-4 w-4" />, query: "Which items are low in stock?" },
  { id: "deliveries", label: "Today Deliveries", icon: <Truck className="h-4 w-4" />, query: "Show today's deliveries" },
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
      {
        id: "1",
        role: "assistant",
        content: "👋 Hello! I'm your LPG Nexus Assistant. I can help you with:\n\n• Total customers count\n• Inventory status\n• Today's sales\n• Pending payments\n• Low stock alerts\n• Today's deliveries\n• Customer details\n\nWhat would you like to know?",
        timestamp: new Date(),
      },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      let messageContent: string;
      // Check for error in response (even if status is 200)
      if (data.error || !data.response) {
        messageContent = data.error 
          ? `❌ ${data.error}${data.details ? `\n\n${data.details}` : ""}`
          : "I apologize, but I encountered an error. Please try again.";
      } else {
        messageContent = data.response || "I apologize, but I couldn't process your request. Please try again.";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: messageContent,
        timestamp: new Date(),
        data: data.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    sendMessage(query);
  };

  const handleClear = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "👋 Hello! I'm your LPG Nexus Assistant. I can help you with:\n\n• Total customers count\n• Inventory status\n• Today's sales\n• Pending payments\n• Low stock alerts\n• Today's deliveries\n• Customer details\n\nWhat would you like to know?",
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col ${
        isMinimized ? "h-16 w-96" : "h-[600px] w-96"
      } rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Assistant</h3>
              <p className="text-xs text-white/90">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Quick Actions */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-600 mb-2">Quick Actions:</p>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.query)}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-purple-300 transition-colors text-xs text-slate-700 disabled:opacity-50"
                >
                  {action.icon}
                  <span className="text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className={`flex flex-col max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <Card className={`p-3 ${
                    message.role === "user"
                      ? "bg-purple-600 text-white border-0"
                      : "bg-slate-100 text-slate-900 border-0"
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content.split(/\*\*(.*?)\*\*/g).map((part, i) => 
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                    </div>
                    {message.data && (
                      <div className="mt-2 pt-2 border-t border-slate-300">
                        {typeof message.data === "object" ? (
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(message.data, null, 2)}
                          </pre>
                        ) : (
                          <div className="text-xs">{message.data}</div>
                        )}
                      </div>
                    )}
                  </Card>
                  <span className="text-xs text-slate-500 mt-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600">
                    <span className="text-xs font-semibold text-white">
                      {message.content.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <Card className="p-3 bg-slate-100">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 bg-white p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 rounded-xl"
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">Powered by LPG Nexus</p>
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

