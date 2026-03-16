const mongoose = require('mongoose');

const emotionalRecordSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  selfAwareness: { type: Number, required: true },
  selfRegulation: { type: Number, required: true },
  motivation: { type: Number, required: true },
  empathy: { type: Number, required: true },
  socialSkills: { type: Number, required: true },
  overallScore: { type: Number, required: true },
  notes: { type: String, default: '' },
  recordDate: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('EmotionalRecord', emotionalRecordSchema);
