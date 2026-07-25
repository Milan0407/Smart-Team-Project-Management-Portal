const trimTrailingSlash = (value) => value?.trim().replace(/\/+$/, "") || "";

const getApiBaseUrl = () => {
  let url = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api");
  if (url && !url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
};

export const API_BASE_URL = getApiBaseUrl();

export const SOCKET_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"
);

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const assetUrl = (path = "") => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

