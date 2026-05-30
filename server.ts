import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing with reasonable size limits
app.use(express.json({ limit: "15mb" }));

// Helper to initialize Gemini SDK lazily and check key existence
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not set or configured. Please set your Gemini API key in Settings > Secrets.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// ==========================================
// API ENDPOINTS
// ==========================================

// Endpoint to check environment configuration
app.get("/api/config", (req, res) => {
  const isKeySet = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    configured: isKeySet,
    message: isKeySet ? "System operational." : "Gemini API key is missing. Please configure it in Settings > Secrets."
  });
});

/**
 * Step 1: Formulate Research Plan / Paper Outline
 * Topic: "e.g., Solid-state battery breakthroughs"
 * Parameters: targetDepth, tone, language, focusAreas
 */
app.post("/api/research/plan", async (req, res) => {
  try {
    const { topic, focusAreas, tone, depth } = req.body;
    
    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return res.status(400).json({ error: "Topic is required" });
    }

    const ai = getGeminiClient();
    
    const prompt = `You are a Principal Research Architect. Develop a comprehensive, highly-structured research project outline for: "${topic}".
Focus Area constraints: ${focusAreas || "None specified (general academic/industry report)"}.
Writing Tone style: ${tone || "Professional and objective"}.
Target Depth: ${depth || "Detailed"}.

Create a title and 4 to 6 logical outline sections. Each section must cover a core dimension of the topic.
Format your output strictly as a JSON object matching this schema:
{
  "title": "A highly precise professional title for the research paper",
  "scope": "A short, concise 2-sentence summary detailing the research boundaries and main objectives.",
  "sections": [
    {
      "id": "unique-slug-1",
      "title": "Clean, descriptive name of the section",
      "objective": "A focused objective statement detailing what specific questions or facts this section must uncover during web research.",
      "focusKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scope: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  focusKeywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["id", "title", "objective", "focusKeywords"]
              }
            }
          },
          required: ["title", "scope", "sections"]
        }
      }
    });

    const planData = JSON.parse(response.text || "{}");
    res.json(planData);
  } catch (error: any) {
    console.error("Error generating research plan:", error);
    res.status(500).json({ error: error?.message || "Internal server error formulating research plan" });
  }
});

/**
 * Step 2: Investigate a Single Outline Section (with Google Search Grounding)
 * Takes research topic, section title, section objective, and focus keywords.
 */
app.post("/api/research/investigate", async (req, res) => {
  try {
    const { topic, sectionTitle, sectionObjective, focusKeywords } = req.body;

    if (!topic || !sectionTitle) {
      return res.status(400).json({ error: "Topic and Section Title are required" });
    }

    const ai = getGeminiClient();

    const queryPrompt = `Conduct rigorous web research on the specific section: "${sectionTitle}" in the context of the main topic: "${topic}".
Section Objective: ${sectionObjective || "Investigate core metrics, key developers, timelines, and facts."}
Focus Keywords to explore: ${(focusKeywords || []).join(", ")}.

Perform detailed web-grounded analysis. You must retrieve real, accurate statistics, key companies/academics involved, historical facts, and current developments.
Synthesize your findings into a professionally formatted analytical section.
Do not use generic, hand-waving statements. Extract specific metrics, timelines, or comparative points where possible.
Format your output strictly as a JSON object matching this schema:
{
  "synthesizedText": "Detailed markdown formatted synthesis of this section (2-4 robust paragraphs with inline markdown references like [1], [2], etc.). Do not include the main section header itself, start directly with the paragraphs.",
  "keyFacts": [
    {
      "fact": "A strong, singular historical fact, statistic, or core finding extracted from research.",
      "context": "Context or explanation of why this fact matters.",
      "metric": "Optional numeric value or metric string (e.g. '$5.2B', '2028', '85%') if applicable. Keep empty string if none."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: queryPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synthesizedText: { type: Type.STRING },
            keyFacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fact: { type: Type.STRING },
                  context: { type: Type.STRING },
                  metric: { type: Type.STRING }
                },
                required: ["fact", "context", "metric"]
              }
            }
          },
          required: ["synthesizedText", "keyFacts"]
        }
      }
    });

    // Parse output JSON
    const resultData = JSON.parse(response.text || "{}");
    
    // Extract sources/citations from the grounding metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk?.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Web Source",
        url: chunk.web.uri || "#"
      }));

    res.json({
      ...resultData,
      sources
    });
  } catch (error: any) {
    console.error("Error investigating section:", error);
    res.status(500).json({ error: error?.message || "Internal server error during search-grounded investigation" });
  }
});

/**
 * Step 3: Polish Report & Generate Synthesis
 * Compiles section contents together, generating a unified Executive Summary and Key Takeaways.
 */
app.post("/api/research/finalize", async (req, res) => {
  try {
    const { topic, plan, investigatedSections } = req.body;

    if (!topic || !investigatedSections || !Array.isArray(investigatedSections)) {
      return res.status(400).json({ error: "Missing compiled information" });
    }

    const ai = getGeminiClient();

    // Create a summarized overview of investigated contents
    const sectionSummaries = investigatedSections.map(s => {
      return `Section: ${s.title}\nSynthesis Snippet: ${s.synthesizedText.substring(0, 500)}...\nKey Facts: ${JSON.stringify(s.keyFacts)}`;
    }).join("\n\n");

    const prompt = `You are a Principal Analyst. Synthesis and integrate the following research findings into a cohesive final publication.
Main Research Topic: "${topic}"
Overall Executive Plan: "${plan?.scope || ""}"

Here is the raw analyzed content we gathered from search-grounded queries:
${sectionSummaries}

Based on this content, generate a highly polished:
1. Executive Summary: A cohesive overview outlining the core themes, major breakthroughs, and structural challenges. (3-4 paragraphs)
2. Highlights/Takeaways: 3 or 4 high-level strategic takeaways each with a descriptive name, explanation, and an intensity score out of 100 representing market impact or significance.

Format your output strictly as a JSON object matching this schema:
{
  "executiveSummary": "A beautifully drafted, fully mature Executive Summary in Markdown (including sub-headlines if needed). Make it highly engaging.",
  "highlights": [
    {
      "title": "Takeaway/Highlight header (e.g., Breakthrough energy density achievements)",
      "description": "Explanatory analytical description.",
      "score": 85,
      "tag": "e.g., Technology, Trend, Risk, Opportunity"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            highlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  tag: { type: Type.STRING }
                },
                required: ["title", "description", "score", "tag"]
              }
            }
          },
          required: ["executiveSummary", "highlights"]
        }
      }
    });

    const finalData = JSON.parse(response.text || "{}");
    res.json(finalData);
  } catch (error: any) {
    console.error("Error finalizing report:", error);
    res.status(500).json({ error: error?.message || "Internal server error finalizing research report" });
  }
});

/**
 * Direct Live News Search Bar (with Google Search Grounding)
 * Queries latest up-to-date news about a query.
 */
app.post("/api/news/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const ai = getGeminiClient();

    const searchPrompt = `Conduct a search for the absolute latest, up-to-date breaking news, articles, and developments about: "${query}".
Focus on recent events (from the last days/hours), real facts, and current headlines.
Synthesize a short, 2-3 sentence global summary, and list 4-6 specific news developments or articles, including their exact titles, summaries, publisher/source names, and real URLs.
All URL links must be real, valid web addresses retrieved from search.
Format your output strictly as a JSON object matching this schema:
{
  "summary": "Brief overall summary of the latest news scene in 2-3 sentences.",
  "news": [
    {
      "title": "A precise headline of the news article/event",
      "summary": "1-2 sentence detailed summary of what occurred.",
      "source": "Name of the publisher or news outlet (e.g. Reuters, TechCrunch, etc.)",
      "url": "A real, complete web link to the source starting with http/https"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  source: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["title", "summary", "source", "url"]
              }
            }
          },
          required: ["summary", "news"]
        }
      }
    });

    const newsData = JSON.parse(response.text || "{}");
    
    // Fallback urls check: if any url is empty or fake, extract from grounding metadata as fallback
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter((chunk: any) => chunk?.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Web Source",
        url: chunk.web.uri || "#"
      }));

    if (newsData.news && Array.isArray(newsData.news)) {
      newsData.news = newsData.news.map((item: any, idx: number) => {
        if (!item.url || item.url.includes("example.com") || item.url === "#") {
          const matchingChunk = webSources[idx % webSources.length];
          if (matchingChunk) {
            item.url = matchingChunk.url;
            if (item.source === "Name of the publisher" || !item.source) {
              item.source = matchingChunk.title;
            }
          }
        }
        return item;
      });
    }

    res.json({
      ...newsData,
      webSources
    });
  } catch (error: any) {
    console.error("Error searching news:", error);
    res.status(500).json({ error: error?.message || "Internal server error during up-to-date news crawl" });
  }
});

/**
 * Daily Quiz Generator for every subject
 * Generates an educational 5-question multiple choice quiz on any topic/subject.
 */
app.post("/api/quiz/generate", async (req, res) => {
  try {
    const { subject } = req.body;
    if (!subject || typeof subject !== "string" || subject.trim() === "") {
      return res.status(400).json({ error: "Subject is required" });
    }

    const ai = getGeminiClient();

    const quizPrompt = `You are a Senior Academic Educator. Generate a highly engaging, fully interactive multiple-choice quiz about the subject: "${subject}".
The quiz must contain exactly 5 diverse and challenging questions ranging from conceptual basic to advanced thinking.
For each question, provide 4 highly plausible options, specify the single correct option (must exactly match one of the options string), and write a robust, highly educational 2-3 sentence explanation of why it is correct and why other key choices are incorrect.

Format your output strictly as a JSON object matching this schema:
{
  "subject": "The precise title of the subject/quiz",
  "questions": [
    {
      "id": 1,
      "question": "The quiz question text.",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "The exact matching text of the correct option choice",
      "explanation": "Double-grounded conceptual explanation details."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: quizPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["subject", "questions"]
        }
      }
    });

    const quizData = JSON.parse(response.text || "{}");
    res.json(quizData);
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: error?.message || "Internal server error formulating subject quiz details" });
  }
});

/**
 * AI Endpoint 1: Suggest focus areas and constraints based on a research theme
 */
app.post("/api/ai/suggest-focus", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return res.status(400).json({ error: "Research topic is required to suggest parameters" });
    }

    const ai = getGeminiClient();
    const prompt = `You are an Academic Director. Analyze the following research theme:
"${topic}"

Suggest 4 to 6 highly specific research keywords or scope constraints to focus on. For example, if the topic is batteries, recommend specific chemistries (e.g., sodium-ion, solid-state), KPIs (e.g., volumetric energy density, cycle life), or commercial angles (e.g., supply chain risks, manufacturing safety).
Format these as a clean comma-separated list of keywords that can directly fit into a single search input field.
Keep the overall text under 15 words.
Return strictly as a JSON object:
{
  "suggestedFocus": "keyword1, keyword2, keyword3, keyword4"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedFocus: { type: Type.STRING }
          },
          required: ["suggestedFocus"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Error suggesting focus areas:", error);
    res.status(500).json({ error: error?.message || "Internal server error predicting focus areas" });
  }
});

/**
 * AI Endpoint 2: Quality audit and counterclaim engine for a research report
 */
app.post("/api/ai/audit-report", async (req, res) => {
  try {
    const { title, topic, executiveSummary, sections } = req.body;

    if (!topic || !sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: "Complete report sections are required for an audit." });
    }

    const ai = getGeminiClient();

    // Prepare text sample to audit
    const compiledContent = sections.map((s: any) => `### Section: ${s.title}\n${s.synthesizedText || ""}`).join("\n\n");

    const prompt = `You are a critical Peer Review Referee for a prestigious scientific and strategic journal. Audit the draft report details thoroughly:
Title: "${title || topic}"
Core Topic: "${topic}"

Executive Summary context:
"${executiveSummary || "None specified"}"

Full Sections Context:
${compiledContent.substring(0, 8000)}

Analyze the report critically. Grade the depth/analytical quality out of 100.
Formulate:
1. 3 major content strengths (e.g., explicit coverage of technical bottlenecks, cited claims).
2. 3 major research gaps/vulnerabilities (e.g., omission of recycling constraints, lack of cost-per-kWh details).
3. 2 key strategic counterclaims of alternate schools of thought or criticisms.
4. 3 advanced, highly cited follow-up investigation questions to research next.

Return strictly as a JSON object:
{
  "score": 85,
  "strengths": ["Strength detail 1", "Strength detail 2", "Strength detail 3"],
  "gaps": ["Gap detail 1", "Gap detail 2", "Gap detail 3"],
  "counterarguments": ["Counterargument detail 1", "Counterargument detail 2"],
  "followUps": ["Question 1", "Question 2", "Question 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            counterarguments: { type: Type.ARRAY, items: { type: Type.STRING } },
            followUps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "strengths", "gaps", "counterarguments", "followUps"]
        }
      }
    });

    const auditResult = JSON.parse(response.text || "{}");
    res.json(auditResult);
  } catch (error: any) {
    console.error("Error auditing report:", error);
    res.status(500).json({ error: error?.message || "Internal server error auditing analytical report" });
  }
});

/**
 * AI Endpoint 3: Interactive Q&A chat engine centered entirely around a report
 */
app.post("/api/ai/chat-report", async (req, res) => {
  try {
    const { title, topic, executiveSummary, sections, messages } = req.body;

    if (!topic || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Interactive message history and topic context are required." });
    }

    const ai = getGeminiClient();

    // Prepare context of the report
    const sectionsText = sections.map((s: any) => `Section: ${s.title}\nContent: ${s.synthesizedText || ""}`).join("\n\n");
    const reportSummaryContext = `
Title: ${title || topic}
Topic: ${topic}
Executive Summary: ${executiveSummary || "None provided"}
Sections context:
${sectionsText}
`;

    // Limit previous history context length for safety
    const recentMessages = messages.slice(-10);

    // Form contents correctly with the context prepended
    const conversationHistory = recentMessages.map((m: any) => {
      return `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`;
    }).join("\n");

    const systemInstruction = `You are a Senior Research Co-Pilot. You have read a comprehensive research paper themed around "${topic}".
Here is the context of the report you must refer to:
---
${reportSummaryContext.substring(0, 8050)}
---

Conduct an interactive professional conversation. Answer questions, provide deeper explanations, hypothesize based on the facts in the report, or guide further studies. 
Be rigorous, clear, objective, and highly engaging. Do not wander outside the boundaries of scientific/analytical consistency. Avoid generic talk. Keep responses concise, highly informative, and structured using clean Markdown.`;

    const prompt = `Existing conversation context:\n${conversationHistory}\n\nUser's latest message:\n"${recentMessages[recentMessages.length - 1]?.content || ""}"\n\nAssistant reply in markdown:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ reply: response.text || "No response generated." });
  } catch (error: any) {
    console.error("Error in interactive report chat:", error);
    res.status(500).json({ error: error?.message || "Internal server error during chatbot interaction" });
  }
});


// ==========================================
// VITE CLIENT DEV MIDDLEWARE & STATIC ASSETS
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // SPA Fallback for client routes
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Research & Report server booting successfully on Port ${PORT}`);
  });
}

// Only start the standalone express server if NOT running in serverless / Netlify environment
if (!process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT) {
  startServer().catch((err) => {
    console.error("Critical: Failed to boot express server instance:", err);
  });
}

export { app };
