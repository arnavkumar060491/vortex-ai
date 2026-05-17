const express = require('express');
const cors = require('cors');
require('dotenv').config();

const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();

// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json());

app.use(express.static('public'));

// ================= USERS FILE =================

const USERS_FILE = './users.json';

// ================= LOAD USERS =================

async function loadUsers() {

    try {

        return await fs.readJson(
            USERS_FILE
        );

    } catch {

        return [];

    }

}

// ================= SAVE USERS =================

async function saveUsers(users) {

    await fs.writeJson(
        USERS_FILE,
        users,
        { spaces: 2 }
    );

}

// ================= HEALTH =================

app.get('/api/health', (req, res) => {

    res.json({

        status: 'running',

        model:
            'openai/gpt-oss-120b:free',

    });

});

// ================= SIGNUP =================

app.post('/api/signup', async (req, res) => {

    try {

        const {
            username,
            password,
        } = req.body;

        const users =
            await loadUsers();

        const exists =
            users.find(
                u =>
                    u.username ===
                    username
            );

        if (exists) {

            return res.json({

                success: false,

                error:
                    'Username already exists',

            });

        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        const newUser = {

            id: uuidv4(),

            username,

            password:
                hashedPassword,

            messages: [],

        };

        users.push(newUser);

        await saveUsers(users);

        res.json({

            success: true,

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message,

        });

    }

});

// ================= LOGIN =================

app.post('/api/login', async (req, res) => {

    try {

        const {
            username,
            password,
        } = req.body;

        const users =
            await loadUsers();

        const user =
            users.find(
                u =>
                    u.username ===
                    username
            );

        if (!user) {

            return res.json({

                success: false,

                error:
                    'User not found',

            });

        }

        const valid =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!valid) {

            return res.json({

                success: false,

                error:
                    'Wrong password',

            });

        }

        res.json({

            success: true,

            user: {

                id: user.id,

                username:
                    user.username,

            },

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message,

        });

    }

});

// ================= CHAT =================

app.post('/api/chat', async (req, res) => {

    try {

        const {
            message,
            username,
        } = req.body;

        const model =
            req.body.model ||
            'openai/gpt-oss-120b:free';

        const users =
            await loadUsers();

        const user =
            users.find(
                u =>
                    u.username ===
                    username
            );

        if (!user) {

            return res.json({

                success: false,

                error:
                    'User not found',

            });

        }

        // SAVE USER MESSAGE
        user.messages.push({

            role: 'user',

            content: message,

        });

        // LIMIT MEMORY
        if (
            user.messages.length > 20
        ) {

            user.messages =
                user.messages.slice(
                    -20
                );

        }

        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {

                method: 'POST',

                headers: {

                    Authorization:
                        `Bearer ${process.env.OPENROUTER_API_KEY}`,

                    'Content-Type':
                        'application/json',

                },

                body: JSON.stringify({

                    model,

                    max_tokens: 200,

                    temperature: 0.7,

                    messages: [

                        {

                            role:
                                'system',

                            content:
                                'You are Vortex AI. Remember previous messages and talk naturally.',

                        },

                        ...user.messages,

                    ],

                }),

            }
        );

        const data =
            await response.json();

        console.log(data);

        const aiMessage =
            data.choices?.[0]
                ?.message?.content ||
            'No response';

        // SAVE AI MESSAGE
        user.messages.push({

            role: 'assistant',

            content: aiMessage,

        });

        await saveUsers(users);

        res.json({

            success: true,

            aiResponse:
                aiMessage,

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message,

        });

    }

});

// ================= GET HISTORY =================

app.post(
    '/api/history',
    async (req, res) => {

        try {

            const {
                username,
            } = req.body;

            const users =
                await loadUsers();

            const user =
                users.find(
                    u =>
                        u.username ===
                        username
                );

            if (!user) {

                return res.json({

                    success: false,

                });

            }

            res.json({

                success: true,

                messages:
                    user.messages,

            });

        } catch (err) {

            res.status(500).json({

                success: false,

                error:
                    err.message,

            });

        }

    }
);

// ================= CLEAR CHAT =================

app.post(
    '/api/clear',
    async (req, res) => {

        try {

            const {
                username,
            } = req.body;

            const users =
                await loadUsers();

            const user =
                users.find(
                    u =>
                        u.username ===
                        username
                );

            if (user) {

                user.messages = [];

                await saveUsers(
                    users
                );

            }

            res.json({

                success: true,

            });

        } catch (err) {

            res.status(500).json({

                success: false,

                error:
                    err.message,

            });

        }

    }
);

// ================= START SERVER =================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 Vortex AI Running on ${PORT}`
    );

});