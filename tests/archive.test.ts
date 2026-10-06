import { archiveSolution } from "../src/services/archiveService.js";

await archiveSolution({
    date: "2026-10-06",
    title: "Minimum Add to Make Parentheses Valid",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/",
    language: "cpp",
    model: "openai/gpt-oss-120b",
    status: "ACCEPTED",
    attempts: 1,
    code: `class Solution {
public:
    int minAddToMakeValid(string s) {
        int balance = 0;
        int additions = 0;

        for (char c : s) {
            if (c == '(') {
                balance++;
            } else {
                if (balance > 0) {
                    balance--;
                } else {
                    additions++;
                }
            }
        }

        return additions + balance;
    }
};`,
});