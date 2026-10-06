import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
    problemId: mongoose.Types.ObjectId;
    solutionId: mongoose.Types.ObjectId;
    attempt: number;
    status: string;
    runtime?: string;
    memory?: string;
    feedback?: string;
    submittedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
    {
        problemId: {
            type: Schema.Types.ObjectId,
            ref: "Problem",
            required: true,
        },

        solutionId: {
            type: Schema.Types.ObjectId,
            ref: "Solution",
            required: true,
        },

        attempt: {
            type: Number,
            required: true,
        },

        status: {
            type: String,
            required: true,
        },

        runtime: {
            type: String,
        },

        memory: {
            type: String,
        },

        feedback: {
            type: String,
        },

        submittedAt: {
            type: Date,
            default: Date.now,
        },
    }
);

submissionSchema.index(
    { problemId: 1, attempt: 1 },
    { unique: true }
);

export const Submission = mongoose.model<ISubmission>(
    "Submission",
    submissionSchema
);