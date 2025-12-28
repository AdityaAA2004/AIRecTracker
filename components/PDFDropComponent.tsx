"use client";
import React, { useCallback, useState, useRef } from 'react';
import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor
} from "@dnd-kit/core"
import { useUser } from '@clerk/clerk-react';
import { useRouter } from 'next/navigation';
import { useSchematicEntitlement } from '@schematichq/schematic-react';
import { uploadPDF } from '@/actions/uploadPDF';
import { AlertCircle } from 'lucide-react';
function PDFDropComponent() {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));
  const { user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<string>>([]);
  const {
    value: isFeatureEnabled,
    featureUsageExceeded,
    featureUsage,
    featureAllocation
  } = useSchematicEntitlement("scan");
  console.log("Feature enabled:", isFeatureEnabled)
  console.log("Feature allocation:", featureAllocation)
  console.log("Feature usage exceeded:", featureUsageExceeded)
  const handleDragOver = useCallback((e: React.DragEvent)=> {
    e.preventDefault()
    setIsDraggingOver(true)
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    console.log(files);
    if (!user) {
        alert("Please sign in to upload files!!!");
        return;
    }
    const fileArray = Array.from(files);
    const pdfFiles = fileArray.filter((file)=>
    file.type === 'application/pdf' && file.name.toLowerCase().endsWith(".pdf"))
    if (pdfFiles.length === 0) {
        alert("Please only upload PDF files.")
        return;
    }

    setIsUploading(true);

    try {
        const newUploadedFiles: string[] = []
        for (const pdf of pdfFiles) {
            const formData = new FormData();
            formData.append("file", pdf);

            const result = await uploadPDF(formData);

            if(!result.success) {
                throw new Error(result.error || "Upload failed");
            }

            newUploadedFiles.push(pdf.name)
        }
        setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
        setTimeout(()=> {
            setUploadedFiles([]);
        }, 5000)
    } catch (error) {
        console.error("Error in upload:", error)
        alert(
            `Upload failed ${error instanceof Error ? error.message : "Unknown Error"}`
        )
    } finally {
        setIsUploading(false);
    }

  }, [user, router])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    console.log("Dropped");
    if (!user) {
        alert("Please sign in to upload files!!!");
        return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleUpload(e.dataTransfer.files)
    }
  }, [user, handleUpload])
  const isUserSignedIn = !!user;
  
  const canUpload = isUserSignedIn && isFeatureEnabled; 
  return (
    <DndContext sensors={sensors}>
        <div className="w-full max-w-md mx-auto">
            <div
                onDragOver={canUpload ? handleDragOver : undefined}
                onDragLeave={canUpload ? handleDragLeave : undefined}
                onDrop={canUpload ? handleDrop : undefined}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors 
                    ${isDraggingOver ? "border-blue-500 bg-blue-50" : "border-gray-300"}
                    ${canUpload ? "opacity-70 cursor-not-allowed" : ""}`}
            >
            </div>
            <div className="mt-4">
              {featureUsageExceeded && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-8"></AlertCircle>
                  <span>
                    You have exceeded your limit of {featureAllocation} scans. Pls upgrade to continue 
                  </span>
                </div>
              )}
            </div>
        </div>
    </DndContext>
  )
}

export default PDFDropComponent