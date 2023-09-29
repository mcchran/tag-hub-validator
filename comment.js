const github = require("@actions/github");
const core = require("@actions/core");

function getInputs() {
    const githubToken = core.getInput("github-token");
    return {
        githubToken,
    };
}
function getState() { 
    const failed = core.getState("failed");
    return {
        failed
    }; 
}

async function run() {
    const {
        failed,
    } = getState();

    const {
        githubToken,
    } = getInputs();
    

    const { pull_request } = github.context.payload;
    const { owner, repo } = github.context.repo;

    // console.log("pull_request: ", pull_request);
    // console.log("owner: ", owner);
    // console.log("repo: ", repo);
    console.log(`failed: ${failed}`);

    // let's add a comment to the exracted PR with the results of the check.
    console.log("the toekn:", githubToken)
    const octokit = github.getOctokit(githubToken);
    const comment = `Hello from the check_image_tag action! This is a test comment. \n\n failed: ${failed}`;
    const issue_number = pull_request.number;
    console.log(`issue_number: ${issue_number}`);
    
    const _ = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: comment,
    });
}

run();