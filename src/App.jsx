import { useEffect, useMemo, useState } from "react";
import { fetchAdsPage } from "./api.js";

const PAGE_SIZE = 25;

const CATEGORIES = [
  { label: "Cars", icon: "🚗" },
  { label: "Bikes", icon: "🏍️" },
  { label: "Mobiles", icon: "📱" },
  { label: "Laptops", icon: "💻" },
  { label: "Houses", icon: "🏠" },
  { label: "Properties", icon: "🏢" },
  { label: "Jobs", icon: "💼" },
  { label: "House Movers", icon: "🚚" }
];

const DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
  "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar"
];

function getTitle(ad) {
  return ad.title || ad.name || "Untitled Ad";
}

function getLocation(ad) {
  return ad.location || ad.area || ad.district || "Tamil Nadu";
}

function getPrice(ad) {
  if (ad.price === null || ad.price === undefined || ad.price === "") {
    return "Price on request";
  }
  return typeof ad.price === "number"
    ? `₹${ad.price.toLocaleString("en-IN")}`
    : String(ad.price);
}

function getImage(ad) {
  return ad.image_url || ad.image || ad.imageUrl || "";
}

function isPaidAd(ad) {
  const paidValue = String(
    ad.is_paid ?? ad.paid ?? ad.is_premium ?? ad.premium ?? ad.ad_type ?? ad.plan ?? ""
  ).toLowerCase();
  const status = String(ad.promotion_status || ad.payment_status || "").toLowerCase();
  return ["true", "1", "paid", "premium", "promoted", "featured"].includes(paidValue) ||
    ["paid", "active", "success", "completed"].includes(status) &&
    Boolean(ad.is_paid || ad.paid || ad.is_premium || ad.premium || ad.promotion_status);
}

function getAdDate(ad) {
  const value = ad.created_at || ad.createdAt || ad.posted_at || ad.postedAt || ad.published_at || ad.date || "";
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortAds(ads) {
  return [...ads].sort((a, b) => {
    const paidDifference = Number(isPaidAd(b)) - Number(isPaidAd(a));
    if (paidDifference !== 0) return paidDifference;
    return getAdDate(b) - getAdDate(a);
  });
}

export default function App() {
  const [ads, setAds] = useState([]);
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState("Loading live ads…");

  useEffect(() => {
    setPage(1);
  }, [category, district, search]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchAdsPage({
          category,
          district,
          search,
          page,
          limit: PAGE_SIZE
        });
        if (cancelled) return;
        const liveAds = Array.isArray(result?.ads) ? result.ads : [];
        setAds(sortAds(liveAds));
        setHasMore(Boolean(result?.hasMore));
        setTotal(typeof result?.total === "number" ? result.total : null);
        setApiMessage(liveAds.length
          ? "Showing live ads from 24Adz."
          : "No live ads found for this page. Try another search or category.");
      } catch (error) {
        if (!cancelled) {
          setAds([]);
          setHasMore(false);
          setTotal(null);
          setApiMessage(`Could not load live ads: ${error?.message || "Please try again."}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [category, district, search, page]);

  const visibleAds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ads.filter((ad) => {
      const matchesCategory = !category || String(ad.category || "").toLowerCase() === category.toLowerCase();
      const adDistrict = String(ad.district || getLocation(ad)).toLowerCase();
      const matchesDistrict = !district || adDistrict.includes(district.toLowerCase());
      const matchesSearch = !q || `${getTitle(ad)} ${ad.description || ""} ${getLocation(ad)} ${ad.category || ""}`.toLowerCase().includes(q);
      return matchesCategory && matchesDistrict && matchesSearch;
    });
  }, [ads, category, district, search]);

  function clearFilters() {
    setCategory("");
    setDistrict("");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="24Adz home">
          <span className="brand-mark">24</span><span className="brand-text">Adz<span>.com</span></span>
        </a>
        <div className="top-note">Tamil Nadu Classifieds</div>
        <a className="post-button" href="#how-to-post">＋ Post Ad</a>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><span className="live-dot" /> LOCAL FINDS. BETTER DEALS.</div>
          <h1>Find it nearby.<br /><span>Make it yours.</span></h1>
          <p>Discover cars, bikes, mobiles, properties and jobs across Tiruppur and Tamil Nadu.</p>
          <div className="search-panel">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="What are you looking for?" aria-label="Search ads" />
            </label>
            <label className="select-field">
              <span>District</span>
              <select value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="Select district">
                <option value="">All Tamil Nadu</option>
                {DISTRICTS.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <button className="search-button" onClick={() => document.querySelector(".ads-section")?.scrollIntoView({ behavior: "smooth" })}>Search Ads</button>
          </div>
          <div className="hero-foot"><span>✓ Local listings</span><span>✓ Simple search</span><span>✓ Buyer safety first</span></div>
        </section>

        <section className="section category-section">
          <div className="section-heading">
            <div><p className="kicker">BROWSE BY CATEGORY</p><h2>What are you looking for?</h2></div>
            <button className="text-button" onClick={clearFilters}>Clear filters ↗</button>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((item) => (
              <button key={item.label} className={`category-card ${category === item.label ? "selected" : ""}`} onClick={() => setCategory(category === item.label ? "" : item.label)} aria-pressed={category === item.label}>
                <span className="category-icon">{item.icon}</span><span>{item.label}</span><span className="category-arrow">↗</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section ads-section">
          <div className="section-heading">
            <div><p className="kicker">FRESH FROM YOUR AREA</p><h2>{category ? `${category} for you` : "Latest ads"}</h2></div>
            <span className="result-count">{total !== null ? `${total} listings` : `${visibleAds.length} listings on this page`}</span>
          </div>
          <div className="api-status" role="status"><span className="status-dot" />{loading ? "Loading ads…" : apiMessage}</div>
          {visibleAds.length ? (
            <div className="ads-grid">
              {visibleAds.map((ad, index) => (
                <article className="ad-card" key={ad.id || ad.ad_id || `${getTitle(ad)}-${index}`}>
                  <div className="ad-image">
                    {getImage(ad) ? <img src={getImage(ad)} alt={getTitle(ad)} loading="lazy" /> : <div className="image-placeholder"><span>{CATEGORIES.find((c) => c.label.toLowerCase() === String(ad.category || "").toLowerCase())?.icon || "✦"}</span><small>24Adz Marketplace</small></div>}
                    {isPaidAd(ad) && <span className="premium-badge">★ PREMIUM</span>}
                  </div>
                  <div className="ad-content">
                    <div className="ad-category">{ad.category || "CLASSIFIED"}</div>
                    <h3>{getTitle(ad)}</h3>
                    <p className="ad-description">{ad.description || "Contact the advertiser for more details."}</p>
                    <div className="ad-meta"><span>⌖ {getLocation(ad)}</span><strong>{getPrice(ad)}</strong></div>
                    <div className="ad-actions">
                      {ad.phone || ad.contact_phone ? <a href={`tel:${ad.phone || ad.contact_phone}`}>Call</a> : <span className="disabled-action">Call</span>}
                      {ad.whatsapp || ad.whatsapp_number ? <a className="whatsapp-link" href={`https://wa.me/${String(ad.whatsapp || ad.whatsapp_number).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a> : <span className="disabled-action">WhatsApp</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : !loading ? (
            <div className="empty-state"><span>⌕</span><h3>No live ads found</h3><p>Try another search or clear the filters. Demo listings are not shown as real ads.</p><button className="search-button" onClick={clearFilters}>Show all ads</button></div>
          ) : null}

          <div className="section-heading" style={{ marginTop: 24, alignItems: "center" }}>
            <button className="text-button" disabled={page <= 1 || loading} onClick={() => { setPage((current) => Math.max(1, current - 1)); document.querySelector(".ads-section")?.scrollIntoView({ behavior: "smooth" }); }} style={{ opacity: page <= 1 || loading ? 0.45 : 1, cursor: page <= 1 || loading ? "not-allowed" : "pointer" }}>← Previous</button>
            <span className="result-count">Page {page}</span>
            <button className="text-button" disabled={!hasMore || loading} onClick={() => { setPage((current) => current + 1); document.querySelector(".ads-section")?.scrollIntoView({ behavior: "smooth" }); }} style={{ opacity: !hasMore || loading ? 0.45 : 1, cursor: !hasMore || loading ? "not-allowed" : "pointer" }}>Next 25 Ads →</button>
          </div>
        </section>

        <section className="safety-banner" id="how-to-post">
          <div><p className="kicker">STAY SAFE</p><h2>Smart deals start with safe choices.</h2><p>Inspect items, verify the seller, and never send an advance payment to an unknown person.</p></div>
          <div className="safety-icon">✓</div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand" href="/"><span className="brand-mark">24</span><span className="brand-text">Adz<span>.com</span></span></a>
        <span>Local classifieds for Tamil Nadu.</span>
        <span>© {new Date().getFullYear()} 24Adz.com</span>
      </footer>
    </div>
  );
}
