const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Case = require('./models/Case');
const Schedule = require('./models/Schedule');
const User = require('./models/User');


const app = express();
app.use(cors({
  origin: "https://lawgic-4.onrender.com"
}));
app.use(bodyParser.json());

// Use env var if present, otherwise local default
const MONGO_URI = process.env.MONGO_URI; // ?? 'mongodb+srv://pavithra_pothula:pavi_1234@namasthenode.juqmng7.mongodb.net/lawgic';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(()=> console.log('✅ MongoDB connected'))
.catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

// Create case
app.post('/api/cases', async (req, res) => {
  try {
    const newCase = new Case(req.body);
    await newCase.save();
    res.status(201).json({ message: 'Case added successfully', data: newCase });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update case by id
app.put('/api/cases/:id', async (req, res) => {
  try {
    const updated = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Case not found' });
    res.json({ message: 'Case updated successfully', data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get case
app.get('/api/cases/:id', async (req, res) => {
  try {
    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Schedule Case
app.post('/api/schedule', async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json({ message: 'Case scheduled successfully', data: schedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


//  Get all pending cases
app.get('/api/cases/status/Pending', async (req, res) => {
  try {
    const cases = await Case.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Get all resolved cases
app.get('/api/cases/status/Resolved', async (req, res) => {
  try {
    const cases = await Case.find({ status: 'Resolved' }).sort({ updatedAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Create new account (Add Account form)
app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User account created successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ✅ Get user details by username (for lawyer / registrar / judge dashboards)
app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error while fetching user' });
  }
});


//Login route (for home.html)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//Get user details by username
app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Case Details by ID
app.get('/api/cases/:id', async (req, res) => {
  try {
    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//  Get Cases by Court Name
app.get('/api/cases/court/:courtName', async (req, res) => {
  try {
    const court = req.params.courtName;
    const cases = await Case.find({ courtName: { $regex: new RegExp(court, 'i') } });
    if (!cases.length) return res.status(404).json({ error: 'No cases found for this court' });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Get Cases by Hearing Date
// Get Cases by Hearing Date (from Schedule)
app.get('/api/cases/hearing/:hearingDate', async (req, res) => {
  try {
    const selectedDate = new Date(req.params.hearingDate);

    const start = new Date(selectedDate.setHours(0, 0, 0, 0));
    const end = new Date(selectedDate.setHours(23, 59, 59, 999));

    // 1. Find schedules with this hearing date
    const schedules = await Schedule.find({
      hearingDate: { $gte: start, $lte: end }
    });

    if (!schedules.length) {
      return res.status(404).json({ error: 'No hearings found on this date' });
    }

    // 2. Extract case IDs
    const caseIds = schedules.map(s => s.caseId);

    // 3. Fetch cases using those IDs
    const cases = await Case.find({ _id: { $in: caseIds } });

    // 4. Return combined results
    res.json(cases);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ 1. Search by Keyword (matches any field)
app.get('/api/cases/search/:keyword', async (req, res) => {
  try {
    const key = req.params.keyword;
    const regex = new RegExp(key, 'i');
    const cases = await Case.find({
      $or: [
        { defendantName: regex },
        { crimeType: regex },
        { judgeName: regex },
        { lawyerName: regex },
        { courtName: regex },
        { prosecutorName: regex }
      ]
    });
    if (!cases.length) return res.status(404).json({ error: 'No matching cases found' });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 2. Search by Arresting Officer
app.get('/api/cases/officer/:name', async (req, res) => {
  try {
    const officer = req.params.name;
    const cases = await Case.find({ arrestOfficer: { $regex: new RegExp(officer, 'i') } });
    if (!cases.length) return res.status(404).json({ error: 'No cases found for this officer' });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 3. Search by Lawyer
app.get('/api/cases/lawyer/:name', async (req, res) => {
  try {
    const lawyer = req.params.name;
    const cases = await Case.find({ lawyerName: { $regex: new RegExp(lawyer, 'i') } });
    if (!cases.length) return res.status(404).json({ error: 'No cases found for this lawyer' });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`🚀 Server running on port ${PORT}`));
