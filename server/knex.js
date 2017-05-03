const config = require('./config.js').database;
const fs = require('fs-extra');

//Promisified wrapped initialization of the database. 
//Useful for ensuring db is completely initialized before server is ready
function initDb() {
  //delete sqlite file if it exists (mainly for dev purposes);
  if (config.deleteDBonStart && fs.existsSync(config.dbPath)) {
    fs.unlinkSync(config.dbPath);
  }

  return new Promise((res, rej) => {
    //export an instance of the db so other files can access it
    module.exports.db = require('knex')({
      client: 'sqlite3',
      connection: {
        filename: config.dbPath
      },
      useNullAsDefault: true
    })
    res();
  })
}

module.exports = {
  initDb: initDb
}
