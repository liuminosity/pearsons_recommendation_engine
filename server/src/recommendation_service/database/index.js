var fs = require('fs-extra');
var config = require('./../../../config.js').database;
var knex = require('./../../../knex.js').db
const utils = require('./db_utils.js');

function dbInit() {
  return Promise.all([
    utils.createUserTable(),
    utils.createListensTable(),
    utils.createSubtopicsTable()
  ])

}

function populateSQL() {
  return new Promise((res, rej) => {
    utils.addSubtopics().then(() => {
    utils.addUsers().then(() => {
    utils.addListens().then(() => {
    res() })})})
    .catch((e) => {
      rej(e);
    })    
  })
}


module.exports = new Promise((res, rej) => {
  //If config tells us to not delete db, then don't re-populate entries (unless file doesn't exist)
  if (config.deleteDBonStart || !fs.existsSync(config.dbPath)) {
    dbInit().then(()=> {
      populateSQL().then(() => {
        console.log('Database initialization complete');
        res();
      })
    })
    .catch((e)=> {
      rej('Error in initializing database:', e)
    })
  } else {
    console.log('Database not deleted as per config, initialization skipped. To re-initialize db, change config.js database.deleteDBonStart = true')
    res();
  }

})

// module.exports = knex;
