import { createTool, openai, createAgent } from "@inngest/agent-kit";
import { z } from "zod";
const parsePDFTool = createTool({
    name: "parse-pdf",
    description: "Analyzes the given PDF",
    parameters: z.object({
        pdfUrl: z.string()
    }),
    handler: async ({pdfUrl}, {step}) => {
        try {
            // Use an AI model to parse the PDF and extract structured data
            return await step?.ai.infer("parse-pdf", {
                model: step.ai.models.anthropic({
                    model: "claude-3-7-sonnet-20250219",
                    defaultParameters: {
                        max_tokens: 3094
                    }
                }),
                body: {
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "document",
                                    source: {
                                        type: "url",
                                        url: pdfUrl
                                    }
                                },
                                {
                                    type: "text",
                                    text: `Extract the data from the receipt and return a structured output as follows:
                                    {
                                        "merchant" : {
                                            "name": "Store Name",
                                            "address": "123 Main St, City, State, ZIP",
                                            "contact": "Store Contact Info"
                                        },
                                        "transaction": {
                                            "date": "YYYY-MM-DD",
                                            "receipt_number" : "ABC123456",
                                            "payment_method": "Credit Card"
                                        },
                                        "items": [
                                            {
                                                "name": "Item 1",
                                                "quantity": 2,
                                                "unit_price": 5.99,
                                                "total_price": 11.98
                                            },
                                            ...
                                        ],
                                        "totals": {
                                            "subtotal": 50.00,
                                            "tax": 4.50,
                                            "total_paid": 54.50,
                                            "currency": "USD"
                                        }
                                    }`
                                }
                            ]
                        },
                        
                    ]
                }
            })
        } catch (error) {
            console.error("Error parsing PDF:", error);
            throw error;
        }
    }
})
export const expenseFileScanningAgent = createAgent({
    name: "Expense File Scanning Agent",
    description: "Processs expense files images and PDFs to extract key information like vendor names, dates, amounts, and line items.",
    system:
    `You are an AI powered receipt scanning assistant. Your primary role is to accurately extract and structure relevant information from scanned receipts.
    Your task includes recognizing and parsing details such as:
    - Merchant Information: Store name, address, and contact details.
    - Transaction Details: Date, time, receipt number, and payment method.
    - Itemized Purchases: Product names, quantities, individual prices, and discounts applied
    - Total Amounts: Subtotal, taxes, total paid, and any applied discounts.
    - Ensure high accuracy by detecting OCR errors and correcting misread text when possible.
    - Normalize dates, currency values, and formatting for consistency.
    - If any key details are missing or unclear, return a structured response indicating incomplete data.
    - Handle multiple formats, languages, and varying receipt layouts effectively.
    - Maintain a structured JSON output for easy integration with databases or expense tracking systems.`,
    model: openai({
        model: "gpt-4o-mini",
        defaultParameters: {
            max_completion_tokens: 3094 
        }
    }), 
    tools: [parsePDFTool]
})