const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdEvents: [
    //array of objects of type: identifiers of the Events
    {
      type: Schema.Types.ObjectId,
      ref: "Event", //we have to use this exact name 'Event' because we exported the same from the event.js file in models
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
