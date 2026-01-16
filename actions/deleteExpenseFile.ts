"use server";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import convex from "@/lib/convexClient"

export async function deleteExpenseFile(expenseFileId: string) {
    try {
        await convex.mutation(api.expenses.deleteExpenseFile, {
            id: expenseFileId as Id<"expenseFiles">
        });

        return {
            success: true
        };

    } catch (error) {
        console.error("Error deleting expense file:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }
    }
}