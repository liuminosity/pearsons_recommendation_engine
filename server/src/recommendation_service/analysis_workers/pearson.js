//Various functions for calculating pearson correlation between two users
//These are not used by the server, but generate the json files used by SQL/knex

const listens = require('./../data/raw/listens.json');
const subtopics = require('./../data/raw/subtopics.json');
const config = require('./../../../config.js').recommendation_service.pearson;
const fs = require('fs-extra');

//calculates the pearson score between two users, based on their listen history
//returns a value between -1 (negative correlation) and 1 (high correlation)
function calculatePearsonCorrelation(userA, userB) {
  let mutualViews = {};
  for (let subtopic in userA) {
    if (userB[subtopic]) {
      mutualViews[subtopic] = true;
    }
  }

  //if no mutually viewed subtopics, return a neutral score of 0
  let numMutual = Object.keys(mutualViews).length;
  if (numMutual === 0) return 0;

  let userASum = addUserSum(userA, mutualViews);
  let userBSum = addUserSum(userB, mutualViews);

  let userASqSum = addUserSquareSum(userA, mutualViews);
  let userBSqSum = addUserSquareSum(userB, mutualViews);

  let productSum = addUsersProduct(userA, userB, mutualViews);

  let r = pearson(userASum, userBSum, userASqSum, userBSqSum, productSum, numMutual);

  //fix rounding errors when r = 1.00000000002 or something
  if (r > 1) r = 1;
  return r;

  /*various helper math functions*/
  function addUserSum(user, commonViews) {
    let sum = 0;
    for (let subtopic in commonViews) {
      sum += user[subtopic]
    }
    return sum;
  }

  function addUserSquareSum(user, commonViews) {
    let sum = 0;
    for (let subtopic in commonViews) {
      sum += (user[subtopic]*user[subtopic])
    }
    return sum;
  }

  function addUsersProduct(user1, user2, commonViews) {
    let sum = 0;
    for (let subtopic in commonViews) {
      sum += (user1[subtopic]*user2[subtopic])
    }
    return sum;
  }

  /*Pearson function*/
  function pearson(sum1, sum2, sqSum1, sqSum2, pSum, n) {
    let denominator = Math.sqrt( (sqSum1 - sum1*sum1/n) * (sqSum2 - sum2*sum2/n) )
    if (denominator === 0) return 0;
    let numerator = pSum - (sum1*sum2/n);

    return numerator / denominator
  }
}

//calculate Pearson Correlations for all users
//time complexity: ~O(n^2)
function calculateAllPearsons() {
  let userBrowseringHistory = formatUserHistory(listens);
  userBrowseringHistory = trimUsers(userBrowseringHistory, config.userListenThreshold);
  let users = Object.keys(userBrowseringHistory);

  console.log('Calculating Pearson correlation between all remaining users');
  let userCorrelations = {};

  for (let i = 0; i < users.length; i++) {
    let userA = users[i];
    if ((users.length - i)%100 === 0) console.log(`${users.length - i} users left`);

    for (let j = i+1; j < users.length; j++) {
      let userB = users[j];
      let pearsonCorr = calculatePearsonCorrelation(userBrowseringHistory[userA], userBrowseringHistory[userB]);

      //only add correlation if positive
      if (pearsonCorr > 0) {
        userCorrelations[userA] ? null : userCorrelations[userA] = [];
        let corrA = {
          userId: userB,
          pCorr: pearsonCorr
        };
        //inserted into sorted array into correct spot, limit array length to config
        insertIntoSortedLimitedArray(userCorrelations[userA], corrA, config.maxNumToSave);

        //also add the correlation score for the second user
        userCorrelations[userB] ? null : userCorrelations[userB] = [];
        let corrB = {
          userId: userA,
          pCorr: pearsonCorr
        };
        insertIntoSortedLimitedArray(userCorrelations[userB], corrA, config.maxNumToSave);
     
      }
    }
  }

  console.log('Pearson complete');
  return userCorrelations;
}

//Inserts an object into a sorted (large->small) array in the correct spot. If the array.length > maxLength, remove the smallest values.
function insertIntoSortedLimitedArray(arr, user, maxLength) {
  if (arr.length === 0) {
    arr.push(user);
    return;
  }
  if (user.pCorr < arr[arr.length-1].pCorr) return;
  for (let i = 0; i < arr.length; i++) {
    if (user.pCorr > arr[i].pCorr) {
      arr.splice(i, 0, user);
      break;
    }
  }
  //should only ever pop once since function only adds one max, but just in case...
  while(arr.length > maxLength) {
    arr.pop();
  }
}

//no longer used
function trimLowCorrelation(userCorrelations) {
  for (let user in userCorrelations) {
    let matches = userCorrelations[user];
    if (Object.keys(matches).length > config.maxNumToSave) continue
  }
}

//Because calculating pearson between ALL users is such an expensive function, we trim the data
//for meaningless comparisons (ie don't worry about comparing users with only 1 listened subtopic)
function trimUsers(users, limit) {
  console.log(`Trimming data, ${Object.keys(users).length} users previously.`)
  let nonPearsonUsers = [];
  for (let user in users) {
    if (Object.keys(users[user]).length <= limit) {
      nonPearsonUsers.push({
        user_serial: user
      })
      delete users[user]
    }
  }
  exportData(nonPearsonUsers, config.exportNonPearsonFileDestination)
  console.log(`Trim complete, ${Object.keys(users).length} remaining`);
  return users;
}

/*formats listens.json and returns the following object:
{
  "userId": {
    "subtopicId": 3 //viewcount
  }

}
*/
function formatUserHistory(instances) {
  let usersHistory = {};
  instances.map((listenInstance) => {
    let subtopic = listenInstance.subtopic;
    let user = listenInstance.user;

    if (usersHistory[user]) {
      usersHistory[user][subtopic] ? usersHistory[user][subtopic]++ : usersHistory[user][subtopic] = 1;
    } else {
      usersHistory[user] = {};
      usersHistory[user][subtopic] = 1
    }
  })

  return usersHistory;
}

//exports pearson data as a json to 
function exportData(data, dest) {
  console.log('exporting json data');
  fs.writeFileSync(dest, JSON.stringify(data, null, 2));
  console.log('export complete');
}

//init fn
function init() {
  let userCorrelations = calculateAllPearsons();
  if (config.exportDataToFile) {
    exportData(userCorrelations, config.exportPearsonFileDestination);
  }

  //Starts the webworker to automatically update file
  if (config.automatedUpdate) {
    console.log('worker running at interval', config.automatedUpdateInterval)
    setInterval(() => {
      let userCorrelations = calculateAllPearsons();
      exportData(userCorrelations, config.exportPearsonFileDestination);
    }, config.automatedUpdateInterval)
  }
}

init();
