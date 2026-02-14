const express = require("express");
const axios = require("axios");
const cors = require("cors");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "sk-or-v1-SUA_CHAVE_AQUI";

const server = app.listen(3000, () => {
    console.log("🔥 Nyno Core rodando na porta 3000");
});

const wss = new WebSocket.Server({ server });

let speakerSocket = null;

wss.on("connection", (ws) => {
    console.log("📡 Dispositivo conectado");

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "speaker") {
            speakerSocket = ws;
            console.log("🔊 Speaker registrado");
        }
    });
});

app.post("/ask", async (req, res) => {
    const pergunta = req.body.message;

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: "Você é o Nyno OS, assistente doméstico inteligente." },
                    { role: "user", content: pergunta }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const reply = response.data.choices[0].message.content;

        if (speakerSocket) {
            speakerSocket.send(JSON.stringify({
                type: "speak",
                message: reply
            }));
        }

        res.json({ reply });

    } catch (err) {
        res.status(500).json({ error: "Erro no Nyno Core" });
    }
});
