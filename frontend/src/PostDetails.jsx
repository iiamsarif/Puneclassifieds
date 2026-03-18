import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const fallbackImage = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

const PostDetails = ({ apiBase }) => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/posts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPost(data);
        const first = (data?.imageUrls && data.imageUrls[0]) || data?.imageUrl || data?.imageData || "";
        setActiveImage(first);
      })
      .catch(console.error);
  }, [apiBase, id]);

  if (!post) {
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
      <section className="post-details">
        <div className="post-gallery">
          <img
            className="post-main-image"
            src={activeImage || (post.imageUrls && post.imageUrls[0]) || post.imageUrl || post.imageData || fallbackImage}
            alt={post.title}
          />
          {Array.isArray(post.imageUrls) && post.imageUrls.length > 1 && (
            <div className="post-thumbs">
              {post.imageUrls.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  className={`thumb-btn ${activeImage === url ? "active" : ""}`}
                  onClick={() => setActiveImage(url)}
                >
                  <img src={url} alt={`${post.title} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="post-info">
          <span className="badge">{post.category}</span>
          {post.type && <span className="badge">{post.type}</span>}
          {post.label && <span className="badge">{post.label}</span>}
          <h1>{post.title}</h1>
          <p>{post.description}</p>
          {post.location && <p className="muted">Location: {post.location}</p>}
          <p className="muted">Posted by: {post.userEmail || "Community Member"}</p>
          {post.category && post.category.toLowerCase() === "pets" && (
            <div className="detail-list">
              {post.breed && (
                <div className="detail-item">
                  <strong>Breed</strong>
                  <span>{post.breed}</span>
                </div>
              )}
              {post.age && (
                <div className="detail-item">
                  <strong>Age</strong>
                  <span>{post.age}</span>
                </div>
              )}
              {post.gender && (
                <div className="detail-item">
                  <strong>Gender</strong>
                  <span>{post.gender}</span>
                </div>
              )}
              {post.size && (
                <div className="detail-item">
                  <strong>Size</strong>
                  <span>{post.size}</span>
                </div>
              )}
              {post.vaccinationStatus && (
                <div className="detail-item">
                  <strong>Vaccination Status</strong>
                  <span>{post.vaccinationStatus}</span>
                </div>
              )}
              {post.medicalHistory && (
                <div className="detail-item">
                  <strong>Medical History</strong>
                  <span>{post.medicalHistory}</span>
                </div>
              )}
              {post.temperament && (
                <div className="detail-item">
                  <strong>Temperament</strong>
                  <span>{post.temperament}</span>
                </div>
              )}
              {post.adoptionConditions && (
                <div className="detail-item">
                  <strong>Adoption Conditions</strong>
                  <span>{post.adoptionConditions}</span>
                </div>
              )}
              {post.contactDetails && (
                <div className="detail-item">
                  <strong>Contact Details</strong>
                  <span>{post.contactDetails}</span>
                </div>
              )}
            </div>
          )}
          <div className="contact-row">
            <span>{post.contactName || "Community Desk"}</span>
            <span>{post.phone || ""}</span>
            {post.phone && (
              <a className="primary-btn" href={`tel:${post.phone}`}>Call</a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default PostDetails;


