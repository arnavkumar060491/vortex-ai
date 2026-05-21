const express =
    require('express');

const cors =
    require('cors');

const fs =
    require('fs');

require('dotenv').config();

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.static('public'));

// ================= USERS =================

const USERS_FILE =
    './users.json';

function loadUsers() {

    if (!fs.existsSync(USERS_FILE)) {

        fs.writeFileSync(
            USERS_FILE,
            '{}'
        );

    }

    return JSON.parse(

        fs.readFileSync(
            USERS_FILE,
            'utf8'
        )

    );

}

function saveUsers(users) {

    fs.writeFileSync(

        USERS_FILE,

        JSON.stringify(
            users,
            null,
            2
        )

    );

}

// ================= SIGNUP =================

app.post(
    '/api/signup',
    (req, res) => {

        const {
            username,
            password
        } = req.body;

        const users =
            loadUsers();

        if (users[username]) {

            return res.json({

                success: false,

                error:
                    'User already exists',

            });

        }

        users[username] = {

            password,

            history: [],

        };

        saveUsers(users);

        res.json({

            success: true,

        });

    }
);

// ================= LOGIN =================

app.post(
    '/api/login',
    (req, res) => {

        const {
            username,
            password
        } = req.body;

        const users =
            loadUsers();

        const user =
            users[username];

        if (!user) {

            return res.json({

                success: false,

                error:
                    'User not found',

            });

        }

        if (
            user.password !==
            password
        ) {

            return res.json({

                success: false,

                error:
                    'Wrong password',

            });

        }

        res.json({

            success: true,

        });

    }
);

// ================= CHAT =================

app.post(
    '/api/chat',
    async (req, res) => {

        try {

            const {
                username,
                message,
                model
            } = req.body;

            const users =
                loadUsers();

            if (
                !users[username]
            ) {

                return res.json({

                    success: false,

                    error:
                        'User not found',

                });

            }

            if (
                !users[username]
                    .history
            ) {

                users[
                    username
                ].history = [];

            }

            users[
                username
            ].history.push({

                role: 'user',

                content:
                    message,

            });

            const response =
                await fetch(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {

                        method:
                            'POST',

                        headers: {

                            Authorization:
                                `Bearer ${process.env.OPENROUTER_API_KEY}`,

                            'Content-Type':
                                'application/json',

                        },

                        body: JSON.stringify(
                            {

                                model:
                                    model ||
                                    'openai/gpt-oss-120b:free',

                                messages:
                                    users[
                                        username
                                    ]
                                        .history,

                            }
                        ),

                    }
                );

            const data =
                await response.json();

            console.log(
                data
            );

            const aiMessage =
                data.choices?.[0]
                    ?.message
                    ?.content ||
                'No response';

            users[
                username
            ].history.push({

                role:
                    'assistant',

                content:
                    aiMessage,

            });

            saveUsers(users);

            res.json({

                success: true,

                aiResponse:
                    aiMessage,

            });

        } catch (err) {

            console.log(err);

            res.status(500).json({

                success: false,

                error:
                    err.message,

            });

        }

    }
);

// ================= HISTORY =================

app.post(
    '/api/history',
    (req, res) => {

        const { username } =
            req.body;

        const users =
            loadUsers();

        const user =
            users[username];

        if (!user) {

            return res.json({

                success: false,

                messages: [],

            });

        }

        res.json({

            success: true,

            messages:
                user.history || [],

        });

    }
);

// ================= CLEAR =================

app.post(
    '/api/clear',
    (req, res) => {

        const { username } =
            req.body;

        const users =
            loadUsers();

        if (
            users[username]
        ) {

            users[
                username
            ].history = [];

            saveUsers(users);

        }

        res.json({

            success: true,

        });

    }
);

// ================= HEALTH =================

app.get(
    '/api/health',
    (req, res) => {

        res.json({

            status: 'running',

            model:
                'GPT OSS 120B',

        });

    }
);

// ================= START =================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Running on port ${PORT}`
    );

});