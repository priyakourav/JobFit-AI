const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function embedTexts(texts) {
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: texts,
    config: { outputDimensionality: 768 },
  });
  return result.embeddings.map((e) => e.values);
}

module.exports = { embedTexts };