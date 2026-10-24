
const { parseResumePDF } = require('./parseResume');

async function test() {
 const text = await parseResumePDF('../../../data/sample-resume.pdf');
  console.log('--- Extracted Text ---');
  console.log(text);
  console.log('--- Total characters:', text.length, '---');
}

test();