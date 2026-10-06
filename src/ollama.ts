import "dotenv/config";
import Groq from "groq-sdk";

interface LeetCodeProblem {
    date: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    content: string;
    url: string;
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});


function cleanCode(code: string): string {
    return code
        .trim()
        .replace(/^```(?:cpp|c\+\+)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

function cleanProblemHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<li>/gi, "\n- ")
        .replace(/<\/li>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&amp;/gi, "&")
        .replace(/&#39;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();
}

function validateCode(code: string): void {
    if (!code) {
        throw new Error(
            "Groq returned empty code."
        );
    }

    if (!code.includes("class Solution")) {
        throw new Error(
            "Groq output does not contain class Solution."
        );
    }

    if (
        !code.includes("{") ||
        !code.includes("}")
    ) {
        throw new Error(
            "Groq returned incomplete C++ code."
        );
    }
}


async function askGroq(
    system: string,
    user: string
): Promise<string> {
    const start = performance.now();

    const response =
        await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",

            messages: [
                {
                    role: "system",
                    content: system,
                },
                {
                    role: "user",
                    content: user,
                },
            ],

            temperature: 0,

            max_tokens: 4096,
        });

    const output =
        response.choices[0]
            ?.message
            ?.content ?? "";

    const end = performance.now();

    console.log(
        "\n\n------------------------------"
    );

    console.log(
        `Groq generation time: ${(
            (end - start) / 1000
        ).toFixed(2)}s`
    );

    console.log(
        `Characters: ${output.length}`
    );

    console.log(
        "------------------------------"
    );

    console.log(output);

    return output;
}


export async function generateSolution(
    problem: LeetCodeProblem
): Promise<string> {
    console.log(
        `Generating solution for: ${problem.title}\n`
    );

    const problemText =
        cleanProblemHtml(
            problem.content
        );

    const rawCode =
        await askGroq(
            `
You solve LeetCode problems.

Think carefully, then output ONLY complete compilable C++17 code.

Requirements:
- class Solution
- required LeetCode function
- no main()
- no explanations
- no comments
- no markdown
- no JSON

Output code only.
            `.trim(),

            `
Problem:
${problem.title}

Difficulty:
${problem.difficulty}

Statement:
${problemText}

Return the correct C++17 solution.
            `.trim()
        );

    const code =
        cleanCode(rawCode);

    validateCode(code);

    return code;
}


export async function debugSolution(
    problem: LeetCodeProblem,
    code: string,
    feedback: string
): Promise<string> {
    console.log(
        "\nAsking Groq to fix the solution...\n"
    );

    const problemText =
        cleanProblemHtml(
            problem.content
        );

    const rawCode =
        await askGroq(
            `
You debug incorrect LeetCode solutions.

Re-solve the problem instead of blindly patching
the previous code.

Use the complete problem statement, previous code,
and failing testcase to find the actual algorithmic error.

Output ONLY complete compilable C++17 code.

Requirements:
- class Solution
- required LeetCode function
- no main()
- no explanations
- no comments
- no markdown
- no JSON

Output code only.
            `.trim(),

            `
Problem:
${problem.title}

Statement:
${problemText}

Previous code:
${code}

LeetCode failure:
${feedback}

Return the complete corrected C++17 solution.
            `.trim()
        );

    const fixedCode =
        cleanCode(rawCode);

    validateCode(fixedCode);

    return fixedCode;
}