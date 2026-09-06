const base = 'http://127.0.0.1:3000/api/v1';
async function req(method, path, opts = {}, body) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, headers: res.headers };
}
async function waitForApi(timeoutMs = 150000) {
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

  // 1. Health
  const live = await req('GET', '/health/live');
  const ready = await req('GET', '/health/ready');
  console.log('1. health/live:', live.status, JSON.stringify(live.data));
  console.log('2. health/ready:', ready.status, JSON.stringify(ready.data));

  // 2. Auth flow
  const ts = Date.now();
  const email = `gate.${ts}@opsly.test`;
  await req('POST', '/auth/register', {}, { email, password: 'GatePass123!', name: 'Gate' });
  const login = await req('POST', '/auth/login', {}, { email, password: 'GatePass123!' });
  const token = login.data?.accessToken;
  console.log('3. register+login:', !!token ? 'PASS token=' + token.slice(0, 12) + '...' : 'FAIL ' + JSON.stringify(login.data));

  // 3. Org create (unique name per run to avoid slug collision)
  const org = await req('POST', '/organizations', { headers: { Authorization: `Bearer ${token}` } }, { name: `Gate Org ${ts}` });
  const orgId = org.data?.id;
  console.log('4. org create:', org.status, orgId ? 'PASS' : JSON.stringify(org.data));

  // 4. Provider validation failure path (no real creds) - all 5 registered
  for (const p of ['render', 'cloudflare', 'neon', 'upstash', 'mongodb-atlas']) {
    const r = await req('POST', '/provider-connections', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } }, { name: 'gate-' + p, providerType: p, credentials: {} });
    const msg = r.data?.message || '';
    const adapterReached = r.status === 400 && /Provider validation failed/.test(msg);
    console.log(`5. provider ${p}:`, r.status, adapterReached ? 'PASS (adapter reached)' : msg);
  }

  // 5. Chat tools (10) - org-scoped endpoint
  const tools = await req('GET', '/chat/tools', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } });
  console.log('6. chat tools:', tools.status, Array.isArray(tools.data) ? `PASS (${tools.data.length})` : JSON.stringify(tools.data).slice(0, 80));

  // 6. Middleware headers + rate limit
  const h = await req('GET', '/health/live');
  console.log('7. header X-RateLimit-Limit:', h.headers.get('x-ratelimit-limit'));
  console.log('   header X-Content-Type-Options:', h.headers.get('x-content-type-options'));
  console.log('   header X-Frame-Options:', h.headers.get('x-frame-options'));
  console.log('   header Referrer-Policy:', h.headers.get('referrer-policy'));

  // 7. Audit / incidents / monitoring endpoints reachable
  const audits = await req('GET', '/audit', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } });
  const incidents = await req('GET', '/incidents', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } });
  const alerts = await req('GET', '/monitoring/alerts', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } });
  console.log('8. audit:', audits.status, '| incidents:', incidents.status, '| alerts:', alerts.status);
  console.log('GATE DONE');
})();