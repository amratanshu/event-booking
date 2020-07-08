const Event = require("../../models/event");
const User = require("../../models/user");
const { dateToString } = require("../../helpers/date");

const eventDetails = (eventIds) => {
  //returns all events which have their ID in the list of eventIds
  return Event.find({ _id: { $in: eventIds } })
    .then((events) => {
      return events.map((event) => {
        return transformEvent(event);
      });
    })
    .catch((err) => {
      throw err;
    });
};

const singleEvent = async (eventID) => {
  try {
    const event = await Event.findById(eventID);
    return transformEvent(event);
  } catch (err) {
    throw err;
  }
};

const userDetails = (userID) => {
  //function to manually retrieve user details using the UserID
  return User.findById(userID)
    .then((user) => {
      return {
        ...user._doc,
        _id: user.id,
        createdEvents: eventDetails(user._doc.createdEvents),
      }; //overwriting id, was actually required in older versions on Mongoose to convert Id to a simple string, but now it works just fine
    }) //similarly overwriting createdEvents to contain more info than just the _IDS
    .catch((err) => {
      //console.log(err);
      throw err;
    });
};
const transformBooking = (booking) => {
  return {
    ...booking._doc,
    _id: booking.id,
    user: userDetails.bind(this, booking._doc.user),
    event: singleEvent.bind(this, booking._doc.event),
    createdAt: dateToString(booking._doc.createdAt),
    updatedAt: dateToString(booking._doc.updatedAt),
  };
};

const transformEvent = (event) => {
  return {
    ...event._doc,
    _id: event.id,
    creator: userDetails.bind(this, event.creator),
    date: dateToString(event._doc.date), //replacing date with something which is human readable :)
  }; //overwriting creator field to contain all the fields instead of just the creator _ID
};

exports.transformBooking = transformBooking;
exports.transformEvent = transformEvent;
