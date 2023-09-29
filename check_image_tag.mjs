#!/usr/bin/env zx

const fs = require('fs');
const yaml = require('js-yaml');
const glob = require('glob');
const axios = require('axios');

// Function to extract Docker image information from a values file
function extractImageInfo(valuesFilePath) {
    let imageInfoList = [];
    try {
        const yamlData = yaml.load(fs.readFileSync(valuesFilePath, 'utf8'));
        if (typeof yamlData === 'object') {
            imageInfoList = findImageInfo(yamlData, imageInfoList);
        }
    } catch (e) {
        console.error(`Error parsing ${valuesFilePath} --> \n ${e}`);
        console.dir(e, { depth: null })
    }
    return imageInfoList;
}

// Function to tail-recursively find image information in a YAML structure
function findImageInfo(data, imageInfoList) {
    if ( data !== null && typeof data === 'object') {
        for (const [key, value] of Object.entries(data)) {
            if (key === 'image') {
                imageInfoList.push(parseImageReference(value));
            } else {
                imageInfoList = findImageInfo(value, imageInfoList);
            }
        }
    } else if (Array.isArray(data)) {
        for (const item of data) {
            imageInfoList = findImageInfo(item, imageInfoList);
        }
    }
    return imageInfoList;
}

// Function to parse a Docker image reference into repository, name, and tag/version
function parseImageReference(imageReference) {
    if (typeof imageReference === 'string') {
        const parts = imageReference.split(':');
        const repositoryName = parts[0];
        const tag = parts.length > 1 ? parts[1] : 'latest';
        return {
            imageSrc: repositoryName,
            tag,
        };
    } else {
        try {
            let tag = null;
            let repositoryName = imageReference.repository;
            if (repositoryName.includes(':')) {
                const parts = repositoryName.split(':');
                repositoryName = parts[0];
                tag = parts.length > 1 ? parts[1] : 'latest';
            }
            
            if (!repositoryName.includes('/')) {
                repositoryName = `library/${repositoryName}`;
            }

            if (!tag) {
                tag = imageReference.tag || 'latest';
            }

            return `${repositoryName}:${tag}`;
        } catch (error) {
            // Skip if no repository is found
            return null;
        }
    }
}

// Function to scan all values.* files in a directory
function scanDirectory(directoryPath) {
    const filePaths = glob.sync(`${directoryPath}/**/values*.yaml`);
    const imageInfoList = [];
    for (var file of filePaths) {
        imageInfoList.push(...extractImageInfo(file));
    }

    return imageInfoList;
}

// an async function to get a JWT token from Docker Hub so as to perform any consecutive requests
async function getDockerJwt(username, password) {
    const loginUrl = 'https://hub.docker.com/v2/users/login/';
    const data = {
      username,
      password,
    };
  
    try {
        const response = await axios.post(loginUrl, data);
        if (response.status !== 200) {
            throw new Error(response.data);
        }
        return response.data.token;
    } catch (error) {
        console.error(`An exception occurred during auth: ${error.message}`);
        return null;
    }
  }

async function performDockerHubRequests(jwt, repoTags) {
    const successfulResponses = [];
    const failedRequests = [];
  
    // Create an array of Promise objects representing the HTTP requests
    for (const repoTag of repoTags) {
        const [repository, tag] = repoTag.split(':');
        try {
            await axios.get(
            `https://hub.docker.com/v2/repositories/${repository}/tags/${tag}`,
            {
                headers: {
                Authorization: `JWT ${jwt}`,
                },
            }
            );
            successfulResponses.push(`${repository}:${tag}`);
        } catch (error) {
            failedRequests.push({
                repoTag: `${repository}:${tag}`,
                reason: error.message,
            })
        }
    }
    
    return [successfulResponses, failedRequests];
  }

// Main script goes as it follows:

function main(){
    // the first two arguments should be `zx` and the script name ... little messy ... but it works
    const TARGET_PATH = process.argv[3];
    const GH_USERNAME = process.argv[4];
    const GH_PASSWORD = process.argv[5];

    const imageInfoList = [...new Set(scanDirectory(TARGET_PATH).filter(element => element !== null))];
    // check if there are images ...
    if (imageInfoList.length > 0) {
        // get dockerhub token to check if the image/tag exists
        (async () => {
                const token = await getDockerJwt(GH_USERNAME, GH_PASSWORD);
                const [_, failed] = await performDockerHubRequests(token, imageInfoList)
                console.log(failed)
        })();
    } else {
        console.log('No Docker image information found in the directory.');
        process.exit(1);
    }
}

main();