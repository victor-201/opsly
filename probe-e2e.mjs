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
  const email = `t040c.${ts}@opsly.test`;
  await req('POST', '/auth/register', {}, { email, password: 'ProbePass123!', name: 'T040' });
  const token = (await req('POST', '/auth/login', {}, { email, password: 'ProbePass123!' })).data?.accessToken;
  const org = await req('POST', '/organizations', { headers: { Authorization: `Bearer ${token}` } }, { name: `T040C Ox ${ts}` });
  const orgId = org.data?.id;

  // 1. Valid object, no creds -> should 400 'API key is required' (adapter reaches validation)
  let r = await req('POST', '/provider-connections', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } }, { name: 'no-creds', providerType: 'render', credentials: {} });
  console.log('render {} creds ->', r.status, JSON.stringify(r.data));

  // 2. Fake creds -> should 400 'Provider validation failed...' (real API call attempted, fails gracefully; status stored 'invalid')
  r = await req('POST', '/provider-connections', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } }, { name: 'fake', providerType: 'render', credentials: { apiKey: 'rp_fake_probe_key_0000' } });
  console.log('render fake-creds ->', r.status, JSON.stringify(r.data));

  // 3. Unknown provider -> should 400 'must be one of the following values'
  r = await req('POST', '/provider-connections', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } }, { name: 'unknown', providerType: 'nope', credentials: {} });
  console.log('unknown-provider ->', r.status, JSON.stringify(r.data));

  // 4. Valid provider list (all 5 registered)
  r = await req('POST', '/provider-connections', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } }, { name: 'cloudflare', providerType: 'cloudflare', credentials: {} });
  console.log('cloudflare {} creds ->', r.status, JSON.stringify(r.data));

  // 5. Check connection list (should include invalid-status entries created before failure)
  r = await req('GET', '/provider-connections', { headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': orgId } });
  console.log('GET connections ->', r.status, 'count=', r.data?.length, JSON.stringify(r.data));
})();