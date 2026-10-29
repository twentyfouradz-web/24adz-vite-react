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
  return Boolean(
    ad.is_paid || ad.paid || ad.premium || ad.is_premium ||
    ad.isPremium || ad.plan === "paid" || ad.ad_type === "paid"
  );
}

export default function App() {
  const [ads, setAds] = useState([]);
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState("Loading live ads…");

  useEffect(() => {
    let cancelled = false;

    async function loadAds() {
      setLoading(true);
      setApiMessage("Loading live ads…");

      try {
        const result = await fetchAdsPage({
          category,
          district,
          search,
          page,
          limit: PAGE_SIZE
        });

        if (cancelled) return;

        // Paid listings appear before free listings on the current page.
        // Global paid-first ordering must also be applied by the API/SQL query.
        const sortedAds = [...result.ads].sort(
          (a, b) => Number(isPaidAd(b)) - Number(isPaidAd(a))
        );

        setAds(sortedAds);
        setTotal(result.total);
        setHasMore(result.hasMore);
        setApiMessage(
          result.ads.length
            ? `Showing live ads — page ${result.page}.`
            : page > 1
              ? "No more ads on this page. Go to the previous page."
              : "No live ads found. Try another search or clear the filters."
        );
      } catch (error) {
        if (!cancelled) {
          setAds([]);
          setTotal(null);
          setHasMore(false);
          setApiMessage(`Unable to load live ads: ${error.message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAds();
    return () => { cancelled = true; };
  }, [category, district, search, page]);

  // If a filter changes, start again from page 1.
  function changeCategory(value) {
    setCategory(value);
    setPage(1);
  }

  function changeDistrict(value) {
    setDistrict(value);
    setPage(1);
  }

  function changeSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function clearFilters() {
    setCategory("");
    setDistrict("");
    setSearch("");
    setPage(1);
  }

  const pageLabel = useMemo(() => {
    if (total !== null) {
      if (total === 0) return "0 listings";
      const start = (page - 1) * PAGE_SIZE + 1;
      const end = Math.min(page * PAGE_SIZE, total);
      return `${start}–${end} of ${total} listings`;
    }
    return `${ads.length} listings · Page ${page}`;
  }, [ads.length, page, total]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="24Adz home">
          <span className="brand-mark">24</span>
          <span className="brand-text">Adz<span>.com</span></span>
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
              <input
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="What are you looking for?"
                aria-label="Search ads"
              />
            </label>
            <label className="select-field">
              <span>District</span>
              <select value={district} onChange={(event) => changeDistrict(event.target.value)} aria-label="Select district">
                <option value="">All Tamil Nadu</option>
                <option value="Ariyalur">Ariyalur</option>
                <option value="Chengalpattu">Chengalpattu</option>
                <option value="Chennai">Chennai</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Cuddalore">Cuddalore</option>
                <option value="Dharmapuri">Dharmapuri</option>
                <option value="Dindigul">Dindigul</option>
                <option value="Erode">Erode</option>
                <option value="Kallakurichi">Kallakurichi</option>
                <option value="Kancheepuram">Kancheepuram</option>
                <option value="Kanniyakumari">Kanniyakumari</option>
                <option value="Karur">Karur</option>
                <option value="Krishnagiri">Krishnagiri</option>
                <option value="Madurai">Madurai</option>
                <option value="Mayiladuthurai">Mayiladuthurai</option>
                <option value="Nagapattinam">Nagapattinam</option>
                <option value="Namakkal">Namakkal</option>
                <option value="Nilgiris">Nilgiris</option>
                <option value="Perambalur">Perambalur</option>
                <option value="Pudukkottai">Pudukkottai</option>
                <option value="Ramanathapuram">Ramanathapuram</option>
                <option value="Ranipet">Ranipet</option>
                <option value="Salem">Salem</option>
                <option value="Sivaganga">Sivaganga</option>
                <option value="Tenkasi">Tenkasi</option>
                <option value="Thanjavur">Thanjavur</option>
                <option value="Theni">Theni</option>
                <option value="Thoothukudi">Thoothukudi</option>
                <option value="Tiruchirappalli">Tiruchirappalli</option>
                <option value="Tirunelveli">Tirunelveli</option>
                <option value="Tirupathur">Tirupathur</option>
                <option value="Tiruppur">Tiruppur</option>
                <option value="Tiruvallur">Tiruvallur</option>
                <option value="Tiruvannamalai">Tiruvannamalai</option>
                <option value="Tiruvarur">Tiruvarur</option>
                <option value="Vellore">Vellore</option>
                <option value="Viluppuram">Viluppuram</option>
                <option value="Virudhunagar">Virudhunagar</option>
              </select>
            </label>
            <button className="search-button" onClick={() => window.scrollTo({ top: 570, behavior: "smooth" })}>Search Ads</button>
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
              <button
                key={item.label}
                className={`category-card ${category === item.label ? "selected" : ""}`}
                onClick={() => changeCategory(category === item.label ? "" : item.label)}
                aria-pressed={category === item.label}
              >
                <span className="category-icon">{item.icon}</span>
                <span>{item.label}</span>
                <span className="category-arrow">↗</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section ads-section" id="ads-list">
          <div className="section-heading">
            <div><p className="kicker">FRESH FROM YOUR AREA</p><h2>{category ? `${category} for you` : "Latest ads"}</h2></div>
            <span className="result-count">{pageLabel}</span>
          </div>
          <div className="api-status" role="status" aria-live="polite">
            <span className="status-dot" />{loading ? "Loading ads…" : apiMessage}
          </div>

          {ads.length ? (
            <>
              <div className="ads-grid">
                {ads.map((ad, index) => (
                  <article className="ad-card" key={ad.id || ad.ad_id || `${getTitle(ad)}-${index}`}>
                    <div className="ad-image">
                      {getImage(ad)
                        ? <img src={getImage(ad)} alt={getTitle(ad)} loading="lazy" />
                        : <div className="image-placeholder"><span>{CATEGORIES.find((item) => item.label.toLowerCase() === String(ad.category || "").toLowerCase())?.icon || "✦"}</span><small>24Adz Marketplace</small></div>}
                      {isPaidAd(ad) && <span className="premium-badge">★ PREMIUM</span>}
                    </div>
                    <div className="ad-content">
                      <div className="ad-category">{ad.category || "CLASSIFIED"}</div>
                      <h3>{getTitle(ad)}</h3>
                      <p className="ad-description">{ad.description || "Contact the advertiser for more details."}</p>
                      <div className="ad-meta"><span>⌖ {getLocation(ad)}</span><strong>{getPrice(ad)}</strong></div>
                      <div className="ad-actions">
                        {(ad.phone || ad.contact_phone)
                          ? <a href={`tel:${ad.phone || ad.contact_phone}`}>Call</a>
                          : <span className="disabled-action">Call</span>}
                        {(ad.whatsapp || ad.whatsapp_number)
                          ? <a className="whatsapp-link" href={`https://wa.me/${String(ad.whatsapp || ad.whatsapp_number).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                          : <span className="disabled-action">WhatsApp</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="pagination-controls" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
                <button className="search-button" disabled={loading || page <= 1} onClick={() => { setPage((current) => Math.max(1, current - 1)); document.getElementById("ads-list")?.scrollIntoView({ behavior: "smooth" }); }}>← Previous</button>
                <span className="result-count">Page {page}{total !== null ? ` · ${total} total ads` : ""}</span>
                <button className="search-button" disabled={loading || !hasMore} onClick={() => { setPage((current) => current + 1); document.getElementById("ads-list")?.scrollIntoView({ behavior: "smooth" }); }}>Next →</button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span>⌕</span>
              <h3>{loading ? "Loading ads…" : "No ads found"}</h3>
              <p>{loading ? "Please wait while we fetch live listings." : "No live listings match your search. Try another search or clear the filters."}</p>
              {!loading && <button className="search-button" onClick={clearFilters}>Show all ads</button>}
            </div>
          )}
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
