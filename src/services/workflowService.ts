import { WorkflowRun } from "../db/index.js";
import mongoose from "mongoose";

export async function startWorkflow(
    problemId: mongoose.Types.ObjectId
) {
    return await WorkflowRun.create({
        problemId,
        status: "RUNNING",
        attempts: 0,
    });
}

export async function updateWorkflowAttempts(
    workflowId: mongoose.Types.ObjectId,
    attempts: number
) {
    await WorkflowRun.findByIdAndUpdate(
        workflowId,
        {
            attempts,
        }
    );
}

export async function completeWorkflow(
    workflowId: mongoose.Types.ObjectId,
    attempts: number
) {
    await WorkflowRun.findByIdAndUpdate(
        workflowId,
        {
            status: "COMPLETED",
            attempts,
            completedAt: new Date(),
        }
    );
}

export async function failWorkflow(
    workflowId: mongoose.Types.ObjectId,
    attempts: number,
    error: string
) {
    await WorkflowRun.findByIdAndUpdate(
        workflowId,
        {
            status: "FAILED",
            attempts,
            error,
            completedAt: new Date(),
        }
    );
}