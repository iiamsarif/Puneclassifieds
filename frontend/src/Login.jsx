import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ apiBase }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="page auth-page">
      <section className="form-section">
        <div className="auth-intro">
          <div className="auth-logo">pc</div>
          <div className="auth-welcome">Welcome Back</div>
          <div className="auth-subtext">Sign in to your PuneClassifieds account.</div>
        </div>
        <div className="section-head-block">
          <h1>Login</h1>
          <p>Access your community account.</p>
        </div>
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button className="primary-btn" type="submit">Login</button>
          {error && <p className="error">{error}</p>}
          <div className="auth-links">
            <a href="#">Forgot password?</a>
            <a href="/signup">Don't have an account?</a>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Login;


