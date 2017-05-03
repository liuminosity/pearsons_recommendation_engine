const config = require('./../../config.js').recommendation_service;
const utils = require('./database/db_utils.js');
const _ = require('lodash');

const conditionals = require('./data/manipulated/conditional.json');

module.exports = function(res, req) {
  return new Promise((resolve, reject) => {
    if (res.query) {
      const query = res.query;

      if (query.subtopic && query.user) {
        findPearsonMatches(query.subtopic, query.user)
        .then((data) => {
          resolve(data)
        })
        // resolve("both")
      } else if (query.subtopic) {
        findConditionalMatches(query.subtopic)
        .then((data) => {
          resolve(data);
        })
      } else {
        resolve(formatErr("No subtopic specified."))
      }
    }
  })
}

//given a subtopic, finds the "x" number of best conditional-probability videos
//returns a Promise with a properly formatted response
function findConditionalMatches(subtopic) {
  let subtopicGraph = conditionals[subtopic];
  if (subtopicGraph) {
    const matches = [];
    for (let otherSub in subtopicGraph.otherSubs) {
      if (matches.length < config.maxNumToSuggest) {
        /* match format:
        {
          subtopic_serial: "57d808b351224d0300c000df",
          probability: 0.1569693094629156
        }*/
        matches.push({
          subtopic_serial: otherSub,
          probability: subtopicGraph.otherSubs[otherSub]
        });
        matches.sort((a,b) => b.probability-a.probability)
      } else {
        if (subtopicGraph.otherSubs[otherSub] > matches[matches.length - 1]) {
          matches.push({
            subtopic_serial: otherSub,
            probability: subtopicGraph.otherSubs[otherSub]
          });
          matches.sort((a,b) => b.probability-a.probability)
          while (matches.length >= config.maxNumToSuggest) {
            matches.pop();
          }
        }
      }
    }

    let promisifiedArr = [];

    matches.map((match) => {
      promisifiedArr.push(utils.lookupSubtopicData(match.subtopic_serial));
    })

    return Promise.all(promisifiedArr).then((data) => formatRes(data, subtopic))
  } else {
    //TODO: create better handling of incorrect subtopics
    return Promise.resolve(formatRes([], subtopic));
  }
}

//given a subtopic (not being used now) and a user, returns a list of videos recently watched 
//by the users with very similar tastes as the current user, as determined by pearson analysis
//returns a Promise with a properly formatted response
function findPearsonMatches(subtopic, user) {
  return utils.lookupPearsonPairs(user)
  .then((pearsonUsers) => {
    let pUsers = pearsonUsers[0];
    let promisifiedArr = [];

    for (let pUser in pUsers) {
      promisifiedArr.push(utils.lookupListenByUser(pUsers[pUser], subtopic))
    }

    return Promise.all(promisifiedArr).then((data) => formatRes(data, subtopic, user))
  })
}

//formats a res into a standard format
function formatRes(arr, subtopic, user) {
  const res = {};
  res.recommendations = _.flattenDeep(arr);

  //remove db id... maybe not necessary?
  res.recommendations.map((suggestion) => {
    delete suggestion.id
  })
  res.recommendationCount = res.recommendations.length;
  res.subtopic = subtopic;
  user ? res.user = user : null
  return res;
}

//formats an err res into a standard format
function formatErr(err) {
  return {
    error: err
  };
}
