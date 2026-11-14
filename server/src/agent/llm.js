const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Pehla model busy/unavailable ho toh agla try hoga
const MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-2.5-flash-lite',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateJSON(prompt) {
  let lastError;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        const text = (res.text || '').replace(/```json|```/g, '').trim();
        return JSON.parse(text);
      } catch (err) {
        lastError = err;
        const status = err.status;
        if (status === 404) break; // model hi nahi hai, agle model par jao
        if (status === 503 || status === 429) {
          console.log(`[${model}] busy (try ${attempt}/3), retrying...`);
          await sleep(3000 * attempt); // 3s, 6s, 9s
          continue;
        }
        throw err; // koi aur error (jaise galat key) toh seedha dikhao
      }
    }
  }
  throw lastError;
}

module.exports = { generateJSON };