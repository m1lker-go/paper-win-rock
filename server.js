const express = require(`express`);
const { Server } = require(`socket.io`);
const crypto = require(`crypto`);
const app = express();

app.get(`/`, (req, res) => {
  const randomGold = crypto.randomInt(1, 100);
  res.send(`Ты получил ${randomGold} золотых монет!`);
});

app.listen(3000, () => {
  console.log(`Сервер запущен на порту 3000`);
});
const http = require(`http`);
const server = http.createServer(app);
const io = new Server(server); // создаём сокет сервер

// простой пример соединения
io.on(`connection`, (socket) => {
  console.log(`Игрок подключился:`, socket.id);

  socket.on(`disconnect`, () => {
    console.log(`Игрок отключился:`, socket.id);
  });
});