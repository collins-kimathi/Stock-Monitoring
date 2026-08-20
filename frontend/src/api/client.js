// Base URL for the Express backend. Defaults to the local dev server.
export const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // fall back to the status message
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function qs(params) {
  const query = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `?${query}` : '';
}

export const api = {
  products: {
    list: (params) => request(`/api/products${qs(params)}`),
    create: (payload) => request('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/products/${id}`, { method: 'DELETE' })
  },
  services: {
    list: () => request('/api/services'),
    create: (payload) => request('/api/services', { method: 'POST', body: JSON.stringify(payload) })
  },
  sales: {
    list: () => request('/api/sales'),
    create: (payload) => request('/api/sales', { method: 'POST', body: JSON.stringify(payload) })
  },
  movements: {
    list: (params) => request(`/api/movements${qs(params)}`),
    create: (payload) => request('/api/movements', { method: 'POST', body: JSON.stringify(payload) })
  },
  suppliers: {
    list: () => request('/api/suppliers'),
    create: (payload) => request('/api/suppliers', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/suppliers/${id}`, { method: 'DELETE' })
  },
  dashboard: {
    get: () => request('/api/dashboard')
  }
};