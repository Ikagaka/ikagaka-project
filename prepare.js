const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const repositories = require("./repositories.json");

const base = path.join(__dirname, "packages");

const clone = (repo, callback) => new Promise((resolve, reject) => {
    const repoUrl = `git@github.com:${repo}.git`;
    const target = path.join(base, repo.replace(/^.*?([^\/]+)$/, "$1"));
    if (fs.existsSync(target)) {
        console.log(`${repo} >>> exists`);
        resolve();
    } else {
        const command = `git clone ${repoUrl} ${target}`;
        console.log(`${repo} >>> ${command}`);
        exec(command, (error, stdout, stderr) =>
            error ? reject(error) : resolve(stdout, stderr));
    }
});

const cloneAll = async (repos) => {
    for (const repo of repos) {
        await clone(repo);
    }
}

cloneAll(repositories);
