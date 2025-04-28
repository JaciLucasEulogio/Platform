'use client';

import React, { useState, useRef, useEffect } from "react";

const formatBotText = (text) => {
  let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/(\n|^)[*-] (.*?)(?=\n|$)/g, "<li>$2</li>");
  formatted = formatted.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  formatted = formatted.replace(/\n{2,}/g, "</p><p>");
  formatted = "<p>" + formatted + "</p>";
  return formatted;
};

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
      
      // Set initial position to bottom right
      if (position.x === 0 && position.y === 0 && chatWindowRef.current) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const chatWidth = chatWindowRef.current.offsetWidth;
        const chatHeight = chatWindowRef.current.offsetHeight;
        
        setPosition({
          x: windowWidth - chatWidth - 30,
          y: windowHeight - chatHeight - 100
        });
      }
    }
  }, [isOpen, messages, position]);

  const handleMouseDown = (e) => {
    if (chatWindowRef.current && e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const boundingRect = chatWindowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - boundingRect.left,
        y: e.clientY - boundingRect.top
      });
      
      // Prevent text selection during drag
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && chatWindowRef.current) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const chatWidth = chatWindowRef.current.offsetWidth;
      const chatHeight = chatWindowRef.current.offsetHeight;
      
      // Calculate new position
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Keep window within viewport bounds
      newX = Math.max(0, Math.min(windowWidth - chatWidth, newX));
      newY = Math.max(0, Math.min(windowHeight - chatHeight, newY));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleChat = () => {
    setIsOpen(!isOpen);

    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          from: "bot",
          text:
            "**¡Hola! 👋**\n\nEstoy aquí para ayudarte. Puedes preguntarme lo que quieras 😊\n\n- Haz clic en el botón enviar\n- O presiona Enter cuando termines de escribir",
        },
      ]);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { from: "user", text: userInput }];
    setMessages(newMessages);
    const currentInput = userInput;
    setUserInput("");
    setIsLoading(true);

    setMessages([...newMessages, { from: "bot", text: "..." }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });
      const data = await res.json();

      const updatedMessages = [...newMessages, { from: "bot", text: data.reply || data.error }];
      setMessages(updatedMessages);
    } catch (err) {
      console.error(err);
      const errorMessages = [...newMessages, { from: "bot", text: "Error de conexión. Por favor, intenta de nuevo." }];
      setMessages(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = () => {
    sendMessage();
  };

  return (
    <div>
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 rounded-full w-14 h-14 bg-indigo-600 text-white text-2xl border-none cursor-pointer z-50 flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg"
        aria-label="Abrir chat"
      >
        💬
      </button>

      {isOpen && (
        <div 
          ref={chatWindowRef}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '350px',
            height: '450px',
            cursor: isDragging ? 'move' : 'auto',
            zIndex: 1000,
          }}
          className="bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 overflow-hidden"
          onMouseDown={handleMouseDown}
        >
          {/* Header - drag handle */}
          <div className="p-3 bg-indigo-600 text-white font-medium flex items-center justify-between rounded-t-lg cursor-move drag-handle select-none">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center mr-2">
                💬
              </div>
              <span>Asistente Virtual</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs mr-2 italic">Arrastra para mover</span>
              <button 
                onClick={toggleChat}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Cerrar chat"
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Messages area with fixed height */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 text-sm leading-normal"
            style={{ height: '350px' }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 ${msg.from === "user" ? "text-right" : "text-left"}`}
              >
                {msg.from === "bot" && msg.text !== "..." ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: formatBotText(msg.text) }}
                    className="inline-block bg-gray-100 text-gray-800 py-2 px-3 rounded-lg max-w-[85%] text-left shadow-sm"
                  />
                ) : (
                  <div
                    className={`inline-block py-2 px-3 rounded-lg max-w-[85%] shadow-sm ${
                      msg.from === "user"
                        ? "bg-indigo-100 text-gray-800"
                        : "bg-gray-100 text-gray-500 italic"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              className="flex-1 p-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-800"
              autoFocus
            />
            <button
              onClick={handleSendClick}
              disabled={isLoading || !userInput.trim()}
              className="p-2 rounded-full bg-indigo-600 text-white disabled:bg-gray-300 hover:bg-indigo-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"></path>
                <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChat;