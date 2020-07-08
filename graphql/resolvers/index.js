const Event = require("../../models/event");
const User = require("../../models/user");
const Booking = require("../../models/booking");
const bcrypt = require("bcryptjs");

const eventDetails = (eventIds) => {
  //returns all events which have their ID in the list of eventIds
  return Event.find({ _id: { $in: eventIds } })
    .then((events) => {
      return events.map((event) => {
        return {
          ...event._doc,
          creator: userDetails.bind(this, event.creator),
          date: new Date(event._doc.date).toISOString(), //replacing date with something which is human readable :)
        }; //overwriting creator field to contain all the fields instead of just the creator _ID
      });
    })
    .catch((err) => {
      throw err;
    });
};
const singleEvent = async (eventID) => {
  try {
    const event = await Event.findById(eventID);
    return {
      ...event._doc,
      _id: event.id,
      creator: userDetails.bind(this, event.creator),
    };
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

module.exports = {
  events: () => {
    return Event.find()
      .then((events) => {
        //return events; //doiing this returns all the metadata from mongoose as well, so we use MAP in the next line to actually return only the relevant core data we want
        return events.map((event) => {
          //   console.log(
          //     `\n\n${userDetails.bind(this, { ...event._doc.creator })._doc}`
          //   );
          return {
            ...event._doc,
            _id: event.id,
            date: new Date(event._doc.date).toISOString(),
            creator: userDetails.bind(this, event._doc.creator),
            //overwriting the creator to return all the important parameters, otherwise only the ID will be present here as our model is defined that way
          };
        });
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },

  bookings: async () => {
    try {
      const bookings = await Booking.find();
      return bookings.map((booking) => {
        return {
          ...booking._doc,
          _id: booking.id,
          user: userDetails.bind(this, booking._doc.user),
          event: singleEvent.bind(this, booking._doc.event),
          createdAt: new Date(booking._doc.createdAt).toISOString(),
          updatedAt: new Date(booking._doc.updatedAt).toISOString(),
        };
      });
    } catch (err) {
      throw err;
    }
  },

  createEvent: (args) => {
    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: args.eventInput.price,
      date: new Date(args.eventInput.date),
      creator: args.eventInput.creator,
    });
    //now I can call some mongoose methods on this object, as this constructor/Class Event provides us with that
    //like the event.save() function
    let createdEvent; //to be used in the then() block later on
    return event //we added the return keyword here because otherwise event.save().then... would have completed instantly (async) without return
      .save()
      .then((result) => {
        //console.log(result);
        //we can return the whole result object here but it contains a lot of metadata which we do not need, so we use the spread operator in JS to return the core data which is in .doc
        createdEvent = {
          ...result._doc,
          _id: result._doc._id.toString(),
          date: new Date(event._doc.date).toISOString(),
          creator: userDetails.bind(this, result._doc.creator),
        }; //succesfully created
        //here we want to edit the user, and add the createdEvents field for that particular user!
        return User.findById("5ef7789d795a86987757ba1f");
        // return { ...result._doc };
      })
      .then((user) => {
        if (!user) {
          throw new Error("User not found");
        }
        user.createdEvents.push(event);
        return user.save(); //updating the user database finally
      })
      .then((result) => {
        return createdEvent;
      })
      .catch((err) => {
        console.log(err);
        throw err; // so that  graphql can handle that error
      }); //actually hit the db and write it to the db
  },

  createUser: (args) => {
    return User.findOne({ email: args.userInput.email })
      .then((user) => {
        if (user) {
          //console.log("User exists already!");
          throw new Error("User exists already");
        }
        return bcrypt.hash(args.userInput.password, 12); //12 rounds of hashing is considered to be safe
      })
      .then((hashedPassword) => {
        const user = new User({
          email: args.userInput.email,
          //password: args.userInput.password  //this is a security flaw as we're storing the passwords as plain text in the DB
          password: hashedPassword,
        });
        return user.save();
      })
      .then((result) => {
        console.log(result);
        return { ...result._doc, password: null }; //explicitly putting the returned password as null, otherwise hashed password return hoga, which is not so much of a security issue but still, it is good for nothing
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },
  bookEvent: async (args) => {
    const fetchedEvent = await Event.findOne({ _id: args.eventID });
    const fetchedUser = await User.findOne({ _id: args.userID });
    const booking = new Booking({
      user: fetchedUser,
      event: fetchedEvent,
    });
    const result = await booking.save();
    return {
      ...result._doc,
      _id: result.id,
      user: userDetails.bind(this, booking._doc.user),
      event: singleEvent.bind(this, booking._doc.event),
      createdAt: new Date(result._doc.createdAt).toISOString(),
      updatedAt: new Date(result._doc.updatedAt).toISOString(),
    };
  },
  cancelBooking: async (args) => {
    try {
      const booking = await Booking.findById(args.bookingID).populate("event"); 
      const event = {
        ...booking.event._doc,
        _id: booking.event.id,
        creator: userDetails.bind(this, booking.event._doc.creator),
      };
      await Booking.deleteOne({ _id: args.bookingID });
      return event;
    } catch (err) {
      throw err;
    }
  },
};
