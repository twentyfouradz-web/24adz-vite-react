
// ============================================
// 24Adz.com - API CLIENT
// Cloudflare Workers API Connection
// ============================================

// Production API URL
// Cloudflare Pages Environment Variable:
// VITE_API_BASE_URL=https://api.24adz.com

const configuredBase = import.meta.env.VITE_API_BASE_URL;

const fallbackBase = import.meta.env.PROD
  ? "https://api.24adz.com"
  : "http://localhost:8787";

const API_BASE = (
  configuredBase || fallbackBase
).replace(/\/+$/, "");

// ============================================
// AUTH TOKEN MANAGEMENT
// ============================================

const TOKEN_KEY = "24adz_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ============================================
// MAIN API REQUEST FUNCTION
// ============================================

export async function api(path, options = {}) {
  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),

    ...(options.headers || {}),
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const cleanPath = path.startsWith("/")
    ? path
    : `/${path}`;

  let response;

  try {
    response = await fetch(`${API_BASE}${cleanPath}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      `API connection failed. Check API URL and Cloudflare Worker. (${error.message})`
    );
  }

  const responseText = await response.text();

  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        `API returned an invalid response (${response.status}).`
      );
    }
  }

  if (
    !response.ok ||
    data.ok === false ||
    data.success === false
  ) {
    throw new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

// ============================================
// IMAGE UPLOAD - CLOUDFLARE R2
// ============================================

export async function uploadImage(file) {
  if (!file) {
    throw new Error("Please select an image.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Only JPG, PNG and WEBP images are allowed."
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error(
      "Image size must be 5 MB or smaller."
    );
  }

  const form = new FormData();

  form.append("file", file);

  return api("/api/uploads", {
    method: "POST",
    body: form,
  });
}

// ============================================
// API HEALTH CHECK
// ============================================

export async function checkApiHealth() {
  return api("/api/health");
}

// ============================================
// 24ADZ API CLIENT END
// ============================================
