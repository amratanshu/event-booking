const express = require("express");
const bodyParser = require("body-parser");
//const graphql = require('express-graphql');
const bcrypt = require("bcryptjs");
const graphqlHTTP = require("express-graphql");
const {
  buildSchema,
  createSourceEventStream,
  isCompositeType,
} = require("graphql"); //graphql object.buildSchema - buildScheme property helps in converting a schema in string form to the reqd JS format

const mongoose = require("mongoose");
const Event = require("./models/event");
const User = require("./models/user");

const app = express();
const eventDetails = (eventIds) => {
  //returns all events which have their ID in the list of eventIds
  return Event.find({ _id: { $in: eventIds } })
    .then((events) => {
      return events.map((event) => {
        return {
          ...event._doc,
          creator: userDetails.bind(this, event.creator),
        }; //overwriting creator field to contain all the fields instead of just the creator _ID
      });
    })
    .catch((err) => {
      throw err;
    });
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
app.use(bodyParser.json());
app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: User!
        }

        type User {
            _id: ID
            email: String!
            password: String 
            createdEvents: [Event!]
        }

        input UserInput {
            email: String!
            password: String!
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery 
            mutation: RootMutation
        }
    `),
    //[String] is an array of String, the inside exclamation says that it is not a list of NULL values, the outside exclamation is because events cannot be null.
    rootValue: {
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
            createdEvent = { ...event._doc }; //succesfully created
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
    },

    graphiql: true,
  })
);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-w93xk.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,
    { useUnifiedTopology: true, useNewUrlParser: true }
  )
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });

//connect method takes in the string with the address of our database cluster/server
