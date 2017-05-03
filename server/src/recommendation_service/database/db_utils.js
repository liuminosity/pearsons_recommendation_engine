//Various db utility functions

var knex = require('./../../../knex.js').db
var config = require('./../../../config.js').database;

//importing raw data
var listens = require('./../data/raw/listens.json');
var subtopics = require('./../data/raw/subtopics.json');
var pearsons = require(config.pearsonFileDest);
var nonPearsons = require(config.nonPearsonFileDest);

//creates users table with schema:
// - id
// - user_serial
// - pearsons_pair_0
// ...
// - pearsons_pair_x (where x = numCorrelations to store, as defined in config.js)
function createUserTable() {
  return knex.schema.createTableIfNotExists('users', (table) => {
    table.increments(); //primary
    table.string('user_serial').unique();
    for (var i = 0; i < config.numCorrelations; i++) {
      table.string(`pearson_pair_${i}`);
    }
    
  })
}

//creates listens table with schema:
// - id
// - user
// - listenDat
// - subtopic
function createListensTable() {
  return knex.schema.createTableIfNotExists('listens', (table) => {
    table.increments();
    table.string('user'); //TODO: format data to use user_serial to be consistent
    // table.integer('user_id'); //TODO: add foreign key lookup
    // table.foreign('user_id').references('id').inTable('users');
    table.timestamp('listenDate');
    table.string('subtopic');
  })
}

//creates subtopics table with schema:
// - id
// - description
// - subtopic_serial
// - name
function createSubtopicsTable() {
  return knex.schema.createTableIfNotExists('subtopics', (table) => {
    table.increments();
    table.string('description');
    table.string('subtopic_serial').unique();
    table.string('name');
  })
}

//adds all the subtopics from the json into the db
function addSubtopics() {
  subtopics.map((subtopic) => {
    var temp = subtopic.id;
    subtopic.subtopic_serial = subtopic.id;
    delete subtopic.id;
  })

  return knex.batchInsert('subtopics', subtopics)
    .then(console.log('Subtopics added'));

}

//adds all the users from the pearsons.json and non-pearson.json into db
function addUsers() {
  //necessary to split into smaller arrays as sqlite3 cannot handle too many variables (lol)
  var MAX_ARRAY_LENGTH = 100;

  var formattedPearsonDataArrs = prepForSQLBatch(pearsons);

  var nonPearsonBatch = [];
  for (var i = 0; i < nonPearsons.length; i++) {
    nonPearsonBatch.push(nonPearsons[i]);
    if (nonPearsonBatch.length > MAX_ARRAY_LENGTH) {
      formattedPearsonDataArrs.push(nonPearsonBatch);
      nonPearsonBatch = [];
    }
  }
  formattedPearsonDataArrs.push(nonPearsonBatch);

  var promisifiedBatchQueries = [];

  //add subBatches as individual promisified batch adds
  formattedPearsonDataArrs.map((subBatch) => {
    promisifiedBatchQueries.push(knex.batchInsert('users', subBatch))
  })

  return Promise.all(promisifiedBatchQueries)
    .then(console.log('Users added'))

  //format data into proper SQL batch insert. Also splits arrays into smaller batches so sqlite3 doesn't error out
  function prepForSQLBatch(data) {
    var res = [];
    var arr = [];

    for (var user in data) {
      var pearsonPair = data[user];
      var formattedObj = {user_serial: user};
  
      for (var i = 0; i < pearsonPair.length; i++) {
        formattedObj[`pearson_pair_${i}`] = pearsonPair[i].userId;
      }
      arr.push(formattedObj);

      if (arr.length > MAX_ARRAY_LENGTH) {
        res.push(arr);
        arr = [];
      }
    }
    res.push(arr);
    return res;
  }
}

//adds all the listens from the json into db
function addListens() {
  //once again, necessary to split into smaller arrays as sqlite3 cannot handle too many variables (lol)
  var MAX_ARRAY_LENGTH = 300;

  var promisifiedBatchQueries = [];
  var listenBatches = []; //small batches suitable for sqlite3
  var tmpListens = [];
  for (var i = 0; i < listens.length; i++) {
    tmpListens.push(listens[i]);
    if (tmpListens.length > MAX_ARRAY_LENGTH) {
      listenBatches.push(tmpListens);
      tmpListens = [];
    }
  }
  listenBatches.push(tmpListens);

  listenBatches.map((subBatch) => {
    promisifiedBatchQueries.push(knex.batchInsert('listens', subBatch))
  })

  return Promise.all(promisifiedBatchQueries)
    .then(console.log('Listens added'))

}

//No longer used, but keeping it around as it might be useful
//looks up an id given a user_serial
function lookupUserId(user_serial) {
  return knex.select('id').from('users').where({
    user_serial
  }).then((id)=>id)
}

//looks up a subtopic data given a subtopic_serial
function lookupSubtopicData(subtopic_serial) {
  return knex.select().from('subtopics').where({
    subtopic_serial
  }).then((data) => data)
}

//looks up all of the pearson pairs of a given user (via user_serial)
function lookupPearsonPairs(user_serial) {
  let selectQueryArr = [];
  for (var i = 0; i < config.numCorrelations - 1; i++) {
    selectQueryArr.push(`pearson_pair_${i}`);
  }
  return knex.select(selectQueryArr).from('users').where({
    user_serial
  }).then((data) => data);
}

//looks up the most recent listen by a user (via user_serial), and then returns the subtopic data of that listen
function lookupListenByUser(user_serial, subtopicToAvoid) {
  return knex.select().from('listens').orderBy('listenDate', 'desc').limit(1).where({
    user: user_serial
  }).whereNot({
    subtopic: subtopicToAvoid
  }).then((recentListen) => {
    recentListen = recentListen[0];
    return knex.select().from('subtopics').where({
      subtopic_serial: recentListen.subtopic
    }).then((subtopic) => subtopic)
  });
}

module.exports = {
  addSubtopics,
  addUsers,
  addListens,
  createUserTable,
  createListensTable,
  createSubtopicsTable,
  lookupSubtopicData,
  lookupPearsonPairs,
  lookupListenByUser
}
