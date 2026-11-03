const path = require('path');
const fs = require('fs');
const { parseResumePDF } = require('./parseResume');
const { chunkText } = require('./chunkText');
const { embedTexts } = require('../embeddings/embedText');
const { index } = require('../vectorstore/pineconeClient');

const dataDir = path.join(__dirname, '../../../data');

async function run() {
  // 1. Resume: parse -> chunk -> embed -> store
  const resumeText = await parseResumePDF(path.join(dataDir, 'sample-resume.pdf'));
  const resumeChunks = chunkText(resumeText);
  const resumeVectors = await embedTexts(resumeChunks);

  const records = resumeChunks.map((text, i) => ({
    id: `resume-${i}`,
    values: resumeVectors[i],
    metadata: { text },
  }));
  await index.namespace('resume').upsert({ records });
  console.log(`Stored ${records.length} resume chunks`);

  // Pinecone ko data searchable hone mein thoda time lagta hai
  await new Promise((r) => setTimeout(r, 8000));

  // 2. JD: chunk -> embed -> find best resume match for each line
  const jdText = fs.readFileSync(path.join(dataDir, 'sample-jd.txt'), 'utf-8');
  const jdChunks = chunkText(jdText);
  const jdVectors = await embedTexts(jdChunks);

  for (let i = 0; i < jdChunks.length; i++) {
    const res = await index.namespace('resume').query({
      vector: jdVectors[i],
      topK: 1,
      includeMetadata: true,
    });
    const best = res.matches[0];
    console.log('\nJD    :', jdChunks[i]);
    console.log('RESUME:', best?.metadata?.text, '| score:', best?.score?.toFixed(3));
  }
}

run().catch(console.error);