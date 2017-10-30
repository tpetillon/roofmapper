# RoofMapper

This is the main source repository for the [OpenStreetMap](https://www.openstreetmap.org/) contribution tool [RoofMapper](http://www.roofmapper.eu/).

It allows users to easily improve the OSM database, on a very specific subject: telling what the building's roofs are made of, according to aerial imagery.
[Resulting maps](http://www.roofmapper.eu/maps) are generated daily from the contributions.

## Server

The server is built with [Node.js](https://nodejs.org/en/), uses [PostGIS](http://postgis.net/) for data storage and [Mapnik](http://mapnik.org/) for map generation.

#### Dependencies
* [NPM](https://www.npmjs.com/)
* Node.js
* PostgreSQL
  * with PostGIS extensions

#### Setup
* Setup the database using instructions found in `server/sql/schema.sql` and `server/sql/map.sql`
* Fill the database with buildings
  * Use [`buildingextractor`](https://github.com/tpetillon/roofmapper-buildingextractor) to get data
* Clone this repository
* Execute `npm install` in the `server` directory
  * Mapnik comes automatically with the `node-mapnik` package
* Setup the configuration
  * `server/config/default.json` for development
  * `server/config/production.json` for production
* Add geographical data in `data/mapdata`
  * Currently, [this dataset](https://www.data.gouv.fr/fr/datasets/contours-des-departements-francais-issus-d-openstreetmap/) is required, download and extract it in the directory

#### Launch
* `node ./bin/www` for development mode (or just `npm run start`)
* `NODE_ENV=production node ./bin/www` for production mode

## Client

The web client is packaged with [Webpack](https://webpack.js.org/).

#### Dependency
* NPM

#### Setup
* Clone this repository
* Execute `npm install` in the `client` directory
* Run `npm run build` for production build
* The server automatically serves the client

When developing, it is advised to use `npm run watch-dev`, which rebuilds the client after each change.

## License

MIT, cf. `LICENSE.md`.
