import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';
import * as stream from 'stream';

import { Package } from '../build';

describe('_pipeChildProcess', function () {
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

	it('should pipe stdout and stderr as non-persistent', function (done) {
		this.timeout(7000);

		var data = '';
		const s = new stream.Writable();
		s._write = (chunk, decoded, next) => { data += chunk; next(); };

		pkg.pipe(s, s, false)
			.install('node-foo')
			.then((p) => {
				assert.equal((p as any)._pipe.stdout, null);
				assert.equal((p as any)._pipe.stderr, null);
				assert.equal((p as any)._pipe.persistent, false);
			})
			.then(() => pkg.install('node-bar'))
			.then(() => {
				if (String(data).indexOf('node-foo') !== -1 && data.indexOf('node-bar') === -1) {
					done();
				} else {
					done('stream problem\n' + data);
				}
			})
			.catch((err) => done(err));
	});

	it('should pipe stdout and stderr as persistent', function (done) {
		this.timeout(7000);

		var data = '';
		const s = new stream.Writable();
		s._write = (chunk, decoded, next) => { data += chunk; next(); };

		pkg.pipe(s, s, true)
			.install('node-foo')
			.then((p) => {
				assert.notEqual((p as any)._pipe.stdout, null);
				assert.notEqual((p as any)._pipe.stderr, null);
				assert.equal((p as any)._pipe.persistent, true);
			})
			.then(() => pkg.install('node-bar'))
			.then(() => {
				if (String(data).indexOf('node-foo') !== -1 && data.indexOf('node-bar') !== -1) {
					done();
				} else {
					done('stream problem\n' + data);
				}
			})
			.catch((err) => done(err));
	});
});
