require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;
let User; // to be defined on new connection (see initialize)

const userSchema = new Schema({
  userName: {
    type: String,
    unique: true
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String
    }
  ]
});

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGODB);

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
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          return reject("Unable to find user: " + userData.userName);
        }

        const user = users[0];

        bcrypt.compare(userData.password, user.password)
          .then((isMatch) => {
            if (!isMatch) {
              return reject("Incorrect Password for user: " + userData.userName);
            }

            // Update login history
            if (user.loginHistory.length === 8) {
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
      .catch(() => {
        reject("Unable to find user: " + userData.userName);
      });
  });
};
