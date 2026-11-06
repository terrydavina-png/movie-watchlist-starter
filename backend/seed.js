const db = require('./db');
const movies = require('../data/movies.json');


const insertGenre = db.prepare('INSERT OR IGNORE INTO genres (name) VALUES (?)');
const findGenre = db.prepare('SELECT id FROM genres WHERE name = ?');
const insertMovieGenre = db.prepare('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)');

const insertMovie = db.prepare(`
  INSERT INTO movies (id, title, year, director, rating, duration, synopsis, poster_url, cast_members)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);



for (const movie of movies) {
  insertMovie.run(
    movie.id,
    movie.title,
    movie.year,
    movie.director,
    movie.rating,
    movie.duration,
    movie.synopsis,
    movie.poster_url,
    movie.cast.join(', ')
  );

  for (const genreName of movie.genres) {
    insertGenre.run(genreName);
    const genreId = findGenre.get(genreName).id;
    insertMovieGenre.run(movie.id, genreId);
  }
}



console.log('Seeding selesai');
console.log(db.prepare(`
  SELECT movies.title, genres.name
  FROM movie_genres
  JOIN movies ON movies.id = movie_genres.movie_id
  JOIN genres ON genres.id = movie_genres.genre_id
  WHERE movies.id = 1
`).all());
console.log(db.prepare('SELECT COUNT(*) AS total FROM movies').get());
console.log(db.prepare('SELECT COUNT(*) AS total FROM genres').get());
console.log(db.prepare('SELECT COUNT(*) AS total FROM movie_genres').get());