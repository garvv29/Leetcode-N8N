import mongoose, { Schema, Document } from "mongoose";

export interface IWorkflowRun extends Document {
    problemId: mongoose.Types.ObjectId;
    status: string;
    startedAt: Date;
    completedAt?: Date;
    attempts: number;
    error?: string;
}

const workflowRunSchema = new Schema<IWorkflowRun>(
    {
        problemId: {
            type: Schema.Types.ObjectId,
            ref: "Problem",
            required: true,
        },

        status: {
            type: String,
            required: true,
        },

        startedAt: {
            type: Date,
            default: Date.now,
        },

        completedAt: {
            type: Date,
        },

        attempts: {
            type: Number,
            default: 0,
        },

        error: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const WorkflowRun = mongoose.model<IWorkflowRun>(
    "WorkflowRun",
    workflowRunSchema
);