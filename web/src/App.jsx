import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE = '/api';
const LANGS = ['zh', 'en', 'ms'];

const toneMap = {
  bully: { zh: '校园霸凌', en: 'Bullying', ms: 'Buli' },
  cyber: { zh: '网络霸凌', en: 'Cyberbullying', ms: 'Buli siber' },
  emotion: { zh: '情绪困扰', en: 'Emotional distress', ms: 'Tekanan emosi' },
  safety: { zh: '安全威胁', en: 'Safety threat', ms: 'Ancaman keselamatan' },
  other: { zh: '其他', en: 'Other', ms: 'Lain-lain' },
};

const severityMap = {
  low: { zh: '轻微', en: 'Low', ms: 'Ringan' },
  medium: { zh: '中等', en: 'Medium', ms: 'Sederhana' },
  high: { zh: '严重', en: 'High', ms: 'Serius' },
  critical: { zh: '紧急', en: 'Critical', ms: 'Kritikal' },
};

const roleLabels = {
  student: { zh: '学生', en: 'Student', ms: 'Pelajar' },
  teacher: { zh: '老师', en: 'Teacher', ms: 'Guru' },
  admin: { zh: '管理员', en: 'Admin', ms: 'Pentadbir' },
};

const defaultForm = {
  name: '',
  email: 'student@vs.school',
  password: 'password123',
  className: '',
  role: 'student',
};

const defaultChat = [
  { role: 'ai', text: 'I am here to listen and support you. What is happening?' },
];

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function App() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(localStorage.getItem('vs-school-lang') || 'zh');
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('vs-school-user');
    return cached ? JSON.parse(cached) : null;
  });
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState(defaultForm);
  const [view, setView] = useState('home');
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [resources, setResources] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [chatMessages, setChatMessages] = useState(defaultChat);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [reportForm, setReportForm] = useState({
    type: 'bully',
    severity: 'high',
    description: '',
    location: '',
    anonymous: false,
  });

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('vs-school-lang', language);
  }, [language, i18n]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('vs-school-user', JSON.stringify(user));
      loadUserData(user);
    } else {
      localStorage.removeItem('vs-school-user');
    }
  }, [user]);

  const loadUserData = async (currentUser) => {
    try {
      setLoading(true);
      const [reportData, notifyData, resourceData, analyticsData] = await Promise.all([
        fetchJson(`${API_BASE}/reports?userId=${currentUser.id}&role=${currentUser.role}`),
        fetchJson(`${API_BASE}/notifications?userId=${currentUser.id}`),
        fetchJson(`${API_BASE}/resources`),
        fetchJson(`${API_BASE}/analytics`),
      ]);

      setReports(reportData || []);
      setNotifications(notifyData || []);
      setResources(resourceData || []);
      setAnalytics(analyticsData || null);
    } catch (error) {
      setStatus(error.message || 'Unable to load data');
    } finally {
      setLoading(false);
    }
  };

  const navItems = useMemo(() => {
    const base = [
      { key: 'home', label: t('home') },
      { key: 'report', label: t('report') },
      { key: 'reports', label: t('reports') },
      { key: 'chat', label: t('chat') },
      { key: 'resources', label: t('resources') },
      { key: 'settings', label: t('settings') },
    ];

    if (user?.role === 'teacher') {
      return base.filter((item) => item.key !== 'report');
    }

    if (user?.role === 'admin') {
      return [
        { key: 'home', label: t('home') },
        { key: 'admin', label: t('admin') },
        { key: 'reports', label: t('reports') },
        { key: 'resources', label: t('resources') },
        { key: 'settings', label: t('settings') },
      ];
    }

    return base;
  }, [t, user]);

  const loginDemo = (role) => {
    const preset = {
      student: { email: 'student@vs.school', password: 'password123' },
      teacher: { email: 'teacher@vs.school', password: 'password123' },
      admin: { email: 'admin@vs.school', password: 'password123' },
    }[role];

    setForm({ ...defaultForm, ...preset, role });
    setAuthMode('login');
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setStatus('');

    try {
      setLoading(true);
      const endpoint = authMode === 'login' ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
      const payload = authMode === 'login'
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            className: form.className,
            role: form.role,
          };

      const result = await fetchJson(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setUser({ ...result.user, token: result.token });
      setView('home');
      setForm(defaultForm);
    } catch (error) {
      setStatus(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      await fetchJson(`${API_BASE}/reports`, {
        method: 'POST',
        body: JSON.stringify({
          ...reportForm,
          studentId: user.id,
        }),
      });
      setReportForm({ type: 'bully', severity: 'high', description: '', location: '', anonymous: false });
      setView('reports');
      setStatus('Report sent successfully');
      loadUserData(user);
    } catch (error) {
      setStatus(error.message || 'Unable to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    const nextMessages = [...chatMessages, { role: 'user', text: userMessage }];
    setChatMessages(nextMessages);
    setChatInput('');

    try {
      const result = await fetchJson(`${API_BASE}/chat/message`, {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'c-1', userId: user.id, text: userMessage }),
      });

      setChatMessages([
        ...nextMessages,
        { role: 'ai', text: result.response },
      ]);
    } catch (error) {
      setChatMessages([
        ...nextMessages,
        { role: 'ai', text: 'I am here to listen. Please contact a trusted adult or emergency support if you feel unsafe.' },
      ]);
    }
  };

  const renderHome = () => {
    const counts = {
      total: reports.length || 0,
      pending: reports.filter((item) => item.status === 'pending').length,
      review: reports.filter((item) => item.status === 'review').length,
      resolved: reports.filter((item) => item.status === 'resolved').length,
    };

    return (
      <div className="panel-grid">
        <section className="panel welcome-card">
          <div>
            <p className="eyebrow">{t('welcome')}</p>
            <h2>{user?.name || 'Vs School'}</h2>
            <p className="muted">{roleLabels[user?.role || 'student'][language] || 'Student'}</p>
          </div>
          <div className="quick-actions">
            <button onClick={() => setView('chat')}>{t('chat')}</button>
            <button onClick={() => setView('report')}>{t('report')}</button>
            <button onClick={() => setView('resources')}>{t('resources')}</button>
          </div>
        </section>

        <section className="stats-grid">
          <div className="mini-stat"><span>{counts.total}</span><label>{t('reports')}</label></div>
          <div className="mini-stat"><span>{counts.pending}</span><label>Pending</label></div>
          <div className="mini-stat"><span>{counts.review}</span><label>Review</label></div>
          <div className="mini-stat"><span>{counts.resolved}</span><label>Resolved</label></div>
        </section>

        <section className="panel">
          <h3>{t('safetyTips')}</h3>
          <ul className="check-list">
            <li>Talk to a trusted teacher, parent, or counsellor whenever you feel unsafe.</li>
            <li>Use emergency or support hotline when you need immediate help.</li>
            <li>Keep a written record of what happened and any evidence you have.</li>
          </ul>
        </section>

        <section className="panel">
          <h3>{t('emergency')}</h3>
          <div className="call-links">
            <a href="tel:999">{t('call999')}</a>
            <a href="tel:15999">{t('call15999')}</a>
            <a href="tel:0376272929">Befrienders KL</a>
          </div>
        </section>
      </div>
    );
  };

  const renderReports = () => (
    <section className="panel">
      <h3>{t('reports')}</h3>
      <div className="report-list">
        {reports.length === 0 && <p className="muted">No reports yet.</p>}
        {reports.map((item) => (
          <article key={item.id || item.code} className="report-card">
            <div className="report-head">
              <strong>{item.code}</strong>
              <span className={`badge ${item.status}`}>{item.status}</span>
            </div>
            <p>{toneMap[item.type]?.[language] || item.type}</p>
            <p>{severityMap[item.severity]?.[language] || item.severity}</p>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );

  const renderChat = () => (
    <section className="panel chat-box">
      <h3>{t('chat')}</h3>
      <div className="chat-thread">
        {chatMessages.map((entry, idx) => (
          <div key={`${entry.role}-${idx}`} className={`bubble ${entry.role}`}>
            {entry.text}
          </div>
        ))}
      </div>
      <div className="composer">
        <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={t('chatHint')} />
        <button onClick={handleChatSend}>{t('send')}</button>
      </div>
    </section>
  );

  const renderResources = () => (
    <section className="panel">
      <h3>{t('resources')}</h3>
      <div className="resource-list">
        {(resources.length ? resources : [
          { id: 'e1', title: 'Malaysia Emergency', phone: '999' },
          { id: 'e2', title: 'Talian Kasih', phone: '15999' },
          { id: 'e3', title: 'Befrienders KL', phone: '03-7627 2929' },
        ]).map((item) => (
          <div key={item.id} className="resource-item">
            <span>{item.type === 'support' ? '💚' : item.type === 'school' ? '🏫' : '🚨'}</span>
            <div><strong>{item.title}</strong><p>{item.phone}</p></div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="panel">
      <h3>{t('settings')}</h3>
      <div className="settings-box">
        <label>{t('language')}</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="ms">Bahasa Melayu</option>
        </select>
      </div>
    </section>
  );

  const renderAdmin = () => (
    <section className="panel">
      <h3>{t('adminPortal')}</h3>
      <div className="stats-grid">
        <div className="mini-stat"><span>{analytics?.totalReports || 128}</span><label>{t('totals')}</label></div>
        <div className="mini-stat"><span>{analytics?.pending || 16}</span><label>Pending</label></div>
        <div className="mini-stat"><span>{analytics?.resolved || 89}</span><label>Resolved</label></div>
        <div className="mini-stat"><span>{analytics?.critical || 7}</span><label>Critical</label></div>
      </div>
    </section>
  );

  const renderReportForm = () => (
    <section className="panel">
      <h3>{t('report')}</h3>
      <form className="report-form" onSubmit={handleReportSubmit}>
        <label>
          {t('reportType')}
          <select value={reportForm.type} onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}>
            <option value="bully">Bullying</option>
            <option value="cyber">Cyberbullying</option>
            <option value="emotion">Emotional distress</option>
            <option value="safety">Safety threat</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          {t('severity')}
          <select value={reportForm.severity} onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>

        <label>
          {t('description')}
          <textarea value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })} />
        </label>

        <label>
          Location
          <input value={reportForm.location} onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })} />
        </label>

        <label className="checkbox-row">
          <input type="checkbox" checked={reportForm.anonymous} onChange={(e) => setReportForm({ ...reportForm, anonymous: e.target.checked })} />
          Anonymous submission
        </label>

        <button type="submit">{t('submit')}</button>
      </form>
    </section>
  );

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand-block">
            <div className="logo">🛡️</div>
            <h1>{t('appTitle')}</h1>
            <p>{t('slogan')}</p>
          </div>

          <div className="auth-panel">
            <div className="lang-row">
              {LANGS.map((lang) => (
                <button key={lang} className={language === lang ? 'active' : ''} onClick={() => setLanguage(lang)}>
                  {lang === 'zh' ? '中文' : lang === 'en' ? 'English' : 'Bahasa Melayu'}
                </button>
              ))}
            </div>

            <div className="demo-row">
              <button onClick={() => loginDemo('student')}>{t('student')}</button>
              <button onClick={() => loginDemo('teacher')}>{t('teacher')}</button>
              <button onClick={() => loginDemo('admin')}>{t('adminRole')}</button>
            </div>

            <form className="auth-form" onSubmit={handleAuth}>
              {authMode === 'register' && (
                <>
                  <input placeholder={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input placeholder={t('className')} value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </>
              )}

              <input placeholder={t('email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input type="password" placeholder={t('password')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

              <button className="primary" type="submit" disabled={loading}>
                {loading ? '...' : authMode === 'login' ? t('login') : t('register')}
              </button>

              <button type="button" className="ghost-btn" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                {authMode === 'login' ? t('register') : t('login')}
              </button>
              {status && <p className="form-status">{status}</p>}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="logo-mini">🛡️</div>
          <div>
            <strong>{t('appTitle')}</strong>
            <small>{roleLabels[user.role]?.[language] || user.role}</small>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button key={item.key} className={view === item.key ? 'selected' : ''} onClick={() => setView(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="user-box">
          <span>{user.name}</span>
          <small>{roleLabels[user.role]?.[language] || user.role}</small>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vs School</p>
            <h2>{t('dashboard')}</h2>
          </div>
          <div className="header-actions">
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ms">Bahasa Melayu</option>
            </select>
            <button onClick={() => setUser(null)}>{t('logout')}</button>
          </div>
        </header>

        {status && <div className="status-banner">{status}</div>}
        {loading && <div className="status-banner subtle">Loading ...</div>}

        {view === 'home' && renderHome()}
        {view === 'report' && renderReportForm()}
        {view === 'reports' && renderReports()}
        {view === 'chat' && renderChat()}
        {view === 'resources' && renderResources()}
        {view === 'settings' && renderSettings()}
        {view === 'admin' && renderAdmin()}
      </main>
    </div>
  );
}

export default App;
