const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/+$/, "");

function buildAdsUrl({
  category = "",
  district = "",
  search = "",
  page = 1,
  limit = 25
} = {}) {
  if (!API_BASE) {
    throw new Error(
      "API URL missing. Set VITE_API_BASE_URL in Cloudflare Pages environment variables."
    );
  }

  const safePage = Math.max(
    1,
    Number.parseInt(page, 10) || 1
  );

  const safeLimit = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || 25)
  );

  const url = new URL(`${API_BASE}/ads`);

  url.searchParams.set("page", String(safePage));
  url.searchParams.set("limit", String(safeLimit));
  url.searchParams.set(
    "offset",
    String((safePage - 1) * safeLimit)
  );

  if (category && category !== "All Categories") {
    url.searchParams.set("category", category);
  }

  if (district && district !== "All Tamil Nadu") {
    url.searchParams.set("district", district);
  }

  if (search.trim()) {
    url.searchParams.set("search", search.trim());
  }

  return url;
}

async function requestAds({
  category = "",
  district = "",
  search = "",
  page = 1,
  limit = 25
} = {}) {
  const url = buildAdsUrl({
    category,
    district,
    search,
    page,
    limit
  });

  let response;

  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
  } catch (error) {
    throw new Error(
      "Ads API connection failed. Check VITE_API_BASE_URL, Worker deployment and CORS settings. " +
      (error?.message || "")
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      throw new Error("Ads API returned invalid JSON.");
    }
  } else {
    const body = await response.text();

    throw new Error(
      `Ads API returned a non-JSON response. HTTP ${response.status}. ` +
      body.slice(0, 150)
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Ads API error: HTTP ${response.status}`
    );
  }

  let ads;

  if (Array.isArray(data)) {
    ads = data;
  } else if (Array.isArray(data?.ads)) {
    ads = data.ads;
  } else if (Array.isArray(data?.results)) {
    ads = data.results;
  } else if (Array.isArray(data?.data)) {
    ads = data.data;
  } else {
    throw new Error(
      'Invalid API response. Expected an array of ads or { "ads": [...] }.'
    );
  }

  const currentPage =
    Number(data?.page) ||
    Math.max(1, Number.parseInt(page, 10) || 1);

  const currentLimit =
    Number(data?.limit) ||
    Math.max(1, Number.parseInt(limit, 10) || 25);

  const total =
    data?.total != null &&
    Number.isFinite(Number(data.total))
      ? Number(data.total)
      : null;

  const hasMore =
    typeof data?.hasMore === "boolean"
      ? data.hasMore
      : typeof data?.has_more === "boolean"
        ? data.has_more
        : total !== null
          ? currentPage * currentLimit < total
          : ads.length >= currentLimit;

  return {
    ads,
    page: currentPage,
    limit: currentLimit,
    total,
    hasMore
  };
}

// Fetch the first 25 ads.
// Keeps compatibility with App.jsx code using fetchAds().
export async function fetchAds({
  category = "",
  district = "",
  search = ""
} = {}) {
  const result = await requestAds({
    category,
    district,
    search,
    page: 1,
    limit: 25
  });

  return result.ads;
}

// Fetch a specific page of ads.
export async function fetchAdsPage({
  category = "",
  district = "",
  search = "",
  page = 1,
  limit = 25
} = {}) {
  return requestAds({
    category,
    district,
    search,
    page,
    limit
  });
}
