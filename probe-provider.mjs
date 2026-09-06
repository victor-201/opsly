const base = 'http://127.0.0.1:3000/api/v1';
async function req(method, path, opts = {}, body) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers||{}) };
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
(async () => {
  const ts = Date.now();
  const email = `t040.${ts}@opsly.test`;
  let r = await req('POST', '/auth/register', {}, { email, password: 'ProbePass123!', name: 'T040' });
  const token = (await req('POST', '/auth/login', {}, { email, password: 'ProbePass123!' })).data?.accessToken;
  r = await req('POST', '/organizations', { headers: { Authorization: `Bearer ${token}` } }, { name: 'T040 Org' });
  const orgId = r.data?.id;

  // CREATE with providerType 'render', no creds
  r = await req('POST', '/provider-connections', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } }, { name: 'probe', providerType: 'render' });
  console.log('create render no-creds ->', r.status, JSON.stringify(r.data));

  // CREATE with fake creds
  r = await req('POST', '/provider-connections', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } }, { name: 'probe2', providerType: 'render', credentials: { apiKey: 'fake-key-for-probe' } });
  console.log('create render fake-creds ->', r.status, JSON.stringify(r.data));

  // CREATE with unknown provider
  r = await req('POST', '/provider-connections', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } }, { name: 'probe3', providerType: 'nonexistent', credentials: {} });
  console.log('create unknown-provider ->', r.status, JSON.stringify(r.data));
})();