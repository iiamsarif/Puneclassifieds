import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminAccess = ({ apiBase }) => {
  const [form, setForm] = useState({ adminId: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("adminToken", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="page auth-page admin-login-page">
      <section className="form-section">
        <div className="auth-intro">
          <div className="auth-logo">pc</div>
          <div className="auth-welcome">Admin Access</div>
          <div className="auth-subtext">Secure access for community administrators.</div>
        </div>
        <div className="section-head-block">
          <h1>Admin Login</h1>
          <p>Secure access for community administrators.</p>
        </div>
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Admin ID"
            value={form.adminId}
            onChange={(e) => setForm({ ...form, adminId: e.target.value })}
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
     
        </form>
      </section>
    </main>
  );
};

export default AdminAccess;


