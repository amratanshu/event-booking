const { buildSchema } = require("graphql");

//the createdAt and updatedAt vars in type Booking are already made by graphql because we passed the parameter Timestamps in the booking model js file
module.exports = buildSchema(`
        type Booking {
            _id: ID!
            event: Event!
            user: User!
            createdAt: String!
            updatedAt: String!
        }

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
            bookings: [Booking!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
            bookEvent(eventID: ID!, userID: ID!): Booking!
            cancelBooking(bookingID: ID!): Event!
        }

        schema {
            query: RootQuery 
            mutation: RootMutation
        }
    `);
