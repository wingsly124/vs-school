import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const users = [
  {
    id: 'u-1001',
    name: 'Alicia Tan',
    email: 'student@vs.school',
    password: 'password123',
    role: 'student',
    className: 'Form 3A',
    preferredLanguage: 'zh',
    schoolName: 'SMK Seri Makmur'
  },
  {
    id: 'u-1002',
    name: 'Mr. Lim',
    email: 'teacher@vs.school',
    password: 'password123',
    role: 'teacher',
    className: '',
    preferredLanguage: 'en',
    schoolName: 'SMK Seri Makmur'
  },
  {
    id: 'u-1003',
    name: 'Admin User',
    email: 'admin@vs.school',
    password: 'password123',
    role: 'admin',
    className: '',
    preferredLanguage: 'ms',
    schoolName: 'SMK Seri Makmur'
  }
];

const reports = [
  {
    id: 'r-1001',
    code: 'VS-2026-000101',
    studentId: 'u-1001',
    type: 'bully',
    severity: 'high',
    description: 'A classmate keeps mocking me in chat and after school.',
    location: 'School canteen',
    status: 'review',
    anonymous: false,
    assignedTo: 'u-1002',
    createdAt: '2026-10-05T09:30:00.000Z'
  },
  {
    id: 'r-1002',
    code: 'VS-2026-000102',
    studentId: 'u-1001',
    type: 'emotion',
    severity: 'medium',
    description: 'I feel anxious before class and I need support.',
    location: 'Library',
    status: 'pending',
    anonymous: true,
    assignedTo: null,
    createdAt: '2026-10-07T10:40:00.000Z'
  }
];

const notifications = [
  {
    id: 'n-1',
    userId: 'u-1001',
    type: 'status',
    title: 'Report Update',
    body: 'Your report VS-2026-000101 is now in review.',
    read: false,
    createdAt: '2026-10-06T08:00:00.000Z'
  }
];

const chatSessions = [
  {
    id: 'c-1',
    userId: 'u-1001',
    title: 'Stress after school',
    createdAt: '2026-10-04T08:00:00.000Z'
  }
];

const chatMessages = [
  { id: 'm-1', sessionId: 'c-1', role: 'user', text: 'I feel very anxious in class lately.', createdAt: '2026-10-04T08:00:00.000Z' },
  { id: 'm-2', sessionId: 'c-1', role: 'ai', text: 'It sounds stressful. Would you like to talk about what is making you feel uneasy?', createdAt: '2026-10-04T08:01:00.000Z' }
];

const resources = [
  { id: 'res-1', title: 'Malaysia Emergency', phone: '999', type: 'emergency' },
  { id: 'res-2', title: 'Talian Kasih', phone: '15999', type: 'support' },
  { id: 'res-3', title: 'Befrienders KL', phone: '03-7627 2929', type: 'support' },
  { id: 'res-4', title: 'School Counsellor', phone: '03-233 3455', type: 'school' }
];

const analytics = {
  totalReports: 128,
  pending: 16,
  resolved: 89,
  critical: 7,
  monthlyTrend: [24, 28, 31, 26, 35, 42, 39],
  typeBreakdown: [
    { name: 'Bullying', value: 34 },
    { name: 'Cyber', value: 18 },
    { name: 'Emotion', value: 22 },
    { name: 'Safety', value: 13 },
    { name: 'Other', value: 13 }
  ]
};

function getUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
}

function getUserById(id) {
  return users.find((user) => user.id === id) || null;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Vs School backend ready' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = getUserByEmail(email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = `demo-token-${user.id}`;
  return res.json({ user: { ...user, password: undefined }, token });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, className, role = 'student' } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (getUserByEmail(email)) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    name,
    email,
    password,
    role,
    className: className || '',
    preferredLanguage: 'en',
    schoolName: 'SMK Seri Makmur'
  };

  users.push(newUser);
  return res.status(201).json({ user: { ...newUser, password: undefined }, token: `demo-token-${newUser.id}` });
});

app.get('/api/profile', (req, res) => {
  const userId = req.query.userId;
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({ user: { ...user, password: undefined } });
});

app.get('/api/reports', (req, res) => {
  const { userId, role } = req.query;
  const user = getUserById(userId);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (role === 'student') {
    return res.json(reports.filter((report) => report.studentId === userId));
  }

  if (role === 'teacher') {
    return res.json(reports.filter((report) => report.assignedTo === userId || report.status === 'pending')); 
  }

  return res.json(reports);
});

app.post('/api/reports', (req, res) => {
  const report = req.body;
  if (!report.studentId || !report.type || !report.description) {
    return res.status(400).json({ message: 'Missing required report fields' });
  }

  const newItem = {
    id: `r-${Date.now()}`,
    code: `VS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`,
    studentId: report.studentId,
    type: report.type,
    severity: report.severity || 'medium',
    description: report.description,
    location: report.location || '',
    status: 'pending',
    anonymous: Boolean(report.anonymous),
    assignedTo: null,
    createdAt: new Date().toISOString()
  };

  reports.unshift(newItem);
  notifications.unshift({
    id: `n-${Date.now()}`,
    userId: report.studentId,
    type: 'new',
    title: 'Report Submitted',
    body: `Your report ${newItem.code} has been submitted successfully.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json(newItem);
});

app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  return res.json(notifications.filter((item) => item.userId === userId));
});

app.get('/api/chat/sessions', (req, res) => {
  const { userId } = req.query;
  return res.json(chatSessions.filter((session) => session.userId === userId));
});

app.get('/api/chat/messages/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  return res.json(chatMessages.filter((message) => message.sessionId === sessionId));
});

app.post('/api/chat/message', (req, res) => {
  const { sessionId, userId, text } = req.body || {};

  if (!sessionId || !userId || !text) {
    return res.status(400).json({ message: 'Missing chat payload' });
  }

  const lowered = String(text).toLowerCase();
  let risk = 0;
  if (/(suicide|kms|kill myself|want to die|self harm|bunuh diri|mati)/i.test(lowered)) risk = 3;
  else if (/(bully|harass|threat|being bullied|buli|gangguan|ancaman)/i.test(lowered)) risk = 2;
  else if (/(anxious|stress|tired|sad|lonely|panik|cemas|sedih)/i.test(lowered)) risk = 1;

  const aiReply = risk >= 3
    ? 'I am sorry you are feeling this way. Please contact 999 or 15999, or reach out to a trusted adult immediately. If you are at school, tell a teacher or a school counsellor right away.'
    : risk >= 2
      ? 'I hear that this situation is affecting you. Would you like to tell me more? You can also submit a safety report and ask a trusted teacher for support.'
      : 'Thank you for telling me. Let us unpack what happened, and we can look at small steps you can take to feel safer and supported.';

  const userMessage = { id: `m-${Date.now()}`, sessionId, role: 'user', text, createdAt: new Date().toISOString() };
  const aiMessage = { id: `m-${Date.now() + 1}`, sessionId, role: 'ai', text: aiReply, createdAt: new Date().toISOString() };

  chatMessages.push(userMessage, aiMessage);

  return res.json({ risk, response: aiReply });
});

app.get('/api/resources', (req, res) => {
  return res.json(resources);
});

app.get('/api/analytics', (req, res) => {
  return res.json(analytics);
});

app.listen(PORT, () => {
  console.log(`Vs School backend running on http://localhost:${PORT}`);
});
