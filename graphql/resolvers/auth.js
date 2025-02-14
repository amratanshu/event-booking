const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
module.exports = {
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
        console.log({ ...result._doc, password: null });
        return { ...result._doc, password: null }; //explicitly putting the returned password as null, otherwise hashed password return hoga, which is not so much of a security issue but still, it is good for nothing
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("User does not exist!");
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new Error("Password is incorrect!");
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      "somesupersecretkey",
      {
        expiresIn: "1h",
      }
    );
    return { userId: user.id, token: token, tokenExpiration: 1 };
  },
};
