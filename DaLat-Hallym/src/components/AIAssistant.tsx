import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithAI, ChatMessage } from '../services/aiService';
import { useLanguage } from '../contexts/LanguageContext';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: language === 'vi' 
        ? '🌿 Xin chào! Tôi là EcoBot - trợ lý AI về phân loại rác và bảo vệ môi trường. Tôi có thể giúp bạn:\n\n• Hướng dẫn phân loại rác đúng cách\n• Tìm điểm thu gom gần bạn\n• Chia sẻ mẹo bảo vệ môi trường\n\nBạn cần hỗ trợ gì?'
        : language === 'ko'
        ? '🌿 안녕하세요! 저는 EcoBot - 분리수거와 환경 보호를 위한 AI 도우미입니다.\n\n• 올바른 분리수거 방법 안내\n• 가까운 수거함 찾기\n• 환경 보호 팁 공유\n\n무엇을 도와드릴까요?'
        : '🌿 Hello! I\'m EcoBot - your AI assistant for recycling and environmental protection. I can help you with:\n\n• Proper waste sorting guidance\n• Finding nearby collection points\n• Environmental protection tips\n\nHow can I help you?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await chatWithAI(userMessage.content, messages);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: language === 'vi' 
          ? '❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!'
          : language === 'ko'
          ? '❌ 죄송합니다. 오류가 발생했습니다. 다시 시도해주세요!'
          : '❌ Sorry, an error occurred. Please try again!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: language === 'vi'
        ? '🌿 Cuộc trò chuyện đã được xóa. Tôi sẵn sàng giúp đỡ bạn!'
        : language === 'ko'
        ? '🌿 대화가 초기화되었습니다. 도움이 필요하시면 말씀해주세요!'
        : '🌿 Chat cleared. I\'m ready to help you!',
      timestamp: new Date()
    }]);
  };

  const quickQuestions = [
    language === 'vi' ? 'Cách phân loại chai nhựa?' : language === 'ko' ? '플라스틱병 분리 방법?' : 'How to sort plastic bottles?',
    language === 'vi' ? 'Pin cũ bỏ đâu?' : language === 'ko' ? '폐건전지 버리는 곳?' : 'Where to dispose batteries?',
    language === 'vi' ? 'Rác thực phẩm xử lý sao?' : language === 'ko' ? '음식물 쓰레기 처리?' : 'How to handle food waste?',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md h-[85vh] rounded-t-3xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">EcoBot AI</h3>
                  <p className="text-xs text-green-100">
                    {language === 'vi' ? 'Trợ lý phân loại rác' : language === 'ko' ? '분리수거 도우미' : 'Recycling Assistant'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title={language === 'vi' ? 'Xóa cuộc trò chuyện' : language === 'ko' ? '대화 삭제' : 'Clear chat'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white rounded-tr-sm' 
                      : 'bg-white shadow-sm border border-gray-100 rounded-tl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-green-200' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                      <span className="text-sm text-gray-500">
                        {language === 'vi' ? 'Đang trả lời...' : language === 'ko' ? '답변 중...' : 'Responding...'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-white">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {language === 'vi' ? 'Câu hỏi gợi ý:' : language === 'ko' ? '추천 질문:' : 'Suggested questions:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(q)}
                      className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    language === 'vi' 
                      ? 'Nhập câu hỏi về phân loại rác...' 
                      : language === 'ko'
                      ? '분리수거에 대해 질문하세요...'
                      : 'Ask about recycling...'
                  }
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating AI Button Component
export function AIFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-24 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-full shadow-lg shadow-green-300 z-40"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
        AI
      </span>
    </motion.button>
  );
}
