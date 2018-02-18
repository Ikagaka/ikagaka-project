const { FileSystemObject } = require("fso");
const lnk = require("lnk");
const repositories = require("../repositories.json");

const base = new FileSystemObject(__dirname, "..", "packages");
const baseNodeModules = new FileSystemObject(__dirname, "..", "node_modules");

/**
 * @param {string} repo
 */
const getTarget = (repo) => base.join(repo.replace(/^.*?([^\/]+)$/, "$1"));

/**
 * @param {string} repo
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
 * @param {string} repo
 * @param {string[]} packageNames
 */
async function unlinkKnownDependencies(repo, packageNames) {
    const nodeModules = getTarget(repo).join("node_modules");
    for (const packageName of packageNames) {
        const packageDir = nodeModules.join(packageName);
        if (packageDir.existsSync()) {
            if (packageDir.isSymbolicLinkSync()) {
                console.log(`unlink ${packageDir}`);
                await packageDir.unlink();
            } else {
                console.log(`rm -rf ${packageDir}`);
                await packageDir.rmAll();
                await packageDir.rmdir();
            }
        }
    }
};

/**
 * @param {string[]} repos
 */
async function fixAll(repos) {
    /** @type {{[name: string]: FileSystemObject}} */
    const packages = {};
    /** @type {string[]} */
    const packageNames = [];

    for (const repo of repos) {
        const packageJson = getPackageJson(repo);
        packages[packageJson.name] = getTarget(repo);
        packageNames.push(packageJson.name);
    }

    for (const repo of repos) {
        await unlinkKnownDependencies(repo, packageNames);
    }

    for (const packageName of packageNames) {
        const link = baseNodeModules.join(packageName);
        const target = packages[packageName];
        if (link.existsSync()) {
            if (link.isSymbolicLinkSync()) {
                console.log(`unlink ${link}`);
                await link.unlink();
            } else {
                console.log(`rm -rf ${link}`);
                await link.rmAll();
                await link.rmdir();
            }
        }
        console.log(`symlink from: ${target} to: ${link}`);
        await lnk(target.path, baseNodeModules.path, {rename: packageName, type: "junction"});
    }
}

fixAll(repositories);
