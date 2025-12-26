'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Loader2, ExternalLink, Calendar, ArrowLeft, CheckCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPropertyUrl } from '@/lib/property-url';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  properties?: PropertyResult[];
  actions?: Action[];
  timestamp: Date;
}

interface PropertyResult {
  id: string;
  listingNumber: string | null;
  title: string;
  slug: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  category: string;
  image: string;
  provinceSlug?: string | null;
  areaSlug?: string | null;
}

interface Action {
  type: string;
  label: string;
  data?: Record<string, unknown>;
}

interface ChatWindowProps {
  onClose: () => void;
}

interface ViewingFormData {
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  message: string;
  propertyId?: string;
  propertyTitle?: string;
  isRental?: boolean;
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! 🏡 I'm your PSM property concierge. How can I help you today?",
  actions: [
    { type: 'search', label: '🔍 Find Properties' },
    { type: 'schedule_viewing', label: '📅 Schedule Viewing' },
    { type: 'investment', label: '💰 Investment Info' },
    { type: 'contact', label: '📞 Contact Agent' },
  ],
  timestamp: new Date(),
};

export function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showViewingForm, setShowViewingForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  // Get current property slug if on a property page
  const currentPropertySlug = pathname?.startsWith('/properties/') 
    ? pathname.split('/properties/')[1] 
    : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (!showViewingForm) {
      inputRef.current?.focus();
    }
  }, [showViewingForm]);

  // Load conversation from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatbot_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 1) {
          setMessages(parsed.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })));
        }
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }
  }, []);

  // Save conversation to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('chatbot_messages', JSON.stringify(messages.slice(-20)));
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
          currentPropertySlug,
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        properties: data.properties,
        actions: data.actions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting. Please try again or contact us at +66 98 626 1646.",
        actions: [
          { type: 'whatsapp', label: '💬 WhatsApp' },
          { type: 'call', label: '📞 Call Us' },
        ],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, currentPropertySlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleActionClick = (action: Action, property?: PropertyResult) => {
    switch (action.type) {
      case 'search':
        sendMessage("I'm looking for properties");
        break;
      case 'schedule_viewing':
        // If property is provided, pre-select it
        if (property) {
          setSelectedProperty(property);
        } else if (action.data?.propertyId) {
          // Find property from recent messages
          const recentProps = messages.flatMap(m => m.properties || []);
          const prop = recentProps.find(p => p.id === action.data?.propertyId);
          if (prop) setSelectedProperty(prop);
        }
        setShowViewingForm(true);
        break;
      case 'investment':
        sendMessage("Tell me about investment opportunities");
        break;
      case 'contact':
        sendMessage("I'd like to speak with an agent");
        break;
      case 'whatsapp':
        window.open('https://wa.me/66986261646?text=Hello%2C%20I%20need%20help%20with%20properties', '_blank');
        break;
      case 'call':
        window.open('tel:+66986261646', '_blank');
        break;
      case 'email':
        window.open('mailto:info@psmphuket.com', '_blank');
        break;
      case 'make_offer':
        sendMessage(`I'd like to make an offer on property ${action.data?.propertyId || ''}`);
        break;
      default:
        sendMessage(action.label.replace(/[^\w\s]/g, ''));
    }
  };

  const handleViewingSubmit = async (formData: ViewingFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat/viewing-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowViewingForm(false);
        setSelectedProperty(null);
        
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Thank you, ${formData.name}! Your viewing request has been submitted.\n\nWe'll contact you at ${formData.email} within 24 hours to confirm the details.\n\nIs there anything else I can help you with?`,
          actions: [
            { type: 'search', label: '🔍 Find More Properties' },
            { type: 'contact', label: '📞 Contact Agent Now' },
          ],
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (error) {
      console.error('Viewing request error:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, there was an issue submitting your request. Please try again or contact us directly.",
        actions: [
          { type: 'whatsapp', label: '💬 WhatsApp Us' },
          { type: 'call', label: '📞 Call +66 98 626 1646' },
        ],
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setShowViewingForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem('chatbot_messages');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50
                 w-[calc(100vw-2rem)] sm:w-[400px] h-[500px] sm:h-[550px]
                 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl
                 flex flex-col overflow-hidden
                 border border-slate-200 dark:border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 
                      bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="flex items-center gap-3">
          {showViewingForm && (
            <button
              onClick={() => {
                setShowViewingForm(false);
                setSelectedProperty(null);
              }}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl">{showViewingForm ? '📅' : '🏡'}</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {showViewingForm ? 'Schedule Viewing' : 'PSM Property Concierge'}
            </h3>
            <p className="text-xs text-white/80">
              {showViewingForm ? 'Fill in your details below' : 'Online • Usually replies instantly'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!showViewingForm && (
            <button
              onClick={clearChat}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-xs"
              title="Clear chat"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {showViewingForm ? (
          <ViewingRequestForm
            key="form"
            property={selectedProperty}
            onSubmit={handleViewingSubmit}
            onCancel={() => {
              setShowViewingForm(false);
              setSelectedProperty(null);
            }}
            isLoading={isLoading}
          />
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* Property Cards */}
                    {message.properties && message.properties.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.properties.map((property) => (
                          <PropertyCard 
                            key={property.id} 
                            property={property}
                            onScheduleViewing={() => {
                              setSelectedProperty(property);
                              setShowViewingForm(true);
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action)}
                            className="px-3 py-1.5 text-xs font-medium
                                       bg-slate-100 dark:bg-slate-600 
                                       hover:bg-slate-200 dark:hover:bg-slate-500
                                       text-slate-700 dark:text-white
                                       rounded-full transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-slate-500">Typing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-sm
                             bg-slate-100 dark:bg-slate-800 
                             border-0 rounded-full
                             focus:outline-none focus:ring-2 focus:ring-primary/50
                             placeholder:text-slate-400
                             disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-primary text-white rounded-full
                             hover:bg-primary/90 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Powered by AI • <a href="tel:+66986261646" className="underline">Call us</a> for immediate help
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Viewing Request Form Component
function ViewingRequestForm({
  property,
  onSubmit,
  onCancel,
  isLoading,
}: {
  property: PropertyResult | null;
  onSubmit: (data: ViewingFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<ViewingFormData>({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    message: '',
    propertyId: property?.id,
    propertyTitle: property?.title,
    isRental: property?.type === 'FOR_RENT',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800/50"
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Selected Property */}
        {property && (
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 flex gap-3">
            <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-slate-200">
              {property.image ? (
                <Image
                  src={property.image}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {property.listingNumber}
              </p>
              <h4 className="text-xs font-medium text-slate-800 dark:text-white truncate">
                {property.title}
              </h4>
              <p className="text-xs text-primary font-semibold">{property.price}</p>
            </div>
          </div>
        )}

        {!property && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            📍 Fill in your details and we&apos;ll help you find the perfect property to view!
          </p>
        )}

        {/* Form Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john@example.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+66 XX XXX XXXX"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Preferred Date *
            </label>
            <input
              type="date"
              required
              min={minDateStr}
              value={formData.preferredDate}
              onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Additional Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Any specific requirements or questions..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium
                       bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white
                       rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500
                       transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium
                       bg-primary text-white rounded-lg
                       hover:bg-primary/90 transition-colors
                       disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Request Viewing
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          We&apos;ll contact you within 24 hours to confirm your viewing.
        </p>
      </form>
    </motion.div>
  );
}

// Inline Property Card Component
function PropertyCard({ 
  property,
  onScheduleViewing,
}: { 
  property: PropertyResult;
  onScheduleViewing?: () => void;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-600 rounded-lg overflow-hidden">
      <Link
        href={getPropertyUrl(property)}
        target="_blank"
        className="block hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
      >
        <div className="flex gap-3 p-2">
          <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-slate-200">
            {property.image ? (
              <Image
                src={property.image}
                alt={property.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-300">
              <span className="font-mono">{property.listingNumber || 'N/A'}</span>
              <span>•</span>
              <span>{property.type === 'FOR_SALE' ? 'Sale' : 'Rent'}</span>
            </div>
            <h4 className="text-xs font-medium text-slate-800 dark:text-white truncate">
              {property.title}
            </h4>
            <p className="text-xs text-primary font-semibold">{property.price}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-300">
              {property.beds} bed • {property.baths} bath • {property.sqft}m²
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0 self-center" />
        </div>
      </Link>
      {onScheduleViewing && (
        <div className="px-2 pb-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onScheduleViewing();
            }}
            className="w-full px-3 py-1.5 text-xs font-medium
                       bg-primary/10 text-primary hover:bg-primary/20
                       rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <Calendar className="w-3 h-3" />
            Schedule Viewing
          </button>
        </div>
      )}
    </div>
  );
}
