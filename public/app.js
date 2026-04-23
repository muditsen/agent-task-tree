document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const executeBtn = document.getElementById('execute-btn');
    const logContainer = document.getElementById('log-container');
    const statusIndicator = document.getElementById('status-indicator');

    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackInput = document.getElementById('feedback-input');
    const continueBtn = document.getElementById('continue-btn');

    executeBtn.addEventListener('click', () => {
        const task = taskInput.value.trim();
        if (!task) return;

        // Reset UI
        logContainer.innerHTML = '';
        feedbackContainer.classList.add('hidden');
        feedbackInput.value = '';
        executeBtn.disabled = true;
        
        runAgentStream('/api/plan', { task });
    });

    continueBtn.addEventListener('click', () => {
        const message = feedbackInput.value.trim();
        
        feedbackContainer.classList.add('hidden');
        feedbackInput.value = '';
        
        runAgentStream('/api/continue', { message });
    });

    async function runAgentStream(endpoint, payload) {
        setStatus('running', 'Processing...');
        
        const downloadCodeBtn = document.getElementById('download-code-btn');
        if (downloadCodeBtn) {
            downloadCodeBtn.classList.add('hidden');
        }
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('API request failed: ' + response.statusText);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            let isFinalState = false;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                
                // Keep the last incomplete chunk in the buffer
                buffer = lines.pop(); 

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        try {
                            const event = JSON.parse(dataStr);
                            handleEvent(event);
                            if (event.type === 'final' || event.type === 'error') {
                                isFinalState = true;
                            }
                        } catch (e) {
                            console.error('Error parsing event data:', e, dataStr);
                        }
                    }
                }
            }
            
            if (endpoint === '/api/plan') {
                setStatus('idle', 'Awaiting Approval');
                feedbackContainer.classList.remove('hidden');
            } else {
                setStatus('done', 'Completed');
                executeBtn.disabled = false;
            }
            
            if (isFinalState) {
                fetchTaskTree();
            }
            
        } catch (error) {
            console.error('Execution error:', error);
            handleEvent({ type: 'error', data: { message: error.message } });
            setStatus('error', 'Failed');
            executeBtn.disabled = false;
        }
    }

    async function fetchTaskTree() {
        try {
            const res = await fetch('/api/tree');
            if (!res.ok) throw new Error('Failed to fetch tree');
            const rootNode = await res.json();
            
            const treePanel = document.getElementById('tree-panel');
            const treeContainer = document.getElementById('tree-container');
            const downloadBtn = document.getElementById('download-tree-btn');
            
            treePanel.classList.remove('hidden');
            if (downloadBtn) downloadBtn.classList.remove('hidden');
            
            if (!rootNode) {
                treeContainer.innerHTML = '<p style="color: var(--text-secondary);">No tree data available.</p>';
                return;
            }
            
            const ul = document.createElement('ul');
            ul.appendChild(buildTreeNode(rootNode));
            
            treeContainer.innerHTML = '';
            const treeDiv = document.createElement('div');
            treeDiv.className = 'tree';
            treeDiv.appendChild(ul);
            treeContainer.appendChild(treeDiv);
            
            // Scroll tree into view smoothly
            treePanel.scrollIntoView({ behavior: 'smooth', block: 'end' });
            
        } catch (e) {
            console.error('Error rendering tree:', e);
        }
    }

    function isNodeCompleted(node) {
        if (node._explicitly_completed) return true;
        if (node.children && node.children.length > 0) {
            return node.children.every(c => isNodeCompleted(c));
        }
        return false;
    }

    function buildTreeNode(node) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = 'javascript:void(0)';
        a.innerHTML = `<strong>${escapeHtml(node.title)}</strong><br><small>${escapeHtml(node.id)}</small>`;
        a.className = isNodeCompleted(node) ? 'completed' : 'pending';
        
        li.appendChild(a);
        
        if (node.children && node.children.length > 0) {
            const ul = document.createElement('ul');
            for (const child of node.children) {
                ul.appendChild(buildTreeNode(child));
            }
            li.appendChild(ul);
        }
        
        return li;
    }

    function setStatus(state, text) {
        statusIndicator.className = `status ${state}`;
        statusIndicator.textContent = text;
    }

    function handleEvent(event) {
        const { type, data } = event;
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;

        let title = '';
        let content = '';

        if (type === 'status') {
            title = 'Status Update';
            content = data.message;
        } else if (type === 'tool_call') {
            title = `Agent Request: ${data.name}`;
            content = JSON.stringify(data.args, null, 2);
        } else if (type === 'tool_result') {
            title = `Environment Response: ${data.name}`;
            content = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
            
            if (data.name === 'zip_project' && data.result && data.result.url) {
                const btn = document.getElementById('download-code-btn');
                if (btn) {
                    btn.href = data.result.url;
                    btn.classList.remove('hidden');
                }
            }
        } else if (type === 'final') {
            title = 'Final Output';
            content = data.content || "Agent reached a conclusion without outputting final message.";
            setStatus('done', 'Completed');
        } else if (type === 'error') {
            title = 'Error Occurred';
            content = data.message;
            setStatus('error', 'Error');
        }

        entry.innerHTML = `
            <strong>${escapeHtml(title)}</strong>
            <pre>${escapeHtml(content).trim()}</pre>
        `;

        logContainer.appendChild(entry);
        
        // Auto-scroll to botttom
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    const downloadTreeBtn = document.getElementById('download-tree-btn');
    if (downloadTreeBtn) {
        downloadTreeBtn.addEventListener('click', async () => {
            const originalText = downloadTreeBtn.innerText;
            downloadTreeBtn.innerText = 'Capturing...';
            downloadTreeBtn.disabled = true;
            
            try {
                const element = document.getElementById('tree-container');
                const canvas = await html2canvas(element, {
                    backgroundColor: '#f8fafc', // Matches var(--bg-color)
                    scale: 2 // High res export
                });
                
                const link = document.createElement('a');
                link.download = 'task-tree.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) {
                console.error("Error capturing image: ", err);
                alert("Failed to download image.");
            } finally {
                downloadTreeBtn.innerText = originalText;
                downloadTreeBtn.disabled = false;
            }
        });
    }
});
