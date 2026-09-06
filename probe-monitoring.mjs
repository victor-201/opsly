const base = 'http://127.0.0.1:3000/api/v1';
async function req(method, path) {
  const t0 = Date.now();
  const res = await fetch(base + path, { method });
  const ms = Date.now() - t0;
  await res.arrayBuffer();
  return { status: res.status, ms };
}
async function waitForApi(timeoutMs = 90000) {
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
  console.log('API reachable after boot:', up);
  if (!up) process.exit(1);

  const results = { live: [], ready: [] };
  for (let i = 0; i < 5; i++) {
    try {
      results.live.push(await req('GET', '/health/live'));
    } catch (e) { results.live.push({ status: 0, ms: -1, err: String(e) }); }
    try {
      results.ready.push(await req('GET', '/health/ready'));
    } catch (e) { results.ready.push({ status: 0, ms: -1, err: String(e) }); }
    await new Promise((r) => setTimeout(r, 3000));
  }

  const summarize = (arr) => {
    const ok = arr.filter((x) => x.status === 200);
    const lat = ok.map((x) => x.ms);
    const avg = lat.length ? (lat.reduce((a, b) => a + b, 0) / lat.length).toFixed(1) : 0;
    const max = lat.length ? Math.max(...lat) : 0;
    return `${ok.length}/${arr.length} ok, avg ${avg}ms, max ${max}ms, failures: ${arr.filter((x) => x.status !== 200).map((x) => JSON.stringify(x)).join(', ') || 'none'}`;
  };
  console.log('LIVE  ->', summarize(results.live));
  console.log('READY ->', summarize(results.ready));
})();