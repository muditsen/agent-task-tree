import express from "express";
import { openai } from "./openaiClient.js";
import { tools, executeTool, tree } from "./tools/taskTools.js";

const app = express();
app.use(express.static("public"));
app.use(express.json());

app.get("/api/tree", (req, res) => {
    res.json(tree.root);
});

let sessionMessages = [];

app.post("/api/plan", async (req, res) => {
    const { task } = req.body;

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (type, data) => {
        res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    const sysPrompt = `You are an autonomous AI Website and Program Builder. You MUST follow this workflow for PLANNING:
1. When given a build goal, use \`create_task_tree\` to set a root project.
2. Break the project down into development subtasks using \`add_task\`. Outline frontend, backend, and components needed.
3. If a subtaks can divided into more subtasks, then divide it and add them as subtasks of that task.
4. Break substask into smaller subtask till the granular level like classes or methods or components. 
5. Do not ask any clarifying questions or add any task of clarifying question.
6. Finally, use \`print_tree\` to display the build plan to the user.
7. IMPORTANT: Stop talking immediately after using \`print_tree\` and ask the user for approval. Do NOT proceed to execute tasks. Do NOT use \`pop_task\` yet.`;

    sessionMessages = [
        {
            role: "system",
            content: sysPrompt
        },
        {
            role: "user",
            content: task || "Create a simple website layout and execute the build plan."
        }
    ];

    await runAgentLoop(sessionMessages, sendEvent);
    res.end();
});

app.post("/api/continue", async (req, res) => {
    const { message } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (type, data) => {
        res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    if (sessionMessages.length === 0) {
        sendEvent('error', { message: 'No active session found. Please start a new plan.' });
        res.end();
        return;
    }

    sessionMessages.push({
        role: "system",
        content: `You may now proceed to EXECUTE the build plan:
1. Stop talking and use \`pop_task\` to grab the next uncompleted leaf task.
2. Execute the work required (generate code, configurations, etc.) for that specific task.
3. Use \`create_directory\` and write file tools to create and save files.
4. Use \`complete_task\` to mark it done.
5. Repeat from Step 1 until all tasks are complete.
6. Share a Zip of all the files with tool \`zip_project\` generated with if needed init.sh for any init project setup and run.sh for running the project.
`
    });

    sessionMessages.push({
        role: "user",
        content: message || "Approved. Please proceed with execution."
    });

    await runAgentLoop(sessionMessages, sendEvent);
    res.end();
});

async function runAgentLoop(messages, sendEvent) {
    try {
        while (true) {
            sendEvent('status', { message: 'Thinking...' });

            const response = await openai.chat.completions.create({
                model: "gpt-5.2",
                messages,
                tools,
                tool_choice: "auto"
            });

            const msg = response.choices[0].message;
            messages.push(msg);

            if (!msg.tool_calls) {
                // If it asks for approval or finishes, it outputs text here
                sendEvent('final', { content: msg.content });
                break;
            }

            for (const call of msg.tool_calls) {
                const name = call.function.name;
                const args = JSON.parse(call.function.arguments);

                sendEvent('tool_call', { name, args });

                const result = executeTool(name, args);

                sendEvent('tool_result', { name, result });

                const resultString = typeof result === 'string' ? result : JSON.stringify(result);
                
                messages.push({
                    role: "tool",
                    tool_call_id: call.id,
                    content: resultString
                });
            }
        }
    } catch (error) {
        sendEvent('error', { message: error.message });
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Agent server listening on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser.`);
});