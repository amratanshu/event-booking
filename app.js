const express = require("express");
const bodyParser = require("body-parser");
const graphqlHTTP = require("express-graphql");
const mongoose = require("mongoose");

const graphQLSchema = require("./graphql/schema/index");
const graphQLResolvers = require("./graphql/resolvers/index");

const app = express();

app.use(bodyParser.json());
app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphQLSchema,
    //[String] is an array of String, the inside exclamation says that it is not a list of NULL values, the outside exclamation is because events cannot be null.
    rootValue: graphQLResolvers,

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
    console.log("connected to DB, listening on port 3000");
  })
  .catch((err) => {
    console.log(err);
  });

//connect method takes in the string with the address of our database cluster/server
