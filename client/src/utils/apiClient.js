const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const trimmedBaseUrl = rawBaseUrl.replace(/\/+$/, '');

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanedPath = path.replace(/^\/+/, '');

  if (!trimmedBaseUrl) {
    return `/${cleanedPath}`;
  }

  return `${trimmedBaseUrl}/${cleanedPath}`;
}

export function apiFetch(path, options) {
  const url = buildUrl(path);
  return fetch(url, options);
}

