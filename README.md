# node-puckages
[![npm version](https://badge.fury.io/js/puckages.svg)](https://badge.fury.io/js/puckages) [![Travis](https://img.shields.io/travis/ibrahimduran/node-puckages.svg)](https://travis-ci.org/ibrahimduran/node-puckages) [![Coverage Status](https://coveralls.io/repos/github/ibrahimduran/node-puckages/badge.svg?branch=master)](https://coveralls.io/github/ibrahimduran/node-puckages?branch=master)

node package manager for node.js

## Getting Started

### Installation

`$ npm install --save puckages`

### Usage
```js
import { Package } from 'puckages';

// Create writable directory for package
Package.create('/path/to/package')
  
  // Initialize package.json, this accepts parameters for configuration and options.
  .then(p => p.init())

  // Install a new package and save as dependency
  .then(p => p.install('node-foo', { save: true }))
  
  // Uninstall a package and update dependencies
  .then(p => p.uninstall('node-foo', { save: true }))
```

## API
You can find documentation [here](https://ibrahimduran.github.io/node-puckages/). All documentation has been generated from source code using the [typedoc](https://github.com/TypeStrong/typedoc).

## Verbose
This package uses [debug](https://github.com/visionmedia/debug) module. So you can set environment variable to display verbose log messages.
```sh
$ DEBUG=puckages node myApp.js
```

## Running Tests/Coverage
```bash
$ npm test # runs both test + coverage on source code
```


## License
MIT
