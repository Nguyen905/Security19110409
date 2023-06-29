const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');
const cookieSession = require('cookie-session');

require('dotenv').config();

const config = {
  CLIENT_ID: "897839330594-3vljknin9i0ftdp5q70pspgl4it2qlkd.apps.googleusercontent.com",
  CLIENT_SECRET: "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",
  COOKIE_KEY_1: process.env.COOKIE_KEY_1,
  COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

const AUTH_OPTIONS = {
  callbackURL: '/auth/google/callback',
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
  accessType:'offline',
  prompt:'consent',
  approvalPrompt:'force'
};
function verifyCallback(accessToken, refreshToken, profile, done) {
  console.log('Google profile', profile);
  console.log('Google refreshToken', refreshToken);
  console.log('Google accessToken', accessToken);

  done(null, profile);
}
passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));
passport.serializeUser((user, done) => {
  // console.log(user);
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  // User.findById(id).then((user) => {
  //   done(null, user);
  // });
  done(null, id);
});

const PORT = process.env.PORT || 3001;
const app = express();

// app.use(helmet());
app.use(
  cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000,
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2],
  })
);
app.use(passport.initialize());
app.use(passport.session());

function checkLoggedIn(req, res, next) {
  console.log('Curent user is:', req.user);

  const isLoggedIn = req.isAuthenticated() && req.user;
  if (!isLoggedIn) {
    return res.status(401).json({
      error: 'You must log in',
    });
  }
  next();
}
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['email','https://www.googleapis.com/auth/calendar.events'],
    accessType:'offline',
    prompt:'consent',
  })
);
app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    // failureRedirect: '/failure',
    // successRedirect: '/',
    session: true,
  }),
  (req, res) => {
    console.log('Google called us back');
  }
);
app.get('/auth/logout', (req, res) => {
  req.logout();
  return res.redirect('/');
});
app.get('/secret', checkLoggedIn, (req, res) => {
  return res.send('Your persional secret is 42 ');
});
app.get('/failure', (req, res) => {
  return res.send('Failed to login');
});
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


    // {
    //   key: fs.readFileSync('key.pem'),
    //   cert: fs.readFileSync('cert.pem'),
    // },
    app

  .listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
  });
