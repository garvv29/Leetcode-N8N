import {
    connectDatabase,
    disconnectDatabase,
    Submission,
    Solution,
    WorkflowRun,
    Problem,
} from "../src/db/index.js";

await connectDatabase();

await Submission.deleteMany({});
await Solution.deleteMany({});
await WorkflowRun.deleteMany({});
await Problem.deleteMany({});

console.log("Submissions, solutions and workflow runs cleared.");

await disconnectDatabase();