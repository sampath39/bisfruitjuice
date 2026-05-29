import fs from 'fs';
import path from 'path';

const logPath = 'C:\\Users\\Sampath\\.gemini\\antigravity-ide\\brain\\1f4e38b3-c7d5-47c3-8605-46a07d1b6787\\.system_generated\\logs\\transcript.jsonl';

function searchLogs() {
  try {
    if (!fs.existsSync(logPath)) {
      console.log('Log file does not exist at:', logPath);
      return;
    }

    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    console.log(`Total log lines: ${lines.length}`);

    // Search for patterns
    const patterns = [
      /postgresql:\/\//i,
      /db_password/i,
      /postgres:[^@\s]+/i,
      /lgztolrpwgdydrxxiejn/i
    ];

    let foundCount = 0;
    lines.forEach((line, idx) => {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          console.log(`\n[Line ${idx + 1}] Match found for pattern ${pattern}:`);
          // Print a snippet around the match
          const matchIdx = line.search(pattern);
          const start = Math.max(0, matchIdx - 100);
          const end = Math.min(line.length, matchIdx + 200);
          console.log(line.substring(start, end));
          foundCount++;
          break; // move to next line
        }
      }
    });

    console.log(`\nTotal matches found: ${foundCount}`);
  } catch (err) {
    console.error('Error reading logs:', err);
  }
}

searchLogs();
