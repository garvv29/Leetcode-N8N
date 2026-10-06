import { gitAddAndCommit, gitPush } from "../src/services/githubService.js";

await gitAddAndCommit(
    [
        "archive/2026-10-06-minimum-add-to-make-parentheses-valid.md",
        "src/services/githubService.ts",
        "tests/github.test.ts",
    ],
    "chore: add LeetCode archive and GitHub integration",
);

await gitPush();