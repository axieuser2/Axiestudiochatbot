import React, { useState, useRef, useEffect } from 'react';
import { Send, Calendar, X, MessageCircle, Loader2, Palette } from 'lucide-react';
import { sendChatMessage } from '../api/chat';

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
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

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
      const data: ChatResponse = await sendChatMessage(messageText, sessionId.current);
      setConnectionStatus('connected');

      // Check for booking popup trigger
      if (data.showBookingPopup || (data.output && data.output.showBookingPopup)) {
        // Show a nice message before opening the popup
        const bookingMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Jag öppnar bokningsmodulen för dig! / I\'m opening the booking modal for you!',
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, bookingMessage]);
        setIsTyping(false);
        setIsLoading(false);
        
        // Open the booking modal after a short delay
        setTimeout(() => {
          setShowBookingModal(true);
        }, 500);
        return;
      }

      // Simulate typing delay for better UX
      setTimeout(() => {
        // Parse the response properly - don't show raw JSON
        let responseText = '';
        
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.showBookingPopup) {
              // This should have been caught above, but just in case
              setShowBookingModal(true);
              return;
            }
            responseText = parsed.message || parsed.response || parsed.output || 'Jag fick ditt meddelande.';
          } catch {
            responseText = data;
          }
        } else {
          responseText = data.message || data.response || data.output || 'Jag fick ditt meddelande.';
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
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
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-black shadow-lg border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <img 
                src="/c09c673465270e53fed0666cae1a9b69.ico/favicon-32x32.png" 
                alt="Axie Studio" 
                className="w-6 h-6"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Palette className="w-6 h-6 text-black hidden" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Axie Studio</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <span className="text-sm text-gray-300 capitalize">
                  {connectionStatus === 'connected' ? 'ansluten' : 
                   connectionStatus === 'connecting' ? 'ansluter' : 'frånkopplad'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={openBookingPopup}
            className="flex items-center space-x-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            <Calendar className="w-4 h-4" />
            <span>Boka Möte</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-end space-x-3 max-w-xs lg:max-w-md">
              {message.sender === 'bot' && (
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/c09c673465270e53fed0666cae1a9b69.ico/favicon-16x16.png" 
                    alt="Bot" 
                    className="w-4 h-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <MessageCircle className="w-4 h-4 text-white hidden" />
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl shadow-md ${
                  message.sender === 'user'
                    ? 'bg-black text-white rounded-br-md'
                    : 'bg-white text-black border border-gray-200 rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <img 
                  src="/c09c673465270e53fed0666cae1a9b69.ico/favicon-16x16.png" 
                  alt="Bot" 
                  className="w-4 h-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <MessageCircle className="w-4 h-4 text-white hidden" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md flex items-center space-x-2 shadow-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-600">Skriver...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Skriv ditt meddelande..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-0 disabled:opacity-50 transition-all duration-300 text-black placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-black">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <img 
                    src="/c09c673465270e53fed0666cae1a9b69.ico/favicon-16x16.png" 
                    alt="Axie Studio" 
                    className="w-4 h-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <Calendar className="w-4 h-4 text-black hidden" />
                </div>
                <h2 className="text-xl font-bold text-white">Boka Möte - Axie Studio</h2>
              </div>
              <button
                onClick={closeBookingModal}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors duration-300 text-white"
              >
                <X className="w-6 h-6" />
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