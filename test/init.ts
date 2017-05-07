import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';

import { Package, PackageConfig } from '../build';

after((done) => {
	fs.remove(__dirname + '/.test', (err) => {
		if (err) return done(err);

		setTimeout(done, 1000);
	});
});

describe('init', () => {
	var pkgDir = __dirname + '/.test';
	var pkg: Package;

	it('should try to initialize in non-existing directory', (done) => {
		(new Package(pkgDir)).init()
			.then(() => done('it should have thrown fs error'))
			.catch(() => done());
	});

	it('should create package', (done) => {
		Package.create(pkgDir)
			.then((p) => {
				assert.equal(p instanceof Package, true);
				assert.equal(p.path, pkgDir);
				assert.equal(p.json, null);

				pkg = p;

				fs.stat(pkgDir, (err) => {
					if (err) return done(err);

					done();
				});
			})
			.catch(err => done(err));
	});

	it('should initialize the package with no config', (done) => {
		pkg.init({}, {})
			.then((p) => done())
			.catch(err => done(err));
	});

	it('should overwrite and reinitialize the package', (done) => {
		pkg.init({}, { overwrite: true })
			.then((p) => done())
			.catch(err => done(err));
	});

	it('should initialize the package and fill empty fields', (done) => {
		pkg.init({}, { fillEmpty: true, overwrite: true })
			.then(() => fs.readJson(pkgDir + '/package.json'))
			.then((json: PackageConfig) => {
				assert.equal(json.name, '.test');
				assert.equal(json.license, 'ISC');
				assert.equal(json.main, 'index.js');
				assert.equal(json.version, '1.0.0');
				done();
			})
			.catch(err => done(err));
	});

	describe('repository configuration', () => {
		it('should try to configure with unsupported url', (done) => {
			pkg.init({ repository: 'unsupported://myurl.version' }, { overwrite: true })
				.then(() => done('it should have thrown unsupported git url error'))
				.catch((err) => String(err).indexOf('Unsupported') !== -1 ? done() : done(err));
		});

		it('should configure with ssh protocol', (done) => {
			pkg.init({ repository: 'git@github.com:ibrahimduran/node-npmjs.git' }, { overwrite: true })
				.then((p) => {
					fs.readJSON(pkgDir + '/package.json', (err, json) => {
						if (err) return done(err);

						assert.equal(json.repository.type, 'git');
						assert.equal(json.repository.url, 'git+ssh://git@github.com:ibrahimduran/node-npmjs.git');

						done();
					});
				})
				.catch(err => done(err));
		});

		it('should configure with https protocol', (done) => {
			pkg.init({ repository: 'https://github.com/ibrahimduran/node-npmjs.git' }, { overwrite: true })
				.then((p) => {
					fs.readJSON(pkgDir + '/package.json', (err, json) => {
						if (err) return done(err);

						assert.equal(json.repository.type, 'git');
						assert.equal(json.repository.url, 'git://github.com/ibrahimduran/node-npmjs.git');

						done();
					});
				})
				.catch(err => done(err));
		});
	});

	it('should initialize and run install', function (done) {
		this.timeout(20000);

		var packageOptions = {
			dependencies: ['node-foo'],
			devDependencies: ['debug']
		};

		pkg.init(packageOptions, { overwrite: true, installDependencies: true })
			.then(() => fs.readJson(pkgDir + '/package.json'))
			.then((json: any) => {
				assert.equal(Boolean(json.dependencies['node-foo']), true);
				assert.equal(Boolean(json.devDependencies['debug']), true);

				done();
			})
			.catch(err => done(err));
	});

	it('should initialize with config data', function (done) {
		var packageOptions = {
			name: '@npmjs/test',
			version: '0.0.1',
			description: 'testing',
			main: 'main.js',
			scripts: { test: 'test' },
			keywords: ['hello', 'world'],
			author: 'npmjs',
			license: 'MIT',
		};

		pkg.init(packageOptions, { fillEmpty: true, overwrite: true })
			.then(() => fs.readJson(pkgDir + '/package.json'))
			.then((json: any) => {
				assert.equal(json.name, packageOptions.name);
				assert.equal(json.version, packageOptions.version);
				assert.equal(json.description, packageOptions.description);
				assert.equal(json.main, packageOptions.main);
				assert.equal(json.scripts.test, packageOptions.scripts.test);
				assert.equal(json.keywords[0], packageOptions.keywords[0]);
				assert.equal(json.keywords[1], packageOptions.keywords[1]);
				assert.equal(json.author, packageOptions.author);
				assert.equal(json.license, packageOptions.license);

				done();
			})
			.catch(err => done(err));
	});

	it('should throw already initialized error', (done) => {
		pkg.init()
			.then(() => fs.readJson(pkgDir + '/package.json'))
			.then(() => done('it did not throw "package.json already exists" error'))
			.catch(err => done());
	});
});
