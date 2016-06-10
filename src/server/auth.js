import express from 'express';
import _ from 'lodash';
import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2/lib/strategy';

export default function createMiddleware(backends){
  let router = express.Router();

  let samiBackend = _.find(backends, b => b.name === 'sami');

  if (!_.isUndefined(samiBackend)) {
    const CLIENT_ID = process.env.SAMI_CLIENT_ID;
    const CLIENT_SECRET = process.env.SAMI_CLIENT_SECRET;
    const AUTH_URL ='https://accounts.samsungsami.io/authorize';
    const TOKEN_URL = 'https://accounts.samsungsami.io/token';
    const CALL_BACK_URL = 'http://localhost:4444/auth/sami/callback';
    const CALL_BACK_PATH = '/sami/callback';

    router.use(passport.initialize());
    router.use(passport.session());

    passport.deserializeUser((id, done) => {
      done(null, 'user');
    });
    passport.serializeUser((user, done) => {
      done(null, 'user');
    });
    passport.use(new OAuth2Strategy({
      authorizationURL: AUTH_URL,
      tokenURL: TOKEN_URL,
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: CALL_BACK_URL
    },
      (accessToken, refreshToken, profile, done) => {
        samiBackend.init(accessToken);
        return done(null, 'user');
      }
    ));
    router.get('/sami',
      passport.authenticate('oauth2')
    );

    router.get(CALL_BACK_PATH,
      passport.authenticate('oauth2', { failureRedirect: '/error', successRedirect: '/' })
    );
  }

  return router;
}
