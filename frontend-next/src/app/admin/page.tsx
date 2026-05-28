'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, API_BASE_URL } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const router = useRouter();
  const { token, logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Basic redirect if not logged in
    const savedToken = localStorage.getItem('verifyit-token');
    if (!savedToken) {
      router.push('/login');
      return;
    }
    fetchDashboard(savedToken);
  }, []);

  const fetchDashboard = async (authToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const resData = await response.json();
      setData(resData);
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
          <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error" style={{ background: 'var(--danger)', color: 'white', padding: '1rem', borderRadius: 'var(--radius-sm)', margin: '2rem' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Chart configs
  const trendsData = {
    labels: data.fake_news_trends?.map((t: any) => t.date) || [],
    datasets: [
      {
        label: 'Fake/Misleading',
        data: data.fake_news_trends?.map((t: any) => t.fake) || [],
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Real/Credible',
        data: data.fake_news_trends?.map((t: any) => t.real) || [],
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const trendsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const topicsData = {
    labels: data.trending_misinformation_topics?.slice(0, 10).map((t: any) => t.topic) || [],
    datasets: [
      {
        label: 'Occurrences',
        data: data.trending_misinformation_topics?.slice(0, 10).map((t: any) => t.count) || [],
        backgroundColor: '#0d6efd', // accent primary roughly
      },
    ],
  };

  const topicsOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <>
      <nav className="navbar scrolled" id="navbar">
        <div className="container">
          <a href="/" className="navbar-brand">
            <div className="brand-icon"><i className="fas fa-check"></i></div>
            Verify<span className="brand-accent">It</span> Admin
          </a>

          <div className="navbar-actions">
            <button className="btn btn-ghost" onClick={() => { logout(); router.push('/login'); }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="admin-dashboard" style={{ maxWidth: '1400px', margin: '0 auto', padding: '6rem 2rem 2rem 2rem' }}>
        <div className="dashboard-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><i className="fas fa-brain"></i> Admin Intelligence Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor verification trends, user reports, and AI performance</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="stat-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
              {data.total_verifications || 0}
            </div>
            <div className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Verifications</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
              {data.total_reports || 0}
            </div>
            <div className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>User Reports</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
              {data.ai_accuracy?.accuracy_percentage || 0}%
            </div>
            <div className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>AI Accuracy</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
              {data.user_reports?.pending || 0}
            </div>
            <div className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pending Reports</div>
          </div>
        </div>

        {/* Charts */}
        <div className="chart-container" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div className="chart-header" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            <i className="fas fa-chart-line"></i> Fake News Trends (Last 30 Days)
          </div>
          <div style={{ height: '300px' }}>
            <Line data={trendsData} options={trendsOptions} />
          </div>
        </div>

        <div className="chart-container" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div className="chart-header" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            <i className="fas fa-fire"></i> Trending Misinformation Topics
          </div>
          <div style={{ height: '300px' }}>
            <Bar data={topicsData} options={topicsOptions} />
          </div>
        </div>

        {/* Most Checked Stories */}
        <div className="chart-container" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div className="chart-header" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            <i className="fas fa-book-open"></i> Most Checked Stories
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontWeight: 600 }}>Content</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontWeight: 600 }}>Checks</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontWeight: 600 }}>Avg Score</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontWeight: 600 }}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {data.most_checked_stories?.map((story: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>{story.content?.substring(0, 100)}...</td>
                    <td style={{ padding: '0.75rem' }}>{story.count}</td>
                    <td style={{ padding: '0.75rem' }}>{story.avg_score}%</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`verdict-badge verdict-${story.verdict.toLowerCase()}`} style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, background: story.verdict.toLowerCase() === 'fake' ? 'var(--danger)' : story.verdict.toLowerCase() === 'real' ? 'var(--success)' : story.verdict.toLowerCase() === 'misleading' ? 'var(--warning)' : 'var(--text-muted)', color: 'white' }}>
                        {story.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.most_checked_stories?.length && (
                  <tr>
                    <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Reports & Accuracy */}
        <div className="reports-section" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          <div className="chart-container" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div className="chart-header" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              <i className="fas fa-clipboard"></i> Recent User Reports
            </div>
            <div className="reports-list" style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.user_reports?.recent?.map((report: any, idx: number) => (
                <div key={idx} className="report-item" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div><strong>{report.category}</strong>: {report.content?.substring(0, 150)}...</div>
                  <div style={{ marginTop: '0.5rem' }}><em>Reason: {report.reason}</em></div>
                  <div className="report-meta" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Reported by: {report.reported_by} | {new Date(report.timestamp).toLocaleDateString()}
                    {report.source_url && (
                      <> | Source: <a href={report.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>{report.source_url}</a></>
                    )}
                  </div>
                </div>
              ))}
              {!data.user_reports?.recent?.length && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No reports available</div>
              )}
            </div>
          </div>
          
          <div className="chart-container" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', height: 'fit-content' }}>
            <div className="chart-header" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              📊 AI Accuracy Statistics
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Total Feedback:</strong> <span>{data.ai_accuracy?.total_feedback || 0}</span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Agreed with AI:</strong> <span>{data.ai_accuracy?.agreed_count || 0}</span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Accuracy Rate:</strong> <span>{data.ai_accuracy?.accuracy_percentage || 0}%</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                Accuracy is calculated based on user feedback on verification results. Our goal is to continuously improve AI precision.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
