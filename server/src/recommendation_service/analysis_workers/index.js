/*
Do not run this file unless you want to have separate workers 
analyzing pearson and conditional probability correlations at
a regular rate as specified in the config.js in the server
root folder.

These will overwrite json files in './../data/manipulated/'
folder!

Most of the settings can be modified in config.js

These are expensive functions!
*/

module.exports = {
  conditional_probability: require('./conditional_probability'),
  pearsons: require('./pearson.js')
}
