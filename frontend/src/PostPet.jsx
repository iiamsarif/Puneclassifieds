import React, { useEffect, useState } from "react";

const PostPet = ({ apiBase }) => {
  const [form, setForm] = useState({
    petName: "",
    breed: "",
    age: "",
    gender: "",
    location: "",
    pinCode: "",
    label: "",
    photos: "",
    contactPerson: "",
    phone: ""
  });
  const [status, setStatus] = useState("");
  const [locations, setLocations] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    fetch(`${apiBase}/api/locations`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setLocations(data))
      .catch(console.error);
  }, [apiBase]);

  const locationOptions = Array.isArray(locations) ? locations : [];
  const handleLocationInput = (value) => {
    const match = locationOptions.find(
      (loc) => loc.name && loc.name.toLowerCase() === value.toLowerCase()
    );
    setForm({ ...form, location: value, pinCode: match?.pinCode || "" });
  };

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then((data) => {
        const match = (Array.isArray(data) ? data : []).find(
          (cat) => cat.name && cat.name.toLowerCase() === "pets"
        );
        if (match && match.labelsByType) {
          const all = Object.values(match.labelsByType).flat();
          setLabels(Array.from(new Set(all)));
        } else {
          setLabels([]);
        }
      })
      .catch(console.error);
  }, [apiBase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/pets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setStatus("Submitted. Awaiting admin approval.");
      setForm({ petName: "", breed: "", age: "", gender: "", location: "", pinCode: "", label: "", photos: "", contactPerson: "", phone: "" });
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>Post Pet Adoption</h1>
        <p>Share adoption listings for review.</p>
      </section>
      <section className="form-section">
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Pet Name"
            value={form.petName}
            onChange={(e) => setForm({ ...form, petName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Breed"
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Age"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            required
          />
          <div className="location-field">
            <input
              type="text"
              list="pet-location-options"
              placeholder="Select Location"
              value={form.location}
              onChange={(e) => handleLocationInput(e.target.value)}
              required
            />
            <datalist id="pet-location-options">
              {locationOptions.map((loc) => (
                <option key={loc._id || loc.name} value={loc.name} />
              ))}
            </datalist>
          </div>
          <input
            type="text"
            placeholder="Pincode"
            value={form.pinCode}
            readOnly
          />
          {labels.length > 0 && (
            <select
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            >
              <option value="">Select Label</option>
              {labels.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Photos (URL)"
            value={form.photos}
            onChange={(e) => setForm({ ...form, photos: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Contact Person"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <button className="primary-btn" type="submit">Submit Listing</button>
          {status && <p className="success">{status}</p>}
        </form>
      </section>
    </main>
  );
};

export default PostPet;


