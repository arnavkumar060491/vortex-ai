// Configuration
let CONFIG = {
    SERVER_URL: 'http://127.0.0.1:3000',
    MODEL: 'openai/gpt-oss-20b:free',
};

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const chatForm = document.getElementById('chatForm');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const statusText = document.getElementById('statusText');
const statusDot = document.querySelector('.status-dot');
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');
const historyContainer = document.getElementById('historyContainer');

let isLoading = false;
let conversationHistory = [];

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    checkServerStatus();
    setupEventListeners();
    setInterval(checkServerStatus, 5000); // Check every 5 seconds
});

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    chatForm.addEventListener('submit', handleSendMessage);
    clearBtn.addEventListener('click', handleClearHistory);
    
    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    // Settings
    document.getElementById('temperature').addEventListener('input', (e) => {
        document.getElementById('tempValue').textContent = e.target.value;
    });

    document.getElementById('saveSettings').addEventListener('click', saveSettings);
}

// ============ CHAT FUNCTIONALITY ============
async function handleSendMessage(e) {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message || isLoading) return;

    isLoading = true;
    sendBtn.disabled = true;

    // Display user message
    displayMessage('user', message);
    messageInput.value = '';

    try {
        const response = await fetch(`${CONFIG.SERVER_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
    message,
    model: CONFIG.MODEL,
}),
        });

        const data = await response.json();

        if (data.success) {
            displayMessage('ai', data.aiResponse);
            conversationHistory.push({ user: message, ai: data.aiResponse });
            updateHistoryDisplay();
        } else {
            displayMessage('ai', `❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Chat Error:', error);
        displayMessage('ai', `❌ Connection Error: ${error.message}\n\nMake sure the AI Engine server is running and Ollama is active.`);
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

function displayMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleClearHistory() {
    if (!confirm('Are you sure you want to clear the conversation history?')) return;

    try {
        await fetch(`${CONFIG.SERVER_URL}/api/clear`, {
            method: 'POST',
        });

        chatMessages.innerHTML = `
            <div class="message ai-message">
                <div class="message-content">
                    👋 Conversation cleared! How can I help you now?
                </div>
            </div>
        `;
        conversationHistory = [];
        updateHistoryDisplay();
    } catch (error) {
        console.error('Clear Error:', error);
        alert('Failed to clear history');
    }
}

// ============ SERVER STATUS ============
async function checkServerStatus() {
    try {
        const response = await fetch(`${CONFIG.SERVER_URL}/api/health`);
        const data = await response.json();

        statusDot.classList.add('connected');
        statusText.textContent = `Connected • ${data.model}`;
    } catch (error) {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

// ============ HISTORY MANAGEMENT ============
async function loadServerHistory() {
    try {
        const response = await fetch(`${CONFIG.SERVER_URL}/api/history`);
        const data = await response.json();
        return data.history || [];
    } catch (error) {
        console.error('Failed to load history:', error);
        return [];
    }
}

function updateHistoryDisplay() {
    if (conversationHistory.length === 0) {
        historyContainer.innerHTML = '<p class="empty-state">No history yet. Start chatting!</p>';
        return;
    }

    historyContainer.innerHTML = conversationHistory
        .map((item, index) => `
            <div class="history-item">
                <div class="history-item-label">Message ${index + 1}</div>
                <div class="history-item-text"><strong>You:</strong> ${escapeHtml(item.user)}</div>
                <div class="history-item-text" style="margin-top: 8px;"><strong>AI:</strong> ${escapeHtml(item.ai)}</div>
            </div>
        `)
        .join('');
}

// ============ SETTINGS ============
function loadSettings() {
    const savedConfig = localStorage.getItem('aiEngineConfig');
    if (savedConfig) {
        CONFIG = JSON.parse(savedConfig);
    }

    document.getElementById('serverUrl').value = CONFIG.SERVER_URL;
    document.getElementById('modelSelect').value = CONFIG.MODEL;
}

function saveSettings() {
    CONFIG.SERVER_URL = document.getElementById('serverUrl').value || 'http://localhost:3000';
    CONFIG.MODEL = document.getElementById('modelSelect').value;

    localStorage.setItem('aiEngineConfig', JSON.stringify(CONFIG));
    alert('✅ Settings saved successfully!');
    checkServerStatus();
}

// ============ NAVIGATION ============
function switchSection(sectionId) {
    // Update nav buttons
    navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    // Update sections
    sections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });

    // Load history when switching to history section
    if (sectionId === 'history') {
        updateHistoryDisplay();
    }
}

// ============ UTILITIES ============
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl+L to clear
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        handleClearHistory();
    }

    // Escape to unfocus input
    if (e.key === 'Escape') {
        messageInput.blur();
    }
});

console.log('🤖 AI Engine Client Loaded');
console.log('Server URL:', CONFIG.SERVER_URL);
