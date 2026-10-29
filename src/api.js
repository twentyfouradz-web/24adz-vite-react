const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export async function fetchAds({ category = "", district = "", search = "" } = {}) {
  if (!API_BASE) throw new Error("API base URL is not configured.");

  const url = new URL(`${API_BASE}/ads`);
  url.searchParams.set("limit", "25");
  if (category) url.searchParams.set("category", category);
  if (district) url.searchParams.set("district", district);
  if (search) url.searchParams.set("search", search);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Ads API returned HTTP ${response.status}.`);
  }

  const data = await response.json();
  // Supports common API response shapes; verify against the actual Worker response.
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.ads)) return data.ads;
  if (Array.isArray(data.results)) return data.results;
  return [];
}