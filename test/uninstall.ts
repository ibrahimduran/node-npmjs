import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';

import { Package } from '../build';

describe('uninstall', function () {
	var pkgDir = __dirname + '/.test';
	var pkg: Package;

	beforeEach((done) => {
		Package.create(pkgDir)
			.then((p) => p.init({}, { fillEmpty: true }))
			.then((p) => p.install('node-foo', true, true))
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

	it('should uninstall packages', (done) => {
		pkg.uninstall(['node-foo'], true, true)
			.then(() => fs.readJson(pkgDir + '/package.json'))
			.then((json: any) => {
				assert.equal(Boolean(json.devDependencies['node-foo']), false);
				done();
			})
			.catch(err => done(err));
	});

	it('should uninstall packages without saving', (done) => {
		pkg.uninstall(['node-foo'])
			.then(() => fs.readJson(pkgDir + '/package.json'))
			.then((json: any) => {
				assert.equal(Boolean(json.devDependencies['node-foo']), true);

				fs.pathExists(pkgDir + '/node_modules/node-foo')
					.then((exists) => exists ? done('node_modules/node-foo still exists') : done())
					.catch((err) => done(err));
			})
			.catch(err => done(err));
	});

	it('should uninstall packages but throw error while executing forceReloadJson', function (done) {
		this.timeout(20000);

		(pkg as any).forceReloadJson = function () {
			return new Promise<any>((resolve, reject) => {
				reject('some_fs_error');
			});
		};

		pkg.uninstall('node-foo', true)
			.then(() => done('it did not throw error'))
			.catch((err) => err === 'some_fs_error' ? done() : done(err));
	});

	it('should throw error while uninstalling packages', (done) => {
		pkg.uninstall('--')
			.then(() => done('Didn\'t throw any errors.'))
			.catch(() => done());
	});
});
