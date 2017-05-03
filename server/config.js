//Central config file for the entire server. Exports a json-like object with config options that are injected in various points of the server and services


//constants used across multiple different services
const CONSTANTS = {
  numCorrelations: 5,
  exportPearsonFileDestination: './../data/manipulated/pearson.json',
  exportNonPearsonFileDestination: './../data/manipulated/non-pearson.json',
  exportConditionalFileDest: './../data/manipulated/conditional.json'
}

module.exports = {
  server: {
    port: 3000 //set to null to automatically find a free port
  },
  recommendation_service: {
    pearson: {
      //Determines minimum number of videos needed to be watch before being included in pearson analysis. 
      //I do not recommend setting this to any lower than 5 as it will takes hours to parse data on an average laptop
      userListenThreshold: 10, 

      //toggles exporting pearson data into a file. Overwrites any existing Pearson data file
      exportDataToFile: true,
      exportPearsonFileDestination: CONSTANTS.exportPearsonFileDestination,
      exportNonPearsonFileDestination: CONSTANTS.exportNonPearsonFileDestination,

      //allows automated update of pearson correlations on a regular interval
      automatedUpdate: false,
      //how frequently to calculate new pearson correlations. Does nothing if 'automatedUpdate' is set to false. 3600000ms = 1 hour
      automatedUpdateInterval: 3600000,

      //maximum number of high-correlation users to save. Altering this number will require a SQL schema change (TODO: figure out a better way to do this. Maybe explore noSQL solution?)
      re: CONSTANTS.numCorrelations
    },
    conditional: {
      exportDataToFile: true,
      exportConditionalFileDest: CONSTANTS.exportConditionalFileDest,

      //allows automated update of conditonal correlations on a regular interval
      automatedUpdate: false,
      //how frequently to calculate new conditonal correlations. Does nothing if 'automatedUpdate' is set to false. 3600000ms = 1 hour
      automatedUpdateInterval: 3600000,
    },
    maxNumToSuggest: 4
  },
  database: {
    deleteDBonStart: false, //deletes and create a clean copy of the db on server start. Used mainly for dev purposes
    dbPath: './recommendation_service.sqlite', //path of sqlite file
    numCorrelations: CONSTANTS.numCorrelations, //number of pearson correlations to save
    pearsonFileDest: CONSTANTS.exportPearsonFileDestination,
    nonPearsonFileDest: CONSTANTS.exportNonPearsonFileDestination,
  }
}
