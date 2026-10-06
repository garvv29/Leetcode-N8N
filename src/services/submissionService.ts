import { Submission } from "../db/index.js";
import mongoose from "mongoose";

interface SubmissionData {
    problemId: mongoose.Types.ObjectId;
    solutionId: mongoose.Types.ObjectId;
    attempt: number;
    status: string;
    feedback?: string;
}

export async function saveSubmission(
    data: SubmissionData
) {
    return await Submission.create(data);
}

export async function hasAcceptedSubmission(
    problemId: mongoose.Types.ObjectId
): Promise<boolean> {
    const submission = await Submission.findOne({
        problemId,
        status: "ACCEPTED",
    });

    return submission !== null;
}