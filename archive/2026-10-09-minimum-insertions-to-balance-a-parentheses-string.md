# Minimum Insertions to Balance a Parentheses String

**Date:** 2026-10-09

**Difficulty:** Medium

**LeetCode:** https://leetcode.com/problems/minimum-insertions-to-balance-a-parentheses-string/

**Status:** ACCEPTED

**Attempts:** 2

**Language:** cpp


---

## Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minInsertions(string s) {
        int ans = 0, need = 0;
        for (char c : s) {
            if (c == '(') {
                need += 2;
                if (need % 2 == 1) {
                    ans++;
                    need--;
                }
            } else {
                need--;
                if (need == -1) {
                    ans++;
                    need = 1;
                }
            }
        }
        ans += need;
        return ans;
    }
};
```
