const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('token');

  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      throw new Error('Backend server (port 5000) is not responding. Please run "npm run dev" or "node server.js".');
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new Error('Server returned invalid response. Ensure backend server on port 5000 is active.');
    }

    if (!response.ok) {
      // Clear invalid/expired token on 401 or 403 authorization failures
      if ((response.status === 401 || response.status === 403) && endpoint.startsWith('/admin')) {
        localStorage.removeItem('token');
      }
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError') {
      throw new Error('Network error — please check your connection and ensure Express backend is running on port 5000.');
    }
    throw err;
  }
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData }),
};

// ─── Formatting Helpers ──────────────────────────────────────
export function formatPrice(price) {
  return `₹${Number(price).toLocaleString('en-IN')}`;
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function calcDiscount(price, compareAtPrice) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
