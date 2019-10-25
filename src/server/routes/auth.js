import { Router } from "express";
import passport from "passport";
import getUser from "../dabl";

const router = Router();

router.get(
  "/silly",
  (req, res) => {
    getUser("silly").then(user => {
      res.json(user);
    })
    .catch(err => {
      res.status(500).json(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    });
  }
)

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);
router.get("/google/callback", passport.authenticate("google"), 
  (err, req, res, next) => { // custom error handler to catch any errors, such as TokenError
    if (err.name === 'TokenError') {
      res.redirect('/auth/google'); // redirect them back to the login page
    } else {
      throw err;
    }
  },
  (req, res) => {
    res.redirect("/");
  }
);

router.get("/signout", (req, res) => {
  req.logout();
  res.redirect("/");
});

export default router;
