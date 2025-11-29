import React, { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: (
        <>
          <span className="inline-block align-middle mr-1">🤖</span>
          Hi 👋! Ask me anything, and I’ll summarize the latest information for you.
        </>
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref for autoscroll
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [
      ...messages,
      {
        role: "user",
        content: (
          <>
            <span className="inline-block align-middle mr-1">🧑‍💻</span> {input}
          </>
        ),
      },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://verivote-cloud-blockchain-web-based-e.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: (
            <>
              <span className="inline-block align-middle mr-1">🤖</span>
              {data.reply}
            </>
          ),
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: (
            <>
              <span className="inline-block align-middle mr-1">💥</span>
               Error fetching summary.
            </>
          ),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col items-center p-5 bg-gradient-to-br from-pink-100 via-blue-100 to-yellow-100 min-h-screen transition-all duration-700">
      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-pink-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg pb-2">
        Smart Summarizer Chatbot
      </h1>
      <div className="w-full max-w-2xl bg-gradient-to-br from-cyan-50 via-purple-100 to-yellow-50 rounded-2xl shadow-xl flex flex-col p-5 space-y-2 overflow-y-auto h-[67vh] border-2 border-pink-300">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "p-2 bg-blue-200 self-end text-right rounded-2xl max-w-[85%] shadow-md border border-blue-300 mb-2 animate-in fade-in"
                : "p-2 bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 self-start text-left rounded-2xl max-w-[89%] shadow-md border border-pink-200 mb-2 animate-in fade-in"
            }
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="text-pink-600 italic font-bold self-start animate-pulse">
            <span className="mr-1">🤖</span> Summarizing…
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form
        className="flex mt-5 w-full max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        autoComplete="off"
      >
        <input
          className="flex-grow border-2 border-pink-300 rounded-l-2xl p-3 focus:outline-none focus:ring focus:ring-yellow-200 shadow-lg text-lg bg-gradient-to-r from-white via-blue-50 to-pink-50"
          placeholder="Type your question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          aria-label="Your question"
          autoFocus
        />
        <button
          className={`
            bg-gradient-to-r from-blue-500 to-pink-400 hover:from-blue-600 hover:to-pink-600
            text-white px-7 rounded-r-2xl font-bold text-lg transition-colors
            shadow-lg border-none
            ${loading ? "opacity-50 cursor-not-allowed" : ""}
          `}
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </form>
      <div className="mt-4 text-purple-700 text-base text-center max-w-xl font-semibold drop-shadow">
         <span className="bg-gradient-to-r from-yellow-200 via-pink-100 to-blue-100 px-1 rounded">Tip:</span> Questions & summaries welcome! Election info, voting help, or documents—just ask.
      </div>
    </div>
  );
}
