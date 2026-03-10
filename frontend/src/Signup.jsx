import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = ({ apiBase }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      setSuccess("Account created. Please login.");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="page auth-page">
      <section className="form-section">
        <div className="auth-intro">
          <div className="auth-logo">pc</div>
          <div className="auth-welcome">Create Your Account</div>
          <div className="auth-subtext">Join PUneClass and access premium community listings.</div>
        </div>
        <div className="section-head-block">
          <h1>Sign Up</h1>
          <p>Create your community profile in minutes.</p>
        </div>
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
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
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
          <button className="primary-btn" type="submit">Create Account</button>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <div className="auth-links">
            <span>Already have an account?</span>
            <a href="/login">Login</a>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Signup;
