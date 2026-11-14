import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

async function startServer() {
  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGINS ??
    "capacitor://localhost,http://localhost,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "15mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/ocr", async (req, res) => {
    try {
      const { imageDataUrl } = req.body as { imageDataUrl?: string };

      if (!imageDataUrl || typeof imageDataUrl !== "string") {
        res.status(400).json({
          error: "No photo was received. Please try taking or choosing a photo again.",
        });
        return;
      }

      const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        res.status(400).json({
          error: "That image format could not be read. Please try a JPG or PNG photo.",
        });
        return;
      }

      if (!ai) {
        res.status(503).json({
          error: "Photo text reading is unavailable right now. Please paste or type the text instead.",
        });
        return;
      }

      const [, mimeType, base64Data] = match;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: "Extract all readable text from this photo in natural reading order so it can be read aloud clearly to a senior citizen. Return only the plain extracted text with normal spacing and line breaks. Do not add markdown, bullet symbols, or extra commentary. If no readable text is visible, respond with exactly: NO_TEXT_FOUND",
            },
          ],
        },
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const extracted = (response.text ?? "").trim();

      if (!extracted || extracted === "NO_TEXT_FOUND") {
        res.json({
          text: "",
          message: "No clear words were found in that photo. Try moving closer or turning on more light.",
        });
        return;
      }

      res.json({ text: extracted });
    } catch (error) {
      console.error("OCR error:", error);
      res.status(500).json({
        error: "Could not read the photo right now. Please try again or paste your text.",
      });
    }
  });

  if (process.env.NODE_ENV === "production") {
    const distDir = path.join(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ClearRead server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
