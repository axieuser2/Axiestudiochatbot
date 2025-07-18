import React, { useState, useRef, useEffect } from 'react';
import { Send, Calendar, X, MessageCircle, Loader2, Palette } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatResponse {
  message?: string;
  showBookingPopup?: boolean;
  [key: string]: any;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const WEBHOOK_URL = 'https://stefan0987.app.n8n.cloud/webhook/156b9b80-a524-4116-9b0a-f93aa729a5ea';
  const BOOKING_IFRAME_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h';

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      text: 'Hej! Hur kan jag hjälpa dig idag?',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);
    setConnectionStatus('connecting');

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          timestamp: new Date().toISOString(),
          sessionId: `session_${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      setConnectionStatus('connected');

      // Check for booking popup trigger
      if (data.showBookingPopup) {
        setShowBookingModal(true);
        // Don't add a message for the booking popup
        setIsTyping(false);
        setIsLoading(false);
        return;
      }

      // Simulate typing delay for better UX
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message || 'I received your message.',
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('disconnected');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Ursäkta, jag har problem med anslutningen just nu. Försök igen.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const openBookingPopup = () => {
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Axie Studio Assistent</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600 capitalize">
                  {connectionStatus === 'connected' ? 'ansluten' : 
                   connectionStatus === 'connecting' ? 'ansluter' : 'frånkopplad'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={openBookingPopup}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Calendar className="w-4 h-4" />
            <span>Boka Möte</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border border-gray-200 px-4 py-2 rounded-lg flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Skriver...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Skriv ditt meddelande..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Skicka</span>
          </button>
        </form>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Palette className="w-3 h-3 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Boka Möte - Axie Studio</h2>
              </div>
              <button
                onClick={closeBookingModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-0">
              <iframe
                src={BOOKING_IFRAME_URL}
                width="100%"
                height="600"
                frameBorder="0"
                scrolling="yes"
                className="w-full"
                title="Boka Möte - Axie Studio"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;