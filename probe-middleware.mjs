const base = 'http://127.0.0.1:3000/api/v1';
async function waitForApi(timeoutMs = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(base + '/health/live');
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}
(async () => {
  const up = await waitForApi();
  console.log('API reachable:', up);
  if (!up) process.exit(1);

  const r = await fetch(base + '/health/live');
  console.log('health status:', r.status);
  console.log('X-RateLimit-Limit:', r.headers.get('x-ratelimit-limit'));
  console.log('X-RateLimit-Remaining:', r.headers.get('x-ratelimit-remaining'));
  console.log('X-Content-Type-Options:', r.headers.get('x-content-type-options'));
  console.log('X-Frame-Options:', r.headers.get('x-frame-options'));
  console.log('Referrer-Policy:', r.headers.get('referrer-policy'));

  console.log('--- hammer rate limit (130 rapid requests) ---');
  let got429 = false;
  const t0 = Date.now();
  const batch = [];
  for (let i = 0; i < 130; i++) {
    batch.push(fetch(base + '/health/live').then((res) => {
      if (res.status === 429) got429 = true;
    }).catch(() => {}));
  }
  await Promise.all(batch);
  console.log('requests/sec rate:', 'n/a', 'saw 429:', got429, 'window:', Date.now() - t0, 'ms');
})();