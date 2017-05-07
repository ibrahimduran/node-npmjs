import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs-extra';

import { Package } from '../build';

describe('getPackageDir', function () {
	it('should return correct package name', function () {
		assert.equal(Package.getPackageDir('git@github.com:ibrahimduran/foo.git'), 'foo');
		assert.equal(Package.getPackageDir('https://github.com/ibrahimduran/node-foo.git'), 'node-foo');
		assert.equal(Package.getPackageDir('@scope/foo'), '@scope/foo');
		assert.equal(Package.getPackageDir('@scope/foo@1.3'), '@scope/foo');
		assert.equal(Package.getPackageDir('@scope/foo@tag'), '@scope/foo');
	});
});
