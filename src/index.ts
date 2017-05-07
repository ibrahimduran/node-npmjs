import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';

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

export interface InitOptions {
	installDependencies?: boolean,
	fillEmpty?: boolean,
	overwrite?: boolean
}

export class Package {
	private static debug = require('debug')('puckages');
	private _path: string;
	private _json: any = null;

	get json() {
		return this._json;
	}

	get path() {
		return this._path;
	}

	constructor(dir) {
		this._path = path.normalize(dir);
	}

	public init(config: PackageConfig = {}, opts: InitOptions = { installDependencies: false, fillEmpty: false, overwrite: false }) {
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

							this.install(config.dependencies, true, false)
								.then(() => this.install(config.devDependencies, true, true))
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

	public forceReloadJson(opts = { returnEmptyOnErr: false }) {
		return new Promise<Package>((resolve, reject) => {
			fs.readJson(path.join(this._path, 'package.json'))
				.then(json => {
					this._json = json;
					resolve(this);
				})
				.catch(err => {
					if (opts.returnEmptyOnErr) {
						this._json = {};
						resolve(this);
					} else {
						reject(err);
					}
				});
		});
	}

	public install(pkgs?: (string[] | string), save = false, dev = false) {
		Package.debug('Installing dependencies for ' + this._path);

		return new Promise<Package>((resolve, reject) => {
			if (!Array.isArray(pkgs)) pkgs = [pkgs];

			const cmd = `npm install ${pkgs.join(' ')} ${save ? '--save' : ''}${dev ? '-dev' : ''}`;

			exec(cmd, { cwd: this._path }, (err) => {
				if (!err) {
					Package.debug('Installation successful for ' + this._path);
					if (save) {
						this.forceReloadJson()
							.then(() => resolve(this))
							.catch((err) => reject(err));
					} else {
						resolve(this);
					}
				} else {
					Package.debug('Installation failed for ' + this._path);
					reject(err);
				}
			});
		});
	}

	public uninstall(pkgs: (string[] | string), save = false, dev = false) {
		return new Promise<Package>((resolve, reject) => {
			if (!Array.isArray(pkgs)) pkgs = [pkgs];

			const cmd = `npm uninstall ${pkgs.join(' ')} ${save ? '--save' : ''}${dev ? '-dev' : ''}`;

			exec(cmd, { cwd: this._path }, (err) => {
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
		});
	}

	public hasDependency(dep, dev = false): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			fs.readJson(this._path + '/package.json')
				.then((json: any) => resolve(
					Boolean(!dev ? json.dependencies : json.devDependencies)
					&& Boolean(!dev ? json.dependencies[dep] : json.devDependencies[dep])
				))
				.catch(err => reject(err));
		});
	}

	public getDependency(dep) {
		const depPackage = new Package(path.join(this._path, 'node_modules', dep));
		
		return new Promise<Package>((resolve, reject) => {
			fs.stat(depPackage._path)
				.then(() => resolve(depPackage))
				.catch(() => reject('Dependency does not exist!'));
		});
	}

	public static create(dir): Promise<Package> {
		return new Promise<Package>((resolve, reject) => {
			fs.mkdirp(dir, (err) => {
				Package.debug('Created package directory ' + dir);
				resolve(new Package(dir));
			});
		});
	}
}