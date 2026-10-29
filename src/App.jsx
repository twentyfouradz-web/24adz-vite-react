import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

const CATEGORIES = [
  "Cars",
  "Bikes",
  "Mobile",
  "House",
  "Jobs",
  "House Movers",
];

const DISTRICTS = [
  "All Tamil Nadu",
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kancheepuram",
  "Kanniyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

const CATEGORY_ICONS = [
  "🚗",
  "🏍️",
  "📱",
  "🏠",
  "💼",
  "🚚",
];

function getAdId(ad, index) {
  return ad.id ?? ad.ad_id ?? ad.slug ?? index;
}

function getAdPhone(ad) {
  return ad.phone || ad.phone_number || ad.mobile || "";
}

function getAdWhatsApp(ad) {
  return ad.whatsapp || ad.whatsapp_number || getAdPhone(ad);
}

function getAdLocation(ad) {
  return ad.location || ad.area || ad.district || "";
}

function getAdImage(ad) {
  return (
    ad.image_url ||
    ad.imageUrl ||
    ad.image ||
    ad.photo_url ||
    ad.image_key_url ||
    ""
  );
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function makeWhatsAppUrl(phone) {
  let number = normalizePhone(phone);

  if (!number) return "";

  if (number.length === 10) {
    number = "91" + number;
  }

  return `https://wa.me/${number}`;
}

function isPublished(ad) {
  if (
    ad.published === true ||
    ad.published === 1 ||
    ad.published === "1"
  ) {
    return true;
  }

  if (
    typeof ad.status === "string" &&
    ad.status.toLowerCase() === "published"
  ) {
    return true;
  }

  // If the API returns public ads without status fields.
  return ad.published === undefined && ad.status === undefined;
}

export default function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [district, setDistrict] = useState("All Tamil Nadu");

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Load published ads from the Cloudflare API.
  useEffect(() => {
    let cancelled = false;

    async function loadAds() {
      setLoading(true);
      setApiError("");

      if (!API_BASE_URL) {
        setAds([]);
        setApiError(
          "API URL is not configured. Set VITE_API_BASE_URL in your Vite project."
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/ads`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Ads API error: HTTP ${response.status}`
          );
        }

        const result = await response.json();

        const data = Array.isArray(result)
          ? result
          : Array.isArray(result.ads)
            ? result.ads
            : Array.isArray(result.data)
              ? result.data
              : null;

        if (!data) {
          throw new Error(
            "API response does not contain an ads array."
          );
        }

        if (!cancelled) {
          setAds(data.filter(isPublished));
        }
      } catch (error) {
        if (!cancelled) {
          setAds([]);

          setApiError(
            error instanceof Error
              ? error.message
              : "Unable to load ads."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAds();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Search and filter ads.
  const filteredAds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ads
      .filter((ad) => {
        const adCategory = String(
          ad.category || ""
        ).toLowerCase();

        const matchesCategory =
          category === "All Categories" ||
          adCategory === category.toLowerCase();

        const location = getAdLocation(ad).toLowerCase();

        const matchesDistrict =
          district === "All Tamil Nadu" ||
          location.includes(district.toLowerCase());

        const searchableText = [
          ad.title,
          ad.description,
          ad.category,
          ad.location,
          ad.area,
          ad.district,
          ad.model,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          matchesCategory &&
          matchesDistrict &&
          searchableText.includes(query)
        );
      })
      .slice(0, 25);
  }, [ads, search, category, district]);

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <a className="logo" href="/">
          <span>24</span>Adz
          <span className="dot">.com</span>
        </a>

        <p>TAMIL NADU CLASSIFIEDS</p>

        <a className="admin" href="/admin">
          Admin Login
        </a>
      </header>

      <main>
        {/* HERO AND SEARCH */}
        <section className="hero">
          <span className="badge">
            TAMIL NADU'S CLASSIFIEDS
          </span>

          <h1>
            Buy. Sell. <span>Connect.</span>
          </h1>

          <p>
            Find great deals near you with 24Adz.com.
          </p>

          <form
            className="search-box"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="What are you looking for?"
              aria-label="Search advertisements"
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              aria-label="Select category"
            >
              <option value="All Categories">
                All Categories
              </option>

              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={district}
              onChange={(event) =>
                setDistrict(event.target.value)
              }
              aria-label="Select district"
            >
              {DISTRICTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button type="submit">
              Search
            </button>
          </form>
        </section>

        {/* CATEGORIES */}
        <section className="categories">
          <h2>Explore Categories</h2>

          <p>
            Discover deals across Tamil Nadu
          </p>

          <div className="category-grid">
            {CATEGORIES.map((item, index) => (
              <button
                className={
                  category === item
                    ? "category-card active"
                    : "category-card"
                }
                key={item}
                type="button"
                onClick={() =>
                  setCategory(
                    category === item
                      ? "All Categories"
                      : item
                  )
                }
                aria-pressed={category === item}
              >
                <span className="category-icon">
                  {CATEGORY_ICONS[index]}
                </span>

                <strong>{item}</strong>

                <span className="arrow">
                  Explore →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* LATEST ADS */}
        <section className="listings">
          <div className="listings-heading">
            <div>
              <h2>Latest Ads</h2>

              <p>
                Find the latest listings across Tamil Nadu.
              </p>
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={() =>
                setRefreshKey((value) => value + 1)
              }
            >
              Refresh Ads
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <span>⏳</span>
              <h3>Loading listings...</h3>
              <p>Please wait while ads are loading.</p>
            </div>
          ) : apiError ? (
            <div className="empty-state">
              <span>⚠️</span>
              <h3>Ads could not be loaded</h3>
              <p>{apiError}</p>
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="empty-state">
              <span>📢</span>
              <h3>No ads found</h3>
              <p>
                Try another search, category, or district.
                Published ads will appear here.
              </p>
            </div>
          ) : (
            <div className="ads-grid">
              {filteredAds.map((ad, index) => {
                const phone = getAdPhone(ad);
                const whatsapp = getAdWhatsApp(ad);
                const image = getAdImage(ad);

                return (
                  <article
                    className="ad-card"
                    key={getAdId(ad, index)}
                  >
                    {image ? (
                      <img
                        className="ad-image"
                        src={image}
                        alt={ad.title || "Advertisement"}
                        loading="lazy"
                      />
                    ) : (
                      <div className="ad-image ad-image-placeholder">
                        📦
                      </div>
                    )}

                    <div className="ad-content">
                      <div className="ad-meta">
                        <span>
                          {ad.category || "Classified"}
                        </span>

                        {getAdLocation(ad) && (
                          <span>
                            {getAdLocation(ad)}
                          </span>
                        )}
                      </div>

                      <h3>
                        {ad.title || "Untitled Ad"}
                      </h3>

                      {ad.model && (
                        <p className="ad-model">
                          {ad.model}
                        </p>
                      )}

                      <p className="ad-description">
                        {ad.description ||
                          "Contact the advertiser for details."}
                      </p>

                      {ad.price !== undefined &&
                        ad.price !== null &&
                        ad.price !== "" && (
                          <strong className="ad-price">
                            ₹
                            {Number(ad.price).toLocaleString(
                              "en-IN"
                            )}
                          </strong>
                        )}

                      <div className="ad-actions">
                        {phone && (
                          <a
                            className="call-button"
                            href={`tel:${String(phone).replace(
                              /[^\d+]/g,
                              ""
                            )}`}
                          >
                            Call
                          </a>
                        )}

                        {whatsapp && (
                          <a
                            className="whatsapp-button"
                            href={makeWhatsAppUrl(whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* SAFETY */}
        <section className="safety">
          <strong>
            🛡️ Stay Safe on 24Adz
          </strong>

          <p>
            Inspect items before buying.
            Never pay an advance to unknown sellers.
          </p>
        </section>
      </main>

      {/* FOOTER */}
      <footer>
        <a className="logo" href="/">
          <span>24</span>Adz
          <span className="dot">.com</span>
        </a>

        <p>Tamil Nadu Classifieds</p>

        <p>© 2026 24Adz.com</p>
      </footer>
    </div>
  );
              }
