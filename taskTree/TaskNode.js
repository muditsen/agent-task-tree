export class TaskNode {
    constructor(id, title) {
        this.id = id;
        this.title = title;
        this._explicitly_completed = false;
        this.children = [];
    }

    get completed() {
        if (this._explicitly_completed) return true;
        if (this.children.length > 0) {
            return this.children.every(child => child.completed);
        }
        return false;
    }

    set completed(value) {
        this._explicitly_completed = value;
    }

    addChild(node) {
        this.children.push(node);
    }

    pop() {
        if (this.completed) return null;

        for (const child of this.children) {
            const nextTask = child.pop();
            if (nextTask) return nextTask;
        }

        return this;
    }
}