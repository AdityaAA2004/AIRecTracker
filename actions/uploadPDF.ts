'use server'

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import convex from "@/lib/convexClient";
import { currentUser } from "@clerk/nextjs/server"
import { getFileDownloadUrl } from "./getFileDownloadUrl";
import { inngest } from "@/inngest/client";
import Events from "@/inngest/constants";

export async function finalizeUpload(params: {
    storageId: Id<"_storage">,
    fileName: string,
    size: number,
    mimeType: string
}) : Promise <{
    success: boolean,
    error: string | null,
    data: object | null
}> {
    const user = await currentUser();

    if (!user) {
        return {
            success: false,
            error: "Not authenticated",
            data: null
        };
    }

    try {
        const { storageId, fileName, size, mimeType } = params;

        if (!mimeType.includes("pdf") &&
            fileName.toLowerCase().endsWith(".pdf")
        ) {
            return {
                success: false,
                error: "Only PDF files are allowed",
                data: null
            }
        }

        const receiptId = await convex.mutation(api.expenses.storeExpenseFile, {
            userId: user.id,
            fileId: storageId,
            fileName,
            size,
            mimeType
        })

        const fileUrl = await getFileDownloadUrl(storageId);

        // trigger the inngest agents
        await inngest.send({
            name: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DB,
            data: {
                url: fileUrl.downloadUrl,
                expenseFileId: receiptId
            }
        })

        return {
            success: true,
            error: null,
            data: {
                receiptId,
                fileName
            }
        }

    } catch(error) {
        console.error("Server action upload error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occured',
            data: null
        }
    }
}
