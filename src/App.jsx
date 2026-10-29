import { useState } from "react";

export default function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [district, setDistrict] = useState("All Tamil Nadu");

  const categories = [
  "Cars",
  "Bikes",
  "Mobile",
  "House",
  "Jobs",
  "House Movers",
];

  const districts = [
    "All Tamil Nadu",
    "Tiruppur",
    "Coimbatore",
    "Chennai",
    "Erode",
    "Salem",
    "Madurai",
    "Trichy",
    "Perambalur",
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span>24</span>Adz<span className="dot">.com</span>
        </div>
        <p>TAMIL NADU CLASSIFIEDS</p>
        <a className="admin" href="/admin">Admin Login</a>
      </header>

      <section className="hero">
        <span className="badge">TAMIL NADU'S CLASSIFIEDS</span>
        <h1>
          Buy. Sell. <span>Connect.</span>
        </h1>
        <p>Find great deals near you with 24Adz.com.</p>

        <div className="search-box">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="What are you looking for?"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All Categories</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            {districts.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <button
            onClick={() =>
              alert(
                "Search: " +
                  search +
                  "\nCategory: " +
                  category +
                  "\nLocation: " +
                  district
              )
            }
          >
            Search
          </button>
        </div>
      </section>

      <section className="categories">
        <h2>Explore Categories</h2>
        <p>Discover deals across Tamil Nadu</p>

        <div className="category-grid">
          {categories.map((item, index) => (
            <button
              className="category-card"
              key={item}
              onClick={() => setCategory(item)}
            >
              <span className="category-icon">
                {["🚗", "🏍️", "📱", "🏠", "💼", "🚚"][index]}
              </span>
              <strong>{item}</strong>
              <span className="arrow">Explore →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="listings">
        <h2>Latest Ads</h2>
        <div className="empty-state">
          <span>📢</span>
          <h3>Discover Local Deals</h3>
          <p>New listings will appear here when ads are connected.</p>
        </div>
      </section>

      <section className="safety">
        <strong>🛡️ Stay Safe on 24Adz</strong>
        <p>Inspect items before buying. Never pay an advance to unknown sellers.</p>
      </section>

      <footer>
        <div className="logo">
          <span>24</span>Adz<span className="dot">.com</span>
        </div>
        <p>Tamil Nadu Classifieds</p>
        <p>© 2026 24Adz.com</p>
      </footer>
    </div>
  );
}
