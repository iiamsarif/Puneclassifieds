import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

const PAGE_SIZE = 10;

const Notifications = ({ apiBase }) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [banner, setBanner] = useState("");
  const [department, setDepartment] = useState("");
  const [keyword, setKeyword] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [submittedFilters, setSubmittedFilters] = useState({
    department: "",
    keyword: "",
    fromDate: "",
    toDate: "",
    uniqueCode: ""
  });

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/notifications`).then((r) => r.json()),
      fetch(`${apiBase}/api/settings/web`).then((r) => r.json())
    ])
      .then(([itemsData, settings]) => {
        setItems(Array.isArray(itemsData) ? itemsData : []);
        setBanner(settings?.banner4 || "");
      })
      .catch(console.error);
  }, [apiBase]);

  const departmentOptions = useMemo(() => {
    const unique = new Set(
      items
        .map((item) => item.department || item.category || "")
        .filter(Boolean)
        .map((value) => value.trim())
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const itemDepartment = String(item.department || item.category || "").toLowerCase();
      const itemTitle = String(item.title || "").toLowerCase();
      const itemSummary = String(item.summary || item.description || "").toLowerCase();
      const itemSubject = String(item.subject || "").toLowerCase();
      const itemRef = String(item.refNumber || item.serialNo || "").toLowerCase();
      const itemDate = item.dateOfIssue || item.notificationDate || "";

      if (
        submittedFilters.department &&
        itemDepartment !== submittedFilters.department.toLowerCase()
      ) {
        return false;
      }

      if (submittedFilters.keyword) {
        const keywordLower = submittedFilters.keyword.toLowerCase();
        const keywordMatched =
          itemTitle.includes(keywordLower) ||
          itemSummary.includes(keywordLower) ||
          itemSubject.includes(keywordLower) ||
          itemDepartment.includes(keywordLower);
        if (!keywordMatched) return false;
      }

      if (submittedFilters.uniqueCode) {
        const uniqueLower = submittedFilters.uniqueCode.toLowerCase();
        if (!itemRef.includes(uniqueLower)) return false;
      }

      if (submittedFilters.fromDate && itemDate && itemDate < submittedFilters.fromDate) return false;
      if (submittedFilters.toDate && itemDate && itemDate > submittedFilters.toDate) return false;
      if ((submittedFilters.fromDate || submittedFilters.toDate) && !itemDate) return false;

      return true;
    });
  }, [items, submittedFilters]);

  useEffect(() => {
    setPage(1);
  }, [filtered.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1);
  }, [totalPages]);

  const onSearch = () => {
    setSubmittedFilters({
      department,
      keyword: keyword.trim(),
      fromDate,
      toDate,
      uniqueCode: uniqueCode.trim()
    });
    setPage(1);
  };

  const onReset = () => {
    setDepartment("");
    setKeyword("");
    setFromDate("");
    setToDate("");
    setUniqueCode("");
    setSubmittedFilters({
      department: "",
      keyword: "",
      fromDate: "",
      toDate: "",
      uniqueCode: ""
    });
    setPage(1);
  };

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>Government Notifications</h1>
        <p>Verified notices and public updates from civic authorities.</p>
      </section>

      {banner && (
        <section className="section banner-section">
          <div className="container">
            <div className="mid-banner">
              <img className="banner-image" src={banner} alt="Notifications banner" loading="lazy" />
            </div>
          </div>
        </section>
      )}

      <section className="search-section">
        <div className="gov-search-wrap">
          <div className="gov-search-grid">
            <label className="gov-field">
              <span>Department Name</span>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">-- Select --</option>
                {departmentOptions.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </label>

            <label className="gov-field">
              <span>Keywords</span>
              <input
                type="text"
                placeholder="Title / summary / department"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </label>

            <label className="gov-field">
              <span>From Date</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </label>

            <label className="gov-field">
              <span>To Date</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </label>

            <label className="gov-field gov-field-wide">
              <span>Unique Code (Partially allowed)</span>
              <input
                type="text"
                placeholder="Ref number / serial"
                value={uniqueCode}
                onChange={(e) => setUniqueCode(e.target.value)}
              />
            </label>
          </div>
          <div className="gov-search-actions">
            <button type="button" className="primary-btn" onClick={onSearch}>
              Search
            </button>
            <button type="button" className="ghost-btn" onClick={onReset}>
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="gov-table-section">
        <div className="gov-table-meta">
          <p>Total Records: {filtered.length}</p>
        </div>
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>SN</th>
                <th>Department Name</th>
                <th>Title</th>
                <th>Unique Code</th>
                <th>G.R Date</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item, idx) => (
                <tr key={item._id}>
                  <td data-label="SN">{idx + 1 + (page - 1) * PAGE_SIZE}</td>
                  <td data-label="Department Name">{item.department || item.category || "-"}</td>
                  <td data-label="Title">
                    <NavLink className="gov-title-link" to={`/notifications/${item._id}`}>
                      {item.title || "-"}
                    </NavLink>
                  </td>
                  <td data-label="Unique Code">{item.refNumber || item.serialNo || "-"}</td>
                  <td data-label="G.R Date">{item.dateOfIssue || item.notificationDate || "-"}</td>
                  <td data-label="Download">
                    {item.pdfData || item.pdfFile ? (
                      <a className="gov-download-link" href={item.pdfData || item.pdfFile} download>
                        PDF
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="gov-empty">
                    No notifications found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {totalPages > 1 && (
        <div className="pagination">
          {pageNumbers.map((num) => (
            <button
              key={num}
              className={`page-btn ${page === num ? "active" : ""}`}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}
          {totalPages > 4 && (
            <button className="page-btn" onClick={() => setPage(Math.min(page + 1, totalPages))}>
              Next
            </button>
          )}
        </div>
      )}
    </main>
  );
};

export default Notifications;


