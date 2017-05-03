//main server file

const express = require('express');
const freeport = require('freeport');
const config = require('./config.js').server;
let recommendationService;

const app = express();

//server startup sequence
console.log('Starting server... initializing database');
require('./knex.js').initDb()
.then(() => {
  require('./src/recommendation_service/index.js').initRecDb()
  .then(() => {
    recommendationService = require('./src/recommendation_service/index.js').controller;

    //If user defines a port, use that. Otherwise use any free port
    if (config.port) {
      app.listen(config.port)
      console.log(`**Server ready and running on port ${config.port}!**`)
    } else {
      freeport(function(err, port) {
        if (err) throw err
        app.listen(port)
        console.log(`**Server ready running on random free port ${port}!**`)
      })
    }
  })
})

/*
GET /recommendations
Required queries:
- subtopic 
Optional queries:
- user

Returns recommendations given a subtopic and/or user.
If only a subtopic is given, returns conditional_probability listens
If a user is also give, returns pearson correlated listens

Response: 
{ 
  recommendations: [Subtopic, ..., Subtopic],
  recommendationCount: int,
  subtopic: "string",
  user: "string" (only if one provided)

}
*/
app.get('/recommendations', (req, res) => {
  recommendationService(req, res)
  .then((response) => {
    res.send(response);
  })
})
