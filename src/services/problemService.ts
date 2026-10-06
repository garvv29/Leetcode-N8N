import { Problem } from "../db/index.js";
import type { LeetCodeProblem } from "../browser/leetcode.js";

export async function saveProblem(
    problem: LeetCodeProblem
) {
    return await Problem.findOneAndUpdate(
        {
            date: problem.date,
        },
        {
            date: problem.date,
            title: problem.title,
            titleSlug: problem.titleSlug,
            difficulty: problem.difficulty,
            content: problem.content,
            url: problem.url,
        },
        {
            upsert: true,
            returnDocument: "after",
        }
    );
}

export async function findProblemByDate(
    date: string
) {
    return await Problem.findOne({ date });
}