//entry point to recommendation_service.
//initRecDb is a promisifed db initiation so the db can initialize before the server finishes loading

module.exports = {
  controller: require('./controller.js'),
  initRecDb: function() {
    return new Promise((res, rej) => {
      require('./database/index.js')
      .then(res)
    })
  }
}
