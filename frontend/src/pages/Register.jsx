import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";

// Regex standar industri — SELARAS dengan backend validationMiddleware.js
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nav = useNavigate();

  const register = async () => {
    setMessage("");

    // --- VALIDASI CLIENT-SIDE (selaras dengan backend) ---
    if (!username.trim() || username.trim().length < 3) {
      setMessage("Nama Lengkap / Nama Toko wajib diisi dan minimal 3 karakter.");
      return;
    }
    if (!email.trim()) {
      setMessage("Email wajib diisi.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setMessage("Format email tidak valid.");
      return;
    }
    if (!password || password.length < 6) {
      setMessage("Password wajib diisi dan minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ 
          username: username.trim(), 
          email: email.trim().toLowerCase(), 
          password 
        })
      });

      // HANDLER: Rate Limit (429)
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.message || "Terlalu banyak percobaan pendaftaran. Silakan coba lagi nanti.");
        return;
      }

      if (res.ok) {
        // Redirect ke halaman login dengan status berhasil
        nav("/login", { state: { successMessage: "Pendaftaran berhasil! Silakan login untuk masuk ke toko Anda." } });
      } else {
        const data = await res.json();
        setMessage(data.message || "Pendaftaran gagal. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("[Register Error]:", err);
      setMessage("Terjadi kesalahan koneksi ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Submit form dengan Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") register();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Daftar Prospera</h2>
        <p className="subtitle">Mulai bangun toko Anda sendiri</p>

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

        <input className="input" placeholder="Nama Lengkap (Nama Toko)" type="text"
          value={username} onChange={e => setUsername(e.target.value)} 
          onKeyDown={handleKeyDown} />
        <input className="input" placeholder="Email" type="email"
          value={email} onChange={e => setEmail(e.target.value)} 
          onKeyDown={handleKeyDown} />
        <input className="input" placeholder="Password (Min. 6 karakter)" type="password"
          value={password} onChange={e => setPassword(e.target.value)} 
          onKeyDown={handleKeyDown} />
          
        <div> 
          <button className="button" onClick={register} disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "Memproses..." : "Daftar Akun"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>
          Sudah punya akun? <Link to="/login" style={{ color: "#2563EB", textDecoration: "none", fontWeight: "bold" }}>Login di sini</Link>
        </p>
      </div>
    </div>
  );
}
