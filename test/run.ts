import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';

import { Package } from '../build';

describe('run', function () {
	var pkgDir = __dirname + '/.test';
	var pkg: Package;

	before((done) => {
		Package.create(pkgDir)
			.then((p) => p.init({
				name: 'foo',
				scripts: { start: 'node index.js', foo: 'node index.js' }
			}, { overwrite: true, fillEmpty: true }))
			.then((p) => {
				pkg = p;

				fs.writeFile(pkgDir + '/index.js', 'console.log("Hello world!");')
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

	it('should run package (npm run start)', function (done) {
		var childProcess = pkg.run();
		var data = '';
		childProcess.stderr.on('data', (err) => done(err));
		childProcess.on('error', (err) => done(err));
		childProcess.stdout.on('data', (chunk) => {
			data += chunk;
		});
		childProcess.on('exit', () => {
			assert.notEqual(String(data).indexOf('Hello world!\n'), -1);
			done();
		});
	});

	it('should run script', function (done) {
		var childProcess = pkg.run({ script: 'foo' });
		var data = '';
		childProcess.stderr.on('data', (err) => done(err));
		childProcess.on('error', (err) => done(err));
		childProcess.stdout.on('data', (chunk) => {
			data += chunk;
		});
		childProcess.on('exit', () => {
			assert.notEqual(String(data).indexOf('Hello world!\n'), -1);
			done();
		});
	});
});
