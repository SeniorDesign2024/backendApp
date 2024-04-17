const mongoose = require("mongoose");

const Event = mongoose.model(
  "Event",
  new mongoose.Schema({
    name: String,
    startTime: Date,
    endTime: Date,
    userId: mongoose.Schema.Types.ObjectId,
    attendance: Array,
    complianceLimit: Number,
    mlModel: String
  })
);
module.exports = Event;
