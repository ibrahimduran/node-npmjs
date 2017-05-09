import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';

import { Package } from '../build';

describe('hasDependency', function () {
	var pkgDir = __dirname + '/.test';
	var pkg: Package;

	beforeEach((done) => {
		Package.create(pkgDir)
			.then((p) => p.init({}, { overwrite: true, fillEmpty: true }))
			.then((p) => {
				pkg = p;
				done();
			})
			.catch((err) => done(err));
	});

	afterEach((done) => {
		fs.remove(pkgDir, (err) => {
			if (err) return done(err);

			setTimeout(done, 1000);
		});
	});

	it('should check for not existing dependency', function (done) {
		pkg.hasDependency('node-foo')
			.then((exists) => !exists ? done() : done('it should have returned false'))
			.catch(err => done(err));
	});

	it('should check for not existing dev dependency', function (done) {
		pkg.hasDependency('node-foo', true)
			.then((exists) => !exists ? done() : done('it should have returned false'))
			.catch(err => done(err));
	});

	it('should check for existing dependency', function (done) {
		this.timeout(10000);

		pkg.install('node-foo', { save: true })
			.then(p => p.hasDependency('node-foo'))
			.then((exists) => exists ? done() : done('it should have returned true'))
			.catch(err => done(err));
	});

	it('should check for existing dev dependency', function (done) {
		this.timeout(10000);

		pkg.install('node-foo', { save: true, dev: true })
			.then(p => p.hasDependency('node-foo', true))
			.then((exists) => exists ? done() : done('it should have returned true'))
			.catch(err => done(err));
	});

	it('should throw error due to fs issues', function (done) {
		this.timeout(10000);

		fs.remove(pkgDir + '/package.json')
			.then(() => pkg.hasDependency('node-foo'))
			.then(() => done('it should have thrown error'))
			.catch(err => done());
	});
});
