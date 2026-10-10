# Minimum Sum of Squared Difference

**Date:** 2026-10-10

**Difficulty:** Medium

**LeetCode:** https://leetcode.com/problems/minimum-sum-of-squared-difference/

**Status:** ACCEPTED

**Attempts:** 3

**Language:** cpp


---

## Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    long long minSumSquareDiff(vector<int>& nums1, vector<int>& nums2, int k1, int k2) {
        int n = nums1.size();
        vector<int> diffs(n);
        long long sumDiff = 0;
        int maxDiff = 0;
        for (int i = 0; i < n; ++i) {
            diffs[i] = abs(nums1[i] - nums2[i]);
            sumDiff += diffs[i];
            maxDiff = max(maxDiff, diffs[i]);
        }
        long long totalOps = (long long)k1 + k2;
        if (totalOps >= sumDiff) return 0;
        vector<long long> freq(maxDiff + 1, 0);
        for (int d : diffs) freq[d]++;
        long long K = totalOps;
        int cur = maxDiff;
        while (K > 0 && cur > 0) {
            while (cur > 0 && freq[cur] == 0) --cur;
            if (cur == 0) break;
            int next = cur - 1;
            while (next > 0 && freq[next] == 0) --next;
            long long cnt = freq[cur];
            long long diff = cur - next;
            long long need = diff * cnt;
            if (K >= need) {
                freq[next] += cnt;
                K -= need;
                freq[cur] = 0;
                cur = next;
            } else {
                long long q = K / cnt;
                long long r = K % cnt;
                int newLevel = cur - (int)q;
                freq[cur] = 0;
                freq[newLevel] += cnt - r;
                if (r > 0) freq[newLevel - 1] += r;
                K = 0;
                break;
            }
        }
        long long ans = 0;
        for (int v = 0; v <= maxDiff; ++v) {
            if (freq[v]) ans += freq[v] * 1LL * v * v;
        }
        return ans;
    }
};
```
