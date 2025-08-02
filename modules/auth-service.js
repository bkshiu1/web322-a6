require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;
let User; // Defined after DB connection

const userSchema = new Schema({
  userName: {
    type: String,
    unique: true
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: String,
      userAgent: String
    }
  ]
});

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.MONGODB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const db = mongoose.connection;

    db.on('error', (err) => reject(err));
    db.once('open', () => {
      User = db.model('users', userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      return reject("Passwords do not match");
    }

    bcrypt.hash(userData.password, 10)
      .then((hash) => {
        const newUser = new User({
          userName: userData.userName,
          password: hash,
          email: userData.email,
          loginHistory: []
        });

        newUser.save()
          .then(() => resolve())
          .catch((err) => {
            if (err.code === 11000) {
              reject("User Name already taken");
            } else {
              reject("There was an error creating the user: " + err);
            }
          });
      })
      .catch(() => {
        reject("There was an error encrypting the password");
      });
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) {
          return reject("Unable to find user: " + userData.userName);
        }

        bcrypt.compare(userData.password, user.password)
          .then((isMatch) => {
            if (!isMatch) {
              return reject("Incorrect Password for user: " + userData.userName);
            }

            // Limit loginHistory to 8
            if (user.loginHistory.length >= 8) {
              user.loginHistory.pop();
            }

            user.loginHistory.unshift({
              dateTime: new Date().toString(),
              userAgent: userData.userAgent
            });

            User.updateOne(
              { userName: user.userName },
              { $set: { loginHistory: user.loginHistory } }
            ).then(() => resolve(user))
             .catch((err) => reject("There was an error verifying the user: " + err));
          })
          .catch(() => reject("Error comparing passwords"));
      })
      .catch(() => reject("Unable to find user: " + userData.userName));
  });
};
