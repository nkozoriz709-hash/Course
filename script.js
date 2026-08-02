// ============================================================
//  КОНФИГУРАЦИЯ JSONBIN
// ============================================================
const JSONBIN_CONFIG = {
    binId: '6a6fc99dda38895dfeb12e33',
    apiKey: '$2a$10$Q7f3EYrK6RyG37RtKdGbEuinxBtsHPBttKVALqQNjIBNjmub5W2y2',
    baseUrl: 'https://api.jsonbin.io/v3/b'
};

// ============================================================
//  РАБОТА С JSONBIN
// ============================================================
const DB = {
    async load() {
        try {
            const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`, {
                headers: { 'X-Master-Key': JSONBIN_CONFIG.apiKey }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return data.record;
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            throw error;
        }
    },

    async save(data) {
        try {
            const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_CONFIG.apiKey
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('❌ Ошибка сохранения данных:', error);
            throw error;
        }
    }
};

// ============================================================
//  СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ============================================================
const STATE = {
    currentUser: null,
    currentLanguage: null,
    currentLesson: null,
    isMobile: window.innerWidth <= 768,
    currentTheme: 'light',
    isTrialMode: false,
    trialLanguage: null,
    selectedLanguage: null,
    data: null
};

// ============================================================
//  DOM ССЫЛКИ
// ============================================================
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const DOM = {
    loadingOverlay: $('loadingOverlay'),
    authContainer: $('auth-container'),
    mainContent: $('main-content'),
    loginTab: $('login-tab'),
    registerTab: $('register-tab'),
    loginForm: $('login-form'),
    registerForm: $('register-form'),
    switchToRegister: $('switch-to-register'),
    switchToLogin: $('switch-to-login'),
    loginEmail: $('login-email'),
    loginPassword: $('login-password'),
    registerName: $('register-name'),
    registerEmail: $('register-email'),
    registerPassword: $('register-password'),
    registerConfirmPassword: $('register-confirm-password'),
    loginBtn: $('login-btn'),
    registerBtn: $('register-btn'),
    loginError: $('login-error'),
    registerError: $('register-error'),
    registerSuccess: $('register-success'),
    userMenuBtn: $('user-menu-btn'),
    usernameDisplay: $('username-display'),
    userModal: $('user-modal'),
    closeUserModal: $('close-user-modal'),
    userModalName: $('user-modal-name'),
    userModalEmail: $('user-modal-email'),
    userRegDate: $('user-reg-date'),
    russianAccess: $('russian-access'),
    englishAccess: $('english-access'),
    russianProgress: $('russian-progress'),
    englishProgress: $('english-progress'),
    russianProgressBar: $('russian-progress-bar'),
    englishProgressBar: $('english-progress-bar'),
    logoutBtn: $('logout-btn'),
    trialRussianBtn: $('trial-russian-btn'),
    trialEnglishBtn: $('trial-english-btn'),
    russianBtn: $('russian-btn'),
    englishBtn: $('english-btn'),
    lessonsList: $('lessons-list'),
    currentLanguage: $('current-language'),
    passwordModal: $('password-modal'),
    passwordInput: $('password-input'),
    togglePassword: $('toggle-password'),
    modalMessage: $('modal-message'),
    passwordError: $('password-error'),
    submitPassword: $('submit-password'),
    cancelPassword: $('cancel-password'),
    closeModal: $('close-modal'),
    videoPlayer: $('video-player'),
    videoOverlay: $('video-overlay'),
    youtubeVideo: $('youtube-video'),
    lessonTitle: $('lesson-title'),
    closePlayer: $('close-player'),
    backToLessons: $('back-to-lessons'),
    notesLink: $('notes-link'),
    materialsTitle: $('materials-title'),
    themeToggle: $('theme-toggle'),
    adminLink: document.querySelector('.admin-link')
};

// ============================================================
//  УТИЛИТЫ
// ============================================================
function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) { return dateString; }
}

function hashPassword(password) {
    return btoa(encodeURIComponent(password));
}

function decodePassword(hashed) {
    try { return decodeURIComponent(atob(hashed)); } catch { return hashed; }
}

function showLoading(show) {
    DOM.loadingOverlay.classList.toggle('active', show);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 99999;
        padding: 14px 24px; border-radius: 12px; 
        background: ${type === 'success' ? 'var(--gradient-success)' : 
                   type === 'error' ? 'var(--gradient-secondary)' : 
                   'var(--gradient-primary)'};
        color: white; font-weight: 500; font-size: 0.95rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease; max-width: 400px;
        display: flex; align-items: center; gap: 12px;
    `;
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${escapeHTML(message)}</span>
        <button style="background:none;border:none;color:rgba(255,255,255,0.7);font-size:1.2rem;cursor:pointer;margin-left:auto;">×</button>
    `;
    document.body.appendChild(toast);
    toast.querySelector('button').addEventListener('click', () => toast.remove());
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = '0.3s';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4500);
}

// ============================================================
//  ТЕМА
// ============================================================
function setTheme(theme) {
    STATE.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('online-courses-theme', theme);
    
    const moon = DOM.themeToggle.querySelector('.fa-moon');
    const sun = DOM.themeToggle.querySelector('.fa-sun');
    if (theme === 'dark') {
        if (moon) moon.style.opacity = '0.5';
        if (sun) sun.style.opacity = '1';
    } else {
        if (moon) moon.style.opacity = '1';
        if (sun) sun.style.opacity = '0.5';
    }
}

function toggleTheme() {
    const newTheme = STATE.currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// ============================================================
//  АВТОРИЗАЦИЯ
// ============================================================
function showAuthForms() {
    DOM.authContainer.style.display = 'block';
    DOM.mainContent.style.display = 'none';
    DOM.mainContent.classList.add('hidden');
    DOM.userMenuBtn.style.display = 'none';
}

function showMainContent() {
    DOM.authContainer.style.display = 'none';
    DOM.mainContent.style.display = 'block';
    DOM.mainContent.classList.remove('hidden');
    DOM.userMenuBtn.style.display = 'flex';
    updateUserDisplay();
    showInitialMessage();
}

function updateUserDisplay() {
    if (STATE.currentUser) {
        DOM.usernameDisplay.textContent = STATE.currentUser.name;
        updateUserModal();
    }
}

function updateUserModal() {
    if (!STATE.currentUser) return;
    const user = STATE.currentUser;
    DOM.userModalName.textContent = user.name;
    DOM.userModalEmail.textContent = user.email;
    DOM.userRegDate.textContent = formatDate(user.registeredAt);

    DOM.russianProgress.textContent = `${user.progress?.russian || 0}%`;
    DOM.englishProgress.textContent = `${user.progress?.english || 0}%`;
    DOM.russianProgressBar.style.width = `${user.progress?.russian || 0}%`;
    DOM.englishProgressBar.style.width = `${user.progress?.english || 0}%`;

    if (user.unlockedLanguages?.russian) {
        DOM.russianAccess.textContent = 'Доступ открыт';
        DOM.russianAccess.classList.add('unlocked');
    } else {
        DOM.russianAccess.textContent = 'Заблокирован';
        DOM.russianAccess.classList.remove('unlocked');
    }

    if (user.unlockedLanguages?.english) {
        DOM.englishAccess.textContent = 'Доступ открыт';
        DOM.englishAccess.classList.add('unlocked');
    } else {
        DOM.englishAccess.textContent = 'Заблокирован';
        DOM.englishAccess.classList.remove('unlocked');
    }
}

function showInitialMessage() {
    DOM.currentLanguage.textContent = 'Выберите курс для просмотра уроков';
    DOM.lessonsList.innerHTML = `
        <div class="select-course-message">
            <i class="fas fa-key"></i>
            <h3>Доступ к урокам защищен паролем</h3>
            <p>Выберите курс и введите пароль для просмотра уроков</p>
        </div>
    `;
}

// ============================================================
//  ВХОД / РЕГИСТРАЦИЯ
// ============================================================
async function login() {
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value.trim();

    if (!email || !password) {
        DOM.loginError.textContent = 'Заполните все поля';
        DOM.loginError.classList.add('active');
        return;
    }

    showLoading(true);
    try {
        const data = await DB.load();
        STATE.data = data;

        const user = data.users[email];
        if (!user) {
            DOM.loginError.textContent = 'Пользователь не найден';
            DOM.loginError.classList.add('active');
            return;
        }

        if (user.password !== hashPassword(password)) {
            DOM.loginError.textContent = 'Неверный пароль';
            DOM.loginError.classList.add('active');
            return;
        }

        STATE.currentUser = user;
        localStorage.setItem('online-courses-current-user', email);
        showMainContent();
        showToast('Добро пожаловать, ' + user.name + '!', 'success');

    } catch (error) {
        showToast('Ошибка входа: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function register() {
    const name = DOM.registerName.value.trim();
    const email = DOM.registerEmail.value.trim();
    const password = DOM.registerPassword.value.trim();
    const confirm = DOM.registerConfirmPassword.value.trim();

    if (!name || !email || !password || !confirm) {
        DOM.registerError.textContent = 'Заполните все поля';
        DOM.registerError.classList.add('active');
        return;
    }

    if (password.length < 6) {
        DOM.registerError.textContent = 'Пароль должен быть минимум 6 символов';
        DOM.registerError.classList.add('active');
        return;
    }

    if (password !== confirm) {
        DOM.registerError.textContent = 'Пароли не совпадают';
        DOM.registerError.classList.add('active');
        return;
    }

    showLoading(true);
    try {
        const data = await DB.load();
        STATE.data = data;

        if (data.users[email]) {
            DOM.registerError.textContent = 'Пользователь с таким email уже существует';
            DOM.registerError.classList.add('active');
            return;
        }

        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: name,
            email: email,
            password: hashPassword(password),
            registeredAt: new Date().toISOString(),
            unlockedLanguages: { russian: false, english: false },
            progress: { russian: 0, english: 0 },
            lessonProgress: { russian: {}, english: {} }
        };

        data.users[email] = newUser;
        await DB.save(data);

        STATE.data = data;
        STATE.currentUser = newUser;
        localStorage.setItem('online-courses-current-user', email);

        DOM.registerError.classList.remove('active');
        DOM.registerSuccess.textContent = 'Регистрация успешна! Добро пожаловать!';
        DOM.registerSuccess.classList.add('active');

        setTimeout(() => {
            showMainContent();
            showToast('Добро пожаловать, ' + name + '!', 'success');
        }, 500);

    } catch (error) {
        showToast('Ошибка регистрации: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function logout() {
    STATE.currentUser = null;
    localStorage.removeItem('online-courses-current-user');
    showAuthForms();
    showToast('Вы вышли из системы', 'info');
}

// ============================================================
//  КУРСЫ И УРОКИ
// ============================================================
function getLessons(language) {
    return STATE.data?.lessons?.filter(l => l.language === language) || [];
}

function renderLessons(language) {
    const lessons = getLessons(language);
    const courseName = language === 'russian' ? 'Русский язык' : 'Английский язык';

    DOM.currentLanguage.textContent = `${courseName} - Уроки`;

    if (!lessons.length) {
        DOM.lessonsList.innerHTML = `
            <div class="select-course-message">
                <i class="fas fa-book"></i>
                <h3>Уроков пока нет</h3>
                <p>Добавьте уроки через админ-панель</p>
            </div>
        `;
        return;
    }

    DOM.lessonsList.innerHTML = lessons.map((lesson, index) => `
        <div class="lesson-card" data-id="${lesson.id}" data-language="${language}">
            <div class="lesson-number">${index + 1}</div>
            <h3>${escapeHTML(lesson.title)}</h3>
            <p>${escapeHTML(lesson.description || '')}</p>
            <div class="lesson-meta">
                <span><i class="far fa-clock"></i> ${lesson.duration || '—'}</span>
                <span><i class="fas fa-play"></i> Смотреть</span>
            </div>
        </div>
    `).join('');

    // Обработчики кликов на уроки
    DOM.lessonsList.querySelectorAll('.lesson-card').forEach(card => {
        card.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const lang = this.dataset.language;
            const lesson = getLessons(lang).find(l => l.id === id);
            if (lesson) openVideoPlayer(lesson, lang);
        });
    });
}

// ============================================================
//  ПАРОЛЬНЫЙ ДОСТУП
// ============================================================
function requestLanguageAccess(language) {
    if (!STATE.currentUser) {
        showToast('Войдите в аккаунт', 'warning');
        return;
    }

    if (STATE.currentUser.unlockedLanguages?.[language]) {
        renderLessons(language);
        STATE.currentLanguage = language;
        updateLanguageButtons(language);
        return;
    }

    STATE.selectedLanguage = language;
    DOM.modalMessage.textContent = `Введите пароль для доступа к курсу "${language === 'russian' ? 'Русский язык' : 'Английский язык'}"`;
    DOM.passwordInput.value = '';
    DOM.passwordError.classList.remove('active');
    DOM.passwordModal.classList.remove('hidden');
    setTimeout(() => DOM.passwordModal.classList.add('active'), 10);
    DOM.passwordInput.focus();
}

function closePasswordModal() {
    DOM.passwordModal.classList.remove('active');
    setTimeout(() => DOM.passwordModal.classList.add('hidden'), 300);
    DOM.passwordInput.value = '';
    DOM.passwordError.classList.remove('active');
}

async function submitPassword() {
    const password = DOM.passwordInput.value.trim();
    const language = STATE.selectedLanguage;

    if (!password) {
        DOM.passwordError.textContent = 'Введите пароль';
        DOM.passwordError.classList.add('active');
        return;
    }

    const settings = STATE.data?.settings || {};
    const correctPassword = language === 'russian' ? settings.russianPassword : settings.englishPassword;

    if (password === correctPassword) {
        // Разблокируем курс
        const email = STATE.currentUser.email;
        STATE.data.users[email].unlockedLanguages[language] = true;
        STATE.currentUser.unlockedLanguages[language] = true;

        try {
            await DB.save(STATE.data);
            closePasswordModal();
            renderLessons(language);
            STATE.currentLanguage = language;
            updateLanguageButtons(language);
            updateUserModal();
            showToast('Доступ к курсу открыт!', 'success');
        } catch (error) {
            showToast('Ошибка сохранения: ' + error.message, 'error');
        }
    } else {
        DOM.passwordError.textContent = 'Неверный пароль. Попробуйте снова.';
        DOM.passwordError.classList.add('active');
        DOM.passwordInput.classList.add('shake');
        setTimeout(() => DOM.passwordInput.classList.remove('shake'), 500);
        DOM.passwordInput.value = '';
        DOM.passwordInput.focus();
    }
}

function updateLanguageButtons(language) {
    DOM.russianBtn.classList.toggle('active', language === 'russian');
    DOM.englishBtn.classList.toggle('active', language === 'english');
}

// ============================================================
//  ВИДЕО ПЛЕЕР
// ============================================================
function openVideoPlayer(lesson, language) {
    STATE.currentLesson = lesson;
    DOM.lessonTitle.textContent = lesson.title;

    if (lesson.notesUrl) {
        DOM.notesLink.href = lesson.notesUrl;
        DOM.notesLink.style.display = 'flex';
        DOM.materialsTitle.style.display = 'flex';
    } else {
        DOM.notesLink.style.display = 'none';
        DOM.materialsTitle.style.display = 'none';
    }

    DOM.youtubeVideo.src = `https://www.youtube.com/embed/${lesson.videoId}?rel=0&playsinline=1&enablejsapi=1`;

    DOM.videoOverlay.classList.remove('hidden');
    setTimeout(() => DOM.videoOverlay.classList.add('active'), 10);

    DOM.videoPlayer.classList.remove('hidden');
}

function closeVideoPlayer() {
    DOM.videoOverlay.classList.remove('active');
    setTimeout(() => DOM.videoOverlay.classList.add('hidden'), 300);
    DOM.videoPlayer.classList.add('hidden');
    DOM.youtubeVideo.src = '';
}

// ============================================================
//  ПРОБНЫЙ РЕЖИМ
// ============================================================
function enterTrialMode(language) {
    if (!STATE.currentUser) {
        showToast('Войдите в аккаунт', 'warning');
        return;
    }

    STATE.isTrialMode = true;
    STATE.trialLanguage = language;
    closeUserModal();

    const lessons = getLessons(language);
    if (!lessons.length) {
        showToast('Уроков для пробного доступа нет', 'warning');
        return;
    }

    // Показываем только первый урок
    const trialLessons = [lessons[0]];
    const courseName = language === 'russian' ? 'Русский язык' : 'Английский язык';

    DOM.currentLanguage.innerHTML = `${courseName} - Пробный урок <span class="trial-badge">ПРОБНЫЙ</span>`;

    DOM.lessonsList.innerHTML = `
        <div class="trial-message">
            <i class="fas fa-info-circle"></i>
            <strong>Пробный режим:</strong> Доступен только первый урок. Для полного доступа введите пароль.
        </div>
        ${trialLessons.map((lesson, index) => `
            <div class="lesson-card trial-available" data-id="${lesson.id}" data-language="${language}">
                <div class="lesson-number">${index + 1}</div>
                <h3>${escapeHTML(lesson.title)} <span class="trial-badge">ПРОБНЫЙ</span></h3>
                <p>${escapeHTML(lesson.description || '')}</p>
                <div class="lesson-meta">
                    <span><i class="far fa-clock"></i> ${lesson.duration || '—'}</span>
                    <span><i class="fas fa-play"></i> Смотреть</span>
                </div>
            </div>
        `).join('')}
        ${lessons.length > 1 ? `
            <div class="lesson-card trial-locked">
                <div class="lesson-number">2</div>
                <h3>Остальные уроки заблокированы</h3>
                <p>Введите пароль для полного доступа к курсу</p>
                <div class="lesson-meta">
                    <span><i class="fas fa-lock"></i> Требуется пароль</span>
                </div>
            </div>
        ` : ''}
    `;

    // Обработчики на пробные уроки
    DOM.lessonsList.querySelectorAll('.lesson-card.trial-available').forEach(card => {
        card.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const lang = this.dataset.language;
            const lesson = getLessons(lang).find(l => l.id === id);
            if (lesson) openVideoPlayer(lesson, lang);
        });
    });

    STATE.currentLanguage = language;
    updateLanguageButtons(language);
}

// ============================================================
//  ЛИЧНЫЙ КАБИНЕТ
// ============================================================
function openUserModal() {
    updateUserModal();
    DOM.userModal.classList.remove('hidden');
    setTimeout(() => DOM.userModal.classList.add('active'), 10);
}

function closeUserModal() {
    DOM.userModal.classList.remove('active');
    setTimeout(() => DOM.userModal.classList.add('hidden'), 300);
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================
async function init() {
    console.log('🚀 Загрузка приложения...');
    showLoading(true);

    try {
        STATE.data = await DB.load();
        console.log('✅ Данные загружены');

        const savedTheme = localStorage.getItem('online-courses-theme') || 'light';
        setTheme(savedTheme);

        const savedUser = localStorage.getItem('online-courses-current-user');
        if (savedUser && STATE.data.users[savedUser]) {
            STATE.currentUser = STATE.data.users[savedUser];
            showMainContent();
        } else {
            showAuthForms();
        }

        bindEvents();
        console.log('✅ Приложение готово');
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showToast('Ошибка загрузки данных. Проверьте интернет.', 'error');
        showAuthForms();
    } finally {
        showLoading(false);
    }
}

// ============================================================
//  СОБЫТИЯ
// ============================================================
function bindEvents() {
    // Вкладки авторизации
    DOM.loginTab.addEventListener('click', () => {
        DOM.loginTab.classList.add('active');
        DOM.registerTab.classList.remove('active');
        DOM.loginForm.classList.add('active');
        DOM.registerForm.classList.remove('active');
        DOM.loginError.classList.remove('active');
        DOM.registerError.classList.remove('active');
        DOM.registerSuccess.classList.remove('active');
    });

    DOM.registerTab.addEventListener('click', () => {
        DOM.registerTab.classList.add('active');
        DOM.loginTab.classList.remove('active');
        DOM.registerForm.classList.add('active');
        DOM.loginForm.classList.remove('active');
        DOM.loginError.classList.remove('active');
        DOM.registerError.classList.remove('active');
        DOM.registerSuccess.classList.remove('active');
    });

    DOM.switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.registerTab.click();
    });

    DOM.switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.loginTab.click();
    });

    // Кнопки входа/регистрации
    DOM.loginBtn.addEventListener('click', login);
    DOM.registerBtn.addEventListener('click', register);

    // Enter
    DOM.loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    DOM.registerConfirmPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') register();
    });

    // Показать/скрыть пароль
    $$('.toggle-password-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = document.getElementById(this.dataset.target);
            if (target) {
                const type = target.type === 'password' ? 'text' : 'password';
                target.type = type;
                this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            }
        });
    });

    // Курсы
    DOM.russianBtn.addEventListener('click', () => requestLanguageAccess('russian'));
    DOM.englishBtn.addEventListener('click', () => requestLanguageAccess('english'));

    // Пароль
    DOM.submitPassword.addEventListener('click', submitPassword);
    DOM.cancelPassword.addEventListener('click', closePasswordModal);
    DOM.closeModal.addEventListener('click', closePasswordModal);
    DOM.passwordModal.addEventListener('click', (e) => {
        if (e.target === DOM.passwordModal) closePasswordModal();
    });
    DOM.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitPassword();
    });
    DOM.passwordInput.addEventListener('input', () => {
        DOM.passwordError.classList.remove('active');
    });
    DOM.togglePassword.addEventListener('click', () => {
        const type = DOM.passwordInput.type === 'password' ? 'text' : 'password';
        DOM.passwordInput.type = type;
        DOM.togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Видео
    DOM.closePlayer.addEventListener('click', closeVideoPlayer);
    DOM.backToLessons.addEventListener('click', closeVideoPlayer);
    DOM.videoOverlay.addEventListener('click', closeVideoPlayer);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!DOM.videoPlayer.classList.contains('hidden')) closeVideoPlayer();
            if (!DOM.passwordModal.classList.contains('hidden')) closePasswordModal();
            if (!DOM.userModal.classList.contains('hidden')) closeUserModal();
        }
    });

    // Личный кабинет
    DOM.userMenuBtn.addEventListener('click', openUserModal);
    DOM.closeUserModal.addEventListener('click', closeUserModal);
    DOM.userModal.addEventListener('click', (e) => {
        if (e.target === DOM.userModal) closeUserModal();
    });
    DOM.logoutBtn.addEventListener('click', logout);

    // Пробный период
    DOM.trialRussianBtn.addEventListener('click', () => enterTrialMode('russian'));
    DOM.trialEnglishBtn.addEventListener('click', () => enterTrialMode('english'));

    // Тема
    DOM.themeToggle.addEventListener('click', toggleTheme);

    // Закрытие модальных по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!DOM.userModal.classList.contains('hidden')) closeUserModal();
        }
    });

    // Скрываем ошибки при вводе
    DOM.loginEmail.addEventListener('input', () => DOM.loginError.classList.remove('active'));
    DOM.loginPassword.addEventListener('input', () => DOM.loginError.classList.remove('active'));
    DOM.registerName.addEventListener('input', () => {
        DOM.registerError.classList.remove('active');
        DOM.registerSuccess.classList.remove('active');
    });
    DOM.registerEmail.addEventListener('input', () => {
        DOM.registerError.classList.remove('active');
        DOM.registerSuccess.classList.remove('active');
    });
    DOM.registerPassword.addEventListener('input', () => {
        DOM.registerError.classList.remove('active');
        DOM.registerSuccess.classList.remove('active');
    });
    DOM.registerConfirmPassword.addEventListener('input', () => {
        DOM.registerError.classList.remove('active');
        DOM.registerSuccess.classList.remove('active');
    });
}

// ============================================================
//  ЗАПУСК
// ============================================================
document.addEventListener('DOMContentLoaded', init);