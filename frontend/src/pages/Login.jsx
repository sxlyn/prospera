import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL, setAuthSession, getToken, getUserRole } from "../utils/api";

// Regex standar industri — SELARAS dengan backend validationMiddleware.js
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login() {
  const [activeTab, setActiveTab] = useState("owner"); // "owner" atau "karyawan"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nav = useNavigate();

  // AUTO-LOGIN: Cek token saat halaman dimuat
  useEffect(() => {
    const token = getToken();
    const role = getUserRole();
    if (token && role) {
      // Token ada, redirect sesuai role
      if (role === 'karyawan') {
        nav("/transaction", { replace: true });
      } else {
        nav("/dashboard", { replace: true });
      }
    }
  }, [nav]);

  const login = async () => {
    setMessage("");

    // --- VALIDASI CLIENT-SIDE (selaras dengan backend) ---
    if (!email.trim()) {
      setMessage("Email wajib diisi.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setMessage("Format email tidak valid.");
      return;
    }
    if (!password.trim()) {
      setMessage("Password wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      // HANDLER: Rate Limit (429)
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.message || "Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        
        // Verifikasi apakah role yang didapat sesuai dengan tab yang dipilih
        if (data.user.role !== activeTab) {
          const tabLabel = activeTab === 'owner' ? 'Owner' : 'Karyawan';
          const roleLabel = data.user.role === 'owner' ? 'Owner' : 'Karyawan';
          setMessage(`Email ini terdaftar sebagai ${roleLabel}, bukan ${tabLabel}. Silakan pindah tab.`);
          return;
        }

        setAuthSession(data.token, data.user);

        // RBAC: Redirect berdasarkan role
        if (data.user.role === 'karyawan') {
          nav("/transaction");  // Karyawan langsung ke halaman transaksi
        } else {
          nav("/dashboard");    // Owner ke dashboard analitik
        }
      } else {
        setMessage("Email atau Password yang Anda masukkan salah.");
      }
    } catch (err) {
      console.error("[Login Error]:", err);
      setMessage("Terjadi kesalahan koneksi ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Submit form dengan Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ paddingTop: '20px' }}>
        <h2 style={{ marginBottom: '5px' }}>Welcome to Prospera</h2>
        <p className="subtitle" style={{ marginBottom: '25px' }}>Ready to Prosper</p>

        {/* Tabs untuk Role */}
        <div style={{ display: 'flex', marginBottom: '25px', borderBottom: '1px solid #E5E7EB' }}>
          <button 
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'owner' ? '2px solid #2563EB' : 'none', 
              color: activeTab === 'owner' ? '#2563EB' : '#6B7280', 
              fontWeight: activeTab === 'owner' ? 'bold' : 'normal', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={() => {
              setActiveTab('owner');
              setMessage("");
            }}
          >
            Login Owner
          </button>
          <button 
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'karyawan' ? '2px solid #2563EB' : 'none', 
              color: activeTab === 'karyawan' ? '#2563EB' : '#6B7280', 
              fontWeight: activeTab === 'karyawan' ? 'bold' : 'normal', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={() => {
              setActiveTab('karyawan');
              setMessage("");
            }}
          >
            Login Karyawan
          </button>
        </div>

        {/* Form-Level Feedback (Inline) */}
        {message && (
          <div style={{ 
            padding: "10px", 
            borderRadius: "5px", 
            marginBottom: "12px", 
            background: "#FEE2E2", 
            color: "#991B1B", 
            textAlign: "center", 
            fontSize: "14px",
            border: "1px solid #EF4444"
          }}>
            {message}
          </div>
        )}

        <input 
          className="input" 
          placeholder={activeTab === 'owner' ? "Email Pemilik" : "Email Karyawan"} 
          type="email"
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          onKeyDown={handleKeyDown} 
        />
        <input 
          className="input" 
          placeholder="Password" 
          type="password"
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          onKeyDown={handleKeyDown} 
        />
          
        <div> 
          <button className="button" onClick={login} disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer", marginTop: '10px' }}>
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </div>

        {/* Link Daftar HANYA muncul untuk Owner */}
        {activeTab === 'owner' ? (
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-secondary)" }}>
            Belum punya akun toko? <Link to="/register" style={{ color: "#2563EB", textDecoration: "none", fontWeight: "bold" }}>Daftar sekarang</Link>
          </p>
        ) : (
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-secondary)" }}>
            Akun Karyawan hanya bisa dibuat oleh Owner.
          </p>
        )}
      </div>
    </div>
  );
}