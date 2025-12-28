import {v} from "convex/values"
import {mutation, query} from "./_generated/server"

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        // generate a URL to which the expense file can uploaded
        return await ctx.storage.generateUploadUrl();
    }
})

export const storeExpenseFile = mutation({
    args: {
        userId: v.string(),
        fileId: v.id("_storage"),
        fileName: v.string(),
        size: v.number(),
        mimeType: v.string()
    },
    handler: async (ctx, args) => {
        const expenseFileId = await ctx.db.insert("expenseFiles",
            {
                userId: args.userId,
                fileName: args.fileName,
                fileId: args.fileId,
                uploadedAt: Date.now(),
                size: args.size,
                mimeType: args.mimeType,
                status: "pending",
                merchantName: undefined,
                merchantAddress: undefined,
                merchantContact: undefined,
                transactionDate: undefined,
                transactionAmount: undefined,
                currency: undefined,
                items: []
            }
        );
    }
});

export const getAllExpenseFiles = query({
    args: {
        userId: v.string() // reason we are doing this, the current user context is not always passed from server side components from where these functions will be called
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("expenseFiles")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .collect();
    }
});

export const getExpenseFileById = query({
    args: {
        id: v.id("expenseFiles")
    },
    handler: async (ctx, args) => {
        const expenseFile = await ctx.db.get(args.id);

        // Verify user authorization to access expenseFile
        if (expenseFile) {
            const userIdentity = await ctx.auth.getUserIdentity(); // This function must be called from client component in order for it to work
            if(!userIdentity) {
                throw new Error("Not authenticated")
            }
            const userId = userIdentity.subject;
            if (expenseFile.userId !== userId) {
                throw new Error("Not authorized to see this expense file")
            }
        }
        return expenseFile;
    }
});

export const getExpenseFileDownloadUrl = query({
    args: {
        fileId: v.id("_storage")
    },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.fileId)
    }
})

export const updateExpenseFileStatus = mutation({
    args: {
        id: v.id("expenseFiles"),
        status: v.string()
    },
    handler: async (ctx, args) => {
        const expenseFile = await ctx.db.get(args.id);
        if (!expenseFile) {
            throw new Error("Expense file not found")
        }

        const userIdentity = await ctx.auth.getUserIdentity();
        if (!userIdentity) {
            throw new Error("Not authenticated");
        }
        const userId = userIdentity.subject
        if (userId !== expenseFile.userId) {
            throw new Error("Not authorized to update these expense files")
        }

        await ctx.db.patch(args.id,{
            status: args.status
        })
        return true
    }
})

export const deleteExpenseFile = mutation({
    args: {
        id: v.id("expenseFiles")
    },
    handler: async (ctx, args) => {
        const expenseFile = await ctx.db.get(args.id)
        if (!expenseFile) {
            throw new Error("Expense file not found")
        }

        const userIdentity = await ctx.auth.getUserIdentity();
        if (!userIdentity) {
            throw new Error("Not authenticated");
        }
        const userId = userIdentity.subject
        if (expenseFile.userId !== userId) {
            throw new Error("Not authorized to delete this receipt");
        }

        // delete the file from file storage
        await ctx.storage.delete(expenseFile.fileId);

        // delete DB entry
        await ctx.db.delete(args.id);
        return true;
    }
})

export const updateExpenseFileWithAIExtractedData = mutation({
    args: {
        id: v.id("expenseFiles"),
        fileDisplayName: v.string(),
        merchantName: v.string(),
        merchantAddress: v.string(),
        merchantContact: v.string(),
        transactionDate: v.string(),
        transactionAmount: v.string(),
        currency: v.string(),
        expenseFileSummary: v.string(),
        items: v.array(
            v.object({
                name: v.string(),
                quantity: v.number(),
                unitPrice: v.number(),
                totalPrice: v.number()
            })
        )
    },
    handler: async (ctx, args) => {
        // Verify that the receipt exists
        const expenseFile = await ctx.db.get(args.id)
        if (!expenseFile) {
            throw new Error("Expense File not found")
        }

        await ctx.db.patch(args.id, {
            fileDisplayName: args.fileDisplayName,
            merchantName: args.merchantName,
            merchantContact: args.merchantAddress,
            merchantAddress: args.merchantContact,
            transactionDate: args.transactionDate,
            transactionAmount: args.transactionAmount,
            currency: args.currency,
            expenseFileSummary: args.expenseFileSummary,
            items: args.items,
            status: "processed"
        })
    }
})