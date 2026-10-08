# Remove Outermost Parentheses

**Date:** 2026-10-08

**Difficulty:** Easy

**LeetCode:** https://leetcode.com/problems/remove-outermost-parentheses/

**Status:** ACCEPTED

**Attempts:** 1

**Language:** cpp


---

## Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string removeOuterParentheses(string s) {
        string res;
        int bal = 0;
        for (char c : s) {
            if (c == '(') {
                if (bal > 0) res += c;
                ++bal;
            } else {
                --bal;
                if (bal > 0) res += c;
            }
        }
        return res;
    }
};
```
