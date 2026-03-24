import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getWebSettings } from "./webSettingsCache";

const fallbackImage = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

const pickCategoryAds = (settings, categoryName) => {
  const key = String(categoryName || "").toLowerCase();
  const mapping = {
    jobs: { wide: "jobsWideAd", side1: "jobsSideAd1", side2: "jobsSideAd2", side3: "jobsSideAd3" },
    property: { wide: "propertyWideAd", side1: "propertySideAd1", side2: "propertySideAd2", side3: "propertySideAd3" },
    pets: { wide: "petsWideAd", side1: "petsSideAd1", side2: "petsSideAd2", side3: "petsSideAd3" },
    services: { wide: "servicesWideAd", side1: "servicesSideAd1", side2: "servicesSideAd2", side3: "servicesSideAd3" }
  };
  const m = mapping[key];
  if (!m) {
    return {
      wide: "",
      sideAd1: "",
      sideAd2: "",
      sideAd3: ""
    };
  }
  return {
    wide: settings?.[m.wide] || "",
    sideAd1: settings?.[m.side1] || "",
    sideAd2: settings?.[m.side2] || "",
    sideAd3: settings?.[m.side3] || ""
  };
};

const PostDetails = ({ apiBase }) => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [homeWideAd, setHomeWideAd] = useState("");
  const [sideAds, setSideAds] = useState({ sideAd1: "", sideAd2: "", sideAd3: "" });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post?.title || "Post", url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard.");
        return;
      }
    } catch (err) {
      console.error(err);
    }
    alert("Unable to share on this device.");
  };

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/posts/${id}`).then((r) => r.json()),
      getWebSettings(apiBase)
    ])
      .then(([data, settings]) => {
        setPost(data);
        const first = (data?.imageUrls && data.imageUrls[0]) || data?.imageUrl || data?.imageData || "";
        setActiveImage(first);
        const ads = pickCategoryAds(settings, data?.category);
        setHomeWideAd(ads.wide);
        setSideAds({
          sideAd1: ads.sideAd1,
          sideAd2: ads.sideAd2,
          sideAd3: ads.sideAd3
        });
      })
      .catch(console.error);
  }, [apiBase, id]);

  const sideAdList = useMemo(
    () => [sideAds.sideAd1, sideAds.sideAd2, sideAds.sideAd3].filter(Boolean),
    [sideAds]
  );

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
      {homeWideAd && (
        <section className="section home-wide-ad-section">
          <div className="container">
            <div className="home-wide-ad-card">
              <img src={homeWideAd} alt="Post details wide ad" loading="lazy" />
            </div>
          </div>
        </section>
      )}

      <section className={`container ${sideAdList.length > 0 ? "hero-news-ad-layout" : ""}`}>
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
            <div className="detail-actions">
              <button type="button" className="share-btn" onClick={handleShare} title="Share">
                <span aria-hidden="true">⤴</span>
                Share
              </button>
            </div>
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

        {sideAdList.length > 0 && (
          <aside className="hero-side-ads" aria-label="Post details side ads">
            {sideAdList.map((ad, idx) => (
              <div key={`details-side-ad-${idx}`} className="hero-side-ad-card">
                <img src={ad} alt={`Post details ad ${idx + 1}`} loading="lazy" />
              </div>
            ))}
          </aside>
        )}
      </section>
    </main>
  );
};

export default PostDetails;
