const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let conversations = [];

app.post('/api/chat', async (req, res) => {

    try {

        const userMessage = req.body.message;

        const model =
        req.body.model ||
        'openai/gpt-oss-120b:free';

        conversations.push({
            role: 'user',
            content: userMessage,
        });

        if (conversations.length > 10) {
            conversations = conversations.slice(-10);
        }

        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {

                method: 'POST',

                headers: {

                    Authorization:
                        `Bearer ${process.env.OPENROUTER_API_KEY}`,

                    'Content-Type': 'application/json',
                },

                body: JSON.stringify({

                    model,

                    max_tokens: 150,

                    temperature: 0.7,

                    messages: [

                        {
                            role: 'system',
                            content:
                                'You are Vortex AI. Be smart, concise, modern and helpful.',
                        },

                        ...conversations,

                    ],

                }),

            }
        );

        const data = await response.json();

        console.log(data);

        const aiMessage =
            data.choices?.[0]?.message?.content ||
            'No response';

        conversations.push({
            role: 'assistant',
            content: aiMessage,
        });

        res.json({
            success: true,
            aiResponse: aiMessage,
            model,
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            error: err.message,
        });

    }

});

app.get('/api/health', (req, res) => {

    res.json({
        status: 'running',
        model: 'Vortex AI Online',
    });

});

app.post('/api/clear', (req, res) => {

    conversations = [];

    res.json({
        success: true,
    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});