const Event = require("../../models/event");
const Booking = require("../../models/booking");

const { transformBooking, transformEvent } = require("./merge");

module.exports = {
  bookings: async () => {
    try {
      const bookings = await Booking.find();
      return bookings.map((booking) => {
        return transformBooking(booking);
      });
    } catch (err) {
      throw err;
    }
  },
  bookEvent: async (args) => {
    const fetchedEvent = await Event.findOne({ _id: args.eventID });
    const fetchedUser = await User.findOne({ _id: args.userID });
    const booking = new Booking({
      user: fetchedUser,
      event: fetchedEvent,
    });
    const result = await booking.save();
    return transformBooking(result);
  },
  cancelBooking: async (args) => {
    try {
      const booking = await Booking.findById(args.bookingID).populate("event");
      const event = transformEvent(booking._doc.event);
      await Booking.deleteOne({ _id: args.bookingID });
      return event;
    } catch (err) {
      throw err;
    }
  },
};
