import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getWebSettings } from "./webSettingsCache";

const fallbackImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80";
const getYoutubeEmbedUrl = (url = "") => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.includes("/embed/")) return url;
    }
  } catch {
    return "";
  }
  return "";
};

const NewsDetail = ({ apiBase }) => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [homeWideAd, setHomeWideAd] = useState("");
  const [sideAds, setSideAds] = useState({ sideAd1: "", sideAd2: "", sideAd3: "" });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: news?.title || "News", url });
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
      fetch(`${apiBase}/api/news/${id}`).then((r) => r.json()),
      getWebSettings(apiBase)
    ])
      .then(([newsData, settings]) => {
        setNews(newsData);
        setHomeWideAd(settings?.newsWideAd || "");
        setSideAds({
          sideAd1: settings?.newsSideAd1 || "",
          sideAd2: settings?.newsSideAd2 || "",
          sideAd3: settings?.newsSideAd3 || ""
        });
      })
      .catch(console.error);
  }, [apiBase, id]);

  const sideAdList = useMemo(
    () => [sideAds.sideAd1, sideAds.sideAd2, sideAds.sideAd3].filter(Boolean),
    [sideAds]
  );
  const youtubeEmbedUrl = useMemo(() => getYoutubeEmbedUrl(news?.youtubeLink || ""), [news?.youtubeLink]);

  if (!news) {
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
              <img src={homeWideAd} alt="News details wide ad" loading="lazy" />
            </div>
          </div>
        </section>
      )}

      <section className={`container ${sideAdList.length > 0 ? "hero-news-ad-layout" : ""}`}>
        <section className="news-detail">
          <img src={news.imageData || news.image || fallbackImage} alt={news.title || "News"} />
          <div className="news-detail-body">
            <span className="badge">{news.category}</span>
            <div className="detail-actions">
              <button type="button" className="share-btn" onClick={handleShare} title="Share">
                <span aria-hidden="true">⤴</span>
                Share
              </button>
            </div>
            <h1>{news.heading1 || news.title}</h1>
            <p className="muted">{news.date}</p>
            {(news.description1 || news.description) && (
              <p className="news-text">{news.description1 || news.description}</p>
            )}
            {news.description2 && <p className="news-text">{news.description2}</p>}
            {news.heading2 && <h2 className="news-subheading">{news.heading2}</h2>}
            {(news.image2Data || news.image2) && (
              <img
                className="news-secondary-image"
                src={news.image2Data || news.image2}
                alt={news.heading2 || "News update"}
              />
            )}
            {news.description3 && <p className="news-text">{news.description3}</p>}
            {youtubeEmbedUrl && (
              <div className="news-video-wrap">
                <iframe
                  src={youtubeEmbedUrl}
                  title="News video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            )}
            {news.description4 && <p className="news-text">{news.description4}</p>}
          </div>
        </section>

        {sideAdList.length > 0 && (
          <aside className="hero-side-ads" aria-label="News details side ads">
            {sideAdList.map((ad, idx) => (
              <div key={`news-details-side-ad-${idx}`} className="hero-side-ad-card">
                <img src={ad} alt={`News details ad ${idx + 1}`} loading="lazy" />
              </div>
            ))}
          </aside>
        )}
      </section>
    </main>
  );
};

export default NewsDetail;
