import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; text: string };

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "¡Hola! Soy el asistente virtual de la invitación de grado. ¿En qué puedo ayudarte?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
      const contents = [
        ...history,
        { role: "user", parts: [{ text: userMsg.text }] },
      ];

      const isDev = import.meta.env.DEV;
      let text: string;

      if (isDev) {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB4zCsnvJltSWZKZxYyYjbFt7tXP6JbfHQ",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: "Eres un asistente amigable para la invitación de grado de José Ángel Martínez Rodelo. Responde preguntas sobre el evento. Sé cordial y breve." }],
              },
              generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
            }),
          }
        );
        const data = await res.json();
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Lo siento, no pude procesar tu mensaje.";
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: userMsg.text, history }),
        });
        const data = await res.json();
        text = data.text ?? "Lo siento, no pude procesar tu mensaje.";
      }

      setMessages((prev) => [...prev, { role: "assistant", text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Ocurrió un error. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          open ? "scale-0 opacity-0" : "scale-100 opacity-100",
          "bg-gold text-black hover:bg-gold/90"
        )}
        aria-label="Abrir chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>

      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-80 sm:w-96 overflow-hidden rounded-xl border shadow-2xl transition-all duration-300",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none",
          "border-gold/30 bg-black/90 backdrop-blur-md"
        )}
      >
        <div className="flex items-center justify-between border-b border-gold/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-black">
              G
            </div>
            <div>
              <p className="text-sm font-medium text-gold">Asistente</p>
              <p className="text-[10px] text-gold/60">Gemini AI</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gold/60 hover:bg-gold/10 hover:text-gold transition-colors"
            aria-label="Cerrar chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex h-80 flex-col gap-3 overflow-y-auto p-4 scrollbar-thin">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                msg.role === "user"
                  ? "ml-auto bg-gold text-black"
                  : "mr-auto bg-white/10 text-white/90"
              )}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="mr-auto max-w-[85%] rounded-xl bg-white/10 px-3 py-2 text-sm text-white/60">
              <span className="animate-pulse">Escribiendo...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 border-t border-gold/20 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-lg border border-gold/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/50 transition-colors"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold text-black hover:bg-gold/90 disabled:opacity-40 transition-colors"
            aria-label="Enviar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
