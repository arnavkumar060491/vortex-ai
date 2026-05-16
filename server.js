const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {

  try {

    const userMessage = req.body.message;

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: req.body.model || 'openai/gpt-oss-20b:free',
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log(data);

    const aiMessage =
      data.choices?.[0]?.message?.content ||
      'No response';

    res.json({
      success: true,
      aiResponse: aiMessage,
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
  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log(`Running on port ${PORT}`);
});