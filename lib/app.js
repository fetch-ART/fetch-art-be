// const { mungedDetail } = require('../utils.js');
const request = require('superagent');
const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route.
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/favorites', async(req, res) => {
  const data = await client.query('SELECT * from favorites');

  res.json(data.rows);
});

//route for the list of happy images
app.get('/api/list/happy', async(req, res) => {
  try {
    const data = await request.get(`https://api.unsplash.com/search/photos?query=happy&page=1&client_id=${process.env.UNSPLASH_KEY}`);

    res.json(data.body);
  }
  catch(e) {
    res.json({
      status: 500,
      responseText: 'better luck next time'
    });
  }
}
);

//get photo by id 
app.get('/api/detail/:id', async(req, res) => {
  try {
    const data = await request.get(`https://api.unsplash.com/photos/${req.params.id}?client_id=${process.env.UNSPLASH_KEY}`);

    res.json(data.body);
  }
  catch(e) {
    res.status(500).json({
      responseText: e
    });
  }
}
);

app.use(require('./middleware/error'));

module.exports = app;