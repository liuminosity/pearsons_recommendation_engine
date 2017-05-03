//Various functions for calculating conditional probability between two listens
//These are not used by the server, but generate the json files used by SQL/knex

const listens = require('./../data/raw/listens.json');
const config = require('./../../../config.js').recommendation_service.conditional;
const fs = require('fs-extra');

//creates and returns the conditional probability graph of all listens
function generateProbabilityGraph() {
  console.log('Creating probability graph nodes...');
  const subtopicGraph = {};

  const userHistory = generateUserHistory();

  for (let user in userHistory) {
    for (let i = 0; i < userHistory[user].length; i++) {
      let subtopic = userHistory[user][i];
      for (let j = i+1; j < userHistory[user].length; j++) {
        let otherSub = userHistory[user][j];
        //add for current subtopic...
        if (subtopicGraph[subtopic]) {
          subtopicGraph[subtopic].otherSubs[otherSub] ? subtopicGraph[subtopic].otherSubs[otherSub]++ : subtopicGraph[subtopic].otherSubs[otherSub] = 1;
        } else {
          subtopicGraph[subtopic] = {
            otherSubs: {},
            totalOtherViews: 0
          };
          subtopicGraph[subtopic].otherSubs[otherSub] = 1
        }

        //...and other subtopic
        if (subtopicGraph[otherSub]) {
          subtopicGraph[otherSub].otherSubs[subtopic] ? subtopicGraph[otherSub].otherSubs[subtopic]++ : subtopicGraph[otherSub].otherSubs[subtopic] = 1;
        } else {
          subtopicGraph[otherSub] = {
            otherSubs: {},
            totalOtherViews: 0
          };
          subtopicGraph[otherSub].otherSubs[subtopic] = 1;
        }

        subtopicGraph[subtopic].totalOtherViews++;
        subtopicGraph[otherSub].totalOtherViews++;

      }
    }
  }

  for (let subtopic in subtopicGraph) {
    let otherSubs = subtopicGraph[subtopic].otherSubs;
    let totalNum = subtopicGraph[subtopic].totalOtherViews;

    for (let otherSub in otherSubs) {
      otherSubs[otherSub] = otherSubs[otherSub] / totalNum;
    }

  }

  return subtopicGraph;

}

//Returns an object with user watch histories. 
//The array of subtopics will only contain each subtopic ONCE, regardless of how many times the user listened to it
/*
{
  "57a150cba21362030082c62e": [ ... ]
}
*/
function generateUserHistory() {
  const userHistory = {};
  listens.map((listen) => {
    let user = listen.user;
    if (userHistory[user]) {
      userHistory[user].indexOf(listen.subtopic) === -1 ? userHistory[user].push(listen.subtopic) : null;
    } else {
      userHistory[user] = [listen.subtopic]
    }
  })

  return userHistory;
}

//exports data as a json to dest
function exportData(data, dest) {
  console.log('exporting json data');
  fs.writeFileSync(dest, JSON.stringify(data, null, 2));
  console.log('export complete');
}

//init fn
function init() {
  const probabilityGraph = generateProbabilityGraph();
  if (config.exportDataToFile) {
    exportData(probabilityGraph, config.exportConditionalFileDest);
  }

  //Starts the webworker to automatically update file
  if (config.automatedUpdate) {
    console.log('worker running at interval', config.automatedUpdateInterval)
    setInterval(() => {
      const probabilityGraph = generateProbabilityGraph();
      exportData(probabilityGraph, config.exportConditionalFileDest);
    }, config.automatedUpdateInterval)
  }
}

init();
