const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  hearingDate: Date,
  adjournReason: String,
  proceedingSummary: String,
  nextHearingDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
