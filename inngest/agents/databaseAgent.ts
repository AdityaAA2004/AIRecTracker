import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import convex from "@/lib/convexClient";
import { createAgent, createTool, openai } from "@inngest/agent-kit";
import {z} from "zod";
import {client} from "@/lib/schematic"
const saveToDatabaseTool = createTool({
    name: "save-to-database",
    description: "Saves the given data to the convex database.",
    parameters: z.object({
        fileDisplayName: z.string().describe(
            "The readable display name of the receipt to show in the UI. If the file name is not human readable, use this to give a more readable name"
        ),
        expenseFileId: z.string().describe("The ID of the expense file"),
        merchantName: z.string(),
        merchantAddress: z.string(),
        merchantContact: z.string(),
        transactionDate: z.string(),
        transactionAmount: z.string().describe(
            "The total amount of the transaction, summing all the items on the expense file"
        ),
        expenseFileSummary: z.string().describe(
            "A summary of the expense file, including merchant name, address, contact, transaction date, transaction amount and currency. \
            Include a human readable summary of the expense file. Mention the invoice number if present. This is a special featured summary so it should include some key details \
            about the items on the expense file along with some context."
        ),
        currency: z.string(),
        items: z.array(
            z.object({
                name: z.string(),
                quantity: z.number(),
                unitPrice: z.number(),
                totalPrice: z.number()
            }).describe("An array of items on the expense file. Include name, quantity, unit price and total price for each item.")
        )
    }),
    handler: async (params, context) => {
        const {
            fileDisplayName,
            expenseFileId,
            merchantName,
            merchantAddress,
            merchantContact,
            transactionDate,
            transactionAmount,
            expenseFileSummary,
            currency,
            items
        } = params;

        console.log("Saving to database with params:", params);
        
        const result = await context.step?.run(
            "save-expense-file-to-db",
            async () => {
                // Save to Convex database
                try {
                    const userId = await convex.mutation(
                        api.expenses.updateExpenseFileWithAIExtractedData,
                        {
                            id: expenseFileId as Id<"expenseFiles">,
                            fileDisplayName,
                            merchantName,
                            merchantAddress,
                            merchantContact,
                            transactionDate,
                            transactionAmount,
                            expenseFileSummary,
                            currency,
                            items
                        }
                    );

                    // track on schematic as a successful scan event
                    await client.track({
                        event: "scan",
                        company: {
                            id: userId
                        },
                        user: {
                            id: userId
                        },
                    });

                    return {
                        addedToDB: "Success",
                        expenseFileId,
                        fileDisplayName,
                        merchantName,
                        merchantAddress,
                        merchantContact,
                        transactionDate,
                        transactionAmount,
                        expenseFileSummary,
                        currency,
                        items
                    }

                } catch (error) {
                    console.error("Error saving to database:", error);
                    return { addedToDB: "Error" };
                }
            }
        )
        if (result?.addedToDB === "Success"){
            // set state values as successful
            context.network.state.kv.set('saved-to-db', true);
            context.network.state.kv.set('receipt', expenseFileId);
        }
        return result;
    }

})

export const databaseAgent = createAgent({
    name: "Database Agent",
    description: "responsible for taking key information regarding receipts and saving it to the convex database.",
    system: "You are a helpful assistant that takes key information regarding receipts and saves it to the convex database",
    model: openai({
        model: "gpt-4o-mini",
        defaultParameters: {
            max_completion_tokens: 1000
        }
    }),
    tools: [saveToDatabaseTool]
})