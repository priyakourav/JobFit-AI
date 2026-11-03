const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pinecone } = require('@pinecone-database/pinecone');

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

module.exports = { index };