import { getSchematicTemporaryAccessToken } from "@/actions/getSchematicTemporaryAccessToken";
import SchematicEmbedUI from "@/components/schematic/SchematicEmbedUI";

// This is a server function
async function SchematicComponent({componentId} : {componentId: string}) {
    if (!componentId) {
        return null;
    }
    
    const accessToken = await getSchematicTemporaryAccessToken();
    if (!accessToken) {
        throw new Error("No access token from schematic for the user");
    }
    return (
        <SchematicEmbedUI accessToken={accessToken} componentId={componentId} />
    )
}

export default SchematicComponent