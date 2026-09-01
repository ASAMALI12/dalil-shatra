import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 1. Plan 5-Page Coloring Book Story & Prompts
  app.post("/api/plan-book", async (req: Request, res: Response) => {
    try {
      const { childName = "Explorer", theme = "Space Dinosaurs", ageGroup = "preschool", artStyle = "playful_chibi" } = req.body;
      const ai = getGenAI();

      const lineStyleInstruction = 
        ageGroup === "toddler" 
          ? "Ultra-thick, bold, chunky, simple outlines with large coloring spaces, minimum tiny details, extremely high contrast, perfect for 2-4 year olds." 
          : ageGroup === "preschool"
          ? "Thick, clean, crisp distinct black outlines with friendly shapes and delightful details, easy to color with crayons or markers for 4-6 year olds."
          : "Clean bold defined black outlines with fun engaging scene details and dynamic action for 7-10 year olds.";

      const systemPrompt = `You are a master children's book author and coloring book designer.
You create delightful, cohesive 5-page coloring book journeys for children.
Child's Name: ${childName}
Theme: ${theme}
Age Target: ${ageGroup} (${lineStyleInstruction})
Art Style: ${artStyle}

Requirements:
1. Create a captivating book title featuring ${childName}'s name (e.g., "${childName}'s Epic Space Dino Adventure").
2. Create a cheerful book subtitle.
3. Design a custom Cover prompt that is black and white line art with a big banner or central focal character welcoming ${childName}.
4. Design exactly 5 progressive, distinct story pages that take the child through a beginning, discovery, fun adventure, friendly encounter, and celebratory conclusion.
5. For each page, provide:
   - pageNumber (1 to 5)
   - title (short, punchy, e.g. "Blast Off!", "The Friendly Triceratops")
   - caption (1-2 simple, joyful, rhyming or storytelling sentences addressed directly or featuring ${childName})
   - prompt (detailed, specific prompt optimized for black-and-white children's coloring book line art: STRICTLY pure black thick line art, pure white background, no grayscale shading, no hatching or stippling, no colors, clean open spaces to color).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a 5-page coloring book plan for ${childName} with theme: "${theme}".`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Book title with child name" },
              subtitle: { type: Type.STRING, description: "Book subtitle" },
              coverPrompt: { type: Type.STRING, description: "Detailed prompt for cover coloring page" },
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pageNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                  },
                  required: ["pageNumber", "title", "caption", "prompt"],
                },
              },
            },
            required: ["title", "subtitle", "coverPrompt", "pages"],
          },
        },
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText);

      res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error("Error planning book:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to plan coloring book.",
      });
    }
  });

  // 2. Generate Coloring Page Line Art Image
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        resolution = "1K", // '1K' | '2K' | '4K'
        isCover = false,
        childName = "Child",
        theme = "Coloring",
        ageGroup = "preschool",
      } = req.body;

      if (!prompt) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const ai = getGenAI();

      const baseColoringBookStyle = 
        `Children's coloring book page, black and white line art only, thick bold black outlines, pure clean white background, zero grayscale shading, no gradient, no color, no shadows, high contrast crisp vector style, cute friendly character design, open areas for coloring with crayons and markers, professional children's illustration style.`;

      const refinedPrompt = isCover
        ? `${baseColoringBookStyle} Cover page illustration for a children's coloring book titled "${theme}". Prominent cheerful celebration scene featuring friendly characters with an open ribbon banner, suitable for coloring: ${prompt}`
        : `${baseColoringBookStyle} Single coloring book page scene for kids (${ageGroup} level): ${prompt}`;

      // Use gemini-3-pro-image-preview as requested
      // Fallback to gemini-3.1-flash-image if unavailable
      let imageBase64: string | null = null;
      let usedModel = "gemini-3-pro-image-preview";

      const validResolutions = ["1K", "2K", "4K"];
      const targetSize = validResolutions.includes(resolution) ? resolution : "1K";

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: {
            parts: [{ text: refinedPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "3:4",
              imageSize: targetSize,
            },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              imageBase64 = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } catch (err: any) {
        console.warn("gemini-3-pro-image-preview call failed, falling back to gemini-3.1-flash-image:", err.message);
        usedModel = "gemini-3.1-flash-image";
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-image",
          contents: {
            parts: [{ text: refinedPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "3:4",
              imageSize: targetSize,
            },
          },
        });

        if (fallbackResponse.candidates?.[0]?.content?.parts) {
          for (const part of fallbackResponse.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              imageBase64 = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      }

      if (!imageBase64) {
        throw new Error("No image was returned from the model.");
      }

      res.json({
        success: true,
        imageUrl: imageBase64,
        model: usedModel,
        resolution: targetSize,
      });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate coloring image.",
      });
    }
  });

  // 3. Multi-turn AI Chat Assistant & Co-Creator
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const {
        messages = [],
        model = "gemini-3.5-flash",
        systemInstruction = "You are a creative children's book illustrator and coloring book co-creator. You help parents and kids brainstorm fun coloring themes, write silly captions, and tweak coloring page scenes.",
        childName = "the child",
        theme = "general",
      } = req.body;

      const ai = getGenAI();

      // Valid model routing as specified:
      // gemini-3.1-pro-preview for complex creative tasks
      // gemini-3.5-flash for general tasks
      // gemini-3.1-flash-lite for fast tasks
      const allowedModels = [
        "gemini-3.1-pro-preview",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-3.7-flash",
      ];
      const selectedModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

      // Transform messages into contents format
      const formattedContents = messages.map((m: { role: string; text: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      // Append contextual knowledge
      const augmentedSystem = `${systemInstruction}
Current Project Context:
- Child Name: ${childName}
- Coloring Book Theme: ${theme}

When suggesting new coloring page ideas, provide short catchy page ideas and describe the thick black line-art scene clearly.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: formattedContents,
        config: {
          systemInstruction: augmentedSystem,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "I'd love to help you create more fun coloring pages!";

      res.json({
        success: true,
        text: responseText,
        model: selectedModel,
      });
    } catch (error: any) {
      console.error("Error in chat:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Chat failed to respond.",
      });
    }
  });

  // 4. Regenerate Single Page Prompt with AI
  app.post("/api/regenerate-prompt", async (req: Request, res: Response) => {
    try {
      const { pageTitle, currentCaption, userInstructions, childName, theme, ageGroup } = req.body;
      const ai = getGenAI();

      const prompt = `You are a children's coloring book author.
We want to customize/regenerate page "${pageTitle}" for ${childName}'s "${theme}" book (target age: ${ageGroup}).
User requests this adjustment: "${userInstructions}".
Previous Caption was: "${currentCaption}".

Return a JSON object with:
1. "title": Short catchy title
2. "caption": A playful 1-2 sentence story caption
3. "prompt": A detailed black-and-white coloring book prompt (thick bold black outlines, pure white background, zero grayscale shading, crisp open coloring areas).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              caption: { type: Type.STRING },
              prompt: { type: Type.STRING },
            },
            required: ["title", "caption", "prompt"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error("Error regenerating prompt:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Coloring Book Generator Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
