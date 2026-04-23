import { TaskNode } from "./TaskNode.js";

export class TaskTree {
    constructor() {
        this.root = null;
        this.nodes = {};
    }

    createTaskTree(id, title) {
        this.root = new TaskNode(id, title);
        this.nodes = { [id]: this.root };
        return `Success: Task tree created with root '${title}' (ID: ${id})`;
    }

    addTask(parentId, id, title) {
        if (!this.root) return "Error: You must call 'create_task_tree' first.";
        
        const parent = this.nodes[parentId];
        if (!parent) return `Error: Parent task with ID '${parentId}' not found.`;

        const node = new TaskNode(id, title);
        parent.addChild(node);
        this.nodes[id] = node;

        return `Success: Added subtask '${title}' (ID: ${id}) under parent '${parentId}'`;
    }

    popTask() {
        if (!this.root) return "Error: No active task tree.";
        
        const nextTask = this.root.pop();
        if (!nextTask) return "Status: All tasks in the tree are completed.";
        
        return `Action Required -> Name: '${nextTask.title}', Task ID: '${nextTask.id}'`;
    }

    completeTask(id) {
        const target = this.nodes[id];
        if (!target) return `Error: Task with ID '${id}' not found.`;
        
        target.completed = true;
        return `Success: Task '${target.title}' marked as completed.`;
    }

    printTree(node = this.root, indent = 0) {
        if (!node) return "Tree is empty.";
        
        let result =
            `${" ".repeat(indent)}- ${node.title} [${node.completed ? "✓" : " "}] \n`;

        for (const child of node.children) {
            result += this.printTree(child, indent + 2);
        }
        return result;
    }
}