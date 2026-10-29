import { useEffect, useMemo, useState } from "react";
import { fetchAdsPage } from "./api.js";
import { supabase } from "./supabase.js";

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
    (["paid", "active", "success", "completed"].includes(status) &&
      Boolean(ad.is_paid || ad.paid || ad.is_premium || ad.premium || ad.promotion_status));
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

const authInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontSize: 16,
  marginTop: 6,
  marginBottom: 14
};

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

  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setAuthError("Supabase settings missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Cloudflare Pages.");
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message);
      setUser(data?.session?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data?.subscription?.unsubscribe();
  }, []);

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

  function openLogin() {
    setAuthError("");
    setAuthMessage("");
    setAuthMode("login");
    setAuthOpen(true);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (!supabase) {
      setAuthError("Supabase connect aagala. Cloudflare Pages environment variables check pannunga.");
      return;
    }
    if (!authEmail.trim() || !authPassword) {
      setAuthError("Email and password enter pannunga.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("Password minimum 6 characters irukkanum.");
      return;
    }

    setAuthBusy(true);
    try {
      if (authMode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;

        if (data?.session) {
          setUser(data.user);
          setAuthMessage("Account created and logged in successfully.");
        } else {
          setAuthMessage("Registration successful. Email inbox-la verification link check pannunga; verify pannitu login pannunga.");
          setAuthMode("login");
          setAuthPassword("");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword
        });
        if (error) throw error;
        setUser(data.user);
        setAuthMessage("Login successful.");
      }
    } catch (error) {
      setAuthError(error?.message || "Authentication failed. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setAuthMessage("");
    setAuthError("");
  }

  function handlePostAdClick(event) {
    event.preventDefault();
    if (!user) {
      openLogin();
      return;
    }
    setAuthError("");
    setAuthMessage("You are logged in. The ad-posting form and secure API submission are the next step; they are not connected yet.");
    setAuthOpen(true);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="24Adz home">
          <span className="brand-mark">24</span><span className="brand-text">Adz<span>.com</span></span>
        </a>
        <div className="top-note">Tamil Nadu Classifieds</div>
        {user ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="post-button" onClick={handlePostAdClick}>＋ Post Ad</button>
            <button className="text-button" onClick={handleLogout} title={user.email || "Logout"}>Logout</button>
          </div>
        ) : (
          <button className="post-button" onClick={handlePostAdClick}>＋ Post Ad</button>
        )}
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

      {authOpen && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAuthOpen(false);
              setAuthError("");
              setAuthMessage("");
            }
          }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.72)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, overflowY: "auto"
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            style={{
              width: "100%", maxWidth: 440, background: "#fff", color: "#171717",
              borderRadius: 18, padding: 24, boxSizing: "border-box",
              boxShadow: "0 20px 70px rgba(0,0,0,.35)", position: "relative"
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => { setAuthOpen(false); setAuthError(""); setAuthMessage(""); }}
              style={{ position: "absolute", right: 14, top: 12, border: 0, background: "transparent", fontSize: 28, cursor: "pointer", color: "#555" }}
            >×</button>

            <div style={{ fontWeight: 800, color: "#f97316", letterSpacing: 1, marginBottom: 8 }}>24ADZ.COM</div>
            <h2 id="auth-title" style={{ margin: "0 30px 8px 0", fontSize: 26 }}>
              {user ? "Post an Ad" : authMode === "register" ? "Create your account" : "Login to 24Adz"}
            </h2>
            <p style={{ color: "#666", lineHeight: 1.5, marginTop: 0 }}>
              {user
                ? "Login verified. The ad-posting form and secure API submission still need to be connected."
                : authMode === "register"
                  ? "Register with your email. We will send a verification link."
                  : "Login or create an account to continue to Post Ad."}
            </p>

            {authMessage && (
              <div role="status" style={{ padding: 12, borderRadius: 10, background: "#ecfdf5", color: "#065f46", marginBottom: 14, lineHeight: 1.5 }}>
                {authMessage}
              </div>
            )}
            {authError && (
              <div role="alert" style={{ padding: 12, borderRadius: 10, background: "#fef2f2", color: "#991b1b", marginBottom: 14, lineHeight: 1.5 }}>
                {authError}
              </div>
            )}

            {!user && (
              <form onSubmit={handleAuthSubmit}>
                <label style={{ display: "block", fontWeight: 600 }}>
                  Email address
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="you@example.com"
                    style={authInputStyle}
                  />
                </label>
                <label style={{ display: "block", fontWeight: 600 }}>
                  Password
                  <input
                    type="password"
                    autoComplete={authMode === "register" ? "new-password" : "current-password"}
                    minLength={6}
                    required
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    style={authInputStyle}
                  />
                </label>
                <button
                  type="submit"
                  disabled={authBusy || !supabase}
                  className="search-button"
                  style={{ width: "100%", opacity: authBusy || !supabase ? 0.6 : 1 }}
                >
                  {authBusy ? "Please wait…" : authMode === "register" ? "Register & Verify Email" : "Login"}
                </button>
              </form>
            )}

            {user && (
              <div style={{ padding: 12, borderRadius: 10, background: "#f5f5f5", marginBottom: 14, overflowWrap: "anywhere" }}>
                Logged in as <strong>{user.email}</strong>
              </div>
            )}

            {!user && (
              <p style={{ textAlign: "center", margin: "18px 0 0", color: "#555" }}>
                {authMode === "register" ? "Already registered? " : "New to 24Adz? "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "register" ? "login" : "register");
                    setAuthError("");
                    setAuthMessage("");
                  }}
                  style={{ border: 0, background: "transparent", color: "#ea580c", fontWeight: 700, cursor: "pointer", fontSize: 15 }}
                >
                  {authMode === "register" ? "Login" : "Create account"}
                </button>
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
