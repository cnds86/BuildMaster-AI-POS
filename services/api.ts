
// Use window.location.hostname if available, otherwise default to localhost
const getBaseHost = () => {
  if (typeof window === 'undefined') return 'localhost';
  // Fallback to localhost if hostname is empty (e.g., when running via file:// or specific local setups)
  return window.location.hostname || 'localhost';
};

const BASE_HOST = getBaseHost();
const API_URL = `http://${BASE_HOST}:3001/api`;

export const api = {
  get: async (endpoint: string) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      return res.json();
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },
  post: async (endpoint: string, data: any) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `POST failed with ${res.status}`);
      }
      return res.json();
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  },
  put: async (endpoint: string, data: any) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`PUT failed with ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  },
  delete: async (endpoint: string) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`DELETE failed with ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
};
