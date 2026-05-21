// ================= AUTH =================

let currentUser =
    localStorage.getItem(
        'vortexUser'
    );

if (!currentUser) {

    window.location.href =
        '/auth.html';

}

// ================= CONFIG =================

let CONFIG = {

    MODEL:
        'openai/gpt-oss-120b:free',

};

// ================= DOM =================

const chatMessages =
    document.getElementById(
        'chatMessages'
    );

const messageInput =
    document.getElementById(
        'messageInput'
    );

const chatForm =
    document.getElementById(
        'chatForm'
    );

const sendBtn =
    document.getElementById(
        'sendBtn'
    );

const clearBtn =
    document.getElementById(
        'clearBtn'
    );

const statusText =
    document.getElementById(
        'statusText'
    );

const statusDot =
    document.querySelector(
        '.status-dot'
    );

const historyContainer =
    document.getElementById(
        'historyContainer'
    );

// ================= INIT =================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        checkServerStatus();

        loadHistory();

        setInterval(
            checkServerStatus,
            5000
        );

        chatForm.addEventListener(
            'submit',
            handleSendMessage
        );

        clearBtn.addEventListener(
            'click',
            clearChat
        );

        setupTabs();

        setupLogout();

    }
);

// ================= TABS =================

function setupTabs() {

    const navBtns =
        document.querySelectorAll(
            '.nav-btn'
        );

    const sections =
        document.querySelectorAll(
            '.section'
        );

    navBtns.forEach(btn => {

        btn.addEventListener(
            'click',
            () => {

                const sectionId =
                    btn.dataset.section;

                navBtns.forEach(
                    b =>
                        b.classList.remove(
                            'active'
                        )
                );

                btn.classList.add(
                    'active'
                );

                sections.forEach(
                    sec =>
                        sec.classList.remove(
                            'active'
                        )
                );

                const activeSection =
                    document.getElementById(
                        sectionId
                    );

                if (activeSection) {

                    activeSection.classList.add(
                        'active'
                    );

                }

            }
        );

    });

}

// ================= LOGOUT =================

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            'logoutBtn'
        );

    if (!logoutBtn) return;

    logoutBtn.addEventListener(
        'click',
        signOut
    );

}

function signOut() {

    localStorage.removeItem(
        'vortexUser'
    );

    window.location.href =
        '/auth.html';

}

// ================= SEND MESSAGE =================

async function handleSendMessage(
    e
) {

    e.preventDefault();

    const message =
        messageInput.value.trim();

    if (!message) return;

    displayMessage(
        'user',
        message
    );

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

                    username:
                        currentUser,

                    message,

                    model:
                        CONFIG.MODEL,

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

            loadHistory();

        } else {

            displayMessage(
                'ai',
                `❌ ${data.error}`
            );

        }

    } catch (err) {

        typing.remove();

        displayMessage(
            'ai',
            '❌ Connection failed'
        );

    }

}

// ================= DISPLAY =================

function displayMessage(
    role,
    content
) {

    const messageDiv =
        document.createElement(
            'div'
        );

    messageDiv.className =
        `message ${role}-message`;

    const contentDiv =
        document.createElement(
            'div'
        );

    contentDiv.className =
        'message-content';

    contentDiv.textContent =
        content;

    messageDiv.appendChild(
        contentDiv
    );

    chatMessages.appendChild(
        messageDiv
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}

// ================= TYPING =================

function createTypingIndicator() {

    const typing =
        document.createElement(
            'div'
        );

    typing.className =
        'message ai-message';

    typing.innerHTML = `

        <div class="message-content">

            🤖 Thinking...

        </div>

    `;

    chatMessages.appendChild(
        typing
    );

    return typing;

}

// ================= HISTORY =================

async function loadHistory() {

    try {

        const response =
            await fetch(
                '/api/history',
                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                    },

                    body: JSON.stringify({

                        username:
                            currentUser,

                    }),

                }
            );

        const data =
            await response.json();

        if (!data.success)
            return;

        historyContainer.innerHTML =
            '';

        chatMessages.innerHTML =
            '';

        data.messages.forEach(
            msg => {

                displayMessage(

                    msg.role ===
                        'assistant'
                        ? 'ai'
                        : 'user',

                    msg.content

                );

            }
        );

    } catch (err) {

        console.log(err);

    }

}

// ================= CLEAR =================

async function clearChat() {

    await fetch('/api/clear', {

        method: 'POST',

        headers: {

            'Content-Type':
                'application/json',

        },

        body: JSON.stringify({

            username:
                currentUser,

        }),

    });

    chatMessages.innerHTML =
        '';

}

// ================= SERVER STATUS =================

async function checkServerStatus() {

    try {

        const response =
            await fetch(
                '/api/health'
            );

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

// ================= NEW CHAT =================

function newChat() {

    chatMessages.innerHTML = '';

}

console.log(
    '🚀 Vortex AI Loaded'
);