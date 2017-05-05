# node-puckages
[![npm](https://img.shields.io/npm/v/puckages.svg)](https://www.puckages.com/package/puckages) [![Travis](https://img.shields.io/travis/ibrahimduran/node-puckages.svg)](https://travis-ci.org/ibrahimduran/node-puckages) [![Coverage Status](https://coveralls.io/repos/github/ibrahimduran/node-puckages/badge.svg?branch=master)](https://coveralls.io/github/ibrahimduran/node-puckages?branch=master)

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
  .then(p => p.install('node-foo', true))
  
  // Uninstall a package and update dependencies
  .then(p => p.uninstall('node-foo', true))
```

## API

Until I properly write API/Doc you can see interface definitions in [source](src/index.ts) file.

### Methods
| Method                                                                                                                             | Return            | Description                                                      |
|------------------------------------------------------------------------------------------------------------------------------------|-------------------|------------------------------------------------------------------|
| `Package(path: string)`                                                                                                            | Package           | Constructor for Package.                                         |
| `Package.init(config: PackageConfig = {}, opts: InitOptions = { installDependencies: false, fillEmpty: false, overwrite: false })` | Promise\<Package> | Initializes package.json.                                        |
| `Package.install(pkgs: (string|string[]), save = false, dev = false)`                                                              | Promise\<Package> | Installs new package(s). Updates package.json if `save` is true. |
| `Package.uninstall(pkgs: (string|string[]), save = false, dev = false)`                                                            | Promise\<Package> | Uninstalls package(s). Updates package.json if `save` is true.   |
| `static Package.create(dir: string)`                                                                                               | Promise\<Package> | Creates writable directory for the new package.                  |
|                                                                                                                                    |                   |                                                                  |

## Verbose
This package uses [debug](https://github.com/visionmedia/debug) module. So you can set environment variable to display verbose log messages.
```sh
$ DEBUG=puckages:* node myApp.js
```

## Running Tests
```bash
$ npm test
```

For coverage report you must remap the coverage with tsc generated source maps.

```bash
$ npm run coverage && npm run remap-coverage
```

## License
MIT