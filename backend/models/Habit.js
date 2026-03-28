const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    // 21 booleans representing each day
    days: {
      type: [Boolean],
      default: Array(21).fill(false),
      validate: {
        validator: (arr) => arr.length === 21,
        message: 'Days must have exactly 21 entries',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Habit', habitSchema);