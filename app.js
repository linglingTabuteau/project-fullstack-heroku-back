const cookieParser = require('cookie-parser');
const express = require('express');
const httpErrors = require('http-errors');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const indexRouter = require('./routes/index');

const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Client } = require('pg');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});
client.connect();

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));


// ci-dessous régler le problem of cors dans fetch redux
app.use(cors());

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// paramètre API va utiliser les liens devant '/api'
app.use('/api', indexRouter);

// configurer passport en lui passant la strategy qui prend deux arguments config&callback qui prend 3 arguments(email, password, callback)
passport.use(new LocalStrategy(
  {
    // Attention: 'email' et 'password' les deux noms doivent etre identiques que les noms sur front
    usernameField: 'email',
    passwordField: 'password',
    session: false
  },
  function (email, password, callback) {
    console.log('callbakc:', callback);
    client.query('select * from users where email = ?', email, (err, results) => {
      console.log('err:', err);
      if (err) {
        return callback(err, false);
      }
      const user = results[0];
      if (!user) {
        return callback(null, false);
      }
      const authPassword = bcrypt.compareSync(password, user.password);
      if (!authPassword) {
        return callback(null, false);
      }
      return callback(null, user);
    });
  }));

// 2 Il faut identifier l'utilisateur à chaque requête en décodant le JWT. Pour cela tu vas devoir créer une nouvelle stratégie passport.
// Cette stratégie récupère le token dans le header de la requête ExtractJWT.fromAuthHeaderAsBearerToken() et décode le token à l'aide du secret.
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret'
},
  function (jwtPayload, cb) {
    console.log('jwtPayload:', jwtPayload);
    console.log('JWT-callback:', cb);
    return cb(null, jwtPayload);
  }
));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(httpErrors(404));
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(function (req, res, next) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization'); res.setHeader('Access-Control-Allow-Credentials', true); if ('OPTIONS' === req.method) { res.send(204); } else { next(); } });

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(err);
});


module.exports = app;
