const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const initializePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"), null);

          let user = await User.findOne({ email });

          if (user) {
            // Existing user — update avatar if missing
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
              await user.save();
            }
            return done(null, user);
          }

          // New Google user — create WITHOUT password
          const nameParts = profile.displayName?.split(" ") || [];
          user = await User.create({
            email,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            preferredFullName: profile.displayName || "",
            name: profile.displayName || email,
            avatar: profile.photos?.[0]?.value || "",
            isGoogleUser: true,
            hasPassword: false,
            // No password set — user must go through setup-password page
          });

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      done(null, await User.findById(id));
    } catch (err) {
      done(err, null);
    }
  });
};

module.exports = { passport, initializePassport };
