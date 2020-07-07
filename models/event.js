const mongoose = require("mongoose");
const Schema = mongoose.Schema; //Schema is actually a constructor function, so we can invoke it by using the new keyword

const eventSchema = new Schema({
  //_id will be added by mongodb automatically
  title: {
    type: String,
    required: true, //as we did for the graphql type, can't be NULL
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number, //there is no Float data type in JS, Number works for integers and floats both
    required: true,
  },
  date: {
    type: Date, //we do have a Date type, unlike Graphql where we kept it as a String
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

//Our Schema was actually our plan, but we need a Model to incorporate this "plan"
//export the model so that it can be used by other files
module.exports = mongoose.model("Event", eventSchema); //2 args, Name of the Model and pointer to the Schema
