const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 3000;

// --------------------
// Middleware
// --------------------

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public'));


// --------------------
// In-memory database
// --------------------

let users = [];


// --------------------
// Helper: generate ID
// --------------------

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}


// --------------------
// Helper: convert date
// --------------------

function formatDate(date) {
  return new Date(date).toDateString();
}


// --------------------
// Helper: date for filtering
// --------------------

function getDateValue(dateString) {
  const parts = dateString.split('-');

  if (parts.length !== 3) {
    return NaN;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  return Date.UTC(year, month - 1, day);
}


// --------------------
// Home page
// --------------------

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// --------------------
// API Hello
// --------------------

app.get('/api/hello', function (req, res) {
  res.json({
    greeting: 'hello API'
  });
});


// ==================================================
// CREATE USER
// POST /api/users
// ==================================================

app.post('/api/users', function (req, res) {

  const username = req.body.username;

  if (!username) {
    return res.json({
      error: 'username is required'
    });
  }

  const user = {
    username: username,
    _id: generateId(),
    exercises: []
  };

  users.push(user);

  res.json({
    username: user.username,
    _id: user._id
  });
});


// ==================================================
// GET ALL USERS
// GET /api/users
// ==================================================

app.get('/api/users', function (req, res) {

  const userList = users.map(function (user) {
    return {
      username: user.username,
      _id: user._id
    };
  });

  res.json(userList);
});


// ==================================================
// ADD EXERCISE
// POST /api/users/:_id/exercises
// ==================================================

app.post('/api/users/:_id/exercises', function (req, res) {

  const userId = req.params._id;

  const user = users.find(function (item) {
    return item._id === userId;
  });

  if (!user) {
    return res.json({
      error: 'User not found'
    });
  }

  const description = req.body.description;
  const duration = Number(req.body.duration);

  if (!description) {
    return res.json({
      error: 'description is required'
    });
  }

  if (!req.body.duration || isNaN(duration)) {
    return res.json({
      error: 'duration is required'
    });
  }

  let exerciseDate;

  if (req.body.date) {
    const inputDate = new Date(req.body.date);

    if (isNaN(inputDate.getTime())) {
      return res.json({
        error: 'Invalid date'
      });
    }

    exerciseDate = inputDate;
  } else {
    exerciseDate = new Date();
  }

  const exercise = {
    description: description,
    duration: duration,
    date: exerciseDate.toDateString()
  };

  user.exercises.push(exercise);

  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});


// ==================================================
// GET USER LOG
// GET /api/users/:_id/logs
// ==================================================

app.get('/api/users/:_id/logs', function (req, res) {

  const userId = req.params._id;

  const user = users.find(function (item) {
    return item._id === userId;
  });

  if (!user) {
    return res.json({
      error: 'User not found'
    });
  }

  let log = user.exercises.slice();

  // --------------------
  // FROM filter
  // --------------------

  if (req.query.from) {

    const fromValue = getDateValue(req.query.from);

    if (!isNaN(fromValue)) {

      log = log.filter(function (exercise) {

        const exerciseValue = getDateValue(
          new Date(exercise.date).toISOString().split('T')[0]
        );

        return exerciseValue >= fromValue;
      });
    }
  }


  // --------------------
  // TO filter
  // --------------------

  if (req.query.to) {

    const toValue = getDateValue(req.query.to);

    if (!isNaN(toValue)) {

      log = log.filter(function (exercise) {

        const exerciseValue = getDateValue(
          new Date(exercise.date).toISOString().split('T')[0]
        );

        return exerciseValue <= toValue;
      });
    }
  }


  // --------------------
  // LIMIT
  // --------------------

  if (req.query.limit) {

    const limit = parseInt(req.query.limit);

    if (!isNaN(limit)) {
      log = log.slice(0, limit);
    }
  }


  // --------------------
  // Response
  // --------------------

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log
  });
});


// --------------------
// Start server
// --------------------

const listener = app.listen(port, function () {

  console.log(
    'Your app is listening on port ' +
    listener.address().port
  );

});