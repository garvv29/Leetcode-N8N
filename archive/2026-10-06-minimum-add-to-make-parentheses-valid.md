# Minimum Add to Make Parentheses Valid

**Date:** 2026-10-06

**Difficulty:** Medium

**LeetCode:** https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/

**Status:** ACCEPTED

**Attempts:** 1

**Language:** cpp


---

## Solution

```cpp
class Solution {
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
};
```
