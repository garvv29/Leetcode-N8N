import mongoose, { Schema } from "mongoose";

export interface ISolution {
    problemId: mongoose.Types.ObjectId;
    code: string;
    language: string;
    model: string;
    createdAt: Date;
    updatedAt: Date;
}

const solutionSchema = new Schema<ISolution>(
    {
        problemId: {
            type: Schema.Types.ObjectId,
            ref: "Problem",
            required: true,
        },

        code: {
            type: String,
            required: true,
        },

        language: {
            type: String,
            required: true,
            default: "cpp",
        },

        model: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Solution = mongoose.model<ISolution>(
    "Solution",
    solutionSchema
);