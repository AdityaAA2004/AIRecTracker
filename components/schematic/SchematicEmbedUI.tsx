"use client";
import { EmbedProvider, SchematicEmbed as SchematicEmbedComponent} from "@schematichq/schematic-components";


function SchematicEmbedUI({
    accessToken,
    componentId
}:
{
    accessToken: string,
    componentId: string
}) {
  return (
    <EmbedProvider>
      <SchematicEmbedComponent accessToken={accessToken} id={componentId} />
    </EmbedProvider>
  )
}

export default SchematicEmbedUI;