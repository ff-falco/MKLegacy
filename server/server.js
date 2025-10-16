const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 4000;

// Stato tornei in memoria (per test, poi puoi usare DB)
let tournaments = {}; // { "CODICE123": [{ id, name, nickname, chatId }, ...] }

const TOKEN = "IL_TUO_BOT_TOKEN";
const bot = new TelegramBot(TOKEN, { polling: true });

// Bot Telegram
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Benvenuto! Inserisci il codice del torneo:");
  bot.once("message", (msg1) => {
    const code = msg1.text.trim();
    bot.sendMessage(msg1.chat.id, "Inserisci il tuo nome per il torneo:");
    bot.once("message", (msg2) => {
      const name = msg2.text.trim();
      const nickname = msg2.from.username || name;

      if (!tournaments[code]) tournaments[code] = [];
      tournaments[code].push({ id: msg2.from.id, name, nickname, chatId: msg2.chat.id });

      bot.sendMessage(msg2.chat.id, `Ti sei iscritto con successo come ${name} (${nickname})`);
    });
  });
});

// Endpoint per frontend
app.get("/api/tournament/:code/players", (req, res) => {
  const code = req.params.code;
  res.json(tournaments[code] || []);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
