'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { ChatWindow } from './ChatWindow';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Show notification dot after 3 seconds if chat hasn't been opened
    const timer = setTimeout(() => {
      const hasOpened = localStorage.getItem('chatbot_opened');
      if (!hasOpened) {
        setHasNewMessage(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
    localStorage.setItem('chatbot_opened', 'true');
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <ChatWindow onClose={handleClose} />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 
                       bg-gradient-to-r from-primary to-blue-600 
                       text-white rounded-full shadow-lg 
                       hover:shadow-xl transition-shadow
                       group"
            aria-label="Open chat"
          >
            {/* Notification dot */}
            {hasNewMessage && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              />
            )}
            
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              Chat with us
            </span>
            
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-75" />
          </motion.button>
        )}
      </AnimatePresence>

    </>
  );
}

