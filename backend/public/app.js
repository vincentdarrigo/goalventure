// Shared helpers for the partner web view. No build step, no framework —
// this page's whole job is "glance at a partner's daily summary," which
// doesn't justify more than vanilla JS + fetch.

const STORAGE_KEY = 'goalventure_credential';

function getCredential() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCredential(credential) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credential));
}

function clearCredential() {
  localStorage.removeItem(STORAGE_KEY);
}

async function api(path, options = {}) {
  const credential = getCredential();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (credential) {
    headers.Authorization = `Bearer ${credential.accountId}.${credential.accountSecret}`;
  }

  const response = await fetch(path, { ...options, headers });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const error = new Error(body?.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}
