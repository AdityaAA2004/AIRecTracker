'use server';
import { currentUser } from "@clerk/nextjs/server";
// Initialize Schematic SDK
import { SchematicClient } from "@schematichq/schematic-typescript-node";
const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({ apiKey });

export async function getSchematicTemporaryAccessToken() {
    const user = await currentUser();
    console.log("Check the current user info")
    if (!user) {
        throw new Error("User not authenticated");
    }
    else {
      console.log("Move to create the new token")
      const resp = await client.accesstokens.issueTemporaryAccessToken({
        resource_type: "company",
        lookup: { id : user.id }, // The lookup will vary depending on how you have configured your company keys
      });

      return resp.data?.token;
    }
}

// export async function getSchematicTemporaryAccessToken(companyId: string) {
//   const resp = await client.accesstokens.issueTemporaryAccessToken({
//     resource_type: "company",
//     lookup: { companyId }, // The lookup will vary depending on how you have configured your company keys
//   });

//   return resp.data?.token;
// }
