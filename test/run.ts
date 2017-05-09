import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';

import { Package } from '../build';

describe('run', function () {
	var pkgDir = __dirname + '/.test';
	var pkg: Package;

	before(function (done) {
		this.timeout(10000);
		
		Package.create(pkgDir)
			.then((p) => p.init({
				name: 'foo',
				scripts: { build: 'tsc index.ts', start: 'node index.js' },
			}, { overwrite: true, fillEmpty: true }))
			.then((p) => p.install('typescript', { save: true }))
			.then((p) => {
				pkg = p;

				fs.writeFile(pkgDir + '/index.ts', 'console.log("Hello world!");')
					.then(() => done())
					.catch((err) => done(err));
			})
			.catch((err) => done(err));
	});

	after((done) => {
		fs.remove(pkgDir, (err) => {
			if (err) return done(err);

			setTimeout(done, 1000);
		});
	});
	
	it('should run build script', function (done) {
		this.timeout(7000);
		
		var cp = pkg.run({ script: 'build' });
		cp.stderr.on('data', (err) => {
			done(err);
		});
		cp.on('exit', () => {
			done();
		});
	});
	
	it('should run start script', function (done) {
		this.timeout(3000);
		
		var cp = pkg.run();
		cp.stderr.on('data', (err) => {
			done(err);
		});
		var output = '';
		cp.stdout.on('data', (data) => {
			output += data;
		});
		cp.stdout.on('end', () => {
			assert.equal(String(output).indexOf('Hello world!\n') != -1, true);	
		});
		cp.on('exit', () => {
			done();
		});
	});
});
