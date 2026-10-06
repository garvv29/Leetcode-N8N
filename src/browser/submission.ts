import type { Locator, Page } from "playwright";

export type SubmissionStatus =
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "COMPILE_ERROR"
    | "RUNTIME_ERROR"
    | "TIME_LIMIT_EXCEEDED";

const statusLabels: Array<
    [SubmissionStatus, string]
> = [
    ["ACCEPTED", "Accepted"],
    ["WRONG_ANSWER", "Wrong Answer"],
    ["COMPILE_ERROR", "Compile Error"],
    ["RUNTIME_ERROR", "Runtime Error"],
    ["TIME_LIMIT_EXCEEDED", "Time Limit Exceeded"],
];

export async function getSubmissionResult(
    page: Page
): Promise<SubmissionStatus> {
    const start = Date.now();
    const timeout = 30000;

    while (Date.now() - start < timeout) {
        const url = page.url();

        /*
         * Wait until LeetCode navigates to
         * a specific submission page.
         */
        if (/\/submissions\/\d+\/?$/.test(url)) {
            const body = await page
                .locator("body")
                .innerText();

            let bestStatus: SubmissionStatus | null = null;
            let bestIndex = Infinity;

            for (const [status, label] of statusLabels) {
                const index = body.indexOf(label);

                if (
                    index !== -1 &&
                    index < bestIndex
                ) {
                    bestIndex = index;
                    bestStatus = status;
                }
            }

            if (bestStatus) {
                return bestStatus;
            }
        }

        await page.waitForTimeout(500);
    }

    throw new Error(
        "Submission result did not appear within 30 seconds"
    );
}

export async function getSubmissionFeedback(
    page: Page
): Promise<string> {
    console.log("Getting submission feedback...");

    const body = await page
        .locator("body")
        .innerText();

    const inputIndex = body.indexOf("Input");

    const outputIndex = body.indexOf(
        "Output",
        inputIndex
    );

    const expectedIndex = body.indexOf(
        "Expected",
        outputIndex
    );

    if (
        inputIndex === -1 ||
        outputIndex === -1 ||
        expectedIndex === -1
    ) {
        return (
            "LeetCode returned Wrong Answer, " +
            "but test details were not found."
        );
    }

    const input = body
        .slice(
            inputIndex + "Input".length,
            outputIndex
        )
        .trim();

    const output = body
        .slice(
            outputIndex + "Output".length,
            expectedIndex
        )
        .trim();

    const expected =
        body
            .slice(
                expectedIndex + "Expected".length
            )
            .split("Code")[0]
            ?.trim() ?? "";

    return `
Input:

${input}

Output:

${output}

Expected:

${expected}
    `.trim();
}

export async function submitAndGetResult(
    page: Page,
    submitButton: Locator
): Promise<SubmissionStatus> {
    console.log("Submitting...");

    await submitButton.click();

    console.log(
        "Submitted. Waiting for result..."
    );

    return await getSubmissionResult(page);
}