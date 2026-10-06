# Minimum Add to Make Parentheses Valid

**Date:** 2026-10-06

**Difficulty:** Medium

**LeetCode:** https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/

**Status:** ACCEPTED

**Attempts:** 1

**Language:** cpp

**Model:** openai/gpt-oss-120b

---

## Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minAddToMakeValid(string s) {
        int need = 0, balance = 0;
        for (char c : s) {
            if (c == '(') {
                ++balance;
            } else {
                if (balance > 0) {
                    --balance;
                } else {
                    ++need;
                }
            }
        }
        return need + balance;
    }
};
```
