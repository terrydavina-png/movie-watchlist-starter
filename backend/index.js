const express = require('express');
const db = require('./db');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }
  const token = header.split(' ')[1];
  try { const payload = jwt.verify(token, JWT_SECRET); req.userId = payload.userId; next(); } 
  catch (err) { return res.status(401).json({ error: 'Invalid token' }); }
}

const getGenres = db.prepare(`
  SELECT genres.name
  FROM movie_genres
  JOIN genres ON genres.id = movie_genres.genre_id
  WHERE movie_genres.movie_id = ?
`);

function formatMovie(movie) {
  const genres = getGenres.all(movie.id).map(row => row.name);
  const cast = movie.cast_members.split(',').map(cast => cast.trim());
  return { ...movie, genres, cast };
}


app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ userId: req.userId });
});


app.get('/api/hello', (req, res) => {
 res.json({ message: 'halo dari server!'});
});

app.get('/api/ping', (req, res) => {
 res.json({ status : 'ok'});
});

app.get('/api/movies', (req, res) => {
  const movies = db.prepare('SELECT * FROM movies').all();
  const result = movies.map(formatMovie);
  res.json(result);
});

app.get('/api/movies/:id', (req, res) => {
  const movieId = req.params.id;
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);
  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' });
  }
  const result = formatMovie(movie);
  res.json(result);
});
    

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  const insertUser = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }
  if (db.prepare('SELECT * FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const result = insertUser.run(username, email, password_hash);
  res.status(201).json({ id: result.lastInsertRowid, username, email });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
  res.json({token, user: { id: user.id, username: user.username, email: user.email } });


});

app.get('/api/watchlist', authMiddleware, (req, res) => {
  const rows = db.prepare(`
  SELECT movies.*
  FROM watchlists
  JOIN movies ON movies.id = watchlists.movie_id
  WHERE watchlists.user_id = ?
`).all(req.userId);
  const result = rows.map(formatMovie);
  res.json(result);
});

app.post('/api/watchlist', authMiddleware, (req, res) => {
  const { movieId } = req.body;
  if (!movieId) {
    return res.status(400).json({ error: 'movieId is required' });
  }
  if (!db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId)) {
    return res.status(404).json({ error: 'Movie not found' });
  }
  if (db.prepare('SELECT * FROM watchlists WHERE user_id = ? AND movie_id = ?').get(req.userId, movieId)) {
    return res.status(409).json({ error: 'Movie already in watchlist' });
  }
  const insertWatchlist = db.prepare('INSERT INTO watchlists (user_id, movie_id) VALUES (?, ?)');
  const result = insertWatchlist.run(req.userId, movieId);
  res.status(201).json({ id: result.lastInsertRowid, userId: req.userId, movieId });

});

app.delete('/api/watchlist/:movieId', authMiddleware, (req, res) => {
  const movieId = req.params.movieId;
  const deleteWatchlist = db.prepare('DELETE FROM watchlists WHERE user_id = ? AND movie_id = ?');
  const result = deleteWatchlist.run(req.userId, movieId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Movie not found in watchlist' });
  }
  res.status(200).json({ message: 'Movie removed from watchlist' });
});

app.get('/api/watched', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT id, movie_id, rating, review, created_at
    FROM reviews
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.userId);

  const getMovie= db.prepare('SELECT * FROM movies WHERE id = ?');
  const result = rows.map(row => {
    const movie = getMovie.get(row.movie_id);
    return { ...row, movie: formatMovie(movie) };
  });
  res.json(result);
});

app.post('/api/watched', authMiddleware, (req, res) => {
  const { movieId, rating, review } = req.body;
  if (!movieId || !rating) {
    return res.status(400).json({ error: 'movieId and rating are required' });
  }
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }
  if (!db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId)) {
    return res.status(404).json({ error: 'Movie not found' });
  }
  const insertReview = db.prepare('INSERT INTO reviews (user_id, movie_id, rating, review) VALUES (?, ?, ?, ?)');
  const result = insertReview.run(req.userId, movieId, rating, review ?? null);
  res.status(201).json({ id: result.lastInsertRowid, userId: req.userId, movieId, rating, review });
});




app.listen(8000, () => {
 console.log('Server jalan di http://localhost:8000');
});