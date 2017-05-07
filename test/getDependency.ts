import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';

import { Package } from '../build';

describe('getDependency', function () {
	var pkgDir = __dirname + '/.test';
	var pkg: Package;

	before((done) => {
		Package.create(pkgDir)
			.then((p) => p.init({}, { overwrite: true, fillEmpty: true }))
			.then((p) => p.install('node-foo'))
			.then((p) => {
				pkg = p;
				done();
			})
			.catch((err) => done(err));
	});

	after((done) => {
		fs.remove(pkgDir, (err) => {
			if (err) return done(err);

			setTimeout(done, 1000);
		});
	});

	it('should return dependency as Package', function (done) {
		pkg.getDependency('node-foo')
			.then((p) => done())
			.catch(err => done(err));
	});

	it('should throw dependency does not exist error', function (done) {
		pkg.getDependency('node-bar')
			.then((p) => done('it didn\'t throw error'))
			.catch((err) => err.indexOf('does not exist') > -1 ? done() : done(err));
	});
});
