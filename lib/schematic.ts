import { SchematicClient } from "@schematichq/schematic-typescript-node";

if (!process.env.SCHEMATIC_API_KEY) {
    throw new Error("No Schematic API key found in environment variables");
}

export const client = new SchematicClient({
    apiKey: process.env.SCHEMATIC_API_KEY,
    cacheProviders: {
        flagChecks: [] // disable caching
    }
});