# Remove Invalid Parentheses

**Date:** 2026-10-07

**Difficulty:** Hard

**LeetCode:** https://leetcode.com/problems/remove-invalid-parentheses/

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
    vector<string> removeInvalidParentheses(string s) {
        vector<string> res;
        unordered_set<string> visited;
        queue<string> q;
        q.push(s);
        visited.insert(s);
        bool found = false;
        while (!q.empty()) {
            int n = q.size();
            for (int i = 0; i < n; ++i) {
                string cur = q.front(); q.pop();
                if (isValid(cur)) {
                    res.push_back(cur);
                    found = true;
                }
                if (found) continue;
                for (int j = 0; j < (int)cur.size(); ++j) {
                    if (cur[j] != '(' && cur[j] != ')') continue;
                    string nxt = cur.substr(0, j) + cur.substr(j + 1);
                    if (!visited.count(nxt)) {
                        visited.insert(nxt);
                        q.push(nxt);
                    }
                }
            }
            if (found) break;
        }
        if (res.empty()) res.push_back("");
        return res;
    }
private:
    bool isValid(const string& str) {
        int cnt = 0;
        for (char c : str) {
            if (c == '(') ++cnt;
            else if (c == ')') {
                if (cnt == 0) return false;
                --cnt;
            }
        }
        return cnt == 0;
    }
};
```
