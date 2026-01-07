import {
    anthropic,
    createNetwork,
    getDefaultRoutingAgent
} from "@inngest/agent-kit"
import { createServer } from "@inngest/agent-kit/server";
import { inngest } from "./client";
import Events from "./constants";
import { databaseAgent } from "./agents/databaseAgent";
import { expenseFileScanningAgent } from "./agents/expenseFileScanningAgent";
const agentNetwork = createNetwork({
    name: "Expense file Team",
    agents: [databaseAgent, expenseFileScanningAgent],
    defaultModel: anthropic({
        model: "claude-3-7-sonnet-20250219",
        defaultParameters: {
            max_tokens: 1000
        }
    }),
    defaultRouter: ({network}) => {
        const stateSavedToDB = network.state.kv.get('saved-to-db')
        if (stateSavedToDB !== undefined) {
            // terminate agent process as we have completed this workflow when updating the state
            return undefined;
        }
        return getDefaultRoutingAgent(); // we can build our own router as well with custom LLM. This router is an LLM that reads the request and routes it to the appropriate agent.
    }
});

export const server = createServer({
    agents: [databaseAgent, expenseFileScanningAgent],
    networks: [agentNetwork]
})

export const extractAndSavePDF = inngest.createFunction(
    {id: "Extract PDF and save in DB"},
    {event: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DB},
    async ({event}) => {
        const result = await agentNetwork.run(
            `Extract the key data from this PDF: ${event.data.url}. Once the data is extracted, save it to the database using the receiptId: ${event.data.expenseFileId}.
            Once the expense file is successfully saved to the database, you can terminate the agent process.`
        )
        
        return result.state.kv.get("receipt")
    }
)