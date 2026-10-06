import {
    connectDatabase,
    disconnectDatabase,
} from "./db/index.js";

import {
    connectToChrome,
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

async function main(): Promise<void> {
    let workflowId:
        import("mongoose").Types.ObjectId | null = null;

    let attemptCount = 0;

    await connectDatabase();

    try {
        // =================================================
        // CONNECT TO CHROME
        // =================================================

        const browser = await connectToChrome();

        const contexts = browser.contexts();

        if (contexts.length === 0) {
            throw new Error(
                "No browser context found"
            );
        }

        const context = contexts[0];

        if (!context) {
            throw new Error(
                "Browser context is undefined"
            );
        }

        const pages = context.pages();

        let page = pages[0];

        if (!page) {
            page = await context.newPage();
        }

        console.log(
            "Connected to Chrome"
        );

        console.log(
            "Current URL:",
            page.url()
        );

        console.log(
            "Title:",
            await page.title()
        );

        // =================================================
        // OPEN LEETCODE
        // =================================================

        await page.goto(
            "https://leetcode.com/",
            {
                waitUntil:
                    "domcontentloaded",
            }
        );

        console.log(
            "LeetCode opened:",
            page.url()
        );

        // =================================================
        // GET DAILY PROBLEM
        // =================================================

        const problem =
            await getDailyProblem(page);

        console.log(
            "\nToday's LeetCode problem:"
        );

        console.log(
            "Date:",
            problem.date
        );

        console.log(
            "Title:",
            problem.title
        );

        console.log(
            "Difficulty:",
            problem.difficulty
        );

        console.log(
            "URL:",
            problem.url
        );

        // =================================================
        // SAVE PROBLEM
        // =================================================

        const dbProblem =
            await saveProblem(problem);

        if (!dbProblem) {
            throw new Error(
                "Failed to save problem"
            );
        }

        console.log(
            "MongoDB problem ID:",
            dbProblem._id.toString()
        );

        // =================================================
        // DUPLICATE CHECK
        // =================================================

        const alreadyAccepted =
            await hasAcceptedSubmission(
                dbProblem._id
            );

        if (alreadyAccepted) {
            console.log(
                "\nToday's problem has already been accepted."
            );

            console.log(
                "Skipping generation and submission."
            );

            return;
        }

        // =================================================
        // START WORKFLOW
        // =================================================

        const workflow =
            await startWorkflow(
                dbProblem._id
            );

        workflowId =
            workflow._id;

        console.log(
            "Workflow ID:",
            workflowId.toString()
        );

        // =================================================
        // OPEN PROBLEM
        // =================================================

        await openProblem(
            page,
            problem
        );

        // =================================================
        // GENERATE FIRST SOLUTION
        // =================================================

        let code =
            await generateSolution(
                problem
            );

        // =================================================
        // SAVE FIRST SOLUTION
        // =================================================

        let solution =
            await saveSolution(
                dbProblem._id,
                code
            );

        console.log(
            "Solution saved:",
            solution._id.toString()
        );

        // =================================================
        // FIND SUBMIT BUTTON
        // =================================================

        const submitButton =
            page.getByRole(
                "button",
                {
                    name: /submit/i,
                }
            );

        if (
            await submitButton.count() === 0
        ) {
            throw new Error(
                "Submit button not found"
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
                `\n========== ATTEMPT ${attemptCount}/${MAX_ATTEMPTS} ==========`
            );

            // ---------------------------------------------
            // INSERT CURRENT CODE
            // ---------------------------------------------

            await setEditorCode(
                page,
                code
            );

            // ---------------------------------------------
            // SUBMIT TO LEETCODE
            // ---------------------------------------------

            const result =
                await submitAndGetResult(
                    page,
                    submitButton
                );

            console.log(
                "Submission result:",
                result
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
                    submission._id.toString()
                );

                await updateWorkflowAttempts(
                    workflow._id,
                    attemptCount
                );

                await completeWorkflow(
                    workflow._id,
                    attemptCount
                );

                await archiveSolution({
                    date: problem.date,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    url: problem.url,
                    language: "cpp",
                    model: "openai/gpt-oss-120b",
                    code,
                    status: result,
                    attempts: attemptCount,
                });

                console.log(
                    `\nSolution accepted on attempt ${attemptCount}.`
                );

                return;
            }

            // ---------------------------------------------
            // FAILED
            // ---------------------------------------------

            const feedback =
                await getSubmissionFeedback(
                    page
                );

            console.log(
                "\nSubmission feedback:"
            );

            console.log(
                feedback
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
                "Submission saved:",
                submission._id.toString()
            );

            await updateWorkflowAttempts(
                workflow._id,
                attemptCount
            );

            // ---------------------------------------------
            // MAX ATTEMPTS REACHED
            // ---------------------------------------------

            if (
                attemptCount >= MAX_ATTEMPTS
            ) {
                console.log(
                    "\nMaximum attempts reached."
                );

                await failWorkflow(
                    workflow._id,
                    attemptCount,
                    `Failed after ${MAX_ATTEMPTS} attempts`
                );

                return;
            }

            // ---------------------------------------------
            // DEBUG WITH GROQ
            // ---------------------------------------------

            console.log(
                `\nGenerating corrected solution for attempt ${attemptCount + 1
                }...`
            );

            code =
                await debugSolution(
                    problem,
                    code,
                    feedback
                );

            // ---------------------------------------------
            // SAVE CORRECTED SOLUTION
            // ---------------------------------------------

            solution =
                await saveSolution(
                    dbProblem._id,
                    code
                );

            console.log(
                "Corrected solution saved:",
                solution._id.toString()
            );
        }

    } catch (error) {
        console.error(
            "\nAutomation failed:"
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
                    : String(error)
            );
        }

        throw error;

    } finally {
        await disconnectDatabase();
    }
}

main().catch(() => {
    process.exit(1);
});