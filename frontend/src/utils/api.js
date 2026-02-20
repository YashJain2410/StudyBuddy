const API_BASE = import.meta.env.VITE_API_URL || "";

export const apiFetch = (path, options = {}) => {
  return apiFetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
};