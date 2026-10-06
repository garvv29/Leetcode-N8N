import type { Page } from "playwright";

interface DailyResponse {
    data?: {
        activeDailyCodingChallengeQuestion?: {
            date: string;
            link: string;
            question: {
                title: string;
                titleSlug: string;
                difficulty: string;
                content: string;
            };
        };
    };

    errors?: Array<{
        message: string;
    }>;
}

export interface LeetCodeProblem {
    date: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    content: string;
    url: string;
}

export async function getDailyProblem(
    page: Page
): Promise<LeetCodeProblem> {
    console.log("Fetching today's LeetCode problem...");

    const data = await page.evaluate(
        async (): Promise<DailyResponse> => {
            const response = await fetch("/graphql", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    operationName: "questionOfToday",

                    query: `
                        query questionOfToday {
                            activeDailyCodingChallengeQuestion {
                                date
                                link
                                question {
                                    title
                                    titleSlug
                                    difficulty
                                    content
                                }
                            }
                        }
                    `,
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `LeetCode GraphQL failed: ${response.status}`
                );
            }

            return await response.json() as DailyResponse;
        }
    );

    const daily =
        data.data?.activeDailyCodingChallengeQuestion;

    if (!daily) {
        throw new Error(
            "Today's LeetCode problem not found"
        );
    }

    return {
        date: daily.date,
        title: daily.question.title,
        titleSlug: daily.question.titleSlug,
        difficulty: daily.question.difficulty,
        content: daily.question.content,
        url: `https://leetcode.com${daily.link}`,
    };
}

export async function openProblem(
    page: Page,
    problem: LeetCodeProblem
): Promise<void> {
    await page.goto(problem.url, {
        waitUntil: "domcontentloaded",
    });

    console.log(
        "Problem page:",
        await page.title()
    );

    await page
        .locator(".monaco-editor")
        .first()
        .waitFor({state:"visible",timeout:10000,});
}

export async function setEditorCode(
    page: Page,
    code: string
): Promise<void> {
    console.log("Problem page URL:", page.url());
    console.log("Problem page title:", await page.title());

    console.log(
        "Problem page body:",
        (await page.locator("body").innerText()).slice(0, 1000),
    );
    const editors = page.locator(".monaco-editor");

    if (await editors.count() === 0) {
        throw new Error("No Monaco editor found");
    }

    const editor = editors.nth(0);

    await editor.click();

    await page.evaluate((code) => {
        const monaco = (globalThis as any).monaco;

        if (!monaco) {
            throw new Error("Monaco is not available");
        }

        const editors = monaco.editor.getEditors();

        if (editors.length === 0) {
            throw new Error(
                "No Monaco editor instance found"
            );
        }

        const editor = editors[0];

        const model = editor.getModel();

        if (!model) {
            throw new Error(
                "Monaco model not found"
            );
        }

        model.setValue(code);
    }, code);

    console.log("Code inserted into Monaco");
}