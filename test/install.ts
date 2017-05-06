import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';

import { Package } from '../build';

describe('install', function () {
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

	it('should install new packages', function (done) {
		this.timeout(20000);

		pkg.install('node-bar', true, true)
			.then((p) => p.install('node-foo'))
			.then((p) => fs.readJson(pkgDir + '/package.json'))
			.then((json: any) => {
				assert.equal(Boolean(json.devDependencies['node-foo']), false);
				assert.equal(Boolean(json.devDependencies['node-bar']), true);
				done();
			})
			.catch(err => done(err));
	});

	it('should try to install not existing package', function (done) {
		this.timeout(5000);

		pkg.install(['not_existing_package', 'another_one'], true, true)
			.then(() => done('Didn\'t throw any errors for not existing package.'))
			.catch(() => done());
	});
});
