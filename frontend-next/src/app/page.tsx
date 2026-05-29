'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, API_BASE_URL } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme, ThemeType } from '@/context/ThemeContext';

interface SourceItem {
  title: string;
  url: string;
  trusted: boolean;
}

interface VerificationResult {
  credibility_score: number;
  verdict: string;
  bert_score: number;
  llm_score: number;
  web_score: number;
  reasoning: string;
  sources: SourceItem[];
  red_flags: string[];
  explanations: string[];
  extracted_text?: string;
  manipulation_indicators?: string[];
  suspicion_score?: number;
  media_type?: string;
  detection_details?: string[];
  analysis?: string;
}

const quizQuestions = [
  {
    question: 'Is this headline real or fake? “BREAKING: Government to ban all mobile phones nationwide tonight.”',
    options: ['Real', 'Fake'],
    answer: 1,
    explanation: 'This headline is exaggerated and unlikely. Real news rarely uses extreme urgency to force immediate action.'
  },
  {
    question: 'Is this headline real or fake? “Local hospital reports a 30% drop in malaria cases after new prevention campaign.”',
    options: ['Real', 'Fake'],
    answer: 0,
    explanation: 'This headline is plausible and specific, with a realistic claim that would come from health reporting.'
  },
  {
    question: 'Is this headline real or fake? “Celebrity endorses miracle pill that cures diabetes in 3 days.”',
    options: ['Real', 'Fake'],
    answer: 1,
    explanation: 'Miracle cure claims are a common sign of misinformation; true medical news is not this sensational.'
  },
  {
    question: 'Is this headline real or fake? “University publishes peer-reviewed study on renewable energy adoption.”',
    options: ['Real', 'Fake'],
    answer: 0,
    explanation: 'This sounds like legitimate science reporting, with specific details and a reasonable source.'
  },
  {
    question: 'Is this headline real or fake? “Virus spread linked to 5G towers in city center.”',
    options: ['Real', 'Fake'],
    answer: 1,
    explanation: 'This is a conspiracy-style claim combining unrelated topics, which is a red flag for fake news.'
  }
];

const normalizeData = (data: any) => ({
  ...data,
  bert_score: Math.min(100, Math.max(0, Math.round(data.bert_score > 100 ? data.bert_score / 100 : (data.bert_score || 0)))),
  llm_score: Math.min(100, Math.max(0, Math.round(data.llm_score > 100 ? data.llm_score / 100 : (data.llm_score || 0)))),
  web_score: Math.min(100, Math.max(0, Math.round(data.web_score > 100 ? data.web_score / 100 : (data.web_score || 0)))),
  credibility_score: Math.min(100, Math.max(0, Math.round(data.credibility_score > 100 ? data.credibility_score / 100 : (data.credibility_score || 0))))
});

export default function Home() {
  const router = useRouter();
  const { user, token, logout, updateUserLocal } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  // Navigation states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Modals state
  const [quizOpen, setQuizOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Profile Form state
  const [profileName, setProfileName] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileBio, setProfileBio] = useState('');

  // Toast state
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'warning' | 'info' }[]>([]);

  // Text Verification states
  const [textVal, setTextVal] = useState('');
  const [textLoading, setTextLoading] = useState(false);
  const [textResult, setTextResult] = useState<VerificationResult | null>(null);

  // URL Verification states
  const [urlVal, setUrlVal] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlResult, setUrlResult] = useState<VerificationResult | null>(null);

  // Image Verification states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<VerificationResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extractedOcrText, setExtractedOcrText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deepfake detector states
  const [dfFile, setDfFile] = useState<File | null>(null);
  const [dfLoading, setDfLoading] = useState(false);
  const [dfResult, setDfResult] = useState<VerificationResult | null>(null);
  const dfInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp states
  const [waInput, setWaInput] = useState('');
  const [waMessage, setWaMessage] = useState('');

  // Quiz states
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Trending News states
  const [trendingCategory, setTrendingCategory] = useState('all');
  const [trendingArticles, setTrendingArticles] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  useEffect(() => {
    // Require authentication
    const savedToken = localStorage.getItem('verifyit-token');
    if (!savedToken) {
      router.push('/login');
    } else {
      loadHistory();
      fetchTrendingNews('all');
      if (user) {
        setProfileName(user.username);
        setProfileLocation(user.location || '');
        setProfileBio(user.bio || '');
      }
    }
  }, [user]);

  // Toast Helpers
  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Local Storage History Helpers
  const loadHistory = () => {
    const hist = localStorage.getItem('verifyit-verification-history');
    if (hist) {
      try {
        setHistoryList(JSON.parse(hist));
      } catch {
        setHistoryList([]);
      }
    }
  };

  const saveToHistory = (type: string, text: string, score: number, verdict: string) => {
    const newItem = {
      type,
      text: text.substring(0, 200),
      score,
      verdict,
      timestamp: new Date().toISOString()
    };
    const updated = [newItem, ...historyList].slice(0, 50);
    setHistoryList(updated);
    localStorage.setItem('verifyit-verification-history', JSON.stringify(updated));
  };

  // Fetch Trending News from Backend
  const fetchTrendingNews = async (category: string) => {
    setTrendingLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/trending-news?category=${category}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('verifyit-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTrendingArticles(data.articles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTrendingLoading(false);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setTrendingCategory(cat);
    fetchTrendingNews(cat);
  };

  // 1. Verify Text Endpoint
  const handleVerifyText = async () => {
    if (!textVal.trim()) {
      addToast('Please paste or write a claim first.', 'warning');
      return;
    }
    setTextLoading(true);
    setTextResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('verifyit-token')}`
        },
        body: JSON.stringify({
          text: textVal,
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTextResult(normalizeData(data));
        saveToHistory('text', textVal, data.credibility_score, data.verdict);
        addToast('Verification complete!', 'success');
      } else {
        const errData = await response.json().catch(() => ({}));
        addToast(errData.detail || 'Verification failed.', 'error');
      }
    } catch (err: any) {
      addToast('Network error connecting to API.', 'error');
    } finally {
      setTextLoading(false);
    }
  };

  // 2. Verify URL Endpoint
  const handleVerifyUrl = async () => {
    if (!urlVal.trim()) {
      addToast('Please enter an article URL.', 'warning');
      return;
    }
    setUrlLoading(true);
    setUrlResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/check-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('verifyit-token')}`
        },
        body: JSON.stringify({
          url: urlVal,
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUrlResult(normalizeData(data));
        saveToHistory('url', urlVal, data.credibility_score, data.verdict);
        addToast('URL verification complete!', 'success');
      } else {
        const errData = await response.json().catch(() => ({}));
        addToast(errData.detail || 'URL Verification failed.', 'error');
      }
    } catch (err) {
      addToast('Network error connecting to API.', 'error');
    } finally {
      setUrlLoading(false);
    }
  };

  // 3. Verify Image Endpoint
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Strip data url header
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyImage = async () => {
    if (!imageFile) {
      addToast('Please upload an image first.', 'warning');
      return;
    }
    setImageLoading(true);
    setImageResult(null);

    try {
      const base64 = await fileToBase64(imageFile);
      const response = await fetch(`${API_BASE_URL}/check-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('verifyit-token')}`
        },
        body: JSON.stringify({
          image: base64,
          filename: imageFile.name,
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        setImageResult(normalizeData(data));
        saveToHistory('image', imageFile.name, data.credibility_score, data.verdict);
        addToast('Image verification complete!', 'success');
      } else {
        const errData = await response.json().catch(() => ({}));
        addToast(errData.detail || 'Image Verification failed.', 'error');
      }
    } catch (err) {
      addToast('Error processing image upload.', 'error');
    } finally {
      setImageLoading(false);
    }
  };

  const handleExtractText = async () => {
    if (!imageFile) {
      addToast('Please upload an image first.', 'warning');
      return;
    }
    setOcrLoading(true);
    setExtractedOcrText('');
    
    try {
      const base64 = await fileToBase64(imageFile);
      const response = await fetch(`${API_BASE_URL}/extract-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('verifyit-token')}`
        },
        body: JSON.stringify({
          image: base64,
          filename: imageFile.name,
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text && data.text.trim()) {
          setExtractedOcrText(data.text);
          addToast('Text extracted successfully!', 'success');
        } else {
          setExtractedOcrText('');
          addToast('OCR returned no text. Please configure GEMINI_API_KEYS on Render!', 'warning');
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        addToast(errData.detail || 'Text extraction failed.', 'error');
      }
    } catch (err) {
      addToast('Error extracting text from image.', 'error');
    } finally {
      setOcrLoading(false);
    }
  };

  // 4. Verify Deepfake Endpoint
  const handleVerifyDeepfake = async () => {
    if (!dfFile) {
      addToast('Please upload an audio or video file first.', 'warning');
      return;
    }
    setDfLoading(true);
    setDfResult(null);

    try {
      const base64 = await fileToBase64(dfFile);
      const response = await fetch(`${API_BASE_URL}/check-deepfake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('verifyit-token')}`
        },
        body: JSON.stringify({
          file: base64,
          filename: dfFile.name,
          media_type: dfFile.type
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDfResult(data);
        saveToHistory('deepfake', dfFile.name, data.suspicion_score || 0, data.verdict);
        addToast('Deepfake analysis complete!', 'success');
      } else {
        const errData = await response.json().catch(() => ({}));
        addToast(errData.detail || 'Deepfake analysis failed.', 'error');
      }
    } catch (err) {
      addToast('Failed to verify deepfake file.', 'error');
    } finally {
      setDfLoading(false);
    }
  };

  // WhatsApp Generation Helper
  const handleGenerateWhatsApp = () => {
    if (!waInput.trim()) {
      addToast('Please write a claim to format.', 'warning');
      return;
    }
    const message = `🚨 Sus suspicious mis/disinformation reported to VerifyIt Nigeria:\n\nClaim: "${waInput.trim()}"\n\n🔎 Status: Unverified. Verify this instantly at https://verifyit.ng`;
    setWaMessage(message);
    addToast('Message generated successfully!', 'success');
  };

  const handleCopyWhatsApp = () => {
    if (!waMessage) return;
    navigator.clipboard.writeText(waMessage);
    addToast('Message copied to clipboard!', 'success');
  };

  // Interactive Quiz state machines
  const handleQuizOption = (optIdx: number) => {
    if (quizAnswered) return;
    setSelectedOption(optIdx);
    setQuizAnswered(true);
    const correctAns = quizQuestions[quizIndex].answer;
    if (optIdx === correctAns) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleQuizNext = () => {
    setSelectedOption(null);
    setQuizAnswered(false);
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizAnswered(false);
    setSelectedOption(null);
    setQuizCompleted(false);
  };

  // Profile update persistence
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      addToast('Username cannot be empty.', 'warning');
      return;
    }

    const updated = {
      username: profileName,
      email: user?.email || '',
      location: profileLocation,
      bio: profileBio
    };

    updateUserLocal(updated);
    addToast('Profile saved locally.', 'success');

    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('verifyit-token')}`
        },
        body: JSON.stringify({
          username: profileName,
          location: profileLocation,
          bio: profileBio
        })
      });
      if (response.ok) {
        addToast('Profile synced successfully on cloud!', 'success');
      }
    } catch {
      // Ignore background persistence errors
    }
    setProfileOpen(false);
  };

  const getVerdictColor = (score: number) => {
    if (score >= 70) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getVerdictEmoji = (score: number) => {
    if (score >= 70) return '✅';
    if (score >= 50) return '🔷';
    return '⚠️';
  };

  return (
    <>
      {/* Toast Notification wrapper */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header / Navbar */}
      <nav className="navbar scrolled" id="navbar">
        <div className="container">
          <a href="#" className="navbar-brand">
            <div className="brand-icon"><i className="fas fa-check"></i></div>
            Verify<span className="brand-accent">It</span>
          </a>

          <ul className="navbar-links">
            <li><a href="#" className="active">Verify</a></li>
            <li><a href="#" onClick={() => addToast('VerifyIt Nigeria connects your facts with deep machine models.', 'info')}>About</a></li>
          </ul>

          <div className="navbar-actions">
            {/* Theme switcher */}
            <div className="theme-selector">
              <div className={`theme-dot ${theme === 'dark' ? 'active' : ''}`} data-theme="dark" onClick={() => setTheme('dark')}></div>
              <div className={`theme-dot ${theme === 'light' ? 'active' : ''}`} data-theme="light" onClick={() => setTheme('light')}></div>
              <div className={`theme-dot ${theme === 'ocean' ? 'active' : ''}`} data-theme="ocean" onClick={() => setTheme('ocean')}></div>
              <div className={`theme-dot ${theme === 'forest' ? 'active' : ''}`} data-theme="forest" onClick={() => setTheme('forest')}></div>
            </div>

            <button className="btn btn-ghost btn-icon" onClick={() => setHistoryOpen(true)} title="History">
              <i className="fas fa-clipboard"></i>
            </button>

            {/* Profile Dropdown */}
            {user && (
              <div className="user-actions-wrapper" style={{ position: 'relative' }}>
                <div className="user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                  <span>{user.username}</span>
                </div>
                {dropdownOpen && (
                  <div className="user-profile-dropdown show">
                    {user.email?.includes('admin') && (
                      <div className="dropdown-item" onClick={() => addToast('Admin features loading...', 'info')}>
                        <i className="fas fa-brain"></i> Dashboard
                      </div>
                    )}
                    <div className="dropdown-item" onClick={() => { setProfileOpen(true); setDropdownOpen(false); }}>
                      <i className="fas fa-user"></i> Profile
                    </div>
                    <div className="dropdown-item" onClick={() => { setSettingsOpen(true); setDropdownOpen(false); }}>
                      <i className="fas fa-cog"></i> Settings
                    </div>
                    <div className="dropdown-item logout" onClick={() => { logout(); router.push('/login'); }}>
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="pulse-dot"></span>
              AI-Powered Verification Nigeria
            </div>
            <h1>Detect Fake News<br />with <span className="gradient-text">VerifyIt</span></h1>
            <p>{t('hero_paragraph')}</p>
            <div className="hero-buttons">
              <a href="#verify" className="btn btn-primary btn-lg">Start Verifying <i className="fas fa-arrow-down"></i></a>
              <a href="#trending" className="btn btn-secondary btn-lg">Trending Headlines</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="stat-value">97.3%</div>
                <div className="stat-label">Accuracy Rate</div>
              </div>
              <div className="hero-stat">
                <div className="stat-value">3</div>
                <div className="stat-label">AI Models</div>
              </div>
              <div className="hero-stat">
                <div className="stat-value">&lt;5s</div>
                <div className="stat-label">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Verify Panel */}
      <section className="verify-section" id="verify">
        <div className="container">
          <h2 className="section-title">Verify Your <span className="gradient-text">Content</span></h2>
          <p className="section-subtitle">{t('verify_subtitle')}</p>

          <div className="verify-grid">
            {/* Text Verification Panel */}
            <div className="verify-card">
              <div className="card-header">
                <div className="card-icon"><i className="fas fa-file-alt"></i></div>
                <div>
                  <div className="card-title">{t('text_card_title')}</div>
                  <div className="card-desc">{t('text_card_desc')}</div>
                </div>
              </div>
              <textarea
                className="verify-textarea"
                placeholder="Paste news claim or post content..."
                maxLength={5000}
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
              />
              <div className="char-count">{textVal.length}/5000</div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleVerifyText} disabled={textLoading}>
                  {textLoading ? 'Verifying...' : 'Verify Text'}
                </button>
                <button className="btn btn-ghost" onClick={() => setTextVal('')}>Clear</button>
              </div>

              {textLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <div className="loading-text">Fusing models & search details...</div>
                </div>
              )}

              {textResult && (
                <div className="results-panel">
                  <div className="results-header">
                    <h3>Credibility Gauge</h3>
                  </div>
                  <div className="results-body">
                    <div className="score-gauge">
                      <div className="gauge-ring">
                        <svg viewBox="0 0 100 100">
                          <circle className="gauge-bg" cx="50" cy="50" r="46" />
                          <circle
                            className="gauge-fill"
                            cx="50"
                            cy="50"
                            r="46"
                            stroke={getVerdictColor(textResult.credibility_score)}
                            strokeDasharray={`${2 * Math.PI * 46}`}
                            strokeDashoffset={`${2 * Math.PI * 46 - (textResult.credibility_score / 100) * 2 * Math.PI * 46}`}
                          />
                        </svg>
                        <div className="gauge-text" style={{ color: getVerdictColor(textResult.credibility_score) }}>
                          {textResult.credibility_score}%
                        </div>
                      </div>
                      <div className="gauge-label">
                        <div className="verdict">
                          {getVerdictEmoji(textResult.credibility_score)} {textResult.verdict}
                        </div>
                        <div className="verdict-desc">
                          {textResult.credibility_score >= 70
                            ? t('verdict_desc_high')
                            : textResult.credibility_score >= 45
                            ? t('verdict_desc_mixed')
                            : t('verdict_desc_fake')}
                        </div>
                      </div>
                    </div>

                    <div className="breakdown">
                      <div className="breakdown-item">
                        <span className="breakdown-label">BERT AI Model</span>
                        <div className="breakdown-bar">
                          <div className="breakdown-fill" style={{ width: `${textResult.bert_score}%`, backgroundColor: 'var(--accent-primary)' }}></div>
                        </div>
                        <span className="breakdown-value">{textResult.bert_score}%</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Llama 3 LLM</span>
                        <div className="breakdown-bar">
                          <div className="breakdown-fill" style={{ width: `${textResult.llm_score}%`, backgroundColor: 'var(--accent-secondary)' }}></div>
                        </div>
                        <span className="breakdown-value">{textResult.llm_score}%</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Web Verification</span>
                        <div className="breakdown-bar">
                          <div className="breakdown-fill" style={{ width: `${textResult.web_score}%`, backgroundColor: 'var(--info)' }}></div>
                        </div>
                        <span className="breakdown-value">{textResult.web_score}%</span>
                      </div>
                    </div>

                    {textResult.explanations && textResult.explanations.length > 0 && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Analytical Explanation</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                          {textResult.explanations.map((exp, idx) => (
                            <li key={idx}>{exp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* URL Verification Panel */}
            <div className="verify-card">
              <div className="card-header">
                <div className="card-icon"><i className="fas fa-link"></i></div>
                <div>
                  <div className="card-title">{t('url_card_title')}</div>
                  <div className="card-desc">{t('url_card_desc')}</div>
                </div>
              </div>
              <input
                type="url"
                className="verify-input"
                placeholder="https://punchng.com/example-news-article"
                value={urlVal}
                onChange={(e) => setUrlVal(e.target.value)}
              />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleVerifyUrl} disabled={urlLoading}>
                  {urlLoading ? 'Extracting...' : 'Verify URL'}
                </button>
                <button className="btn btn-ghost" onClick={() => setUrlVal('')}>Clear</button>
              </div>

              {urlLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <div className="loading-text">Extracting article content & matching trusted databases...</div>
                </div>
              )}

              {urlResult && (
                <div className="results-panel">
                  <div className="results-body">
                    <div className="score-gauge">
                      <div className="gauge-ring">
                        <svg viewBox="0 0 100 100">
                          <circle className="gauge-bg" cx="50" cy="50" r="46" />
                          <circle
                            className="gauge-fill"
                            cx="50"
                            cy="50"
                            r="46"
                            stroke={getVerdictColor(urlResult.credibility_score)}
                            strokeDasharray={`${2 * Math.PI * 46}`}
                            strokeDashoffset={`${2 * Math.PI * 46 - (urlResult.credibility_score / 100) * 2 * Math.PI * 46}`}
                          />
                        </svg>
                        <div className="gauge-text" style={{ color: getVerdictColor(urlResult.credibility_score) }}>
                          {urlResult.credibility_score}%
                        </div>
                      </div>
                      <div className="gauge-label">
                        <div className="verdict">
                          {getVerdictEmoji(urlResult.credibility_score)} {urlResult.verdict}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Url: {urlVal}
                        </div>
                        <div className="verdict-desc">
                          {urlResult.credibility_score >= 70
                            ? t('verdict_desc_high')
                            : t('verdict_desc_mixed')}
                        </div>
                      </div>
                    </div>

                    {urlResult.sources && urlResult.sources.length > 0 && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cross-Referenced Media Sources</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {urlResult.sources.map((src, i) => (
                            <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{src.title || src.url}</span>
                              <span style={{ color: src.trusted ? 'var(--success)' : 'var(--text-muted)' }}>
                                {src.trusted ? '✓ Trusted' : 'Unconfirmed'}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Image Verification Panel */}
            <div className="verify-card">
              <div className="card-header">
                <div className="card-icon"><i className="fas fa-image"></i></div>
                <div>
                  <div className="card-title">{t('image_card_title')}</div>
                  <div className="card-desc">{t('image_card_desc')}</div>
                </div>
              </div>

              {!imagePreview ? (
                <div className="image-upload-zone" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon"><i className="fas fa-folder-open"></i></div>
                  <div className="upload-text">Select screenshot to analyze</div>
                  <div className="upload-hint">Supports JPG, PNG (max 10MB)</div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                </div>
              ) : (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Upload Preview" />
                  <button className="remove-image-btn" onClick={() => { setImageFile(null); setImagePreview(''); }}><i className="fas fa-times"></i></button>
                </div>
              )}

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleVerifyImage} disabled={imageLoading || ocrLoading}>
                  {imageLoading ? 'Analyzing...' : 'Verify Image'}
                </button>
                <button className="btn btn-secondary" onClick={handleExtractText} disabled={imageLoading || ocrLoading}>
                  {ocrLoading ? 'Extracting...' : 'Extract Text (OCR)'}
                </button>
              </div>

              {imageLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <div className="loading-text">Running EasyOCR, Gemini Vision & Fact Fusions...</div>
                </div>
              )}

              {ocrLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <div className="loading-text">Running Google Vision OCR & fallback extraction...</div>
                </div>
              )}

              {extractedOcrText && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Extracted Text</span>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => {
                      setTextVal(extractedOcrText);
                      addToast('Copied to text verification box!', 'info');
                    }}>Use for Text Verification</button>
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{extractedOcrText}"
                  </p>
                </div>
              )}

              {imageResult && (
                <div className="results-panel">
                  <div className="results-body">
                    <div className="score-gauge">
                      <div className="gauge-ring">
                        <svg viewBox="0 0 100 100">
                          <circle className="gauge-bg" cx="50" cy="50" r="46" />
                          <circle
                            className="gauge-fill"
                            cx="50"
                            cy="50"
                            r="46"
                            stroke={getVerdictColor(imageResult.credibility_score)}
                            strokeDasharray={`${2 * Math.PI * 46}`}
                            strokeDashoffset={`${2 * Math.PI * 46 - (imageResult.credibility_score / 100) * 2 * Math.PI * 46}`}
                          />
                        </svg>
                        <div className="gauge-text" style={{ color: getVerdictColor(imageResult.credibility_score) }}>
                          {imageResult.credibility_score}%
                        </div>
                      </div>
                      <div className="gauge-label">
                        <div className="verdict">
                          {getVerdictEmoji(imageResult.credibility_score)} {imageResult.verdict}
                        </div>
                        <div className="verdict-desc">
                          Analysis completed. Gemini Vision scanned visual attributes and ran standard matching benchmarks.
                        </div>
                      </div>
                    </div>

                    {imageResult.extracted_text && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>OCR Extracted Content</h4>
                        <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          "{imageResult.extracted_text}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Deepfake Detector Panel */}
            <div className="verify-card">
              <div className="card-header">
                <div className="card-icon"><i className="fas fa-video"></i></div>
                <div>
                  <div className="card-title">Deepfake Media Detector</div>
                  <div className="card-desc">Scan audio/video file for synthetic signals</div>
                </div>
              </div>

              <div className="deepfake-controls">
                <input type="file" ref={dfInputRef} onChange={(e) => setDfFile(e.target.files?.[0] || null)} accept="audio/*,video/*" style={{ display: 'none' }} />
                <button type="button" className="btn btn-secondary" onClick={() => dfInputRef.current?.click()}>Upload File</button>
                <div className="deepfake-selected">
                  {dfFile ? `${dfFile.name} (${Math.round(dfFile.size / 1024)} KB)` : 'No file selected'}
                </div>
                <button type="button" className="btn btn-primary" onClick={handleVerifyDeepfake} disabled={dfLoading}>
                  {dfLoading ? 'Analyzing Kadences...' : 'Detect Deepfake'}
                </button>
              </div>

              {dfLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <div className="loading-text">Running artifact pattern comparisons...</div>
                </div>
              )}

              {dfResult && (
                <div className="results-panel">
                  <div className="results-body">
                    <div className="score-gauge">
                      <div className="gauge-ring">
                        <svg viewBox="0 0 100 100">
                          <circle className="gauge-bg" cx="50" cy="50" r="46" />
                          <circle
                            className="gauge-fill"
                            cx="50"
                            cy="50"
                            r="46"
                            stroke={dfResult.suspicion_score && dfResult.suspicion_score >= 50 ? 'var(--danger)' : 'var(--success)'}
                            strokeDasharray={`${2 * Math.PI * 46}`}
                            strokeDashoffset={`${2 * Math.PI * 46 - ((dfResult.suspicion_score || 0) / 100) * 2 * Math.PI * 46}`}
                          />
                        </svg>
                        <div className="gauge-text" style={{ color: dfResult.suspicion_score && dfResult.suspicion_score >= 50 ? 'var(--danger)' : 'var(--success)' }}>
                          {dfResult.suspicion_score}%
                        </div>
                      </div>
                      <div className="gauge-label">
                        <div className="verdict">
                          {dfResult.suspicion_score && dfResult.suspicion_score >= 50 ? '⚠️' : '✅'} {dfResult.verdict}
                        </div>
                        <div className="verdict-desc">
                          {dfResult.suspicion_score && dfResult.suspicion_score >= 50
                            ? 'Warning: The uploaded media contains significant lip-sync or synthetic cadence shifts.'
                            : 'This audio/video shows normal genuine characteristics.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Spot Check & Share Section */}
      <section className="feature-section">
        <div className="container">
          <div className="section-header feature-header">
            <div>
              <h2 className="section-title">Play and Share</h2>
              <p className="section-subtitle">Tackle misinformation by playing, translation toggles, or direct reporting.</p>
            </div>
          </div>

          <div className="feature-grid">
            {/* Fake News Quiz */}
            <article className="feature-card">
              <div className="feature-card-icon"><i className="fas fa-brain"></i></div>
              <h3>Fake News Quiz</h3>
              <p>Practice identifying sensational headlines from actual confirmed reporting.</p>
              <button type="button" className="btn btn-secondary" onClick={() => { setQuizOpen(true); resetQuiz(); }}>
                Start Quiz
              </button>
            </article>

            {/* WhatsApp Formatting */}
            <article className="feature-card whatsapp-card">
              <div className="feature-card-icon"><i className="fas fa-comment"></i></div>
              <h3>WhatsApp Verification Helper</h3>
              <p>Generate formatted messages with safety headers for easy direct sharing.</p>
              <textarea
                className="verify-input"
                style={{ minHeight: '80px', width: '100%' }}
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                placeholder="Paste doubtful article headers..."
              />
              <div className="whatsapp-actions">
                <button className="btn btn-primary btn-sm" onClick={handleGenerateWhatsApp}>Generate Message</button>
                {waMessage && <button className="btn btn-ghost btn-sm" onClick={handleCopyWhatsApp}>Copy</button>}
              </div>
              {waMessage && (
                <div className="whatsapp-output" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                  {waMessage}
                </div>
              )}
            </article>

            {/* Language card */}
            <article className="feature-card language-card">
              <div className="feature-card-icon"><i className="fas fa-globe"></i></div>
              <h3>Local Language Support</h3>
              <p>Quickly switch interface languages to Yoruba, Hausa, Igbo, or English.</p>
              <div className="language-selector">
                <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                  <option value="en">English</option>
                  <option value="yo">Yoruba</option>
                  <option value="ha">Hausa</option>
                  <option value="ig">Igbo</option>
                </select>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Trending News Section */}
      <section className="trending-section" id="trending">
        <div className="container">
          <div className="trending-header">
            <div>
              <h2 className="section-title">Trending <span className="gradient-text">News</span></h2>
              <p className="section-subtitle">Latest verified headlines from Google News Nigeria</p>
            </div>
            <div className="category-filters">
              {['all', 'politics', 'technology', 'health', 'science', 'business'].map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${trendingCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {trendingLoading ? (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <div className="loading-text">Loading live news feed...</div>
            </div>
          ) : (
            <div className="news-grid">
              {trendingArticles.length === 0 ? (
                <div className="empty-state">No live feeds available right now.</div>
              ) : (
                trendingArticles.map((art, idx) => (
                  <a href={art.link} target="_blank" rel="noopener noreferrer" key={idx} className="news-card">
                    <div className="news-category"><i className="fas fa-bolt"></i> LIVE</div>
                    <div className="news-title" dangerouslySetInnerHTML={{ __html: art.title }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: art.description }} />
                    <div className="news-source">
                      <span><i className="fas fa-newspaper"></i> {art.source}</span>
                      <span style={{ marginLeft: 'auto' }}><i className="far fa-clock"></i> {art.published}</span>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Verification History Panel Sidebar */}
      {historyOpen && (
        <>
          <div className="history-backdrop show" onClick={() => setHistoryOpen(false)}></div>
          <div className="history-panel open">
            <div className="history-panel-header">
              <h3><i className="fas fa-clipboard"></i> Verification History</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setHistoryOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="history-list">
              {historyList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No verifications logged yet.</p>
                </div>
              ) : (
                historyList.map((item, idx) => (
                  <div key={idx} className="history-item">
                    <div className="history-type">{item.type}</div>
                    <div className="history-text">{item.text}</div>
                    <div className="history-meta">
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      <span style={{ color: getVerdictColor(item.score), fontWeight: 700 }}>{item.score}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Quiz Modal popup */}
      {quizOpen && (
        <div className="quiz-backdrop">
          <div className="quiz-widget">
            <div className="quiz-header">
              <div>
                <h3>Fake News Quiz</h3>
                {!quizCompleted && <p>Question {quizIndex + 1} of {quizQuestions.length}</p>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setQuizOpen(false)}>Close</button>
            </div>
            <div className="quiz-body">
              {!quizCompleted ? (
                <div className="quiz-question">
                  <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '1.25rem' }}>
                    {quizQuestions[quizIndex].question}
                  </p>
                  <div className="quiz-options">
                    {quizQuestions[quizIndex].options.map((opt, oIdx) => {
                      const isCorrect = oIdx === quizQuestions[quizIndex].answer;
                      let btnClass = 'quiz-option';
                      if (quizAnswered) {
                        if (oIdx === selectedOption) {
                          btnClass += isCorrect ? ' correct' : ' incorrect';
                        } else if (isCorrect) {
                          btnClass += ' correct';
                        }
                      }
                      return (
                        <button
                          key={oIdx}
                          className={`btn ${btnClass}`}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.85rem' }}
                          onClick={() => handleQuizOption(oIdx)}
                          disabled={quizAnswered}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizAnswered && (
                    <div className="quiz-feedback" style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.9rem' }}>
                      <strong>ℹ️ Explanation:</strong> {quizQuestions[quizIndex].explanation}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '3rem' }}>🎉</div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0.5rem 0' }}>Quiz Completed!</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>You scored {quizScore} out of {quizQuestions.length}!</p>
                </div>
              )}
            </div>
            <div className="quiz-footer">
              {!quizCompleted ? (
                <button type="button" className="btn btn-secondary" onClick={handleQuizNext} disabled={!quizAnswered}>
                  {quizIndex === quizQuestions.length - 1 ? 'See Results' : 'Next Question'}
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={resetQuiz}>Try Again</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal popup */}
      {profileOpen && (
        <div className="quiz-backdrop">
          <div className="quiz-widget">
            <div className="quiz-header">
              <div>
                <h3>User Profile Details</h3>
                <p>{user?.email}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setProfileOpen(false)}>Close</button>
            </div>
            <div className="quiz-body">
              <form onSubmit={handleSaveProfile}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {profileName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Username</label>
                    <input
                      type="text"
                      className="verify-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Location</label>
                    <input
                      type="text"
                      className="verify-input"
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      placeholder="e.g. Lagos, Nigeria"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Short Bio</label>
                    <textarea
                      className="verify-textarea"
                      style={{ minHeight: '80px' }}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="About yourself..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setProfileOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Profile</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal popup */}
      {settingsOpen && (
        <div className="quiz-backdrop">
          <div className="quiz-widget">
            <div className="quiz-header">
              <div>
                <h3>System Settings</h3>
                <p>Customize user preferences</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSettingsOpen(false)}>Close</button>
            </div>
            <div className="quiz-body">
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Theme Settings</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['dark', 'light', 'ocean', 'forest'].map((t: any) => (
                      <button
                        key={t}
                        className={`btn ${theme === t ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTheme(t)}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Local Language</label>
                  <select
                    className="verify-input"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                  >
                    <option value="en">English</option>
                    <option value="yo">Yoruba</option>
                    <option value="ha">Hausa</option>
                    <option value="ig">Igbo</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-primary" onClick={() => setSettingsOpen(false)}>Done</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Frequently Asked <span className="gradient-text">Questions</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto', textAlign: 'center' }}>Everything you need to know about VerifyIt</p>

          <div className="faq-list">
            <div className="faq-item">
              <div className="faq-question">
                How does VerifyIt detect fake news?
              </div>
              <div className="faq-answer-inner">
                VerifyIt uses a multi-model approach combining BERT-based natural language processing, large language model analysis via Groq, and real-time web search verification with a focus on global news sources.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                How accurate is the verification?
              </div>
              <div className="faq-answer-inner">
                Our multi-model approach achieves approximately 97% accuracy on known datasets. However, no automated system is perfect — we recommend using VerifyIt as a tool to guide your judgment.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span>Verify</span><span className="brand-accent">It</span>
            </div>
            <div className="footer-text">© 2026 VerifyIt. AI-Powered Fake News Detection for Nigeria.</div>
            <div className="footer-links">
              <a href="#">About</a>
              <a href="#">Verify</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
