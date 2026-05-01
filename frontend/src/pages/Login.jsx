import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, setAuthSession } from "../utils/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const login = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Gunakan helper setAuthSession untuk sinkronisasi token dan data user
        setAuthSession(data.token, data.user);
        
        // Arahkan ke dashboard (Index.jsx)
        nav("/dashboard");
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.message || "Login gagal");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Terjadi kesalahan koneksi ke server.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Welcome to Prospera</h2>
        <p className="subtitle">Ready to Prosper</p>

        <input className="input" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />

        <input className="input" placeholder="Password" type="password"
          value={password} onChange={e => setPassword(e.target.value)} />
          
        <div> 
          <button className="button" onClick={login}>
            Login
          </button>
        </div> 
      </div>
    </div>
  )};
