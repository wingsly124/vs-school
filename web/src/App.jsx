import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const demoUsers = {
  student: { email: 'student@vs.school', password: 'password123', role: 'student' },
  teacher: { email: 'teacher@vs.school', password: 'password123', role: 'teacher' },
  admin: { email: 'admin@vs.school', password: 'password123', role: 'admin' }
};

const formatReportType = (type) => ({ bully: 'Bullying', emotion: 'Emotional stress', cyber: 'Cyberbullying', safety: 'Safety', other: 'Other' }[type] || type);

function App() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState('zh');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [report, setReport] = useState({ type: 'bully', severity: 'high', description: '', location: '' });
  const [reports, setReports] = useState([
    { code: 'VS-2026-000101', type: 'bully', severity: 'high', status: 'review', description: 'Classmates keep mocking me in chat.' },
    { code: 'VS-2026-000102', type: 'emotion', severity: 'medium', status: 'pending', description: 'I feel anxious during class.' }
  ]);

  const currentRole = user?.role || 'student';

  const navItems = useMemo(() => {
    const base = [
      { key: 'home', label: t('home') },
      { key: 'report', label: t('report') },
      { key: 'reports', label: t('reports') },
      { key: 'chat', label: t('chat') },
      { key: 'resources', label: t('resources') },
      { key: 'settings', label: t('settings') }
    ];

    if (currentRole === 'teacher') return base.filter((item) => item.key !== 'report');
    if (currentRole === 'admin') return [{ key: 'home', label: t('home') }, { key: 'admin', label: t('admin') }, { key: 'reports', label: t('reports') }, { key: 'resources', label: t('resources') }, { key: 'settings', label: t('settings') }];
    return base;
  }, [currentRole, t]);

  const handleLanguageChange = (lng) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
  };

  const loginDemo = (role) => {
    const demo = demoUsers[role];
    setUser({
      ...demo,
      id: role === 'student' ? 'u-1001' : role === 'teacher' ? 'u-1002' : 'u-1003',
      name: role === 'student' ? 'Alicia Tan' : role === 'teacher' ? 'Mr. Lim' : 'Admin User',
      role
    });
    setView('home');
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!report.description.trim()) return;
    const newReport = {
      code: `VS-${Date.now()}`.slice(0, 14),
      ...report,
      severity: report.severity,
      status: 'pending'
    };
    setReports((prev) => [newReport, ...prev]);
    setReport({ type: 'bully', severity: 'high', description: '', location: '' });
    setView('reports');
  };

  const handleSendChat = () => {
    if (!message.trim()) return;
    let riskText = 'I understand this situation. Please take a deep breath and talk to a trusted teacher or family member if needed.';
    const content = message.toLowerCase();
    if (/(suicide|kms|kill myself|want to die|bunuh diri|mati)/i.test(content)) {
      riskText = 'I am sorry you are feeling this way. Please contact 999 or call 15999 right away, and tell a trusted adult at school or home immediately.';
    } else if (/(bully|harass|threat|buli|ancaman|gangguan)/i.test(content)) {
      riskText = 'This sounds serious. You can submit a report and contact your teacher or school counsellor for support.';
    }
    setResponse(riskText);
    setMessage('');
  };

  const renderHome = () => (
    <div className="panel-grid">
      <section className="panel welcome-card">
        <div>
          <p className="eyebrow">{t('welcome')}</p>
          <h2>{user ? `${user.name}` : 'Vs School'}</h2>
        </div>
        <div className="quick-actions">
          <button onClick={() => setView('chat')}>{t('chat')}</button>
          <button onClick={() => setView('report')}>{t('report')}</button>
          <button onClick={() => setView('resources')}>{t('resources')}</button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="mini-stat"><span>24</span><label>{t('reports')}</label></div>
        <div className="mini-stat"><span>8</span><label>{t('dashboard')}</label></div>
        <div className="mini-stat"><span>3</span><label>{t('notifications')}</label></div>
        <div className="mini-stat"><span>99</span><label>{t('resources')}</label></div>
      </section>

      <section className="panel">
        <h3>{t('safetyTips')}</h3>
        <ul className="check-list">
          <li>Keep a trusted adult informed when something feels unsafe.</li>
          <li>Use the emergency resources and school support channels.</li>
          <li>Document what happened and save evidence if possible.</li>
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

  const renderReports = () => (
    <section className="panel">
      <h3>{t('reports')}</h3>
      <div className="report-list">
        {reports.map((item) => (
          <article key={item.code} className="report-card">
            <div className="report-head">
              <strong>{item.code}</strong>
              <span className={`badge ${item.status}`}>{item.status}</span>
            </div>
            <p>{formatReportType(item.type)}</p>
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
        <div className="bubble ai">I’m here to listen and support you. What is happening?</div>
        {response && <div className="bubble ai">{response}</div>}
      </div>
      <div className="composer">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('chatHint')} />
        <button onClick={handleSendChat}>{t('send')}</button>
      </div>
    </section>
  );

  const renderResources = () => (
    <section className="panel">
      <h3>{t('resources')}</h3>
      <div className="resource-list">
        <div className="resource-item"><span>🚨</span><div><strong>Malaysia Emergency</strong><p>999</p></div></div>
        <div className="resource-item"><span>💚</span><div><strong>Talian Kasih</strong><p>15999</p></div></div>
        <div className="resource-item"><span>🌙</span><div><strong>Befrienders KL</strong><p>03-7627 2929</p></div></div>
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="panel">
      <h3>{t('settings')}</h3>
      <div className="settings-box">
        <label>{t('language')}</label>
        <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
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
        <div className="mini-stat"><span>128</span><label>{t('totals')}</label></div>
        <div className="mini-stat"><span>16</span><label>Pending</label></div>
        <div className="mini-stat"><span>89</span><label>Resolved</label></div>
        <div className="mini-stat"><span>7</span><label>Critical</label></div>
      </div>
    </section>
  );

  const renderReportForm = () => (
    <section className="panel">
      <h3>{t('report')}</h3>
      <form className="report-form" onSubmit={handleSubmitReport}>
        <label>
          {t('reportType')}
          <select value={report.type} onChange={(e) => setReport({ ...report, type: e.target.value })}>
            <option value="bully">Bullying</option>
            <option value="cyber">Cyberbullying</option>
            <option value="emotion">Emotional distress</option>
            <option value="safety">Safety threat</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          {t('severity')}
          <select value={report.severity} onChange={(e) => setReport({ ...report, severity: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label>
          {t('description')}
          <textarea value={report.description} onChange={(e) => setReport({ ...report, description: e.target.value })} />
        </label>
        <label>
          Location
          <input value={report.location} onChange={(e) => setReport({ ...report, location: e.target.value })} />
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
              <button className={language === 'zh' ? 'active' : ''} onClick={() => handleLanguageChange('zh')}>中文</button>
              <button className={language === 'en' ? 'active' : ''} onClick={() => handleLanguageChange('en')}>English</button>
              <button className={language === 'ms' ? 'active' : ''} onClick={() => handleLanguageChange('ms')}>Bahasa Melayu</button>
            </div>

            <div className="demo-row">
              <button onClick={() => loginDemo('student')}>{t('student')}</button>
              <button onClick={() => loginDemo('teacher')}>{t('teacher')}</button>
              <button onClick={() => loginDemo('admin')}>{t('adminRole')}</button>
            </div>

            <div className="auth-form">
              <input placeholder={t('email')} defaultValue="student@vs.school" />
              <input type="password" placeholder={t('password')} defaultValue="password123" />
              <button className="primary" onClick={() => loginDemo('student')}>{t('login')}</button>
            </div>
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
            <small>{user.role}</small>
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
          <small>{user.role}</small>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vs School</p>
            <h2>{t('dashboard')}</h2>
          </div>
          <div className="header-actions">
            <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ms">Bahasa Melayu</option>
            </select>
            <button onClick={() => setUser(null)}>{t('logout')}</button>
          </div>
        </header>

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
