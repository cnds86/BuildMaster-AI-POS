
/**
 * API Service stubbed out for Local-Only mode.
 * This prevents the application from attempting to contact a backend server.
 */
export const api = {
  get: async (endpoint: string) => {
    // Silently return empty data to prevent "Failed to fetch" errors
    console.debug(`[Local Mode] GET ${endpoint} intercepted`);
    return [];
  },
  post: async (endpoint: string, data: any) => {
    console.debug(`[Local Mode] POST ${endpoint} intercepted`, data);
    return { ...data, id: `local-${Date.now()}` };
  },
  put: async (endpoint: string, data: any) => {
    console.debug(`[Local Mode] PUT ${endpoint} intercepted`, data);
    return data;
  },
  delete: async (endpoint: string) => {
    console.debug(`[Local Mode] DELETE ${endpoint} intercepted`);
    return { success: true };
  }
};
