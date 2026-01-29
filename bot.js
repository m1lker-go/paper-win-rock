const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');

// Токен из переменных окружения Render
const BOT_TOKEN = process.env.BOT_TOKEN || '8365584044:AAESH0_vHwEhN9P05xgpJl8MPMNbbEpqRG0';
const PORT = process.env.PORT || 3000;

// URL будет автоматически от Render
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

console.log('🚀 Starting Paper-Win-Rock...');
console.log(`🌐 Render URL: ${RENDER_URL}`);

// Проверка токена
if (!BOT_TOKEN || BOT_TOKEN.includes('ВАШ_ТОКЕН')) {
  console.error('❌ ERROR: Invalid BOT_TOKEN!');
  console.log('ℹ️ Set BOT_TOKEN in Render Environment Variables');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Раздача статики
app.use(express.static(path.join(__dirname, 'public')));

// Простой бот
bot.start((ctx) => {
  console.log(`👤 User ${ctx.from.id} started`);
  
  ctx.reply(
    `🎮 *Paper-Win-Rock*\n\n` +
    `Hello, ${ctx.from.first_name}! 🎉\n\n` +
    `Click button below to open the game:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Play Game', url: RENDER_URL }]
        ]
      }
    }
  );
});

// Статический сервер
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Запуск бота
bot.launch()
  .then(() => {
    console.log(`✅ Bot started: @${bot.botInfo.username}`);
    console.log(`🔗 Bot URL: https://t.me/${bot.botInfo.username}`);
    console.log(`🎮 Game URL: ${RENDER_URL}`);
  })
  .catch((err) => {
    console.error('❌ Bot error:', err.message);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));