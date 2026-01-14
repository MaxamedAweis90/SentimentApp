"use client";

import { useState } from "react";

interface SentimentFormProps {
  onResult: (result: any) => void;
}

export default function SentimentForm({ onResult }: SentimentFormProps) {
  const [text, setText] = useState("");
  const [starRating, setStarRating] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          star_rating: starRating ? parseFloat(starRating) : null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      setTimeout(() => {
        onResult(data);
      }, 300);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer-container">
      <div className="card">
        <div className="card-header">
          <h2>Analyze Review Sentiment</h2>
          <p>
            Paste a customer review below to instantly detect sentiment and
            keywords.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reviewText">
              Review Text <span className="required">*</span>
            </label>
            <textarea
              id="reviewText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. I absolutely love this product! It exceeded my expectations."
              required
              minLength={10}
              maxLength={1000}
            />
            <div className="char-count">{text.length}/1000</div>
          </div>

          <div className="form-group">
            <label htmlFor="starRating">Star Rating (Optional)</label>
            <select
              id="starRating"
              value={starRating}
              onChange={(e) => setStarRating(e.target.value)}
            >
              <option value="">-- No Rating --</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
              <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
              <option value="3">⭐⭐⭐ (3 Stars)</option>
              <option value="2">⭐⭐ (2 Stars)</option>
              <option value="1">⭐ (1 Star)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn">
            {loading ? (
              <>
                <div className="loader" />
                Analyzing...
              </>
            ) : (
              "Analyze Sentiment"
            )}
          </button>

          <div className={`error-container ${error ? "visible" : ""}`}>
            <svg
              className="error-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
          </div>
        </form>
      </div>
    </div>
  );
}
