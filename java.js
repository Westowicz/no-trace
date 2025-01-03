// Funkcja do ładowania użytkowników z localStorage

function loadUsersFromStorage() {
    const storedUsers = localStorage.getItem('users');
    return storedUsers ? JSON.parse(storedUsers) : {};
}

// Funkcja do zapisywania użytkowników do localStorage
function saveUsersToStorage() {
    localStorage.setItem('users', JSON.stringify(users));
}

// Załaduj istniejących użytkowników podczas inicjalizacji aplikacji
const users = loadUsersFromStorage();
// Funkcja do ładowania wiadomości z localStorage
function loadMessagesFromStorage() {
    const storedMessages = localStorage.getItem('messages');
    return storedMessages ? JSON.parse(storedMessages) : [];
}
// Funkcja do zapisywania wiadomości do localStorage
function saveMessagesToStorage() {
    localStorage.setItem('messages', JSON.stringify(messages));
}
let loggedInUser = null; // Aktualnie zalogowany użytkownik
let messages = loadMessagesFromStorage();
updateMessagePreview();
// Lista przekleństw (polskich i angielskich)
const bannedWords = [
    "cholera", "kurde", "kurwa", "pierdol", "fuck", "shit", "damn", "bitch", "asshole"
];

// Funkcja do sprawdzania przekleństw
function containsBannedWords(message) {
    return bannedWords.some(word => message.toLowerCase().includes(word));
}

// Funkcja do bezpiecznego kodowania Base64
function safeEncryptMessage(message) {
    return btoa(unescape(encodeURIComponent(message)));
}

// Funkcja do bezpiecznego dekodowania Base64
function safeDecryptMessage(encryptedMessage) {
    return decodeURIComponent(escape(atob(encryptedMessage)));
}

// Funkcja zmienia widoczność sekcji
function toggleVisibility(sectionId, show) {
    document.getElementById(sectionId).classList.toggle('hidden', !show);
}

// Przełączanie między formularzami
document.getElementById('show-register').addEventListener('click', function () {
    document.getElementById('registration-form').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
});

document.getElementById('show-login').addEventListener('click', function () {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('registration-form').classList.add('hidden');
});

// Rejestracja
document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const nickname = document.getElementById('register-nickname').value.trim() || username;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (users[username]) {
        alert('Użytkownik o podanej nazwie już istnieje!');
        return;
    }

    if (!passwordRegex.test(password)) {
        alert('Hasło musi zawierać co najmniej: małą literę, dużą literę, cyfrę, znak specjalny i mieć min. 8 znaków.');
        return;
    }

    if (nickname.length > 20) {
        alert('Pseudonim nie może przekraczać 20 znaków.');
        return;
    }

    users[username] = { password, nickname };
    saveUsersToStorage();
    alert('Rejestracja zakończona sukcesem!');
});

// Logowanie
document.getElementById('login-form-inner').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (users[username] && users[username].password === password) {
        loggedInUser = { username, nickname: users[username].nickname };
        alert('Zalogowano pomyślnie!');

        toggleVisibility('auth-section', false);
        toggleVisibility('chat-section', true);
    toggleVisibility('chat-preview', false);    document.getElementById('preview-list').innerHTML = '';        toggleVisibility('settings-section', false); // Ukryj sekcję ustawień na starcie
        updateMessageList();
    } else {
        alert('Nieprawidłowa nazwa użytkownika lub hasło.');
    }
});

// Znajdź przycisk i sekcję ustawień
const settingsButton = document.getElementById('settings-btn');
const settingsSection = document.getElementById('settings-section');
// Dodaj nasłuchiwanie kliknięcia na przycisku
settingsButton.addEventListener('click', () => {
  // Zmień klasę sekcji ustawień, aby ją wyświetlić
  settingsSection.classList.remove('hidden');
});


// Wysyłanie wiadomości
document.getElementById('message-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();

    if (!messageText) {
        alert('Wiadomość nie może być pusta!');
        return;
    }

    if (messageText.length > 80) {
        alert('Wiadomość nie może przekraczać 80 znaków!');
        return;
    }

    if (containsBannedWords(messageText)) {
        alert('Wiadomość zawiera niedozwolone słowa!');
        return;
    }

    if (loggedInUser) {
        const encryptedMessage = safeEncryptMessage(messageText);
        messages.push({ sender: loggedInUser.nickname, text: encryptedMessage });
        saveMessagesToStorage();
        const decryptedMessage = safeDecryptMessage(encryptedMessage);
        displayMessage(loggedInUser.nickname, decryptedMessage);

        messageInput.value = '';
        updateMessagePreview();
    }
});
function updateMessagePreview() {
    const previewList = document.getElementById('preview-list');
    previewList.innerHTML = '';

    const recentMessages = messages.slice(-5); // Pobierz ostatnie 5 wiadomości
    recentMessages.forEach(({ sender, text }) => {
        const decryptedMessage = safeDecryptMessage(text);
        const messageItem = document.createElement('li');
        messageItem.innerHTML = `<strong>${sender}:</strong> ${decryptedMessage}`;
        previewList.appendChild(messageItem);
    });
}
// Wyświetlanie wiadomości na czacie
function displayMessage(nickname, message) {
    const messageList = document.getElementById('message-list');
    const newMessage = document.createElement('li');
    newMessage.innerHTML = `
    <strong>${nickname}</strong> 
    <button class="start-private-chat" data-nickname="${nickname}" style="background: none; border: none; cursor: pointer;">
        <img class="prywatnelogo" src="prywatne.jpg" alt="Prywatna wiadomosci">
    </button>
    <p>${message}</p>
`;
    messageList.appendChild(newMessage);
}
document.addEventListener('click', (e) => {
    // Sprawdzamy, czy kliknięto na przycisk "start-private-chat"
    if (e.target.closest('.start-private-chat')) {
        const recipientNickname = e.target.closest('.start-private-chat').getAttribute('data-nickname');
        startPrivateChat(recipientNickname);
    }
});

function startPrivateChat(recipientNickname) {
    if (!loggedInUser) {
        alert('Musisz być zalogowany, aby rozpocząć czat prywatny.');
        return;
    }

    // Tworzymy nową sekcję czatu prywatnego
    const chatId = `${loggedInUser.nickname}-${recipientNickname}`;
    if (!document.getElementById(chatId)) {
        const privateChatSection = document.createElement('div');
        privateChatSection.id = chatId;
        privateChatSection.innerHTML = `
            <h3>Czat z ${recipientNickname}</h3>
            <ul class="private-message-list"></ul>
            <form class="private-message-form">
                <input type="text" class="private-message-input" placeholder="Napisz wiadomość...">
                <button type="submit">Wyślij</button>
            </form>
        `;
        document.body.appendChild(privateChatSection);
    }
}
document.body.addEventListener('submit', (e) => {
    if (e.target.classList.contains('private-message-form')) {
        e.preventDefault();

        const form = e.target;
        const input = form.querySelector('.private-message-input');
        const messageText = input.value.trim();

        if (!messageText) return;

        const recipientNickname = form.closest('div').id.split('-')[1];
        const encryptedMessage = safeEncryptMessage(messageText);

        // Dodaj wiadomość do listy
        const privateMessageList = form.previousElementSibling;
        const newMessage = document.createElement('li');
        newMessage.innerHTML = `<strong>${loggedInUser.nickname}:</strong> ${safeDecryptMessage(encryptedMessage)}`;
        privateMessageList.appendChild(newMessage);

        // Przechowujemy wiadomość
        messages.push({ 
            sender: loggedInUser.nickname, 
            recipient: recipientNickname, 
            text: encryptedMessage 
        });
        saveMessagesToStorage();

        // Powiadomienie odbiorcy
        showNotification(`${loggedInUser.nickname} wysłał Ci prywatną wiadomość!`);

        input.value = '';
    }
});
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Aktualizacja listy wiadomości
function updateMessageList() {
    if (!loggedInUser) return;    const messageList = document.getElementById('message-list');
    messageList.innerHTML = '';

    messages.forEach(({ sender, text }) => {
        const decryptedMessage = safeDecryptMessage(text);
        displayMessage(sender, decryptedMessage);
    });
}

// Wylogowanie
document.getElementById('logout-btn').addEventListener('click', () => {
    loggedInUser = null;
    alert('Wylogowano pomyślnie!');

    toggleVisibility('chat-section', false);
    toggleVisibility('auth-section', true);
    toggleVisibility('chat-preview', true);
    toggleVisibility('settings-section', false);
});

// Zmiana pseudonimu
document.getElementById('change-nickname-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const newNickname = document.getElementById('new-nickname').value.trim();

    if (newNickname && newNickname.length <= 20 && loggedInUser) {
        users[loggedInUser.username].nickname = newNickname;
        loggedInUser.nickname = newNickname;
        alert('Pseudonim został zmieniony!');
        document.getElementById('new-nickname').value = '';
    } else {
        alert('Podaj poprawny pseudonim (maksymalnie 20 znaków)!');
    }
});

// Zmiana hasła
document.getElementById('change-password-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const newPassword = document.getElementById('new-password').value.trim();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (newPassword && passwordRegex.test(newPassword) && loggedInUser) {
        users[loggedInUser.username].password = newPassword;
        saveUsersToStorage(); 
        alert('Hasło zostało zmienione!');
        document.getElementById('new-password').value = '';
    } else {
        alert('Podaj poprawne hasło!');
    }
});
