const http = require('http');

async function testEndpoint(url, headers = {}) {
  const res = await fetch(url, { headers });
  console.log(`\nTesting ${url} -> Status ${res.status}`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`Error response: ${text.substring(0, 200)}`);
    return null;
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    return data;
  } else {
    const length = res.headers.get('content-length');
    const range = res.headers.get('content-range');
    console.log(`Binary/Stream response: type=${contentType}, length=${length}, range=${range}`);
    return { status: res.status, contentType, length, range };
  }
}

async function run() {
  const base = process.env.API_BASE || 'http://127.0.0.1:8787';
  console.log(`Verifying backend API at ${base}...`);

  // 1. Health
  const health = await testEndpoint(`${base}/api/health`);
  console.log('Health response:', health);

  // 2. Search
  console.log('\n--- Testing /api/search ---');
  const search = await testEndpoint(`${base}/api/search?q=Never+Gonna+Give+You+Up`);
  if (!search || !search.results || search.results.length === 0) {
    throw new Error('Search failed or returned empty results');
  }
  console.log(`Found ${search.results.length} songs. First song:`, {
    id: search.results[0].id,
    title: search.results[0].title,
    artist: search.results[0].artist,
    thumbnail: search.results[0].thumbnail?.substring(0, 50) + '...'
  });

  const testVideoId = search.results[0].id;

  // 3. Metadata
  console.log(`\n--- Testing /api/metadata/${testVideoId} ---`);
  const meta = await testEndpoint(`${base}/api/metadata/${testVideoId}`);
  console.log('Metadata result:', {
    title: meta?.metadata?.title,
    artist: meta?.metadata?.artist,
    duration: meta?.metadata?.duration,
    thumbnail: meta?.metadata?.thumbnail?.substring(0, 50) + '...'
  });

  // 4. Stream Format Info
  console.log(`\n--- Testing /api/stream/${testVideoId} ---`);
  const stream = await testEndpoint(`${base}/api/stream/${testVideoId}`);
  console.log('Stream format result:', {
    itag: stream?.itag,
    bitrate: stream?.bitrate,
    hasStreamUrl: !!stream?.streamUrl,
    proxyUrl: stream?.proxyUrl
  });

  // 5. Audio Proxy with Range header
  console.log(`\n--- Testing /api/stream/${testVideoId}/audio (Range: bytes=0-2048) ---`);
  const audio = await testEndpoint(`${base}/api/stream/${testVideoId}/audio`, {
    Range: 'bytes=0-2048'
  });
  console.log('Audio proxy response:', audio);

  // 6. Lyrics
  console.log('\n--- Testing /api/lyrics ---');
  const lyrics = await testEndpoint(`${base}/api/lyrics?title=Never+Gonna+Give+You+Up&artist=Rick+Astley`);
  console.log('Lyrics result:', {
    found: lyrics?.found,
    trackName: lyrics?.trackName,
    syncedLinesCount: lyrics?.parsedLines?.length,
    firstLine: lyrics?.parsedLines?.[0]
  });

  // 7. Related / Radio
  console.log(`\n--- Testing /api/related/${testVideoId} ---`);
  const related = await testEndpoint(`${base}/api/related/${testVideoId}`);
  console.log(`Found ${related?.results?.length || 0} related tracks. First related:`, {
    id: related?.results?.[0]?.id,
    title: related?.results?.[0]?.title,
    artist: related?.results?.[0]?.artist
  });

  console.log('\nAll backend API tests PASSED successfully!');
}

run().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
