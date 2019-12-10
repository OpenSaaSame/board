import NestedError from "nested-error-stacks";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const configurePassport = ledgerAdmin => {

  passport.serializeUser((user, cb) => {
    cb(null, user._id)
  });

  passport.deserializeUser(async (userName, cb) => {
    try {
      const user = await ledgerAdmin.getUser(userName);
      const userProfile = await ledgerAdmin.getUserProfile(user);
      cb(null, userProfile);
    } catch(err) {
      cb(new NestedError("Error deserialising user " + userName, err), null);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.ROOT_URL}/auth/google/callback`
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          const user = await ledgerAdmin.getUser(profile.id);
          const userProfile = await ledgerAdmin.getOrCreateUserProfile(user, profile);
          cb(null, userProfile);
        }catch(err) {
          cb(new NestedError (`Could not log in user ${profile.id}`, err), null);
        }
      }
    )
  );
};

export default configurePassport;
