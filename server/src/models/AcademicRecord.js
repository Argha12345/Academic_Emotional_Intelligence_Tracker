import mongoose from 'mongoose';

const academicRecordSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  semester: { type: String, required: true },
  gpa: { type: Number, required: true },
  assignmentScore: { type: Number },
  attendancePercentage: { type: Number },
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

export default mongoose.model('AcademicRecord', academicRecordSchema);
