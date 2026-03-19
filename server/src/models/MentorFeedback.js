import mongoose from 'mongoose';

const mentorFeedbackSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  mentorName: { type: String, required: true },
  feedback: { type: String, required: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.model('MentorFeedback', mentorFeedbackSchema);
