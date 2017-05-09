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

		pkg.install('node-bar', { save: true, dev: true })
			.then((p) => p.install('node-foo'))
			.then((p) => fs.readJson(pkgDir + '/package.json'))
			.then((json: any) => {
				assert.equal(Boolean(json.devDependencies['node-foo']), false);
				assert.equal(Boolean(json.devDependencies['node-bar']), true);
				done();
			})
			.catch(err => done(err));
	});

	it('should install new package but throw error while forceReloadingJson', function (done) {
		this.timeout(20000);

		(pkg as any).forceReloadJson = function () {
			return new Promise<any>((resolve, reject) => {
				reject('some_fs_error');
			});
		};

		pkg.install('node-bar', { save: true })
			.then(() => done('it did not throw error'))
			.catch((err) => err === 'some_fs_error' ? done() : done(err));
	});

	it('should try to install not existing package', function (done) {
		this.timeout(5000);

		pkg.install(['not_existing_package', 'another_one'], { save: true, dev: true })
			.then(() => done('Didn\'t throw any errors for not existing package.'))
			.catch(() => done());
	});

	it('should create symlink in installed packages\' directory', function (done) {
		pkg.install(['node-foo', 'node-bar'], { symlink: true })
			.then(() => fs.readlink(`${pkgDir}/node_modules/node-foo/node_modules`))
			.then(() => fs.readlink(`${pkgDir}/node_modules/node-bar/node_modules`))
			.then(() => done())
			.catch((err) => done(err));
	})
});
