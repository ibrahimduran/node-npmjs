import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';

import { Package } from '../build';

describe('forceReloadJson', function () {
	var pkgDir = __dirname + '/.test';
	var pkg: Package;

	before((done) => {
		Package.create(pkgDir)
			.then((p) => p.init({}, { overwrite: true, fillEmpty: true }))
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

	it('should force reload json', function (done) {
		var oldJson = JSON.stringify({...pkg.json});

		fs.writeJson(pkg.path + '/package.json', {})
			.then(() => pkg.forceReloadJson())
			.then((p) => oldJson != JSON.stringify(p.json) ? done() : done('it did not reload json'))
			.catch(err => done(err));
	});

	it('should try to force reload json on not existing path', function (done) {
		(new Package('.foo')).forceReloadJson()
			.then(() => done('it did not throw error'))
			.catch((err) => done());
	});

	it('should run on not existing path with param returnEmptyOnErr:true', function (done) {
		(new Package('.foo')).forceReloadJson({ returnEmptyOnErr: true })
			.then(p => 
				JSON.stringify(p.json) === JSON.stringify({}) ? done() :
				done('it did not return empty ' + JSON.stringify(p.json))
			);
	});
});
