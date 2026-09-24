// Motivational Quotes
const quotes = [
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Your time is limited. Don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
    { text: "Future you is watching you right now through these messages.", author: "Future Me" },
    { text: "You've got this. Keep pushing forward.", author: "Future You" }
];

// State Management
let messages = [];
let currentFilter = 'all';

// DOM Elements
const messageForm = document.getElementById('messageForm');
const messagesContainer = document.getElementById('messagesContainer');
const themeToggle = document.getElementById('themeToggle');
const messageModal = document.getElementById('messageModal');
const closeModal = document.getElementById('closeModal');
const clearAllBtn = document.getElementById('clearAllBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const futureDate = document.getElementById('futureDate');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setMinimumDate();
    rotateQuote();
    setInterval(rotateQuote, 30000);
});

function initializeApp() {
    // Load from localStorage
    const savedMessages = localStorage.getItem('futureMessages');
    if (savedMessages) {
        messages = JSON.parse(savedMessages);
    }

    // Setup event listeners
    messageForm.addEventListener('submit', handleFormSubmit);
    themeToggle.addEventListener('click', toggleTheme);
    closeModal.addEventListener('click', closeMessageModal);
    clearAllBtn.addEventListener('click', handleClearAll);
    messageModal.addEventListener('click', (e) => {
        if (e.target === messageModal) closeMessageModal();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderMessages();
        });
    });

    // Load theme preference
    loadTheme();

    // Initial render
    renderMessages();

    // Update countdown every second
    setInterval(updateCountdowns, 1000);
}

// Form Submission
function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();
    const revealDate = new Date(document.getElementById('futureDate').value);
    const category = document.getElementById('category').value;

    if (!name || !message || !revealDate) {
        showNotification('Please fill in all fields!', 'error');
        return;
    }

    if (revealDate <= new Date()) {
        showNotification('Please select a future date!', 'error');
        return;
    }

    const newMessage = {
        id: Date.now(),
        name,
        message,
        revealDate: revealDate.toISOString(),
        category,
        created: new Date().toISOString(),
        isRead: false
    };

    messages.unshift(newMessage);
    saveMessages();
    renderMessages();

    messageForm.reset();
    showNotification('Message saved! See you in the future! 🚀', 'success');
}

// Render Messages
function renderMessages() {
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<p class="empty-state">No messages yet. Create one to get started! 🚀</p>';
        return;
    }

    let filteredMessages = messages;

    if (currentFilter === 'locked') {
        filteredMessages = messages.filter(msg => !isMessageUnlocked(msg));
    } else if (currentFilter === 'unlocked') {
        filteredMessages = messages.filter(msg => isMessageUnlocked(msg));
    }

    messagesContainer.innerHTML = filteredMessages.map(msg => createMessageCard(msg)).join('');

    // Add event listeners to cards
    document.querySelectorAll('.message-card').forEach(card => {
        card.addEventListener('click', () => openMessageModal(card.dataset.id));
    });
}

function createMessageCard(msg) {
    const isUnlocked = isMessageUnlocked(msg);
    const revealDate = new Date(msg.revealDate);
    const status = isUnlocked ? 'unlocked' : 'locked';
    const statusText = isUnlocked ? '🔓 Unlocked' : '🔒 Locked';
    const preview = msg.message.substring(0, 80) + (msg.message.length > 80 ? '...' : '');
    const timeRemaining = getTimeRemaining(revealDate);
    const progress = getProgress(msg);

    return `
        <div class="message-card ${status}" data-id="${msg.id}" data-status="${status}">
            <div class="message-header">
                <div>
                    <h3 class="message-name">${escapeHtml(msg.name)}</h3>
                    <span class="message-category">${msg.category}</span>
                </div>
                <span class="message-status ${status}">${statusText}</span>
            </div>
            <p class="message-preview">${escapeHtml(preview)}</p>
            <div class="progress-container">
                <div class="progress-label">
                    <span>Reveal Progress</span>
                    <span>${Math.round(progress)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="message-footer">
                <span class="message-date">${formatDate(revealDate)}</span>
                <span class="countdown" data-id="${msg.id}">${timeRemaining}</span>
            </div>
        </div>
    `;
}

// Modal Functions
function openMessageModal(id) {
    const msg = messages.find(m => m.id == id);
    if (!msg) return;

    const isUnlocked = isMessageUnlocked(msg);
    const revealDate = new Date(msg.revealDate);

    let content = `
        <div class="message-full">
            <div class="modal-message-header">
                <h2 class="modal-message-name">${escapeHtml(msg.name)}</h2>
                <p class="modal-message-date">
                    📅 Created: ${formatDate(new Date(msg.created))}<br>
                    🎯 Reveal Date: ${formatDate(revealDate)}<br>
                    📂 Category: ${msg.category}
                </p>
            </div>
            <div class="modal-message-content">
                ${escapeHtml(msg.message)}
            </div>
    `;

    if (!isUnlocked) {
        const timeRemaining = getTimeRemaining(revealDate);
        content += `
            <div style="background: rgba(245, 158, 11, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #f59e0b; font-weight: 600;">
                    ⏰ This message will be fully revealed in ${timeRemaining}
                </p>
            </div>
        `;
    }

    content += `
        <div class="modal-message-actions">
            <button class="delete-btn" onclick="deleteMessage(${msg.id})">Delete Message</button>
        </div>
    `;

    document.getElementById('modalBody').innerHTML = content;
    messageModal.classList.add('active');
}

function closeMessageModal() {
    messageModal.classList.remove('active');
}

function deleteMessage(id) {
    if (confirm('Are you sure you want to delete this message?')) {
        messages = messages.filter(m => m.id !== id);
        saveMessages();
        renderMessages();
        closeMessageModal();
        showNotification('Message deleted.', 'info');
    }
}

function handleClearAll() {
    if (messages.length === 0) {
        showNotification('No messages to clear.', 'info');
        return;
    }

    if (confirm('Are you sure you want to delete ALL messages? This cannot be undone!')) {
        messages = [];
        saveMessages();
        renderMessages();
        showNotification('All messages cleared.', 'info');
    }
}

// Theme Toggle
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon();
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        updateThemeIcon();
    } else {
        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            updateThemeIcon();
        }
    }
}

function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = `<span class="theme-icon">${isDark ? '☀️' : '🌙'}</span>`;
}

// Quote Rotation
function rotateQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = `"${randomQuote.text}"`;
    quoteAuthor.textContent = `— ${randomQuote.author}`;

    quoteText.style.animation = 'none';
    setTimeout(() => {
        quoteText.style.animation = '';
    }, 10);
}

// Countdown Logic
function isMessageUnlocked(msg) {
    return new Date(msg.revealDate) <= new Date();
}

function getTimeRemaining(revealDate) {
    const now = new Date();
    const diff = revealDate - now;

    if (diff <= 0) {
        return 'Ready to reveal!';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function updateCountdowns() {
    document.querySelectorAll('.countdown').forEach(el => {
        const msgId = el.dataset.id;
        const msg = messages.find(m => m.id == msgId);
        if (msg) {
            el.textContent = getTimeRemaining(new Date(msg.revealDate));
        }
    });

    // Check if any messages need to be unlocked
    let needsUpdate = false;
    messages.forEach(msg => {
        if (!msg.isRead && isMessageUnlocked(msg)) {
            needsUpdate = true;
            msg.isRead = true;
        }
    });

    if (needsUpdate) {
        renderMessages();
        saveMessages();
    }
}

// Progress Calculation
function getProgress(msg) {
    const created = new Date(msg.created);
    const reveal = new Date(msg.revealDate);
    const now = new Date();

    const totalTime = reveal - created;
    const elapsedTime = now - created;

    return Math.min(100, (elapsedTime / totalTime) * 100);
}

// Utility Functions
function formatDate(date) {
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveMessages() {
    localStorage.setItem('futureMessages', JSON.stringify(messages));
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        animation: slideInUp 0.3s ease;
        font-weight: 600;
        max-width: 300px;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function setMinimumDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    futureDate.min = `${year}-${month}-${day}T${hours}:${minutes}`;
    futureDate.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMessageModal();
    }
});
