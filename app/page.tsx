"use client";

import { useState, useEffect } from "react";

interface Review {
  id: string;
  text: string;
  rating: number;
  sentiment: string;
  confidence: number;
  timestamp: number;
}

export default function Home() {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Load reviews from localStorage
    const saved = localStorage.getItem("reviews");
    if (saved) {
      setReviews(JSON.parse(saved));
    }
  }, []);

  const saveReviews = (newReviews: Review[]) => {
    localStorage.setItem("reviews", JSON.stringify(newReviews));
    setReviews(newReviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || text.length < 10) return;

    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, star_rating: rating || null }),
      });

      const data = await response.json();

      if (data.success) {
        const newReview: Review = {
          id: Date.now().toString(),
          text,
          rating: rating || 0,
          sentiment: data.sentiment,
          confidence: data.details.confidence_score,
          timestamp: Date.now(),
        };

        const updatedReviews = [newReview, ...reviews];
        saveReviews(updatedReviews);

        // Reset form
        setText("");
        setRating(0);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="analyzer-container">
        <div className="card">
          <div className="card-header">
            <h2>Submit Your Review</h2>
            <p>Share your experience with our community</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reviewText">
                Your Review <span className="required">*</span>
              </label>
              <textarea
                id="reviewText"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell us about your experience..."
                required
                minLength={10}
                maxLength={1000}
              />
              <div className="char-count">{text.length}/1000</div>
            </div>

            <div className="form-group">
              <label>Rating (Optional)</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${
                      star <= (hoverRating || rating) ? "active" : ""
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn">
              {loading ? (
                <>
                  <div className="loader" />
                  Analyzing...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </form>
        </div>

        {reviews.length > 0 && (
          <div className="reviews-list">
            <h3>Recent Reviews ({reviews.length})</h3>
            {reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="review-stars">
                    {review.rating > 0
                      ? "★".repeat(review.rating) +
                        "☆".repeat(5 - review.rating)
                      : "☆☆☆☆☆"}
                  </div>
                  <span className="review-date">
                    {new Date(review.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
