const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  defendantName: { type: String, required: true },
  defendantAddress: String,
  crimeType: String,
  crimeDate: Date,
  crimeLocation: String,
  arrestOfficer: String,
  arrestDate: Date,
  startDate: Date,
  expectedCompletion: Date,
  status: { type: String, enum: ['Pending','Ongoing','Resolved'], default: 'Pending' },
  judgeName: String,
  prosecutorName: String,
  lawyerName: String,
  courtName: String
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);
