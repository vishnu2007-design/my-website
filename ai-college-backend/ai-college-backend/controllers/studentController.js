const Student = require('../models/Student');

// Helper: find a Student profile from the logged-in user's id.
async function getStudentByUserId(userId) {
  return Student.findOne({ user: userId }).populate('course');
}

// GET /api/student/profile
exports.getProfile = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student record not found.' });

    res.json({
      studentId: student.studentId,
      name: req.user.name,
      year: student.year,
      course: {
        code: student.course.code,
        name: student.course.name,
        subjects: student.course.subjects
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// GET /api/student/attendance
exports.getAttendance = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student record not found.' });
    res.json({ attendance: student.attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// GET /api/student/marks
exports.getMarks = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student record not found.' });
    res.json({ marks: student.marks });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// GET /api/student/timetable
exports.getTimetable = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student record not found.' });
    res.json({ timetable: student.course.timetable });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// POST /api/student/ask-ai  { question: string }
// Calls the Gemini API server-side so the API key never reaches the browser.
// Requires Node 18+ for the built-in global fetch.
exports.askAI = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'A question is required.' });

    const student = await getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student record not found.' });

    const courseObj = student.course.toObject();

    const attendanceLines = student.attendance
      .map((a) => `${a.subject}: ${a.present}/${a.total} classes (${a.total ? Math.round((a.present / a.total) * 100) : 0}%)`)
      .join('\n');
    const marksLines = student.marks.map((m) => `${m.subject}: ${m.score}/100`).join('\n');
    const timetableLines = Object.entries(courseObj.timetable)
      .map(([day, subs]) => `${day}: ${subs.join(' -> ')}`)
      .join('\n');

    const systemPrompt =
      `You are the Meridian College AI Assistant, helping a logged-in student named ${req.user.name} ` +
      `(ID ${student.studentId}, ${courseObj.name}). Answer only using the student data below plus ` +
      `general, sensible college guidance. Be concise and friendly.\n\n` +
      `ATTENDANCE:\n${attendanceLines}\n\nMARKS:\n${marksLines}\n\nTIMETABLE:\n${timetableLines}`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: question }] }]
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'Gemini API returned an error.');
    }
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const reply = parts.map((p) => p.text).filter(Boolean).join('\n').trim();

    res.json({ answer: reply || "I couldn't generate a response just now." });
  } catch (err) {
    res.status(500).json({ message: 'AI assistant error.', error: err.message });
  }
};
