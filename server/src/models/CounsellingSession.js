import mongoose from 'mongoose';

const counsellingSessionSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, default: '' },
  stressScore: { type: Number, required: true },
  date: { type: String, required: true },         // e.g. "2026-03-20"
  slot: { type: String, required: true },          // e.g. "10:00 AM - 11:00 AM"
  status: { type: String, default: 'pending' },    // pending | confirmed | cancelled | completed
  notes: { type: String, default: '' },
  autoBooked: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
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

export default mongoose.model('CounsellingSession', counsellingSessionSchema);
