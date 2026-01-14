"use client";

import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { useRouter } from "next/navigation";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Review {
  id: string;
  text: string;
  rating: number;
  sentiment: string;
  confidence: number;
  timestamp: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
      loadReviews();
    }
  }, []);

  const loadReviews = () => {
    const saved = localStorage.getItem("reviews");
    if (saved) {
      setReviews(JSON.parse(saved));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      sessionStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      setError("");
      loadReviews();
    } else {
      setError("Invalid credentials. Use username: admin, password: admin");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    router.push("/");
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="card">
          <div className="card-header">
            <h2>Admin Login</h2>
            <p>Access the analytics dashboard</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <button type="submit" className="btn">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalReviews = reviews.length;
  const sentimentCounts = {
    Positive: reviews.filter((r) => r.sentiment === "Positive").length,
    Negative: reviews.filter((r) => r.sentiment === "Negative").length,
    Neutral: reviews.filter((r) => r.sentiment === "Neutral").length,
  };

  const avgConfidence =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.confidence, 0) / reviews.length
        ).toFixed(1)
      : 0;

  const ratingDistribution = [1, 2, 3, 4, 5].map(
    (rating) => reviews.filter((r) => r.rating === rating).length
  );

  const pieData = {
    labels: ["Positive", "Negative", "Neutral"],
    datasets: [
      {
        data: [
          sentimentCounts.Positive,
          sentimentCounts.Negative,
          sentimentCounts.Neutral,
        ],
        backgroundColor: ["#10b981", "#ef4444", "#6b7280"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const barData = {
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [
      {
        label: "Number of Reviews",
        data: ratingDistribution,
        backgroundColor: "#6366f1",
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="container">
      <div className="admin-header-flex">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn logout-btn">
          Logout
        </button>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h3>Total Reviews</h3>
          <div className="admin-stat">{totalReviews}</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            All time submissions
          </p>
        </div>

        <div className="admin-card">
          <h3>Positive Reviews</h3>
          <div className="admin-stat" style={{ color: "var(--success-color)" }}>
            {sentimentCounts.Positive}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {totalReviews > 0
              ? ((sentimentCounts.Positive / totalReviews) * 100).toFixed(1)
              : 0}
            % of total
          </p>
        </div>

        <div className="admin-card">
          <h3>Average Confidence</h3>
          <div className="admin-stat">{avgConfidence}%</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Model accuracy score
          </p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Sentiment Distribution</h3>
          <Pie data={pieData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>Rating Distribution</h3>
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>

      <div className="chart-container">
        <h3>Recent Reviews</h3>
        {reviews.slice(0, 10).map((review) => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div className="review-stars">
                {review.rating > 0 ? "★".repeat(review.rating) : "No rating"}
              </div>
              <span
                className={`review-sentiment ${review.sentiment.toLowerCase()}`}
              >
                {review.sentiment}
              </span>
            </div>
            <p className="review-text">{review.text}</p>
            <p className="review-confidence">
              Confidence: {review.confidence}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
