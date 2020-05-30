#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const getPort = require('get-port');
const open = require('open');
const bent = require('bent')
const EventEmitter = require('events');

const CURRENT_DIR = process.cwd();
const PACKAGE_JSON_PATH = path.join(CURRENT_DIR, 'package.json');

if (!fs.existsSync(PACKAGE_JSON_PATH)) {
  console.log('package.json could not be found in this directory 😔');

  process.exit();
}

const { dependencies } = require(PACKAGE_JSON_PATH);

if (!dependencies || (dependencies && !Object.keys(dependencies).length)) {
  console.log('dependency not found 😔');

  process.exit();
}

const getPackageInfo = bent('https://registry.npmjs.org/');

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
const api = require('./api')
app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');

console.log('⌛ fetching package information...')

Promise.all(
  Object
  .entries(dependencies)
  .map(([ packageName, currentVersion ]) => (
    new Promise((resolve) => (
      getPackageInfo(packageName)
      .then(data => data.json())
      .then(({ versions }) => (
        resolve({
          name: packageName,
          currentVersion,
          versions: Object.keys(versions),
        })
      ))
      .catch(() => resolve(null))
    ))
  ))
)
.then(items => items.filter(item => item))
.then(dependencies => {
  console.log('🏃 and ready!')

  const emitter = new EventEmitter();

  emitter.on('deletePackage', (name) => {
    dependencies = dependencies.filter(package => package.name !== name)
  });

  emitter.on('updatePackage', ({ name, newVersion }) => {
    dependencies = dependencies.map(package => ({
      ...package,
      currentVersion: package.name === name ? newVersion : package.currentVersion,
    }))
  });

  app.use('/api', api(emitter));
  app.get('/', (req, res) => res.render('index', { dependencies }));

  getPort().then(port => {
    const url = `http://localhost:${port}`;

    console.log(`> http://localhost:${port}`)

    app.listen(port, () => open(url))
  });
})
