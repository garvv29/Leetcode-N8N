import mongoose, { Schema, Document } from "mongoose";

export interface IProblem extends Document {
    date: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    content: string;
    url: string;
    createdAt: Date;
}

const problemSchema = new Schema<IProblem>(
    {
        date: {
            type: String,
            required: true,
            unique: true,
        },

        title: {
            type: String,
            required: true,
        },

        titleSlug: {
            type: String,
            required: true,
        },

        difficulty: {
            type: String,
            required: true,
        },

        content: {
            type: String,
            required: true,
        },

        url: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Problem = mongoose.model<IProblem>(
    "Problem",
    problemSchema
);