import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Payment from './Payment'
const SUPABASE_URL = "https://kpnxxpmfiwhonphmgazq.supabase.co";
const SUPABASE_KEY = "sb_publishable_DIBefLmMh9YfcUFPWhwGLg_TJH6HHaX";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SAMPLE_PRODUCTS = [
  { id: "s1", name: "Handwoven Kente Bag", price: 45, category: "physical", seller_name: "AmaraShop", rating: 4.8, sales: 132, image: "🛍️", description: "Authentic handwoven kente cloth tote bag.", tag: "Bestseller" },
  { id: "s2", name: "Logo Design Pack", price: 12, category: "digital", seller_name: "DesignsByKofi", rating: 4.9, sales: 310, image: "🎨", description: "50 editable vector logo templates.", tag: "Hot" },
  { id: "s3", name: "Shea Butter Cream", price: 18, category: "physical", seller_name: "NaturalGlow", rating: 4.7, sales: 89, image: "🧴", description: "100% organic unrefined shea butter.", tag: "" },
  { id: "s4", name: "Afrobeats Sample Kit", price: 9, category: "digital", seller_name: "BeatsByDayo", rating: 5.0, sales: 204, image: "🎵", description: "200+ drum loops and melodies.", tag: "New" },
  { id: "s5", name: "Batik Ankara Shirt", price: 35, category: "physical", seller_name: "AmaraShop", rating: 4.6, sales: 67, image: "👕", description: "Hand-dyed batik shirt in Ankara print.", tag: "" },
  { id: "s6", name: "Business Plan Template", price: 7, category: "digital", seller_name: "StartupToolkit", rating: 4.8, sales: 450, image: "📄", description: "Professional editable business plan.", tag: "Bestseller" },
];

export default function Bazara() {
  const [view, setView] = useState("browse");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [myProducts, setMyProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", price: "", category: "physical", description: "" });
  const [formError, setFormError] = useState("");
  const [dbLoading, setDbLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    fetchProducts();
    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchMyProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) setProducts([...data, ...SAMPLE_PRODUCTS]);
    } catch (e) {}
  };

  const fetchMyProducts = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from("products").select("*").eq("seller_id", user.id);
      if (data) setMyProducts(data);
    } catch (e) {}
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleAuth = async () => {
    setAuthError(""); setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast("Account created! You can now log in.");
        setAuthMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast("Welcome back!");
        setView("browse");
      }
    } catch (e) { setAuthError(e.message); }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setMyProducts([]);
    showToast("Logged out.");
  };

  const handleListProduct = async () => {
    if (!form.name || !form.price || !form.description) { setFormError("Please fill all fields."); return; }
    if (!user) { setFormError("Please log in first."); return; }
    setDbLoading(true);
    try {
      const newProduct = { name: form.name, price: parseFloat(form.price), category: form.category, description: form.description, seller_id: user.id, seller_name: email.split("@")[0], image: form.category === "digital" ? "💾" : "📦", rating: 5.0, sales: 0, tag: "New" };
      const { data, error } = await supabase.from("products").insert([newProduct]).select();
      if (error) throw error;
      if (data) { setMyProducts(p => [data[0], ...p]); setProducts(p => [data[0], ...p]); }
      setForm({ name: "", price: "", category: "physical", description: "" });
      setFormError("");
      showToast("Product listed!");
      setView("dashboard");
    } catch (e) { setFormError("Failed to list. Try again."); }
    setDbLoading(false);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`"${product.name}" added to cart!`);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, d) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const filtered = products.filter(p => {
    const matchCat = filter === "All" || p.category === filter.toLowerCase();
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.seller_name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const navItems = [
    { id: "browse", icon: "🛒", label: "Browse" },
    { id: "sell", icon: "➕", label: "Sell" },
    { id: "dashboard", icon: "📊", label: "My Store" },
    { id: "cart", icon: "🧺", label: `Cart${cartCount ? ` (${cartCount})` : ""}` },
    user ? { id: "logout", icon: "👋", label: "Logout", action: handleLogout } : { id: "auth", icon: "🔑", label: "Login" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#faf7f2", color: "#1a1208" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .playfair { font-family: 'Playfair Display', serif; }
        .btn { background: #c8460a; color: #fff; border: none; border-radius: 8px; padding: 11px 24px; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.18s; }
        .btn:hover { background: #a33708; }
        .btn:disabled { background: #ccc; cursor: not-allowed; }
        .card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); transition: transform 0.2s; }
        .card:hover { transform: translateY(-4px); }
        input, textarea, select { width: 100%; padding: 12px 14px; border: 1.5px solid #e0d9cf; border-radius: 8px; font-size: 15px; font-family: 'DM Sans', sans-serif; background: #faf7f2; color: #1a1208; outline: none; }
        input:focus, textarea:focus, select:focus { border-color: #c8460a; }
        .nav-btn { background: none; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; padding: 7px 12px; border-radius: 8px; display: flex; align-items: center; gap: 5px; color: #5a4a38; transition: all 0.15s; }
        .nav-btn.active { background: #c8460a; color: #fff; }
        .nav-btn:hover:not(.active) { background: #f0e8dc; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 20px; }
        .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: #1a1208; color: #fff; padding: 12px 28px; border-radius: 30px; font-size: 14px; font-weight: 500; z-index: 999; animation: fadeUp 0.3s ease; white-space: nowrap; }
        @keyframes fadeUp { from { opacity:0; transform:translate(-50%,16px); } to { opacity:1; transform:translate(-50%,0); } }
      `}</style>

      <header style={{ background: "#fff", borderBottom: "1.5px solid #ede6dc", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24 }}>🏪</span>
          <span className="playfair" style={{ fontSize: 22, fontWeight: 900, color: "#c8460a" }}>Bazara</span>
        </div>
        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {navItems.map(n => (
            <button key={n.id} className={`nav-btn${view === n.id ? " active" : ""}`} onClick={() => n.action ? n.action() : setView(n.id)}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>
        {view === "auth" && (
          <div style={{ maxWidth: 420, margin: "0 auto" }}>
            <h1 className="playfair" style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>{authMode === "login" ? "Welcome back" : "Create account"}</h1>
            <div className="card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuth()} />
                {authError && <p style={{ color: "#c8460a", fontSize: 13 }}>⚠️ {authError}</p>}
                <button className="btn" style={{ width: "100%", padding: 13 }} onClick={handleAuth} disabled={authLoading}>{authLoading ? "Please wait..." : authMode === "login" ? "Log In" : "Create Account"}</button>
                <p style={{ textAlign: "center", fontSize: 14, color: "#7a6a58" }}>
                  {authMode === "login" ? "No account? " : "Have one? "}
                  <span style={{ color: "#c8460a", cursor: "pointer", fontWeight: 600 }} onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}>
                    {authMode === "login" ? "Sign up" : "Log in"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {view === "browse" && (
          <div>
            <h1 className="playfair" style={{ fontSize: 36, fontWeight: 900, marginBottom: 6 }}>Discover & Shop<br /><span style={{ color: "#c8460a" }}>Everything.</span></h1>
            <p style={{ color: "#7a6a58", marginBottom: 24 }}>Physical goods & digital products from independent sellers.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300, flex: 1 }} />
              <div style={{ display: "flex", gap: 6 }}>
                {["All","Physical","Digital"].map(c => (
                  <button key={c} onClick={() => setFilter(c)} style={{ padding: "9px 16px", border: "1.5px solid", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, background: filter === c ? "#c8460a" : "#fff", color: filter === c ? "#fff" : "#7a6a58", borderColor: filter === c ? "#c8460a" : "#e0d9cf" }}>{c}</button>
                ))}
              </div>
            </div>
            <div className="grid">
              {filtered.map(p => (
                <div key={p.id} className="card">
                  <div style={{ background: "#f5f0e8", height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>{p.image}</div>
                  <div style={{ padding: "14px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#9a8a78", marginBottom: 4 }}>by {p.seller_name}</div>
                    <div style={{ fontSize: 12, color: "#5a4a38", marginBottom: 10 }}>{p.description}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 800, fontSize: 17, color: "#c8460a" }}>${p.price}</span>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => addToCart(p)}>Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "sell" && (
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <h1 className="playfair" style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>List a Product</h1>
            {!user && <div style={{ background: "#fff0eb", border: "1.5px solid #c8460a", borderRadius: 10, padding: "16px", marginBottom: 24 }}><p style={{ color: "#c8460a", fontWeight: 600, marginBottom: 10 }}>🔑 Login required</p><button className="btn" onClick={() => setView("auth")}>Log In / Sign Up</button></div>}
            <div className="card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <input placeholder="Product Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={!user} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input type="number" placeholder="Price (USD)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} disabled={!user} />
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} disabled={!user}>
                    <option value="physical">📦 Physical</option>
                    <option value="digital">💾 Digital</option>
                  </select>
                </div>
                <textarea rows={3} placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} disabled={!user} />
                {formError && <p style={{ color: "#c8460a", fontSize: 13 }}>⚠️ {formError}</p>}
                <button className="btn" style={{ width: "100%", padding: 13 }} onClick={handleListProduct} disabled={!user || dbLoading}>{dbLoading ? "Listing..." : "🚀 List Product"}</button>
              </div>
            </div>
          </div>
        )}

        {view === "dashboard" && (
          <div>
            <h1 className="playfair" style={{ fontSize: 30, fontWeight: 900, marginBottom: 24 }}>My Store</h1>
            {!user ? (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>🔑</div>
                <p style={{ marginBottom: 16, color: "#9a8a78" }}>Log in to manage your store</p>
                <button className="btn" onClick={() => setView("auth")}>Log In / Sign Up</button>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 14, marginBottom: 28 }}>
                  {[{ label: "Products", value: myProducts.length, icon: "📦" }, { label: "Sales", value: myProducts.reduce((s,p)=>s+(p.sales||0),0), icon: "💰" }].map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "#9a8a78" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {myProducts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#9a8a78" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                    <p style={{ marginBottom: 14 }}>No products yet!</p>
                    <button className="btn" onClick={() => setView("sell")}>+ List a Product</button>
                  </div>
                ) : myProducts.map(p => (
                  <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: 10 }}>
                    <div style={{ fontSize: 28 }}>{p.image}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 12, color: "#9a8a78" }}>{p.category}</div></div>
                    <div style={{ fontWeight: 800, color: "#c8460a" }}>${p.price}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {view === "cart" && (
          <div style={{ maxWidth: 580, margin: "0 auto" }}>
            <h1 className="playfair" style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>Your Cart</h1>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: "#9a8a78" }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>🧺</div>
                <p style={{ marginBottom: 18 }}>Your cart is empty.</p>
                <button className="btn" onClick={() => setView("browse")}>Start Shopping</button>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: 12 }}>
                    <div style={{ fontSize: 28 }}>{item.image}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{item.name}</div><div style={{ fontSize: 12, color: "#9a8a78" }}>${item.price}</div></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => updateQty(item.id,-1)} style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid #e0d9cf", background: "#faf7f2", cursor: "pointer" }}>−</button>
                      <span style={{ fontWeight: 700 }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id,1)} style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid #e0d9cf", background: "#faf7f2", cursor: "pointer" }}>+</button>
                    </div>
                    <div style={{ fontWeight: 800, color: "#c8460a" }}>${(item.price*item.qty).toFixed(2)}</div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#b0a090" }}>✕</button>
                  </div>
                ))}
                <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontWeight: 800, fontSize: 19 }}>
                    <span>Total</span><span style={{ color: "#c8460a" }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <Payment user={user} amount={cartTotal} onSuccess={(ref) => { showToast("🎉 Payment successful! Ref: " + ref.reference); setCart([]); setView("browse"); }} />
                </div>
              </>
            )}
          </div>
        )}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}