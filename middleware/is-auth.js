const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization"); //the header would contain Authorization Bearer {eABSabdxY72..token}
  if (!authHeader) {
    req.isAuth = false;     //just a new variable in the request - we don't want to stop the flow yet, but we do put a flag so that only some resolvers (like signup) can work (even without a token)
    return next();
  }

  //now the next word is "bearer", followed by the token. (so the token is actually at index 1 if we split by spaces)
  const token = authHeader.split(" ")[1]; //
  if (!token || token === "") {
    req.isAuth = false;
    return next();
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "somesupersecretkey"); //this can fail, that's why we've put it in a try catch block
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  req.isAuth = true;
  req.userId = decodedToken.userId;
  next();
};
