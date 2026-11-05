const { generateJSON } = require('./llm');
const { chunkText } = require('../ingest/chunkText');
const { embedTexts } = require('../embeddings/embedText');
const { index } = require('../vectorstore/pineconeClient');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Step 1: JD se requirements nikalo
async function extractRequirements(jdText) {
  const prompt = `Extract the key requirements from this job description.
Return JSON: {"requirements":[{"skill":"short name","importance":"must|nice"}]}
Max 12 items. Job description:
${jdText}`;
  const out = await generateJSON(prompt);
  return out.requirements || [];
}

// Step 2: har requirement ke liye resume se evidence dhundo (RAG)
async function retrieveEvidence(requirements, resumeText) {
  const ns = `resume-${Date.now()}`;
  const chunks = chunkText(resumeText);
  const vectors = await embedTexts(chunks);
  const records = chunks.map((text, i) => ({
    id: `c-${i}`,
    values: vectors[i],
    metadata: { text },
  }));
  await index.namespace(ns).upsert({ records });
  await sleep(8000); // Pinecone ko data searchable hone mein time lagta hai

  const queries = requirements.map((r) => r.skill);
  const qVectors = await embedTexts(queries);
  const evidence = [];
  for (let i = 0; i < requirements.length; i++) {
    const res = await index.namespace(ns).query({
      vector: qVectors[i],
      topK: 3,
      includeMetadata: true,
    });
    evidence.push({
      ...requirements[i],
      matches: res.matches.map((m) => ({ text: m.metadata.text, score: m.score })),
    });
  }
  await index.namespace(ns).deleteAll();
  return evidence;
}

// Step 3: Gemini evidence dekh ke judge kare aur suggestions de
async function judgeAndSuggest(evidence) {
  const prompt = `You are a career coach. For each job requirement below you get the closest lines from the candidate's resume.
Decide if the resume truly shows the skill. Only use the evidence given, do not invent experience.
Return JSON:
{"matchScore":0-100,
 "summary":"2 sentences",
 "requirements":[{"skill":"","status":"strong|partial|missing","reason":"","suggestion":"concrete resume rewrite or what to learn"}]}
Evidence:
${JSON.stringify(evidence, null, 2)}`;
  return generateJSON(prompt);
}

async function analyzeResume(resumeText, jdText) {
  const requirements = await extractRequirements(jdText);
  const evidence = await retrieveEvidence(requirements, resumeText);
  return judgeAndSuggest(evidence);
}

module.exports = { analyzeResume };