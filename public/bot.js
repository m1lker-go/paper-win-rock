const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');

const BOT_TOKEN = '8365584044:AAESH0_vHwEhN9P05xgpJl8MPMNbbEpqRG0';
const PORT = 3000; // ИЗМЕНИЛИ НА 3000
const NGROK_URL = 'https://unmatchable-superlogically-jeromy.ngrok-free.dev'; // ОБНОВИТЕ ПОСЛЕ ПЕРЕЗАПУСКА NGROK

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Раздача статики
app.use(express.static(path.join(__dirname, 'public')));

// ============ ПРОСТОЙ РАБОЧИЙ БОТ ============
bot.command('start', (ctx) => {
  ctx.reply(
    `🎮 *Paper-Win-Rock*\n\n` +
    `Привет, ${ctx.from.first_name}!\n\n` +
    `Нажми кнопку ниже, чтобы открыть игру:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '▶️ Открыть игру', url: NGROK_URL }],
          [{ text: '📖 Правила', callback_data: 'rules' }]
        ]
      }
    }
  );
});

bot.action('rules', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(
    '📖 *Правила игры:*\n\n' +
    '• Камень (✊) бьет ножницы (✌)\n' +
    '• Ножницы (✌) бьют бумагу (✋)\n' +
    '• Бумага (✋) бьет камень (✊)\n\n' +
    '⏱ У вас 10 секунд на выбор!',
    { parse_mode: 'Markdown' }
  );
});

// Сервер
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});

// Запуск бота
bot.launch()
  .then(() => {
    console.log(`✅ Бот запущен!`);
    console.log(`🔗 Ссылка: https://t.me/${bot.botInfo.username}`);
    console.log(`🌐 Игра: ${NGROK_URL}`);
    console.log(`\n📱 Как тестировать:`);
    console.log(`1. Откройте бота в Telegram`);
    console.log(`2. Нажмите /start`);
    console.log(`3. Нажмите "▶️ Открыть игру"`);
    console.log(`4. На странице ngrok нажмите "Visit Site"`);
  })
  .catch((err) => {
    console.error('❌ Ошибка бота:', err.message);
  });