const { FileSystemObject } = require("fso");
const repositories = require("./repositories.json");

const base = new FileSystemObject(__dirname, "packages");

/**
 * @param {string} repo
 */
const getTarget = (repo) => base.join(repo.replace(/^.*?([^\/]+)$/, "$1"));

/**
 * @param {string} repo
 * @return {{name: string; dependencies: {[name: string]: string}; devDependencies: {[name: string]: string}; peerDependencies: {[name: string]: string;}}}
 */
function getPackageJson(repo) {
    const packageJson = getTarget(repo).join("package.json");
    try {
        return require(packageJson.path);
    } catch (error) {
        throw new Error(`${repo}' package.json does not exist at ${packageJson}`);
    }
}

/**
 * @param {string} name
 * @param {{[name: string]: {[version: string]: string[]}}} packages
 * @param {{[name: string]: string}} dependencies
 */
function aggregatePackageVersions(name, packages, dependencies = {}) {
    for (const packageName of Object.keys(dependencies)) {
        const version = dependencies[packageName];
        if (!packages[packageName]) packages[packageName] = {};
        if (!packages[packageName][version]) packages[packageName][version] = [];
        packages[packageName][version].push(name);
    }
}

/**
 * @param {string[]} repos
 */
async function dependencyVersions(repos) {
    /** @type {{[name: string]: {[version: string]: string[]}}} */
    const packages = {};

    for (const repo of repos) {
        const packageJson = getPackageJson(repo);
        const name = packageJson.name;
        aggregatePackageVersions(name, packages, packageJson.dependencies);
        aggregatePackageVersions(name, packages, packageJson.devDependencies);
        aggregatePackageVersions(name, packages, packageJson.peerDependencies);
    }

    return packages;
}

/**
 * @param {boolean} ignoreSingleVersion
 */
async function disp(ignoreSingleVersion) {
    const packages = await dependencyVersions(repositories);

    if (ignoreSingleVersion) {
        for (const name of Object.keys(packages)) {
            if (Object.keys(packages[name]).length === 1) {
                delete packages[name];
            }
        }
    }

    for (const name of Object.keys(packages)) {
        console.log(`${name}:`);
        for (const version of Object.keys(packages[name])) {
            const sources = packages[name][version];
            console.log(`  "${version}": [${sources.join(", ")}]`);
        }
    }
}


disp(process.argv[2] === "--ignore-single");
