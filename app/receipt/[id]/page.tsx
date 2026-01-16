"use client";

import { deleteExpenseFile } from "@/actions/deleteExpenseFile";
import { getFileDownloadUrl } from "@/actions/getFileDownloadUrl";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSchematicFlag } from "@schematichq/schematic-react";
import { useQuery } from "convex/react";
import { ChevronLeft, FileText, Lightbulb, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function ReceiptPage() {
    const params= useParams<{id: string}>();
    const [expenseFileId, setExpenseFileId] = 
    useState<Id<"expenseFiles"> | null>(null);

    const [isLoadingDownload, setIsLoadingDownload] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();

    const isSummariesEnabled = useSchematicFlag("summary");

    const expenseFileDetails = useQuery(api.expenses.getExpenseFileById, 
      expenseFileId ? {id: expenseFileId} : "skip"
    )

    const fileId = expenseFileDetails?.fileId;
    const downloadUrl = useQuery(api.expenses.getExpenseFileDownloadUrl, 
      fileId ? {fileId: fileId} : "skip"
    );

    const handleDownload = async () => {
      if (!expenseFileDetails || !expenseFileDetails.fileId) return;

      try {
        setIsLoadingDownload(true);
        const result = await getFileDownloadUrl(expenseFileDetails.fileId);

        if (!result.success) {
          throw new Error(result.error || "Failed to get download URL");
        }

        // create download link and trigger download
        const link = document.createElement("a");
        if (!result.downloadUrl) {
          throw new Error("Download URL is missing");
        }
        link.href = result.downloadUrl;
        link.download = expenseFileDetails.fileDisplayName || expenseFileDetails.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } catch (error) {
        console.error("Error downloading expense file:", error);
        alert("Failed to prepare download. Please try again later.");
      } finally {
        setIsLoadingDownload(false);
      }
    }

    const handleDelete = async () => {
      if (!expenseFileId) return;
      
      const confirmDelete = confirm("Are you sure you want to delete this expense file? This action cannot be undone.");
      if (!confirmDelete) return;

      try {
        setIsDeleting(true);
        const result = await deleteExpenseFile(expenseFileId);
        if (!result.success) {
          throw new Error(result?.error || "Failed to delete expense file");
        }
        // Redirect to expense files list after deletion
        router.push("/receipts");

      } catch (error) {
        console.error("Error deleting expense file:", error);
        alert("Failed to delete expense file. Please try again later.");
        setIsDeleting(false);
      } finally {
        setIsDeleting(false);
      }
    }
    
    useEffect(() => {
        try {
          const expenseFileIdFromParams = params.id as Id<"expenseFiles">;
          setExpenseFileId(expenseFileIdFromParams);
        } catch (error) {
          console.error("Invalid expenseFileId in URL params:", error);
          router.push("/"); 
        }
    }, [params.id, router]);
  
    // Loading receipt details
    if (expenseFileDetails === undefined) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 
          border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Receipt details not found
  if (expenseFileDetails === null) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Expense file not found</h1>
        </div>
        <p className="mb-6">
          The expense file you are looking for does not exist or might have been removed.
        </p>
        <Link href="/" className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Return home 
        </Link>
      </div>
    )
  }

  const uploadDate = new Date(expenseFileDetails.uploadedAt).toLocaleString();

  // check if AI has extracted any data
  const hasExtractedData = !!(
    expenseFileDetails.merchantName ||
    expenseFileDetails.merchantAddress ||
    expenseFileDetails.transactionDate ||
    expenseFileDetails.transactionAmount
  );

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6">
          <Link
            href="/receipts"
            className="text-blue-500 hover:underline flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Expense Files
          </Link>
        </nav>
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            {/* Header with file name and status */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800 truncate">
                {expenseFileDetails.fileDisplayName || expenseFileDetails.fileName}
              </h1>
              <div className="flex items-center">
                {expenseFileDetails.status === "pending" ? (
                  <div className="mr-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-800" />
                  </div>
                ) : null}
                <span className={`px-3 py-1 rounded-full text-sm ${
                  expenseFileDetails.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  expenseFileDetails.status === "processed" ? "bg-green-100 text-green-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {expenseFileDetails.status.charAt(0).toUpperCase() + expenseFileDetails.status.slice(1)}
                </span>
              </div>
            </div>
            {/* File info and preview/download button */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Information about the expense file */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Expense Info
                  </h3>
                  <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Uploaded:</p>
                        <p className="font-medium">{uploadDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">File size:</p>
                        <p className="font-medium">
                          {formatFileSize(expenseFileDetails.size)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">File type:</p>
                        <p className="font-medium">{expenseFileDetails.mimeType}</p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
              {/* Download button */}
              <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-blue-500 mx-auto" />
                  <p className="mt-4 text-sm text-gray-500">PDF Preview</p>
                  {downloadUrl && (
                    <a href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 px-4 py-2 bg-blue-500 text-white text-sm cursor-pointer rounded hover:bg-blue-600 inline-block">
                      View PDF
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted data section */}
            {hasExtractedData && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Expense file details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Merchant */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Merchant Information
                    </h4>
                    <div className="space-y-2">
                      {expenseFileDetails.merchantName && (
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">
                            {expenseFileDetails.merchantName}
                          </p>
                        </div>
                      )}

                      {expenseFileDetails.merchantAddress && (
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">
                            {expenseFileDetails.merchantAddress}
                          </p>
                        </div>
                      )}

                      {expenseFileDetails.merchantContact && (
                        <div>
                          <p className="text-sm text-gray-500">Contact</p>
                          <p className="font-medium">
                            {expenseFileDetails.merchantContact}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Transaction */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Transaction Details
                    </h4>
                    <div className="space-y-2">
                      {expenseFileDetails.transactionDate && (
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium">
                            {expenseFileDetails.transactionDate}
                          </p>
                        </div>
                      )}

                      {expenseFileDetails.transactionAmount && (
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-medium">
                            {formatCurrency(parseFloat(expenseFileDetails.transactionAmount), expenseFileDetails.currency)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expense file summary */}
                {expenseFileDetails.expenseFileSummary && (
                  <>
                    {isSummariesEnabled ? (
                      <div className="mt-6 bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 shadow-sm">
                        <div className="flex items-center mb-4">
                          <h4 className="font-semibold text-blue-700">
                            AI Summary
                          </h4>
                          <div className="ml-2 flex">
                            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                            <Sparkles className="h-3 w-3 text-yellow-400 -ml-1" />
                          </div>
                        </div>
                        <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-blue-100">
                          <p className="text-sm whitespace-pre-line leading-relaxed text-gray-700">
                            {expenseFileDetails.expenseFileSummary}
                          </p>
                        </div>
                        <div className="mt-3 text-xs text-blue-600 italic flex items-center">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          <span>AI-generated summary based on expense file data</span>
                        </div>
                      </div>
                    ) : 
                    (
                      <div className="mt-6 bg-gray-100 p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <h4 className="font-semibold text-gray-500">
                              AI Summary
                            </h4>
                            <div className="ml-2 flex">
                              <Sparkles className="h-3.5 w-3.5 text-gray-400" />
                              <Sparkles className="h-3 w-3 text-gray-300 -ml-1" />
                            </div>
                          </div>
                          <Lock className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="bg-white bg-opacity-50 rounded-lg p-4 border border-gray-200 
                        flex flex-col items-center justify-center">
                          <Link 
                            href="/plan/manage"
                            className="text-center py-4"
                          >
                            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 mb-2">
                              AI Summary is a PRO feature.
                            </p>
                            <button className="mt-2 px-4 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 inline-block">
                              Upgrade to PRO
                            </button>
                          </Link>
                        </div>
                        <div className="mt-3 text-xs text-gray-400 italic flex items-center">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          <span>Get AI powered insights from your expenses</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Items */}
            {expenseFileDetails.items && expenseFileDetails.items.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">
                  Items ({expenseFileDetails.items.length})
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseFileDetails.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice, expenseFileDetails.currency)}</TableCell>
                          <TableCell>{formatCurrency(item.totalPrice, expenseFileDetails.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right">
                          Total
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(
                            expenseFileDetails.items.reduce((sum, item) => sum + item.totalPrice, 0), 
                            expenseFileDetails.currency
                          )}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  className={`px-4 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700
                    ${isLoadingDownload ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                  onClick={handleDownload}
                  disabled={isLoadingDownload || !fileId}
                >
                  {isLoadingDownload ? "Preparing download..." : "Download Expense File"}
                </button>

                <button 
                  className={`px-4 py-2 text-sm rounded 
                    ${isDeleting ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" :
                    "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"}`}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Expense File"}
                </button>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  )

}

export default ReceiptPage;

function formatFileSize(bytes: number) : string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k,i)).toFixed(2)) + " " + sizes[i];
}

function formatCurrency(amount: number, currencyCode: string = "") : string {
  return `${amount.toFixed(2)} ${currencyCode ? currencyCode : ""}`;
}