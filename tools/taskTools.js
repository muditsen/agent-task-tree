import { TaskTree } from "../taskTree/TaskTree.js";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const GENERATED_DIR = path.resolve("./generated_projects");
if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

export const tree = new TaskTree();

export const tools = [
    {
        type: "function",
        function: {
            name: "create_task_tree",
            description: "Initializes a new task tree with a root task. This acts as the project goal.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    id: { type: "string" }
                },
                required: ["title", "id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_task",
            description: "Adds a new subtask under an existing parent task in the task tree.",
            parameters: {
                type: "object",
                properties: {
                    parentId: { type: "string" },
                    id: { type: "string" },
                    title: { type: "string" }
                },
                required: ["parentId", "id", "title"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "pop_task",
            description: "Retrieves the next uncompleted leaf task in the tree. Returns a message if all tasks are complete.",
            parameters: { type: "object", properties: {} }
        }
    },
    {
        type: "function",
        function: {
            name: "complete_task",
            description: "Marks a specific task as completed.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" }
                },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "print_tree",
            description: "Print task tree",
            parameters: { type: "object", properties: {} }
        }
    },
    {
        type: "function",
        function: {
            name: "create_directory",
            description: "Creates a new directory inside the generated_projects folder.",
            parameters: {
                type: "object",
                properties: {
                    dirPath: { type: "string" }
                },
                required: ["dirPath"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "write_file",
            description: "Creates, names, writes, and saves a file inside the generated_projects folder.",
            parameters: {
                type: "object",
                properties: {
                    filePath: { type: "string" },
                    content: { type: "string" }
                },
                required: ["filePath", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "zip_project",
            description: "Compresses the generated project folder into one zip archive.",
            parameters: {
                type: "object",
                properties: {
                    zipName: { type: "string", description: "Name of the zip file, e.g., project.zip" }
                },
                required: ["zipName"]
            }
        }
    }
];

export async function executeTool(name, args) {
    switch (name) {
        case "create_task_tree":
            return tree.createTaskTree(args.id, args.title);

        case "add_task":
            return tree.addTask(args.parentId, args.id, args.title);

        case "pop_task":
            return tree.popTask();

        case "complete_task":
            return tree.completeTask(args.id);

        case "print_tree":
            return tree.printTree();

        case "create_directory": {
            const targetDir = path.join(GENERATED_DIR, args.dirPath);
            fs.mkdirSync(targetDir, { recursive: true });
            return `Directory created at ${args.dirPath}`;
        }

        case "write_file": {
            const targetFile = path.join(GENERATED_DIR, args.filePath);
            const parentDir = path.dirname(targetFile);
            fs.mkdirSync(parentDir, { recursive: true });
            fs.writeFileSync(targetFile, args.content);
            return `File successfully saved at ${args.filePath}`;
        }

        case "zip_project": {
            const downloadsDir = path.resolve("./public/downloads");
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir, { recursive: true });
            }
            const zipPath = path.join(downloadsDir, args.zipName);
            execSync(`zip -r ${zipPath} ./*`, { cwd: GENERATED_DIR });
            return { message: `Project successfully zipped.`, url: `/downloads/${args.zipName}` };
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}