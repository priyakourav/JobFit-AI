const express = require('express');
const multer = require('multer');
const { parsePDFBuffer } = require('../ingest/parseResume');
const { analyzeResume } = require('../agent/analyze');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    const jd = (req.body.jd || '').trim();
    if (!req.file) return res.status(400).json({ error: 'Resume PDF is required' });
    if (req.file.mimetype !== 'application/pdf')
      return res.status(400).json({ error: 'Only PDF resumes are supported' });
    if (jd.length < 50)
      return res.status(400).json({ error: 'Please paste a longer job description' });

    const resumeText = await parsePDFBuffer(req.file.buffer);
    if (resumeText.trim().length < 50)
      return res.status(422).json({ error: 'Could not read text from this PDF' });

    const result = await analyzeResume(resumeText, jd);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

module.exports = router;