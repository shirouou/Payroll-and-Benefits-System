const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const logPath = path.join(__dirname, '../logs/combined.log');

const parseLogLine = line => {
  const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[([^\]]+)\]: (.*)$/);
  if (!match) return null;

  return {
    timestamp: match[1],
    level: match[2].toLowerCase(),
    message: match[3],
  };
};

router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(logPath)) return res.json({ success: true, data: [] });

    const entries = fs.readFileSync(logPath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map(parseLogLine)
      .filter(Boolean)
      .slice(-200)
      .reverse();

    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to read audit log' });
  }
});

module.exports = router;
