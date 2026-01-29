document.addEventListener("DOMContentLoaded", () => {
  // Элементы интерфейса
  const screens = {
    menu: document.getElementById("menu"),
    search: document.getElementById("search"),
    battle: document.getElementById("battle")
  };
  
  const goldElement = document.getElementById("gold");
  const timerElement = document.getElementById("timer");
  const playerHand = document.getElementById("playerHand");
  const enemyHand = document.getElementById("enemyHand");
  const statusElement = document.getElementById("status");
  
  let gold = 0;
  let timer = 10;
  let timerInterval = null;
  let playerChoice = null;
  let gameActive = false;
  let userId = null;
  let userName = "Игрок";

  // ==================== TELEGRAM WEBAPP ====================
  // Проверяем, запущена ли игра в Telegram WebApp
  function initTelegram() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
      const tg = Telegram.WebApp;
      
      // Разворачиваем на весь экран
      tg.expand();
      
      // Получаем данные пользователя
      const user = tg.initDataUnsafe?.user;
      if (user) {
        userId = user.id;
        userName = user.first_name || "Игрок";
        console.log("👤 Пользователь Telegram:", user);
        
        // Загружаем статистику пользователя
        loadUserStats();
      }
      
      // Показываем кнопку "Назад" в Telegram
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        tg.close();
      });
      
      return true;
    }
    return false;
  }
  
  // Загружаем статистику пользователя
  async function loadUserStats() {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        gold = data.gold;
        goldElement.textContent = `💎 ${gold}`;
        console.log("📊 Статистика загружена:", data);
      }
    } catch (error) {
      console.log("Не удалось загрузить статистику, используем локальную");
    }
  }
  
  // Сохраняем результат игры
  async function saveGameResult(result, goldChange) {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          result: result,
          goldChange: goldChange
        })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log("✅ Результат сохранен:", data);
        
        // Обновляем локальное золото
        gold = data.stats.gold;
        goldElement.textContent = `💎 ${gold}`;
      }
    } catch (error) {
      console.log("Не удалось сохранить результат:", error);
    }
  }
  
  // Инициализируем Telegram WebApp
  const isInTelegram = initTelegram();
  
  // Если не в Telegram, показываем предупреждение
  if (!isInTelegram) {
    console.log("⚠️ Игра запущена не в Telegram WebApp");
    // Можно показать сообщение или использовать заглушку
  }
  
  // ==================== ИГРОВАЯ ЛОГИКА ====================
  
  // Навигация по экранам
  document.querySelectorAll("button[data-screen]").forEach(button => {
    button.addEventListener("click", () => {
      const screenName = button.getAttribute("data-screen");
      showScreen(screenName);
      
      if (screenName === "search") {
        startSearch();
      }
    });
  });

  // Отмена поиска
  document.getElementById("cancelSearch").addEventListener("click", () => {
    showScreen("menu");
  });

  // Выбор руки в бою
  document.querySelectorAll("[data-choice]").forEach(button => {
    button.addEventListener("click", (e) => {
      if (!gameActive) return;
      
      const choice = e.target.getAttribute("data-choice");
      makeChoice(choice);
    });
  });

  // Кнопка "Сыграть ещё"
  document.getElementById("playAgain").addEventListener("click", () => {
    resetBattle();
    startBattle();
  });

  // Кнопка "Спасибо" (в меню)
  document.getElementById("toMenu").addEventListener("click", () => {
    showScreen("menu");
    
    // Если в Telegram WebApp, обновляем статистику
    if (isInTelegram) {
      loadUserStats();
    }
  });

  // Функция показа экрана
  function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
      screen.classList.add("hidden");
    });
    screens[screenName].classList.remove("hidden");
  }

  // Поиск соперника
  function startSearch() {
    // Показываем анимацию поиска 1.5 секунды
    setTimeout(() => {
      showScreen("battle");
      startBattle();
    }, 1500);
  }

  // Начало боя
  function startBattle() {
    gameActive = true;
    playerChoice = null;
    playerHand.textContent = "✊";
    enemyHand.classList.add("hidden");
    statusElement.textContent = "";
    
    // Включаем кнопки выбора
    document.querySelectorAll("[data-choice]").forEach(btn => {
      btn.disabled = false;
    });
    
    // Скрываем кнопки "Сыграть ещё" и "Спасибо"
    document.getElementById("playAgain").classList.add("hidden");
    document.getElementById("toMenu").classList.add("hidden");

    // Таймер
    timer = 10;
    timerElement.textContent = timer;
    
    timerInterval = setInterval(() => {
      timer--;
      timerElement.textContent = timer;
      
      if (timer <= 0) {
        endBattle();
      }
    }, 1000);
  }

  // Выбор игрока
  function makeChoice(choice) {
    if (!gameActive || playerChoice) return;
    
    playerChoice = choice;
    const emojis = { rock: "✊", scissors: "✌", paper: "✋" };
    playerHand.textContent = emojis[choice];
    
    // Отключаем кнопки выбора
    document.querySelectorAll("[data-choice]").forEach(btn => {
      btn.disabled = true;
    });
    
    // Показываем руку соперника через 0.5 сек
    setTimeout(() => {
      showEnemyChoice();
      endBattle();
    }, 500);
  }

  // Ход соперника
  function showEnemyChoice() {
    const choices = ["rock", "scissors", "paper"];
    const enemyChoice = choices[Math.floor(Math.random() * 3)];
    const emojis = { rock: "✊", scissors: "✌", paper: "✋" };
    
    enemyHand.textContent = emojis[enemyChoice];
    enemyHand.classList.remove("hidden");
    
    return enemyChoice;
  }

  // Определение победителя
  function determineWinner(player, enemy) {
    if (player === enemy) return "draw";
    
    const winConditions = {
      rock: "scissors",
      scissors: "paper",
      paper: "rock"
    };
    
    return winConditions[player] === enemy ? "win" : "lose";
  }

  // Завершение боя
  async function endBattle() {
    gameActive = false;
    clearInterval(timerInterval);
    
    const enemyChoice = showEnemyChoice();
    const result = determineWinner(playerChoice, enemyChoice);
    
    let message = "";
    let goldChange = 0;
    
    switch(result) {
      case "win":
        message = "🎉 Вы победили!";
        goldChange = 10;
        break;
      case "lose":
        message = "😢 Вы проиграли";
        goldChange = -5;
        break;
      case "draw":
        message = "🤝 Ничья!";
        goldChange = 2;
        break;
    }
    
    // Обновляем золото локально
    gold = Math.max(0, gold + goldChange);
    goldElement.textContent = `💎 ${gold}`;
    
    statusElement.textContent = message;
    
    // Сохраняем результат если в Telegram
    if (isInTelegram && userId) {
      await saveGameResult(result, goldChange);
    }
    
    // Показать кнопки после боя
    document.getElementById("playAgain").classList.remove("hidden");
    document.getElementById("toMenu").classList.remove("hidden");
  }

  // Сброс боя
  function resetBattle() {
    playerChoice = null;
    enemyHand.classList.add("hidden");
    statusElement.textContent = "";
    
    document.querySelectorAll("[data-choice]").forEach(btn => {
      btn.disabled = false;
    });
  }

  // Инициализация
  showScreen("menu");
  
  // Если в Telegram, показываем приветствие
  if (isInTelegram) {
    // Можно добавить приветствие в интерфейс
    console.log(`👋 Добро пожаловать, ${userName}!`);
  }
});