const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function parsePDFBuffer(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function parseResumePDF(filePath) {
  return parsePDFBuffer(fs.readFileSync(filePath));
}

module.exports = { parseResumePDF, parsePDFBuffer };