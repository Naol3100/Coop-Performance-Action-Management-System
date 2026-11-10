import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Google GenAI initialization with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Assistant Disciplinary & HR Guidance Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Settings > Secrets panel.',
      });
    }

    const roleName = userContext?.roleName || 'Bank Staff';
    const districtName = userContext?.districtName || 'Bank-Wide';
    const userName = userContext?.userName || 'Staff Member';

    // System instruction specifically tailored to Cooperative Bank of Oromia HR & Disciplinary policies
    const systemInstruction = `You are "CoopBank AI Assistant", the official expert HR & Disciplinary Action Advisor for Cooperative Bank of Oromia (Coopbank).
You assist branch managers, district HR officers, district directors, and head office managers in navigating the Bank's Employee Performance Management & Disciplinary Regulations.

Context of Current User:
- Authenticated User: ${userName}
- Operational Role: ${roleName}
- Jurisdiction: ${districtName} (13 Autonomous Districts: Adama, Hawassa, Jimma, Nekemte, Shashemene, Asella, Bale, Dire Dawa, Chiro, Finfinne North, Finfinne South, Ambo, Bishoftu)

Bank Sanction Ladders and Standard Sanctions:
1. Written Warning (First minor breach, e.g. tardiness, mild procedure non-conformance)
2. Formal Reprimand (Repeated minor breaches or standard compliance lapse)
3. Performance Improvement Plan (PIP) (Measurable targets, 30-90 days duration with milestones)
4. Demotion / Reassignment (Significant performance deficiency or breach of leadership ethics)
5. Suspension Without Pay (Serious misconduct pending formal inquiry)
6. Final Written Warning (Pre-termination sanction, last remediation opportunity)
7. Termination / Dismissal (Gross misconduct, fraud, severe regulatory non-compliance, with Directorate approval)

Key Guidelines:
- Provide clear, professional, bank-compliant, and supportive guidance.
- Advise on fair hearing rights, evidence documentation (Hearing Minutes, Investigation Summary, Notice of Inquiry), directorate approvals, and timeline compliance.
- Keep responses well-structured with bullet points or numbered steps where appropriate.
- If recommending actions or sanctions, cite the proportionate sanction step and remind the user that formal concurrence from the responsible District Director or Head Office HR Oversight is required before sanctions take final legal effect.
- Format responses cleanly using standard Markdown.`;

    // Convert client message history into Gemini chat history format
    const chat = ai.chats.create({
      model: 'gemini-3.8-flash',
      config: {
        systemInstruction,
      },
    });

    // Populate conversation history
    // All messages except the last one are replayed into history if any
    const priorMessages = messages.slice(0, -1);
    const lastUserMessage = messages[messages.length - 1];

    if (priorMessages.length > 0) {
      // Re-create chat with history
      const history = priorMessages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      // Create new chat with history
      const chatWithHistory = ai.chats.create({
        model: 'gemini-3.8-flash',
        history,
        config: {
          systemInstruction,
        },
      });

      const response = await chatWithHistory.sendMessage({
        message: lastUserMessage.content,
      });

      return res.json({
        reply: response.text || 'I was unable to generate a response. Please try rephrasing your question.',
      });
    }

    const response = await chat.sendMessage({
      message: lastUserMessage.content,
    });

    return res.json({
      reply: response.text || 'I was unable to generate a response. Please try rephrasing your question.',
    });
  } catch (err: any) {
    console.error('Gemini API Error in /api/ai/chat:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to process AI assistant response.',
    });
  }
});

// Quick Case Draft Analysis / Summary Endpoint using gemini-3.8-flash
app.post('/api/ai/analyze-incident', async (req, res) => {
  try {
    const { incidentDescription, workUnit, actionType } = req.body;

    if (!incidentDescription) {
      return res.status(400).json({ error: 'Incident description is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Settings > Secrets panel.',
      });
    }

    const prompt = `Analyze this employee disciplinary incident at Cooperative Bank of Oromia:
Work Unit: ${workUnit || 'General Banking Operations'}
Proposed Action: ${actionType || 'Under Assessment'}
Incident Details:
"${incidentDescription}"

Provide a brief, high-level policy review with:
1. Proportionate Sanction Assessment (Is the proposed action proportionate?)
2. Recommended Essential Documentation required (e.g., Notice of Inquiry, Witness Statements, Director Concurrence)
3. Corrective Action or PIP recommendation to prevent recurrence.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert banking labor law and disciplinary policy advisor for Cooperative Bank of Oromia. Give concise, actionable advice.',
      },
    });

    return res.json({
      analysis: response.text || 'Analysis unavailable.',
    });
  } catch (err: any) {
    console.error('Gemini Analyze Incident Error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to analyze incident.',
    });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CoopBank Disciplinary Portal running on http://localhost:${PORT}`);
  });
}

startServer();
