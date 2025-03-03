import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Computer } from "lucide-react";

export default function Chatbot() {
  const socket = useRef<WebSocket | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>("");
  const [connect, setConnect] = useState<boolean>(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm Windows 95's AI assistant. How can I help you today?",
    },
  ]);
  

  const handleSendMessage = () => {
    if (input.trim()) {
      const userMessage = { role: "user", content: input };
  
      // Update state to display user's message
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setLoading(true)
      setTimeout(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
  
      // Send message to WebSocket server
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify(userMessage));
      } else {
        console.error("WebSocket is not connected.");
      }
  
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if(loading)return; // if AI is still processing, dont allow resend
      
      handleSendMessage();
    }
  };

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;

    const connectWebSocket = () => {
      socket.current = new WebSocket("wss://ai-tweet-bot.onrender.com/"); 
      

      socket.current.onopen = () => {
        retryCount = 0;
        setConnect(true)
      };

      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data) {
          console.log(data)
          setMessages((prevData) => [
            ...prevData,
            { role: "assistant", content: data.message },
          ]);
          setLoading(false)
          setTimeout(() => {
            endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      };

      socket.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnect(false)
      };

      socket.current.onclose = () => {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(connectWebSocket, 1000);
        } else {
          console.log("Max retries reached. WebSocket closed permanently.");
        }
      };
    };

    connectWebSocket();

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);


  return (
    <div className="flex justify-center items-center w-[100svw] h-[100svh] relative">
      <div className="w-full h-full flex flex-col">
        {/* Windows 95 Title Bar */}
        <div className="flex items-center  bg-[#000080] text-white px-1 py-0.5">
          <div className="flex items-center gap-1">
            <Computer className="h-4 w-4" />
            <span className="font-bold text-sm tracking-tight">AI Assistant Wins95.exe</span>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="flex bg-[#c0c0c0] border-b border-gray-700 text-xs">
          <button className="px-2 py-0.5 hover:bg-[#000080] hover:text-white">File</button>
          <button className="px-2 py-0.5 hover:bg-[#000080] hover:text-white">Edit</button>
          <button className="px-2 py-0.5 hover:bg-[#000080] hover:text-white">View</button>
          <button className="px-2 py-0.5 hover:bg-[#000080] hover:text-white">Help</button>
        </div>

        {/* Chat Container */}
        <div className="chat_container flex-1 relative bg-white p-2 overflow-x-hidden overflow-y-auto h-[400px] border-t border-l border-t-gray-200 border-l-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-4 text-start touch-auto">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] ${message.role === "user" ? "bg-[#c3c3c3]" : "bg-[#ececec]"} p-2 border-t-2 border-2 border-r-2 border-b-2 ${message.role === "user" ? "border-t-gray-200 border-l-gray-200 border-r-gray-700 border-b-gray-400" : "border-t-gray-700 border-l-gray-700 border-r-gray-300 border-b-gray-300"}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center mb-1">
                      <Computer className="h-4 w-4 mr-1" />
                      <span className="font-bold text-xs">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={endOfMessagesRef}>
            {loading && (
              <div className="flex justify-start items-center gap-1">
                <div className="text-4xl animate-bounce600">.</div>
                <div className="text-4xl animate-bounce800">.</div>
                <div className="text-4xl animate-bounce1000">.</div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-[#c0c0c0] p-2 border-t-2 border-l-2 border-t-gray-200 border-l-gray-200">
          <div className="flex">
            <div className="flex-1 border-2 border-t-gray-700 border-l-gray-700 border-r-gray-200 border-b-gray-200 bg-white p-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your question here..."
                className="w-full h-10 resize-none bg-white text-sm focus:outline-none"
              />
            </div>
            <button
              disabled={loading}
              onClick={handleSendMessage}
              className={`${loading && 'border-t-gray-700 border-l-gray-700 border-r-white border-b-white'} 
              ml-2 px-3 py-1 border-t-2 border-l-2 border-r border-b border-t-gray-200 border-l-gray-200 border-r-gray-700
               border-b-gray-700 bg-[#c0c0c0] hover:bg-[#d0d0d0] active:border-t-gray-700 active:border-l-gray-700 active:border-r-gray-200 active:border-b-gray-200`}
            >
              Send
            </button>
          </div>
          <div className="text-xs text-center mt-1">AI may make mistakes. Please use with discretion.</div>
        </div>

        {/* Status Bar */}
        <div className="bg-[#c0c0c0] border-t border-t-gray-200 flex items-center px-2 py-0.5 text-xs">
          <div className={`${connect ? 'bg-green-500 text-white' : 'bg-red-500'} border border-t-gray-700 border-l-gray-700 border-r-gray-200 border-b-gray-200 px-1 mr-2`}>
            {connect ? 'Online' : 'Offline'}
          </div>
          <div>Windows 95 AI Assistant v1.0</div>
        </div>
      </div>
    </div>
  )
}

