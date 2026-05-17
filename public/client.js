// Configuration
let CONFIG = {

    MODEL: 'openai/gpt-oss-120b:free',

};

// DOM Elements
const chatMessages =
    document.getElementById('chatMessages');

const messageInput =
    document.getElementById('messageInput');

const chatForm =
    document.getElementById('chatForm');

const sendBtn =
    document.getElementById('sendBtn');

const clearBtn =
    document.getElementById('clearBtn');

const statusText =
    document.getElementById('statusText');

const statusDot =
    document.querySelector('.status-dot');

let isLoading = false;

// INIT
document.addEventListener('DOMContentLoaded', () => {

    checkServerStatus();

    setInterval(checkServerStatus, 5000);

    chatForm.addEventListener(
        'submit',
        handleSendMessage
    );

    clearBtn.addEventListener(
        'click',
        handleClearHistory
    );

});

// SEND MESSAGE
async function handleSendMessage(e) {

    e.preventDefault();

    const message =
        messageInput.value.trim();

    if (!message || isLoading) return;

    isLoading = true;

    sendBtn.disabled = true;

    displayMessage('user', message);

    messageInput.value = '';

    const typing =
        createTypingIndicator();

    try {

        const response = await fetch(
            '/api/chat',
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json',
                },

                body: JSON.stringify({

                    message,

                    model: CONFIG.MODEL,

                }),

            }
        );

        const data =
            await response.json();

        typing.remove();

        if (data.success) {

            displayMessage(
                'ai',
                data.aiResponse
            );

        } else {

            displayMessage(
                'ai',
                `❌ ${data.error}`
            );

        }

    } catch (error) {

        typing.remove();

        displayMessage(
            'ai',
            '❌ Connection error.'
        );

    } finally {

        isLoading = false;

        sendBtn.disabled = false;

    }

}

// DISPLAY MESSAGE
function displayMessage(role, content) {

    const messageDiv =
        document.createElement('div');

    messageDiv.className =
        `message ${role}-message`;

    const contentDiv =
        document.createElement('div');

    contentDiv.className =
        'message-content';

    contentDiv.textContent =
        content;

    messageDiv.appendChild(contentDiv);

    chatMessages.appendChild(messageDiv);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}

// TYPING
function createTypingIndicator() {

    const typing =
        document.createElement('div');

    typing.className =
        'message ai-message typing';

    typing.innerHTML = `
        <div class="message-content">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    chatMessages.appendChild(typing);

    return typing;

}

// CLEAR
async function handleClearHistory() {

    await fetch('/api/clear', {
        method: 'POST',
    });

    chatMessages.innerHTML = `
        <div class="message ai-message">
            <div class="message-content">
                👋 Conversation cleared!
            </div>
        </div>
    `;

}

// SERVER STATUS
async function checkServerStatus() {

    try {

        const response =
            await fetch('/api/health');

        const data =
            await response.json();

        statusDot.classList.add(
            'connected'
        );

        statusText.textContent =
            `Connected • ${data.model}`;

    } catch {

        statusDot.classList.remove(
            'connected'
        );

        statusText.textContent =
            'Disconnected';

    }

}

console.log('Vortex AI Loaded');