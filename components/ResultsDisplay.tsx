"use client";

import { useEffect, useState } from "react";

interface ResultsDisplayProps {
  result: any;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [result]);

  if (!result) return null;

  const { sentiment, details } = result;
  const confidence = details.confidence_score || 0;

  return (
    <div className={`results-section ${!visible ? "hidden" : ""}`}>
      <div className="card">
        <div className="card-header">
          <h2>Analysis Results</h2>
        </div>

        <div className="result-overview">
          <div className={`sentiment-badge ${sentiment.toLowerCase()}`}>
            {sentiment}
          </div>

          <div className="confidence-meter">
            <span className="label">Confidence Score</span>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${confidence}%` }} />
            </div>
            <span className="value">
              {confidence}% ({details.confidence_level || "N/A"})
            </span>
          </div>
        </div>

        <div className="result-details">
          <div className="detail-item">
            <span className="label">Detected Keywords</span>
            <div className="tags-list">
              {details.found_phrases && details.found_phrases.length > 0 ? (
                details.found_phrases.map((phrase: string, idx: number) => (
                  <span key={idx} className="tag">
                    {phrase}
                  </span>
                ))
              ) : (
                <span className="text-muted">
                  No specific keywords detected
                </span>
              )}
            </div>
          </div>

          <div className="detail-item">
            <span className="label">Sentiment Score Breakdown</span>
            <div className="score-grid">
              <div className="score-box pos">
                <span className="score-label">Positive Score</span>
                <span className="score-val">
                  {(details.total_pos_score_with_phrases || 0).toFixed(1)}
                </span>
              </div>
              <div className="score-box neg">
                <span className="score-label">Negative Score</span>
                <span className="score-val">
                  {(details.total_neg_score_with_phrases || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
