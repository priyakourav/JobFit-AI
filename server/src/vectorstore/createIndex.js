const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pinecone } = require('@pinecone-database/pinecone');

async function main() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  await pc.createIndex({
    name: process.env.PINECONE_INDEX || 'jobfit-ai',
    dimension: 768,
    metric: 'cosine',
    spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
    waitUntilReady: true,
  });
  console.log('Index created');
}

main().catch(console.error);