// Zaktualizowany plik obsługujący komunikator z użyciem Socket.IO i pełną funkcjonalnością

const socket = io('http://localhost:3000'); // Połączenie z serwerem backendowym

let loggedInUser = null; // Aktualnie zalogowany użytkownik
const bannedWords = [
    "cholera", "kurde", "kurwa", "pierdol", "fuck", "shit", "damn", "bitch", "asshole"
];

function containsBannedWords(message) {
    return bannedWords.some(word => message.toLowerCase().includes(word));
}

function safeEncryptMessage(message) {
    return btoa(unescape(encodeURIComponent(message)));
}

function safeDecryptMessage(encryptedMessage) {
    return decodeURIComponent(escape(atob(encryptedMessage)));
}

function toggleVisibility(sectionId, show) {
    document.getElementById(sectionId).classList.toggle('hidden', !show);
}

socket.on('loadMessages', (serverMessages) => {
    serverMessages.forEach(({ sender, text }) => {
        const decryptedMessage = safeDecryptMessage(text);
        displayMessage(sender, decryptedMessage);
    });
});

socket.on('message', ({ sender, text }) => {
    const decryptedMessage = safeDecryptMessage(text);
    displayMessage(sender, decryptedMessage);
});

document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const nickname = document.getElementById('register-nickname').value.trim() || username;

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
        alert('Hasło musi mieć 8 znaków, zawierać dużą literę, cyfrę i znak specjalny.');
        return;
    }

    socket.emit('register', { username, password, nickname }, (response) => {
        if (response.error) {
            alert(response.error);
        } else {
            alert('Rejestracja zakończona sukcesem!');
        }
    });
});

document.getElementById('login-form-inner').addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    socket.emit('login', { username, password }, (response) => {
        if (response.error) {
            alert(response.error);
        } else {
            loggedInUser = response.user;
            alert('Zalogowano pomyślnie!');

            toggleVisibility('auth-section', false);
            toggleVisibility('chat-section', true);
            toggleVisibility('settings-section', false);
        }
    });
});

document.getElementById('message-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const messageText = document.getElementById('message-input').value.trim();

    if (!messageText || containsBannedWords(messageText)) {
        alert('Wiadomość jest pusta lub zawiera niedozwolone słowa.');
        return;
    }

    const encryptedMessage = safeEncryptMessage(messageText);
    socket.emit('newMessage', { sender: loggedInUser.nickname, text: encryptedMessage });

    document.getElementById('message-input').value = '';
});

function updateMessagePreview() {
    const previewList = document.getElementById('preview-list');
    previewList.innerHTML = '';

    const recentMessages = messages.slice(-5);
    recentMessages.forEach(({ sender, text }) => {
        const decryptedMessage = safeDecryptMessage(text);
        const messageItem = document.createElement('li');
        messageItem.innerHTML = `<strong>${sender}:</strong> ${decryptedMessage}`;
        previewList.appendChild(messageItem);
    });
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

        const privateMessageList = form.previousElementSibling;
        const newMessage = document.createElement('li');
        newMessage.innerHTML = `<strong>${loggedInUser.nickname}:</strong> ${safeDecryptMessage(encryptedMessage)}`;
        privateMessageList.appendChild(newMessage);

        socket.emit('newPrivateMessage', {
            sender: loggedInUser.nickname,
            recipient: recipientNickname,
            text: encryptedMessage
        });

        input.value = '';
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    loggedInUser = null;
    alert('Wylogowano pomyślnie!');

    toggleVisibility('auth-section', true);
    toggleVisibility('chat-section', false);
    toggleVisibility('chat-preview', true);
});

document.getElementById('change-nickname-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const newNickname = document.getElementById('new-nickname').value.trim();

    if (!newNickname || newNickname.length > 20) {
        alert('Pseudonim musi być krótszy niż 20 znaków.');
        return;
    }

    socket.emit('changeNickname', { username: loggedInUser.username, newNickname }, (response) => {
        if (response.error) {
            alert(response.error);
        } else {
            loggedInUser.nickname = newNickname;
            alert('Pseudonim został zmieniony!');
        }
    });
});

document.getElementById('change-password-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('new-password').value.trim();

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
        alert('Hasło musi mieć 8 znaków, zawierać dużą literę, cyfrę i znak specjalny.');
        return;
    }

    socket.emit('changePassword', { username: loggedInUser.username, newPassword }, (response) => {
        if (response.error) {
            alert(response.error);
        } else {
            alert('Hasło zostało zmienione!');
        }
    });
});
