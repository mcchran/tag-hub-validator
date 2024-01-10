const github = require("@actions/github");
const core = require("@actions/core");

function getInputs() {
    const githubToken = core.getInput("github-token");
    const shouldComment = core.getInput("should-comment") === "true";
    return {
        githubToken,
        shouldComment,
    };
}
function getState() { 
    const failed = JSON.parse(core.getState("failed"));
    return {
        failed
    }; 
}

// a function to pad a string with spaces to a given length
function padString(string, length) {
    return string + " ".repeat(length - string.length);
}

function formatComment(failed) {
    let comment = `The following image-tags are not available on dockerhub: \n\n`;
    let maxRepoTagLength = 0;
    let maxReasonLength = 0;
    // Iterate through the failed to find the maximum lengths
    failed.forEach(item => {
    if (item.repoTag.length > maxRepoTagLength) {
        maxRepoTagLength = item.repoTag.length;
    }

    if (item.reason.length > maxReasonLength) {
        maxReasonLength = item.reason.length;
    }
    });


    comment += `|${padString("repoTag", maxRepoTagLength)} | ${padString("Reason", maxReasonLength)} |\n`;
    failed.forEach(item => {
        comment += `|${padString(item.repoTag, maxRepoTagLength)} | ${padString(item.reason, maxReasonLength)} |` + "\n";
    });

    return comment;
  }

async function run() {
    const {
        failed,
    } = getState();

    const {
        githubToken,
        shouldComment
    } = getInputs();
    
    if (!shouldComment) {
        return;
    }

    const { pull_request } = github.context.payload;
    const { owner, repo } = github.context.repo;

    // let's add a comment to the exracted PR with the results of the check.
    const octokit = github.getOctokit(githubToken);

    let comment = "All tags are listed in Dockerhub!";
    if (failed.length > 0) {
        comment = formatComment(failed);
    }

    const issue_number = pull_request.number;
    const _ = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: comment,
    });

}

run();