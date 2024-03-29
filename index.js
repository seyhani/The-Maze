const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoStore = require('connect-mongo')(session);
const methodOverride = require('method-override');
const http = require('http');
const ClientManager = require('./common/socket');

const routes = require('./routes');
const config = require('./config');
const passport = require('./common/passport');

mongoose.connect(`mongodb://${config.dbUsername}:${config.dbPassword}@localhost:27017/maze?authSource=admin`, { useNewUrlParser: true })
  .then(() => {
    console.log('Successfully connected to db');
  })
  .catch((err) => {
    console.log(err);
    console.log('Error connecting to db');
  });

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));
app.use(methodOverride('_method'));
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'keyboard cat',
  store: new mongoStore({ mongooseConnection: mongoose.connection })
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  let body = req.body;
  //if (!(sockets[req.user.username].length > 0))
  //  sockets[req.user.username].emit('salam', 'salam');
  req.ip = req.headers['x-forwarded-for'] || req.ip;
  console.log(`[REQUEST]: ${req.ip} ${req.method} ${req.path} ${JSON.stringify(body)}`);
  next();
});

app.use('/', routes);

const server = http.Server(app);
const clientManager = new ClientManager(server);

server.listen(config.serverPort, () => {
  console.log('listening on *:3000');
});
