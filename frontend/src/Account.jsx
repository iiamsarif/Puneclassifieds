import React, { useEffect, useState } from "react";

const Account = ({ apiBase }) => {
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [userRes, payRes] = await Promise.all([
          fetch(`${apiBase}/api/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiBase}/api/me/payments`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const userData = await userRes.json();
        const payData = await payRes.json();
        if (!mounted) return;
        setUser(userData);
        setPayments(Array.isArray(payData) ? payData : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [apiBase, token]);

  const totalPages = Math.max(1, Math.ceil(payments.length / perPage));
  const startIndex = (page - 1) * perPage;
  const visiblePayments = payments.slice(startIndex, startIndex + perPage);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (loading) {
    return (
      <main className="page">
        <div className="page-loader">
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>Account Settings</h1>
        <p>Manage your profile and plan details.</p>
      </section>

      <section className="account-grid">
        <div className="card account-card">
          <h3>Profile</h3>
          <p className="muted">Name</p>
          <p>{user?.name || "—"}</p>
          <p className="muted">Email</p>
          <p>{user?.email || "—"}</p>
        </div>
        <div className="card account-card">
          <h3>Plan</h3>
          <span className={`plan-badge ${user?.paid ? "paid" : "free"}`}>
            {user?.paid ? "Paid Plan" : "Free Plan"}
          </span>
          <p className="muted">Plan Expiry</p>
          <p>{user?.paidUntil ? new Date(user.paidUntil).toLocaleDateString() : "N/A"}</p>
          <div className="plan-note">
            {user?.paid ? "Premium benefits are active." : "Upgrade to unlock premium limits."}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-label">TRANSACTIONS</div>
            <h2>Plan History</h2>
          </div>
        </div>
        <div className="grid">
          {payments.length === 0 && (
            <div className="card">
              <p>No transactions yet.</p>
            </div>
          )}
          {visiblePayments.map((item) => (
            <div key={item._id} className="card">
              <h4>₹{item.amount} {item.currency}</h4>
              <p className="muted">Payment ID: {item.paymentId}</p>
              <p className="muted">Order ID: {item.orderId}</p>
              <p className="muted">Paid Until: {item.paidUntil ? new Date(item.paidUntil).toLocaleDateString() : "—"}</p>
              <p className="muted">Date: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</p>
            </div>
          ))}
          {payments.length > perPage && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={`pay-page-${idx + 1}`}
                  className={`page-btn ${page === idx + 1 ? "active" : ""}`}
                  onClick={() => setPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              {page < totalPages && (
                <button className="page-btn" onClick={() => setPage(page + 1)}>
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Account;
