const { Router } = require('express');
const router = Router();
const { Client } = require('pg');
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// connection à la bae donnée de Heroku
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});
client.connect();

/* GET index page. */

// get /films
router.get('/films', (req, res) => {
  // connection à la base de données, et sélection des employés
  client.query('SELECT * from ghibli_film', (err, results) => {
    if (err) {
      // Si une erreur est survenue, alors on informe l'utilisateur de l'erreur
      res.status(500).send('Erreur lors de la récupération des films');
    } else {
      // Si tout s'est bien passé, on envoie le résultat de la requête SQL en tant que JSON.
      res.json(results.rows);
    }
  });
});

// post /films 
router.post('/films', (req, res) => {
  const {name, url, category, image_url, video_url} = req.body;
  client.query(`
    INSERT INTO ghibli_film(name, url, category, image_url, video_url)
    VALUES('${name}', '${url}', '${category}', '${image_url}', '${video_url}')`, (err) => {
    if (err) {
      console.log('err:', err);
      res.status(500).send('Erreur lors de rejouter un film');
    } else {
      res.status(200).send('ok');
    }
  });
});

// search bar
router.get('/results', (req, res) => {
  console.log('req.query', req.query);
  const keyword = `%${req.query.keyword}%`;
  client.query(`
    SELECT * FROM ghibli_film
    WHERE LOWER(name) LIKE LOWER('${keyword}')`, (err, results) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json(results.rows);
      console.log('Back-results of search', results.rows);
    }
  });
});

// signup below with bcrypt password & Installation de *passport*
router.post('/signup', (req, res) => {
  // ci-dessous je crypte myPassword qui devient un 'hash'/Store hash in database
  const {email, password, name, lastname} = req.body;
  let hash = bcrypt.hashSync(password, 10);

  // envoie dans BD => hash au lieu de req.body.password
  client.query(`
    INSERT INTO users(name, lastname, email, password)
    VALUES ('${name}', '${lastname}', '${email}', '${hash}')`, (err) => {
    if (err) {
      res.status(500).send('Erreur lors de creat an account');
    } else {
      res.status(200).send('Ok for creating an account');
    }
  })
})

// route signin JWT (Json Web Token) 
router.post('/signin', function (req, res) {
  const authenticate = passport.authenticate('local', (err, user, info) => {
    const token = jwt.sign(JSON.stringify(user), 'your_jwt_secret');
    if (err) {
      return res.sendStatus(500);
    } if (!user) {
      console.log('erre400', res);
      return res.sendStatus(400);
    }
    return res.json({ user, token });
  })
  // cette fonction va appele la stratégie 'local'configurée dans app.js
  authenticate(req, res)
});

//Attention: différentier la route du back "/profile" et le path du front"/myprofile" 
//??? On vérifie les droits d'accès pour chacune des routes qui en ont besoin Pour faire un test, t
router.get("/profile", passport.authenticate('jwt', { session: false }), function (req, res) {
  res.send(req.user);
})

module.exports = router;
