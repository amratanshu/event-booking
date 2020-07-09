const Event = require("../../models/event");
const { transformEvent } = require("./merge");
const User = require("../../models/user");

module.exports = {
  events: () => {
    return Event.find()
      .then((events) => {
        //return events; //doiing this returns all the metadata from mongoose as well, so we use MAP in the next line to actually return only the relevant core data we want
        return events.map((event) => {
          //   console.log(
          //     `\n\n${userDetails.bind(this, { ...event._doc.creator })._doc}`
          //   );
          return transformEvent(event);
        });
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },
  createEvent: (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated!");
    }

    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: args.eventInput.price,
      date: new Date(args.eventInput.date),
      creator: req.userId,
    });
    //now I can call some mongoose methods on this object, as this constructor/Class Event provides us with that
    //like the event.save() function
    let createdEvent; //to be used in the then() block later on
    return event //we added the return keyword here because otherwise event.save().then... would have completed instantly (async) without return
      .save()
      .then((result) => {
        //console.log(result);
        //we can return the whole result object here but it contains a lot of metadata which we do not need, so we use the spread operator in JS to return the core data which is in .doc
        createdEvent = transformEvent(result); //succesfully created
        //here we want to edit the user, and add the createdEvents field for that particular user!
        return User.findById(req.userId);
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
};
