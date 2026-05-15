import { defineConfig } from "@lovable.dev/vite-tanstack-config";

function devApiProxy(): import("vite").PluginOption {
  return {
    name: "dev-api-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "POST" || !req.url?.startsWith("/api/chat")) return next();
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) { res.statusCode = 500; res.end(JSON.stringify({ text: "GEMINI_API_KEY no configurada en .env" })); return; }
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", async () => {
          try {
            const { message, history } = JSON.parse(body);
            const gemini = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  contents: [...(history ?? []), { role: "user", parts: [{ text: message }] }],
                  systemInstruction: { parts: [{ text: "Eres un asistente amigable para la invitación de grado de José Ángel Martínez Rodelo. Sé cordial y breve." }] },
                  generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
                }),
              }
            );
            const data = await gemini.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Lo siento, no pude procesar tu mensaje.";
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ text }));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ text: "Ocurrió un error. Intenta de nuevo." }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
    spa: { enabled: true },
  },
  plugins: [devApiProxy()],
});
