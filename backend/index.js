const express = require('express');
const db = require('./db');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());



app.get('/api/hello', (req, res) => {
 res.json({ message: 'halo dari server!'});
});

app.get('/api/ping', (req, res) => {
 res.json({ status : 'ok'});
});

app.get('/api/movies', (req, res) => {
  const movies = db.prepare('SELECT * FROM movies').all();
  const getGenres = db.prepare(`
    SELECT genres.name
    FROM movie_genres
    JOIN genres ON genres.id = movie_genres.genre_id
    WHERE movie_genres.movie_id = ?
  `);

  const result = movies.map(movie => {
    const genres = getGenres.all(movie.id).map(row => row.name);
    const cast = movie.cast_members.split(',').map(cast => cast.trim());
    return { ...movie, genres: genres, casts: cast };
  });

  res.json(result);
});

app.listen(8000, () => {
 console.log('Server jalan di http://localhost:8000');
});