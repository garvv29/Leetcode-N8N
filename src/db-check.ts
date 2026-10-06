import {
    connectDatabase,
    disconnectDatabase,
    Problem,
    Solution,
    Submission,
    WorkflowRun,
} from "./db/index.js";

await connectDatabase();

console.log("\n===== PROBLEMS =====");
console.log(
    await Problem.find().lean()
);

console.log("\n===== SOLUTIONS =====");
console.log(
    await Solution.find().lean()
);

console.log("\n===== SUBMISSIONS =====");
console.log(
    await Submission.find().lean()
);

console.log("\n===== WORKFLOW RUNS =====");
console.log(
    await WorkflowRun.find().lean()
);

await disconnectDatabase();