//this file is used for misc functions to help understand the data
//none of these functions are used on the server, but were useful for understanding the dataset

const listens = require('./raw/listens.json');
const subtopics = require('./raw/subtopics.json');

//Reads the 'listens.json' json and logs the number of duplicates, the most popular subtopic, and its # of views
//Time complexity: O(n) where n=number of listens
function findNumDuplicates() {
  let frequencyTable = {};
  let numDuplicateViews = 0;
  let highestNumDuplicates = 0;
  let mostPopularSubtopic = '';
  console.log('counting duplicates')

  listens.map((listenInstance) => {
    //use the subtopic+user strings as a temp unique identifier to find if there are multiple views of the same subtopic
    let topicAndUserStr = listenInstance.subtopic + listenInstance.user;
    if (frequencyTable[topicAndUserStr]) {
      numDuplicateViews++;
      frequencyTable[topicAndUserStr]++;

      if (frequencyTable[topicAndUserStr] > highestNumDuplicates) {
        highestNumDuplicates = frequencyTable[topicAndUserStr];
        mostPopularSubtopic = listenInstance.subtopic;
      }
    } else {
      frequencyTable[topicAndUserStr] = 1;
    }

  })

  console.log("total duplicates:", numDuplicateViews, listens.length);
  console.log("most popular subtopic:", mostPopularSubtopic, "with", highestNumDuplicates, "views");
}

//Reads 'listens.json' to find # of unique users, # of users watching > 1 subtopics, and most frequent viewer
//Time complexity: O(n) where n=number of listens
function findFrequentUsers() {
  let frequencyTable = {};
  let highestUserViews = 0;
  let mostFrequentViewer = '';
  let numViewersWatchingMoreThanOne = 0;
  let numUniqueUsers = 0;

  listens.map((listenInstance) => {
    let user = listenInstance.user;
    if (frequencyTable[user]) {
      if (frequencyTable[user] <= 1) numViewersWatchingMoreThanOne++;

      frequencyTable[user]++;

      if (frequencyTable[user] > highestUserViews) {
        highestUserViews = frequencyTable[user];
        mostFrequentViewer = user;
      }
    } else {
      numUniqueUsers++;
      frequencyTable[user] = 1;
    }
  })

  console.log("Total number of unique users:", numUniqueUsers);
  console.log("Number of viewers watching multiple subtopics:", numViewersWatchingMoreThanOne);
  console.log("Most frequent viewer:", mostFrequentViewer, "with", highestUserViews, "views");
}

//Function invocations
// findNumDuplicates();
// findFrequentUsers();
