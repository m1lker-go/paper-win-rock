const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');

// Токен из переменных окружения Render
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

// Получаем URL сервиса автоматически
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
const GAME_URL = RENDER_URL; // Игра доступна по корневому пути

// Проверяем токен
if (!BOT_TOKEN) {
  console.error('❌ ОШИБКА: Не задан BOT_TOKEN в переменных окружения!');
  console.log('📝 Как задать на Render:');
  console.log('1. Зайдите в Dashboard вашего Web Service');
  console.log('2. Нажмите "Environment"');
  console.log('3. Добавьте переменную BOT_TOKEN со значением вашего токена');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Хранилище для статистики (в памяти, на Render это сбрасывается при перезапуске)
const userStats = new Map();

// ============ КОМАНДЫ БОТА ============
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.first_name;
  
  console.log(`👤 Новый пользователь: ${userName} (${userId})`);
  
  // Инициализируем статистику
  if (!userStats.has(userId)) {
    userStats.set(userId, {
      gold: 100,
      wins: 0,
      losses: 0,
      draws: 0,
      games: 0
    });
  }
  
  const stats = userStats.get(userId);
  
  const message = `🎮 *Paper-Win-Rock*\\n\\n` +
    `Привет, ${userName}! 👋\\n\\n` +
    `*Твоя статистика:*\\n` +
    `💎 Кристаллы: ${stats.gold}\\n` +
    `🏆 Побед: ${stats.wins}\\n` +
    `🎮 Игр: ${stats.games}\\n\\n` +
    `Нажми кнопку ниже, чтобы начать игру прямо в Telegram!`;
  
  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '🎮 Играть', web_app: { url: GAME_URL } }],
        [{ text: '📊 Статистика' }, { text: '📖 Правила' }]
      ],
      resize_keyboard: true
    }
  });
});

// Обработка кнопок
bot.hears('📊 Статистика', (ctx) => {
  const userId = ctx.from.id;
  const stats = userStats.get(userId) || { gold: 100, wins: 0, losses: 0, draws: 0, games: 0 };
  
  const winRate = stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(1) : 0;
  
  ctx.reply(
    `📊 *Твоя статистика:*\\n\\n` +
    `💎 Кристаллы: ${stats.gold}\\n` +
    `🏆 Побед: ${stats.wins}\\n` +
    `😢 Поражений: ${stats.losses}\\n` +
    `🤝 Ничьих: ${stats.draws}\\n` +
    `🎮 Всего игр: ${stats.games}\\n` +
    `📈 Процент побед: ${winRate}%`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('📖 Правила', (ctx) => {
  ctx.reply(
    `📖 *Правила игры:*\\n\\n` +
    `🎮 *Как играть:*\\n` +
    `1. Нажми "🎮 Играть"\\n` +
    `2. Выбери руку (камень/ножницы/бумага)\\n` +
    `3. У тебя есть 10 секунд на выбор!\\n` +
    `4. Соперник делает случайный выбор\\n\\n` +
    `⚔️ *Правила победы:*\\n` +
    `• Камень (✊) бьет ножницы (✌)\\n` +
    `• Ножницы (✌) бьют бумагу (✋)\\n` +
    `• Бумага (✋) бьет камень (✊)\\n\\n` +
    `💎 *Награды:*\\n` +
    `• Победа: +10 кристаллов\\n` +
    `• Ничья: +2 кристалла\\n` +
    `• Поражение: -5 кристаллов`,
    { parse_mode: 'Markdown' }
  );
});

// API для игры
app.get('/api/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const stats = userStats.get(userId) || { gold: 100, wins: 0, losses: 0, draws: 0, games: 0 };
  res.json(stats);
});

app.post('/api/game/result', (req, res) => {
  const { userId, result, goldChange } = req.body;
  
  if (!userStats.has(userId)) {
    userStats.set(userId, { gold: 100, wins: 0, losses: 0, draws: 0, games: 0 });
  }
  
  const stats = userStats.get(userId);
  stats.gold += goldChange;
  stats.games += 1;
  
  if (result === 'win') stats.wins += 1;
  else if (result === 'lose') stats.losses += 1;
  else if (result === 'draw') stats.draws += 1;
  
  // Не даем уйти в минус
  stats.gold = Math.max(0, stats.gold);
  
  userStats.set(userId, stats);
  
  res.json({ success: true, stats });
});

// Статический сервер
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🎮 Игра доступна по адресу: ${GAME_URL}`);
});

// Запуск бота
bot.launch()
  .then(() => {
    console.log(`\n🎉 БОТ УСПЕШНО ЗАПУЩЕН!`);
    console.log(`🤖 Имя бота: @${bot.botInfo.username}`);
    console.log(`🔗 Ссылка на бота: https://t.me/${bot.botInfo.username}`);
    console.log(`🌐 URL игры: ${GAME_URL}`);
    console.log(`\n📱 **Инструкция:**`);
    console.log(`1. Откройте бота в Telegram`);
    console.log(`2. Нажмите /start`);
    console.log(`3. Нажмите "🎮 Играть"`);
    console.log(`4. Игра откроется прямо в Telegram!`);
  })
  .catch((err) => {
    console.error('❌ Ошибка запуска бота:', err.message);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));