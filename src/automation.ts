import {
    connectDatabase,
    disconnectDatabase,
} from "./db/index.js";

import {
    commitArchive,
    pushToGitHub,
} from "./services/githubService.js";

import {
    connectToChrome,
    closeChromeIfStarted,
} from "./browser/chrome.js";

import {
    getDailyProblem,
    openProblem,
    setEditorCode,
} from "./browser/leetcode.js";

import {
    submitAndGetResult,
    getSubmissionFeedback,
} from "./browser/submission.js";

import {
    generateSolution,
    debugSolution,
} from "./ollama.js";

import {
    archiveSolution,
} from "./services/archiveService.js";

import {
    saveProblem,
} from "./services/problemService.js";

import {
    saveSolution,
} from "./services/solutionService.js";

import {
    saveSubmission,
    hasAcceptedSubmission,
} from "./services/submissionService.js";

import {
    startWorkflow,
    updateWorkflowAttempts,
    completeWorkflow,
    failWorkflow,
} from "./services/workflowService.js";

export interface AutomationResult {
    status:
        | "ACCEPTED"
        | "ALREADY_ACCEPTED"
        | "FAILED";

    problem: string;
    date: string;
    attempts: number;
    archivePath?: string;
    error?: string;
}

export async function runAutomation(): Promise<AutomationResult> {
    let workflowId:
        | import("mongoose").Types.ObjectId
        | null = null;

    let attemptCount = 0;

    /*
     * NORMAL MODE
     *
     * FORCE_RUN is false or absent:
     * - If today's problem was already accepted,
     *   skip it.
     *
     * FORCE MODE
     *
     * FORCE_RUN=true:
     * - Run the complete automation even if
     *   today's problem already has an accepted
     *   submission.
     *
     * This is useful for testing.
     */
    const forceRun = process.env.FORCE_RUN === "true";

    console.log("\n================================");
    console.log("LeetCode Automation");
    console.log("================================");

    console.log(
        `Mode: ${forceRun ? "FORCE TEST" : "NORMAL"}`,
    );

    await connectDatabase();

    try {
        // =================================================
        // CONNECT TO CHROME
        // =================================================

        const browserOrContext =
            await connectToChrome();

        let context;

        if ("contexts" in browserOrContext) {
            // Windows / CDP Browser
            context =
                browserOrContext.contexts()[0] ??
                await browserOrContext.newContext();
        } else {
            // Docker / persistent BrowserContext
            context = browserOrContext;
        }

        const pages = context.pages();

        const page =
            pages[0] ??
            await context.newPage();

        console.log("Connected to browser");

        console.log(
            "Current URL:",
            page.url(),
        );

        console.log(
            "Title:",
            await page.title(),
        );

        // =================================================
        // OPEN LEETCODE
        // =================================================

        await page.goto(
            "https://leetcode.com/",
            {
                waitUntil: "domcontentloaded",
            },
        );

        console.log(
            "LeetCode opened:",
            page.url(),
        );

        // =================================================
        // GET DAILY PROBLEM
        // =================================================

        console.log(
            "\nFetching today's LeetCode problem...",
        );

        const problem =
            await getDailyProblem(page);

        console.log(
            "\nToday's LeetCode problem:",
        );

        console.log(
            "Date:",
            problem.date,
        );

        console.log(
            "Title:",
            problem.title,
        );

        console.log(
            "Difficulty:",
            problem.difficulty,
        );

        console.log(
            "URL:",
            problem.url,
        );

        // =================================================
        // SAVE PROBLEM
        // =================================================

        const dbProblem =
            await saveProblem(problem);

        if (!dbProblem) {
            throw new Error(
                "Failed to save problem",
            );
        }

        console.log(
            "MongoDB problem ID:",
            dbProblem._id.toString(),
        );

        // =================================================
        // DUPLICATE CHECK
        // =================================================

        const alreadyAccepted =
            await hasAcceptedSubmission(
                dbProblem._id,
            );

        if (
            alreadyAccepted &&
            !forceRun
        ) {
            console.log(
                "\nToday's problem has already been accepted.",
            );

            console.log(
                "Skipping generation and submission.",
            );

            return {
                status: "ALREADY_ACCEPTED",
                problem: problem.title,
                date: problem.date,
                attempts: 0,
            };
        }

        if (
            alreadyAccepted &&
            forceRun
        ) {
            console.log(
                "\nExisting accepted submission found.",
            );

            console.log(
                "FORCE_RUN=true → running automation anyway.",
            );
        }

        // =================================================
        // START WORKFLOW
        // =================================================

        const workflow =
            await startWorkflow(
                dbProblem._id,
            );

        workflowId = workflow._id;

        console.log(
            "Workflow ID:",
            workflowId.toString(),
        );

        // =================================================
        // OPEN PROBLEM
        // =================================================

        await openProblem(
            page,
            problem,
        );

        // =================================================
        // GENERATE FIRST SOLUTION
        // =================================================

        console.log(
            "\nGenerating solution...",
        );

        let code =
            await generateSolution(
                problem,
            );

        console.log(
            "Solution generated.",
        );

        // =================================================
        // SAVE FIRST SOLUTION
        // =================================================

        let solution =
            await saveSolution(
                dbProblem._id,
                code,
            );

        console.log(
            "Solution saved:",
            solution._id.toString(),
        );

        // =================================================
        // FIND SUBMIT BUTTON
        // =================================================

        const submitButton =
            page.getByRole(
                "button",
                {
                    name: /submit/i,
                },
            );

        if (
            await submitButton.count() === 0
        ) {
            throw new Error(
                "Submit button not found",
            );
        }

        // =================================================
        // SUBMISSION LOOP
        // =================================================

        const MAX_ATTEMPTS = 3;

        while (
            attemptCount < MAX_ATTEMPTS
        ) {
            attemptCount++;

            console.log(
                `\n========== ATTEMPT ${attemptCount}/${MAX_ATTEMPTS} ==========`,
            );

            // ---------------------------------------------
            // INSERT CURRENT CODE
            // ---------------------------------------------

            console.log(
                "Inserting code into Monaco...",
            );

            await setEditorCode(
                page,
                code,
            );

            // ---------------------------------------------
            // SUBMIT TO LEETCODE
            // ---------------------------------------------

            console.log(
                "Submitting to LeetCode...",
            );

            const result =
                await submitAndGetResult(
                    page,
                    submitButton,
                );

            console.log(
                "Submission result:",
                result,
            );

            // ---------------------------------------------
            // ACCEPTED
            // ---------------------------------------------

            if (
                result === "ACCEPTED"
            ) {
                const submission =
                    await saveSubmission({
                        problemId:
                            dbProblem._id,

                        solutionId:
                            solution._id,

                        attempt:
                            attemptCount,

                        status:
                            result,
                    });

                console.log(
                    "Submission saved:",
                    submission._id.toString(),
                );

                await updateWorkflowAttempts(
                    workflow._id,
                    attemptCount,
                );

                await completeWorkflow(
                    workflow._id,
                    attemptCount,
                );

                // -----------------------------------------
                // MARKDOWN ARCHIVE
                // -----------------------------------------

                const archivePath =
                    await archiveSolution({
                        date:
                            problem.date,

                        title:
                            problem.title,

                        difficulty:
                            problem.difficulty,

                        url:
                            problem.url,

                        language:
                            "cpp",

                        model:
                            "openai/gpt-oss-120b",

                        code,

                        status:
                            result,

                        attempts:
                            attemptCount,
                    });

                console.log(
                    "Archive created:",
                    archivePath,
                );

                // -----------------------------------------
                // GITHUB
                // -----------------------------------------

                await commitArchive(
                    archivePath,
                    problem.date,
                    problem.title,
                );

                await pushToGitHub();

                console.log(
                    `\nSolution accepted on attempt ${attemptCount}.`,
                );

                return {
                    status: "ACCEPTED",

                    problem:
                        problem.title,

                    date:
                        problem.date,

                    attempts:
                        attemptCount,

                    archivePath,
                };
            }

            // ---------------------------------------------
            // FAILED
            // ---------------------------------------------

            const feedback =
                await getSubmissionFeedback(
                    page,
                );

            console.log(
                "\nSubmission feedback:",
            );

            console.log(
                feedback,
            );

            // ---------------------------------------------
            // SAVE FAILED SUBMISSION
            // ---------------------------------------------

            const submission =
                await saveSubmission({
                    problemId:
                        dbProblem._id,

                    solutionId:
                        solution._id,

                    attempt:
                        attemptCount,

                    status:
                        result,

                    feedback,
                });

            console.log(
                "Failed submission saved:",
                submission._id.toString(),
            );

            await updateWorkflowAttempts(
                workflow._id,
                attemptCount,
            );

            // ---------------------------------------------
            // MAX ATTEMPTS REACHED
            // ---------------------------------------------

            if (
                attemptCount >= MAX_ATTEMPTS
            ) {
                console.log(
                    "\nMaximum attempts reached.",
                );

                await failWorkflow(
                    workflow._id,
                    attemptCount,
                    `Failed after ${MAX_ATTEMPTS} attempts`,
                );

                return {
                    status: "FAILED",

                    problem:
                        problem.title,

                    date:
                        problem.date,

                    attempts:
                        attemptCount,
                };
            }

            // ---------------------------------------------
            // DEBUG WITH GROQ
            // ---------------------------------------------

            console.log(
                `\nGenerating corrected solution for attempt ${attemptCount + 1}...`,
            );

            code =
                await debugSolution(
                    problem,
                    code,
                    feedback,
                );

            console.log(
                "Corrected solution generated.",
            );

            // ---------------------------------------------
            // SAVE CORRECTED SOLUTION
            // ---------------------------------------------

            solution =
                await saveSolution(
                    dbProblem._id,
                    code,
                );

            console.log(
                "Corrected solution saved:",
                solution._id.toString(),
            );
        }

        throw new Error(
            "Automation ended without a result",
        );

    } catch (error) {
        console.error(
            "\nAutomation failed:",
        );

        console.error(error);

        // ---------------------------------------------
        // MARK WORKFLOW FAILED
        // ---------------------------------------------

        if (workflowId) {
            await failWorkflow(
                workflowId,
                attemptCount,
                error instanceof Error
                    ? error.message
                    : String(error),
            );
        }

        throw error;

    } finally {
        await closeChromeIfStarted();

        await disconnectDatabase();
    }
}