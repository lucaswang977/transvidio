// Get logs from Vercel KV storage
// usage: dotenv -e .env -- npm run serverLog 2023-07-24

import { kv } from '@vercel/kv'

const inputDate = process.argv[2];
if (!inputDate || !/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
  console.error("Please provide a valid date in the format YYYY-MM-DD.");
  process.exit(1);
}

async function fetchLogs(date: string) {
  const key = `logs:${date}`;
  const result = await kv.zrange<string[]>(key, 0, -1)
  result.forEach(item => {
    console.log(item)
  })
}

await fetchLogs(inputDate);
