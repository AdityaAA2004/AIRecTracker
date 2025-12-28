'use server'

import { api } from "@/convex/_generated/api";
import convex from "@/lib/convexClient";
import { currentUser } from "@clerk/nextjs/server"
import { getFileDownloadUrl } from "./getFileDownloadUrl";

export async function uploadPDF(formData: FormData) : Promise <{
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
        const file = formData.get("file") as File;
        if (!file) {
            return {
                success: false,
                error: "No file provided",
                data: null
            }
        }

        if (!file.type.includes("pdf") &&
            file.name.toLowerCase().endsWith(".pdf")
        ) {
            return {
                success: false,
                error: "Only PDF files are allowed",
                data: null
            }
        }

        const uploadUrl = await convex.mutation(api.expenses.generateUploadUrl, {}) 
        
        const arrayBuffer = await file.arrayBuffer();

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                "Content-Type": file.type
            },
            body: new Uint8Array(arrayBuffer)
        });

        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
        }

        const { storageId } = await uploadResponse.json()
        
        const receiptId = await convex.mutation(api.expenses.storeExpenseFile, {
            userId: user.id,
            fileId: storageId,
            fileName: file.name,
            size: file.size,
            mimeType: file.type
        })

        const fileUrl = await getFileDownloadUrl(storageId);

        // trigger the inngest agents

        return {
            success: true,
            error: null,
            data: {
                receiptId,
                fileName: file.name
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