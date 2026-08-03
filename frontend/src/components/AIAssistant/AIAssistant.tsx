import React, { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useCompetition } from "../../context/CompetitionContext";
import { sendAssistantMessage } from "../../services/assistantService";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  content: string;
}

const AIAssistant: React.FC = () => {
  const { selectedSeasonID, selectedCompetition, selectedSeason } =
    useCompetition();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I am PlayerPro AI. Ask me about your team, fixtures, and competition.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: message },
    ]);
    setInput("");
    setSending(true);

    try {
      const answer = await sendAssistantMessage(message, selectedSeasonID);
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "assistant", content: answer },
      ]);
    } catch (error: any) {
      const text =
        error.response?.data?.error ||
        "The AI assistant is unavailable. Make sure the required services are running.";
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "assistant", content: text },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <section
          className="fixed inset-3 z-[70] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:bottom-[94px] sm:right-6 sm:h-[min(570px,calc(100vh-130px))] sm:w-[390px]"
          aria-label="PlayerPro AI chat"
        >
          <header className="flex items-center justify-between bg-slate-950 px-[18px] py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-emerald-500 text-slate-950">
                <Bot size={20} />
              </span>
              <div className="flex flex-col">
                <strong>PlayerPro AI</strong>
                <small className="mt-0.5 text-slate-400">
                  {selectedCompetition?.code || "Football"} ·{" "}
                  {selectedSeason?.name || "Assistant"}
                </small>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close AI assistant"
              className="border-0 bg-transparent text-slate-400 transition hover:text-white"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mt-2.5 w-fit max-w-[85%] whitespace-pre-wrap px-[13px] py-2.5 text-sm leading-6 first:mt-0 ${
                  message.role === "user"
                    ? "ml-auto rounded-2xl rounded-br bg-slate-900 text-white"
                    : "rounded-2xl rounded-bl bg-white text-slate-800 shadow-sm"
                }`}
              >
                {message.content}
              </div>
            ))}
            {sending && (
              <div className="mt-2.5 flex w-fit gap-1 rounded-2xl rounded-bl bg-white px-[13px] py-3 shadow-sm">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:300ms]" />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-end gap-2 border-t border-slate-200 p-3"
            onSubmit={submit}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={2000}
              rows={1}
              placeholder="Ask PlayerPro AI..."
              aria-label="Message"
              className="min-h-[42px] max-h-[110px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            <button
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-emerald-500 text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={19} />
            </button>
          </form>
        </section>
      )}

      <button
        className="fixed bottom-4 right-4 z-[70] flex h-[58px] min-w-[58px] items-center justify-center gap-2 rounded-full bg-emerald-500 px-[18px] font-black text-slate-950 shadow-2xl transition hover:-translate-y-0.5 hover:bg-emerald-400 sm:bottom-6 sm:right-6"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? <X /> : <MessageCircle />}
        <span className="hidden text-sm sm:inline">AI</span>
      </button>
    </>
  );
};

export default AIAssistant;
