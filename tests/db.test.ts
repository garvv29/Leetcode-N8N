import { connectDatabase, disconnectDatabase } from "../src/db/connection.js";
import { Problem } from "../src/db/models/Problem.js";

await connectDatabase();

const problem = await Problem.create({
    date: "2026-10-05",
    title: "Score of Parentheses",
    titleSlug: "score-of-parentheses",
    difficulty: "Medium",
    content: "Test problem",
    url: "https://leetcode.com/problems/score-of-parentheses/",
});

console.log("Inserted:");
console.log(problem);

await disconnectDatabase();