## Pearson's + Conditional-probability Recommendation Engine

### Features

- Conditional-probability based recommendation engine
- Pearson-correlation based recommendation engine
- Node/Express/sqlite3/knex based server
- Single endpoint dynamically handles both recommendations, depending on the query[ies] given
- Super fast! Initial server startup time on MBP is less than 5 secs. Endpoints feel instantious on local machine. Very scientific, I know
- Separate workers for updating recommendation engines set up (disabled for now)


Getting started:

```
cd server
npm install
npm run start
```
The first time the server starts, it will take a few seconds to initialize sqlite3 database. Each subsequent run will not require a database re-initialization unless you modify the ```config.js``` file 


### Pearson's??

If you love reading and math, see here: https://en.wikipedia.org/wiki/Pearson_correlation_coefficient

tldr: Pearson correlations utilizes two people's preferences (typically tracked by ratings, or in this case, view counts) to calculate how closely their preferences match. The coefficient varies from -1 (complete opposites) to 1 (complete match). The great thing with Pearson is that it accounts for biases and disproportionate view counts.


### API Documentation

```GET /recommendation```

Params:
- ```subtopic``` subtopic serial code
- ```user``` (Optional) user serial code. Providing this automatically switches to Pearson recommendation

Response:
```
{
  "recommendations": [
      {
        "description": "",
        "subtopic_serial": "",
        "name": ""
      }, ... {}
    ],
  "recommendationCount": 1,
    "subtopic": "",
    "user": "" //only provided if user provided user serial
}
```

Examples:

```GET /recommendations?subtopic=1234``` provides conditional probability recommendation for subtopic ```1234```

```GET /recommendations?subtopic=1234&user=abc``` provides Pearson-based recommendations for users similar to user ```abc``` given that s/he just consumed subtopic ```1234```

### Quick overview

The datasets in ```./recommendation_service/data/raw``` have been stripped down to one example data set for anonymity reasons. This codebase has been tested with datasets up to 100k large

My data exploration tools are in the ```./src/recommendation_service/data/exploringData.js``` file. The functions for manipulating the data for conditional probabilities and Pearsons are separated into two separate "worker" files located in ```./src/recommendation_service/analysis_workers/```. 

They are written like separate workers, because eventually it will be useful to run these processes separately on a regular basis so probabilities and Pearson correlations can be updated live while new data comes in without slowing down the server endpoints at all. Most of this logic is already built in, and is disabled in the ```config.js``` file.

While calculating Pearsons between two individuals is not expensive, calculating Pearons between a LARGE set of users is (given ```n``` users, it takes ```(n^2)/4``` complexity). Therefore, I need to cut out some of the users who do not have enough listening history. Turns out, this makes practical sense too--what's the point of comparing two people if one of them only listened to 1 subtopic? The threshold of "how many listens is required for Pearsons" is defined in ```config.js``` as ```userListenThreshold```.

Once all the data is properly formatted into jsons, adding them using ```knex``` is a breeze. Manipulated data and raw data are separated to make sure I don't alter original data. 

I built out the recommendation engine compartimentalized as its own service for modularity and reusability purposes. Because the data and schema have been properly formatted, hitting the endpoints is extremely fast and feels instantious on a local machine.

### Misc notes

- Make sure you are running node version that can handle some ES6 syntax (ie node  v6.9.1)
- Please don't hesitate to contact me with any questions!
