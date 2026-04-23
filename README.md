# AI App & Website Builder (TaskTree Agent)

An autonomous AI project manager and developer designed to completely prevent LLM drift and hallucination during complex tasks. 

By forcing the AI to strictly construct a deterministic **Task Tree** using dedicated tools before any code is generated, humans get to visually review, modify, and approve the exact architectural blueprint. Once approved, the LLM systematically executes each leaf node recursively and finally bundles the generated code into a compressed `.zip` archive natively!

## Prerequisites
- **Node.js** (v18 or higher recommended)
- **OpenAI API Key**

## Setup Instructions

1. **Clone the Repository**
   Clone the repository from GitHub and navigate into the root directory:
   ```bash
   git clone https://github.com/muditsen/agent-task-tree.git
   cd agent-task-tree
   ```

2. **Install Dependencies**
   Install the required Node packages (`express`, `openai`, `dotenv`):
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your OpenAI API key:
   ```env
   OPENAI_API_KEY="sk-your-openai-api-key-here"
   ```

## Running the Application

1. **Start the Express Server**
   Run the following command to boot up the backend API and frontend assets:
   ```bash
   npm start
   ```

2. **Access the Web UI**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## How to Use the UI

1. **Phase 1 (Planning):** Describe the application or software you want to build in the text area and click **Build Application**. The AI will construct a modular hierarchy of tasks without executing them.
2. **Human-in-the-Loop (Review):** A horizontal, responsive Task Tree graph will be generated directly on your screen. You can review the roadmap. (Optionally click the purple **Download as Image** button to export the blueprint).
3. **Phase 2 (Execution):** If the plan looks good, click **Approve & Continue**. The AI will systematically iterate through the tree, write the files securely to a local `generated_projects` directory, and compress them.
4. **Download Result:** Once execution finishes, click the dynamically spawned green **Download Code** button next to your execution log status to grab your `.zip` payload!
