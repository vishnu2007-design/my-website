const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/facultyController');

// Every route below requires a valid JWT belonging to a 'faculty' user.
router.use(verifyToken, authorize('faculty'));

router.get('/students', ctrl.getMyStudents);
router.post('/attendance', ctrl.addAttendance);
router.put('/marks', ctrl.updateMarks);

module.exports = router;
