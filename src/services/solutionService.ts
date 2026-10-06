import { Solution } from "../db/index.js";
import mongoose from "mongoose";

export async function saveSolution(
    problemId: mongoose.Types.ObjectId,
    code: string
) {
    return await Solution.create({
        problemId,
        code,
        language: "cpp",
        model: "openai/gpt-oss-120b",
    });
}