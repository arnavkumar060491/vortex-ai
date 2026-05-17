
// ================= CONFIG =================

let CONFIG = {

    MODEL: 'openai/gpt-oss-120b:free',

};

// ================= USER =================

let currentUser = null;

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

// ================= INIT =================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        autoLogin();

        checkServerStatus();

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
        createLogoutButton();

    }
);

// ================= AUTO LOGIN =================

function autoLogin() {

    const savedUser =
        localStorage.getItem(
            'vortexUser'
        );

    if (savedUser) {

        currentUser =
            JSON.parse(savedUser);

        addSystemMessage(
            `👋 Welcome back ${currentUser.username}`
        );

        loadHistory();

    } else {

        showAuthMenu();

    }

}

// ================= AUTH MENU =================

function showAuthMenu() {

    const choice = prompt(
        'Type: login OR signup'
    );

    if (!choice) return;

    if (
        choice.toLowerCase() ===
        'signup'
    ) {

        signup();

    } else {

        login();

    }

}

// ================= SIGNUP =================

async function signup() {

    const username = prompt(
        'Choose username'
    );

    const password = prompt(
        'Choose password'
    );

    const response = await fetch(
        '/api/signup',
        {

            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json',
            },

            body: JSON.stringify({
                username,
                password,
            }),

        }
    );

    const data =
        await response.json();

    if (data.success) {

        alert('✅ Account created');

        login();

    } else {

        alert(data.error);

    }

}

// ================= LOGIN =================

async function login() {

    const username = prompt(
        'Username'
    );

    const password = prompt(
        'Password'
    );

    const response = await fetch(
        '/api/login',
        {

            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json',
            },

            body: JSON.stringify({
                username,
                password,
            }),

        }
    );

    const data =
        await response.json();

    if (data.success) {

        currentUser = data.user;

        localStorage.setItem(
            'vortexUser',
            JSON.stringify(currentUser)
        );

        addSystemMessage(
            `✅ Logged in as ${currentUser.username}`
        );

        loadHistory();

    } else {

        alert(data.error);

    }

}

// ================= SEND MESSAGE =================

async function handleSendMessage(e) {

    e.preventDefault();

    if (!currentUser) {

        alert('Login first');

        return;

    }

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

                    message,

                    username:
                        currentUser.username,

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

// ================= LOAD HISTORY =================

async function loadHistory() {

    const response = await fetch(
        '/api/history',
        {

            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json',
            },

            body: JSON.stringify({
                username:
                    currentUser.username,
            }),

        }
    );

    const data =
        await response.json();

    if (!data.success) return;

    chatMessages.innerHTML = '';

    data.messages.forEach(msg => {

        displayMessage(
            msg.role === 'assistant'
                ? 'ai'
                : 'user',
            msg.content
        );

    });

}

// ================= CLEAR CHAT =================

async function clearChat() {

    await fetch('/api/clear', {

        method: 'POST',

        headers: {
            'Content-Type':
                'application/json',
        },

        body: JSON.stringify({
            username:
                currentUser.username,
        }),

    });

    chatMessages.innerHTML = '';

    addSystemMessage(
        '🧹 Chat cleared'
    );

}

// ================= STATUS =================

async function checkServerStatus() {

    try {

        const response = await fetch(
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

// ================= MESSAGE UI =================

function displayMessage(
    role,
    content
) {

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

    messageDiv.appendChild(
        contentDiv
    );

    chatMessages.appendChild(
        messageDiv
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}

// ================= SYSTEM MESSAGE =================

function addSystemMessage(text) {

    const div =
        document.createElement('div');

    div.className =
        'message ai-message';

    div.innerHTML = `
        <div class="message-content">
            ${text}
        </div>
    `;

    chatMessages.appendChild(div);

}

// ================= TYPING =================

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

    chatMessages.appendChild(
        typing
    );

    return typing;

}

console.log('🚀 Vortex AI Loaded');

// ================= TABS =================

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

            // buttons
            navBtns.forEach(b =>
                b.classList.remove(
                    'active'
                )
            );

            btn.classList.add(
                'active'
            );

            // sections
            sections.forEach(sec => {

                sec.classList.remove(
                    'active'
                );

            });

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
// ================= LOGOUT =================

function createLogoutButton() {

    const sidebar =
        document.querySelector(
            '.sidebar'
        );

    const logoutBtn =
        document.createElement(
            'button'
        );

    logoutBtn.className =
        'nav-btn';

    logoutBtn.innerHTML =
        '🚪 Logout';

    logoutBtn.style.marginTop =
        '10px';

    logoutBtn.addEventListener(
        'click',
        logout
    );

    sidebar.appendChild(
        logoutBtn
    );

}

function logout() {

    localStorage.removeItem(
        'vortexUser'
    );

    location.reload();

}