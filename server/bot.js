import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

const TOKEN = "8499224534:AAF363MPS_u5q9T91-lFqUSyQ1xSGGEovKQ";
const API_URL = "http://localhost:3001/api/tournament";
const bot = new TelegramBot(TOKEN, { polling: true });

const userStates = new Map();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "🎮 Benvenuto! Inserisci il *codice torneo*:", { parse_mode: "Markdown" });
  userStates.set(chatId, { step: "askCode" });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);
  if (!state) return;

  if (state.step === "askCode") {
    const code = msg.text.trim();
    userStates.set(chatId, { step: "askName", code });
    bot.sendMessage(chatId, "Scrivi il *nome con cui vuoi iscriverti*:", { parse_mode: "Markdown" });
  } else if (state.step === "askName") {
    const name = msg.text.trim();
    const { code } = state;
    const nickname = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

    try {
      await axios.post(`${API_URL}/join`, { code, name, nickname, telegramId: chatId });
      bot.sendMessage(chatId, `✅ Iscrizione completata!\nNome: *${name}*\nNickname: ${nickname}`, { parse_mode: "Markdown" });
    } catch {
      bot.sendMessage(chatId, "❌ Errore: codice torneo non valido o server offline.");
    }

    userStates.delete(chatId);
  }
});
