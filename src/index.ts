import * as fs from 'fs-extra';
import * as path from 'path';
import { exec, ChildProcess } from 'child_process';
import { Writable } from 'stream';

/**
 * `custom` field is used to add custom properties to `package.json`.
 * 
 * @export
 * @interface PackageConfig
 */
export interface PackageConfig {
	name?: string,
	version?: string,
	description?: string,
	main?: string,
	bugs?: { url: string }
	scripts?: any,
	repository?: string,
	keywords?: string[],
	author?: string,
	license?: string,
	dependencies?: string[],
	devDependencies?: string[],
	custom?: any
}

/**
 * @export
 * @interface InitOptions
 */
export interface InitOptions {
	/**
	 * Install initial dependencies in package.json after initializing package.
	*/
	installDependencies?: boolean,
	
	/**
	 * Auto-fill empty fields of the package.json. (Same as `npm init -y`)
	 */
	fillEmpty?: boolean,

	/**
	 * Overwrite the existing package.json.
	 */
	overwrite?: boolean
}

/**
 * @export
 * @interface InstallOptions
 */
export interface InstallOptions {
	/**
	 * Save to dependencies after installation finishes.
	 */
	save?: boolean,

	/**
	 * Save to devDependencies after installation finishes.
	 */
	dev?: boolean,

	/**
	 * Create symlink of node_modules folder in newly installed dependencies.
	 * directory.
	 * 
	 * Example for foo-bar dependency:
	 * /project/node_modules/foo-bar/node_modules -> /project/node_modules
	 */
	symlink?: boolean
}

/**
 * @export
 * @interface RunOptions
 */
export interface RunOptions {
	/**
	 * NPM script to run.
	 * 
	 * @type {string}
	 */
	script?: string,

	/**
	 * ENV variables for process.
	 * 
	 * @type {*}
	 */
	env?: any
}

/**
 * This is the main class for managing npm packages on local file-system. You
 * can do most of the stuff you do in `npm` cli using this class.
 * 
 * @export
 * @class Package
 */
export class Package {
	private static debug = require('debug')('puckages');
	private _path: string;
	private _json: any = null;
	private _pipe: {
		stdout: Writable,
		stderr: Writable,
		persistent: boolean
	} = { stdout: null, stderr: null, persistent: false };

	/**
	 * Returns the content of `package.json` in package directory. This field
	 * stays null when `Package` first initiated. If you want to use this before
	 * any other method that affects package.json (`install`, `uninstall` -with save
	 * option-, `init`), you need to run `forceReloadJson()`.
	 */
	get json() {
		return this._json;
	}

	/**
	 * Returns the package directory.
	 */
	get path() {
		return this._path;
	}

	/**
	 * Creates an instance of Package.
	 * @param {string} dir
	 */
	constructor(dir: string) {
		this._path = path.normalize(dir);
	}

	/**
	 * @param {PackageConfig} config
	 * @param {InitOptions} opts
	 * @returns {Promise<Package>}
	 */
	public init(config: PackageConfig = {}, opts: InitOptions = { installDependencies: false, fillEmpty: false, overwrite: false }): Promise<Package> {
		return new Promise<Package>((resolve, reject) => {
			Package.debug('Initializing package in ' + this._path);

			if (opts.overwrite) {
				Package.debug('Overwrite enabled, will overwrite in case package.json already exists');
			}

			if (opts.fillEmpty) {
				if (!config.name) config.name = this._path.split('/').pop();
				if (!config.version) config.version = '1.0.0';
				if (!config.description) config.description = '';
				if (!config.main) config.main = 'index.js';
				if (!config.scripts) config.scripts = {};
				if (!config.scripts.test) config.scripts.test = 'echo "Error: no test specified" && exit 1';
				if (!config.keywords) config.keywords = [];
				if (!config.author) config.author = '';
				if (!config.license) config.license = 'ISC';
			}

			if (!config.dependencies) config.dependencies = [];
			if (!config.devDependencies) config.devDependencies = [];

			let repositoryObj: any = {};
			if (config.repository) {
				if (config.repository.indexOf('git') != -1) {
					repositoryObj.type = 'git';

					if (config.repository.indexOf('@') != -1) {
						repositoryObj.url = 'git+ssh://' + config.repository;
					} else {
						repositoryObj.url = config.repository.replace(/https?/, 'git');
					}
				} else {
					Package.debug(`Unsupported repository url "${config.repository}". Please create issue on GitHub if you think this should be added in future.`);
					reject(`Unsupported repository url "${config.repository}". Please create issue on GitHub if you think this should be added in future.`);
				}
			}

			const packageJson = {
				name: config.name,
				version: config.version,
				description: config.description,
				main: config.main,
				scripts: config.scripts,
				repository: repositoryObj,
				keywords: config.keywords,
				author: config.author,
				license: config.license,
				...config.custom
			};

			const pkgJsonPath = path.join(this._path, 'package.json');

			fs.stat(pkgJsonPath, (exists) => {
				if (!exists && !opts.overwrite) return reject(new Error('package.json already exists'));

				fs.writeJson(path.join(this._path, 'package.json'), packageJson)
					.then(() => {
						Package.debug('Successfully saved ' + path.join(this._path, 'package.json'));

						this._json = packageJson;

						if (opts.installDependencies) {
							Package.debug('Installation of initialized dependencies is enabled');

							this.install(config.dependencies, { save: true })
								.then(() => this.install(config.devDependencies, { save: true, dev: true }))
								.then(() => resolve(this));
						} else {
							resolve(this);
						}
					})
					.catch((err) => {
						Package.debug('Save failed ' + path.join(this._path, 'package.json'));
						reject(err);
					});
			});
		});
	}

	/**
	 * Force reload the package.json. Returns empty object when
	 * `opts.returnEmptyOnErr` is set to `true`.
	 * 
	 * @param {boolean} opts
	 * @returns {Promise<Package>} 
	 */
	public forceReloadJson(opts = { returnEmptyOnErr: false }): Promise<Package> {
		Package.debug('Force reloading json');
		return new Promise<Package>((resolve, reject) => {
			fs.readJson(path.join(this._path, 'package.json'))
				.then(json => {
					Package.debug('Successfully reloaded json data');
					this._json = json;
					resolve(this);
				})
				.catch(err => {
					if (opts.returnEmptyOnErr) {
						Package.debug('Json reload failed but returnEmptyOnErr enabled');
						this._json = {};
						resolve(this);
					} else {
						Package.debug('Json reload failed');
						reject(err);
					}
				});
		});
	}

	/**
	 * Run npm script in package directory.
	 * 
	 * @param {RunOptions} opts 
	 * @returns {ChildProcess} 
	 */
	public run(opts: RunOptions = { script: 'start', env: { PATH: process.env.PATH } }): ChildProcess {
		Package.debug(`Running '${opts.script}' in ${this._path}`);
		const cp = exec(`npm run ${opts.script}`, { cwd: this._path, env: opts.env });
		this._pipeChildProcess(cp);
		
		return cp;
	}

	/**
	 * Install new dependency.
	 * 
	 * @param {((string[] | string))} pkgs
	 * @param {InstallOptions} opts 
	 * @returns {Promise<Package>}
	 */
	public install(pkgs?: (string[] | string), opts:InstallOptions = { save: false, dev: false, symlink: false }): Promise<Package> {
		Package.debug('Installing dependencies for ' + this._path);

		return new Promise<Package>((resolve, reject) => {
			if (!Array.isArray(pkgs)) pkgs = [pkgs];

			const cmd = `npm install ${pkgs.join(' ')} ${opts.save ? '--save' : ''}${opts.dev ? '-dev' : ''}`;
			const cp = exec(cmd, { cwd: this._path }, (err) => {
				if (!err) {
					Package.debug('Installation successful for ' + this._path);

					var promises = [];

					if (opts.symlink) {
						promises.push(Promise.all((<string[]>pkgs).map(pkg => 
							fs.symlink(
								path.join(this._path, 'node_modules'),
								path.join(this._path, 'node_modules', Package.getPackageDir(pkg), 'node_modules')))
						))
					}

					if (opts.save) {
						promises.push(this.forceReloadJson());
					}

					Promise.all(promises)
						.then(() => resolve(this))
						.catch((err) => reject(err));
				} else {
					Package.debug('Installation failed for ' + this._path);
					reject(err);
				}
			});

			this._pipeChildProcess(cp);
		});
	}

	/**
	 * Pipe npm command output to the given stream. This process can be persistent
	 * or non-persistent. Persistent means the piping operation will be applied
	 * on the next actions too. This method should be called before the others.
	 * 
	 * @param {any} stdout 
	 * @param {any} stderr 
	 * @param {boolean} persistent 
	 * @returns {Package} 
	 */
	public pipe(stdout, stderr, persistent: boolean): Package {
		this._pipe = { stdout, stderr, persistent };

		return this;
	}

	/**
	 * Uninstall package(s).
	 * 
	 * @param {((string[] | string))} pkgs
	 * @param {boolean} save - Remove dependency from the `dependencies` list of
	 * package.json.
	 * @param {boolean} dev - Remove dependency from the `devDependencies` list of
	 * package.json. 
	 * @returns {Promise<Package>} 
	 */
	public uninstall(pkgs: (string[] | string), save = false, dev = false): Promise<Package> {
		return new Promise<Package>((resolve, reject) => {
			if (!Array.isArray(pkgs)) pkgs = [pkgs];

			Package.debug(`Uninstalling '${pkgs.join(', ')}' in ${this._path}`);

			const cmd = `npm uninstall ${pkgs.join(' ')} ${save ? '--save' : ''}${dev ? '-dev' : ''}`;

			const cp = exec(cmd, { cwd: this._path }, (err) => {
				if (!err) {
					Package.debug('Uninstall successful for ' + this._path);
					if (save) {
						this.forceReloadJson()
							.then(() => resolve(this))
							.catch((err) => reject(err));
					} else {
						resolve(this);
					}
				} else {
					Package.debug('Uninstall failed for ' + this._path);
					reject(err);
				}
			});

			this._pipeChildProcess(cp);
		});
	}

	/**
	 * Check wether the package has the given dependency or not.
	 * 
	 * @param {string} dep 
	 * @param {boolean} dev - Check `devDependencies` instead of `dependencies` in
	 * package.json. 
	 * @returns {Promise<boolean>} 
	 */
	public hasDependency(dep: string, dev = false): Promise<boolean> {
		dep = Package.getPackageDir(dep);

		Package.debug(`Checking wether or not it has ${dep + (dev ? '(dev)' : '')} in ${this._path}`);
		
		return new Promise<boolean>((resolve, reject) => {
			fs.readJson(this._path + '/package.json')
				.then((json: any) => resolve(
					Boolean(!dev ? json.dependencies : json.devDependencies)
					&& Boolean(!dev ? json.dependencies[dep] : json.devDependencies[dep])
				))
				.catch(err => {
					Package.debug(`Dependency check failed in ${this._path}`);
					Package.debug(err);
					reject(err);
				});
		});
	}

	/**
	 * Pipes the configured streams to the childProcess and handles the
	 * persistence of the pipe operation.
	 * 
	 * @private
	 * @param {ChildProcess} cp 
	 */
	private _pipeChildProcess(cp: ChildProcess) {
		if (this._pipe.stdout) cp.stdout.pipe(this._pipe.stdout, { end: false });
		if (this._pipe.stderr) cp.stderr.pipe(this._pipe.stderr, { end: false });

		cp.on('exit', () => {
			if (!this._pipe.persistent) {
				this._pipe = { stdout: null, stderr: null, persistent: false };
			}
		})
	}

	/**
	 * Get dependency as instance of Package.
	 * 
	 * @param {string} dep 
	 * @returns {Promise<Package>}
	 */
	public getDependency(dep: string): Promise<Package> {
		const depPackage = new Package(path.join(this._path, 'node_modules', Package.getPackageDir(dep)));
		depPackage._pipe = {
			...this._pipe,
			persistent: (this._pipe.stdout != null || this._pipe.stderr != null)
		};
		
		return new Promise<Package>((resolve, reject) => {
			fs.stat(depPackage._path)
				.then(() => resolve(depPackage))
				.catch(() => reject('Dependency does not exist!'));
		});
	}

	/**
	 * Returns the unformatted package name.
	 * 
	 * @static
	 * @param {string} pkg 
	 * @returns {string}
	 */
	public static getPackageDir(pkg: string): string {
		var name = pkg;

		if (name.indexOf('.git') != -1) {
			name = name.match(/(([a-z0-9.-]*).git)$/)[2];
		} else {
			name = name.replace('.tar.gz', '')
				.replace(/(@[a-z0-9.-]*)$/, '');
		}

		Package.debug(`Converted to package directory/name: ${pkg} => ${name}`);

		return name;
	}

	/**
	 * Creates writable directory and returns new instance of Package pointing
	 * to created directory.
	 * 
	 * @static
	 * @param {string} dir 
	 * @returns {Promise<Package>} 
	 */
	public static create(dir: string): Promise<Package> {
		return new Promise<Package>((resolve, reject) => {
			fs.mkdirp(dir, (err) => {
				Package.debug('Created package directory ' + dir);
				resolve(new Package(dir));
			});
		});
	}
}