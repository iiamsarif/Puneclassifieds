import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const fallbackImage = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

const PostDetails = ({ apiBase }) => {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    fetch(`${apiBase}/api/posts/${id}`)
      .then((r) => r.json())
      .then(setPost)
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
        <img src={post.imageUrl || post.imageData || fallbackImage} alt={post.title} />
        <div className="post-info">
          <span className="badge">{post.category}</span>
          <h1>{post.title}</h1>
          <p>{post.description}</p>
          {post.location && <p className="muted">Location: {post.location}</p>}
          <p className="muted">Posted by: {post.userEmail || "Community Member"}</p>
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


