import NestedError from "nested-error-stacks";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {getUserProfile, getOrCreateUserProfile} from "./ledger";
const ROOT_URL = "http://localhost:1337"

const configurePassport = dabl => {

  passport.serializeUser((user, cb) => {
    cb(null, user._id);
  });
  passport.deserializeUser((userName, cb) => {
    dabl.getUser(userName).then(user => {
      getUserProfile(user)
      .then(userProfile => {
        cb(null, userProfile);
      })
      .catch(err => {
        cb(new NestedError("Error fetching user profile for " + userName, err), null);
      });
    })
    .catch(err => {
      cb(new NestedError("Error deserialising user " + userName, err), null);
    });
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${ROOT_URL}/auth/google/callback`
      },
      (accessToken, refreshToken, profile, cb) => {
        dabl.getUser(profile.id)
        .then(user => {
          getOrCreateUserProfile(user, profile)
          .then(userProfile => {
            cb(null, userProfile);
          })
          .catch(err => {
            cb(new NestedError (`Error getting or creating user profile for ${profile.id}`, err), null);
          })
        })
        .catch(err => {
          cb(new NestedError (`Could not log in user ${profile.id}`, err), null);
        });
      }
    )
  );
};

export default configurePassport;
