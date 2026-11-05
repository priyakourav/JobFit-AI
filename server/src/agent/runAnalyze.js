const path = require('path');
const fs = require('fs');
const { parseResumePDF } = require('../ingest/parseResume');
const { analyzeResume } = require('./analyze');

const dataDir = path.join(__dirname, '../../../data');

async function run() {
  const resumeText = await parseResumePDF(path.join(dataDir, 'sample-resume.pdf'));
  const jdText = fs.readFileSync(path.join(dataDir, 'sample-jd.txt'), 'utf-8');
  const result = await analyzeResume(resumeText, jdText);
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);