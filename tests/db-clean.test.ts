import {
    connectDatabase,
    disconnectDatabase,
    Submission,
    Solution,
    WorkflowRun,
} from "../src/db/index.js";

await connectDatabase();

await Submission.deleteMany({});
await Solution.deleteMany({});
await WorkflowRun.deleteMany({});

console.log("Submissions, solutions and workflow runs cleared.");

await disconnectDatabase();