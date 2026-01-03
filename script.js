// Онлайн курсы - основной скрипт с системой пользователей
(function() {
    'use strict';
    
    // Конфигурация
    const CONFIG = {
        youtubeEmbedUrl: 'https://www.youtube.com/embed',
        youtubeParams: 'rel=0&playsinline=1&enablejsapi=1',
        mobileBreakpoint: 768,
        animationDuration: 300,
        saveScrollPosition: true,
        defaultTheme: 'light',
        // Пароли для доступа к курсам
        passwords: {
            russian: '65446',
            english: '13345'
        },
        // Минимальная длина пароля
        minPasswordLength: 6
    };
    
    // Состояние приложения
    const STATE = {
        currentUser: null,
        currentLanguage: null,
        currentLesson: null,
        isMobile: false,
        isVideoPlaying: false,
        scrollPosition: 0,
        currentTheme: CONFIG.defaultTheme,
        selectedLanguage: null // Язык, который пытаются выбрать
    };
    
    // Кэш DOM элементов
    const DOM = {
        // Основные элементы
        body: document.body,
        container: document.querySelector('.container'),
        html: document.documentElement,
        
        // Контейнеры
        authContainer: document.getElementById('auth-container'),
        mainContent: document.getElementById('main-content'),
        
        // Кнопки личного кабинета
        userMenuBtn: document.getElementById('user-menu-btn'),
        usernameDisplay: document.getElementById('username-display'),
        
        // Формы авторизации
        loginTab: document.getElementById('login-tab'),
        registerTab: document.getElementById('register-tab'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        switchToRegister: document.getElementById('switch-to-register'),
        switchToLogin: document.getElementById('switch-to-login'),
        
        // Поля форм
        loginEmail: document.getElementById('login-email'),
        loginPassword: document.getElementById('login-password'),
        registerName: document.getElementById('register-name'),
        registerEmail: document.getElementById('register-email'),
        registerPassword: document.getElementById('register-password'),
        registerConfirmPassword: document.getElementById('register-confirm-password'),
        
        // Кнопки
        loginBtn: document.getElementById('login-btn'),
        registerBtn: document.getElementById('register-btn'),
        
        // Сообщения об ошибках
        loginError: document.getElementById('login-error'),
        registerError: document.getElementById('register-error'),
        
        // Кнопки языков
        russianBtn: document.getElementById('russian-btn'),
        englishBtn: document.getElementById('english-btn'),
        
        // Контейнер уроков
        lessonsContainer: document.querySelector('.lessons-container'),
        lessonsList: document.getElementById('lessons-list'),
        currentLanguageTitle: document.getElementById('current-language'),
        
        // Видео плеер и overlay
        videoPlayer: document.getElementById('video-player'),
        videoOverlay: document.getElementById('video-overlay'),
        youtubeVideo: document.getElementById('youtube-video'),
        lessonTitle: document.getElementById('lesson-title'),
        closePlayerBtn: document.getElementById('close-player'),
        backToLessonsBtn: document.getElementById('back-to-lessons'),
        
        // Материалы урока
        materialsTitle: document.getElementById('materials-title'),
        notesLink: document.getElementById('notes-link'),
        
        // Переключатель темы
        themeToggle: document.getElementById('theme-toggle'),
        themeBall: document.querySelector('.theme-ball'),
        
        // Модальное окно пароля
        passwordModal: document.getElementById('password-modal'),
        passwordInput: document.getElementById('password-input'),
        togglePasswordBtn: document.getElementById('toggle-password'),
        modalMessage: document.getElementById('modal-message'),
        passwordError: document.getElementById('password-error'),
        submitPasswordBtn: document.getElementById('submit-password'),
        cancelPasswordBtn: document.getElementById('cancel-password'),
        closeModalBtn: document.getElementById('close-modal'),
        
        // Модальное окно личного кабинета
        userModal: document.getElementById('user-modal'),
        closeUserModalBtn: document.getElementById('close-user-modal'),
        userModalName: document.getElementById('user-modal-name'),
        userModalEmail: document.getElementById('user-modal-email'),
        userRegDate: document.getElementById('user-reg-date'),
        russianProgress: document.getElementById('russian-progress'),
        englishProgress: document.getElementById('english-progress'),
        russianProgressBar: document.getElementById('russian-progress-bar'),
        englishProgressBar: document.getElementById('english-progress-bar'),
        russianAccess: document.getElementById('russian-access'),
        englishAccess: document.getElementById('english-access'),
        logoutBtn: document.getElementById('logout-btn'),
        
        // Прогресс
        progressBars: []
    };
    
    // Система пользователей
    const UserSystem = {
        // Хранение пользователей (в реальном проекте было бы на сервере)
        users: {},
        
        // Инициализация системы
        init: function() {
            this.loadUsers();
        },
        
        // Загрузка пользователей из localStorage
        loadUsers: function() {
            try {
                const usersData = localStorage.getItem('online-courses-users');
                if (usersData) {
                    this.users = JSON.parse(usersData);
                }
                return true;
            } catch (e) {
                console.warn('Ошибка загрузки пользователей:', e);
                this.users = {};
                return false;
            }
        },
        
        // Сохранение пользователей в localStorage
        saveUsers: function() {
            try {
                localStorage.setItem('online-courses-users', JSON.stringify(this.users));
                return true;
            } catch (e) {
                console.warn('Ошибка сохранения пользователей:', e);
                return false;
            }
        },
        
        // Регистрация нового пользователя
        register: function(name, email, password) {
            // Проверка существующего пользователя
            if (this.users[email]) {
                return { success: false, message: 'Пользователь с таким email уже существует' };
            }
            
            // Создание нового пользователя
            const userId = this.generateUserId();
            const newUser = {
                id: userId,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: this.hashPassword(password),
                registeredAt: new Date().toISOString(),
                unlockedLanguages: {
                    russian: false,
                    english: false
                },
                progress: {
                    russian: 0,
                    english: 0
                },
                lessonProgress: {}
            };
            
            // Сохранение пользователя
            this.users[email.toLowerCase().trim()] = newUser;
            
            if (this.saveUsers()) {
                return { success: true, user: newUser };
            } else {
                return { success: false, message: 'Ошибка при сохранении пользователя' };
            }
        },
        
        // Авторизация пользователя
        login: function(email, password) {
            const user = this.users[email.toLowerCase().trim()];
            
            if (!user) {
                return { success: false, message: 'Пользователь не найден' };
            }
            
            if (user.password !== this.hashPassword(password)) {
                return { success: false, message: 'Неверный пароль' };
            }
            
            return { success: true, user: user };
        },
        
        // Выход пользователя
        logout: function() {
            STATE.currentUser = null;
            this.saveCurrentUser();
            return true;
        },
        
        // Сохранение текущего пользователя
        saveCurrentUser: function() {
            if (STATE.currentUser) {
                // Обновляем пользователя в системе
                this.users[STATE.currentUser.email] = STATE.currentUser;
                this.saveUsers();
                
                // Сохраняем текущего пользователя в localStorage
                try {
                    localStorage.setItem('online-courses-current-user', STATE.currentUser.email);
                    return true;
                } catch (e) {
                    console.warn('Ошибка сохранения текущего пользователя:', e);
                    return false;
                }
            } else {
                // Удаляем текущего пользователя из localStorage
                localStorage.removeItem('online-courses-current-user');
                return true;
            }
        },
        
        // Загрузка текущего пользователя
        loadCurrentUser: function() {
            try {
                const userEmail = localStorage.getItem('online-courses-current-user');
                if (userEmail && this.users[userEmail]) {
                    STATE.currentUser = this.users[userEmail];
                    return true;
                }
                return false;
            } catch (e) {
                console.warn('Ошибка загрузки текущего пользователя:', e);
                return false;
            }
        },
        
        // Разблокировка курса для пользователя
        unlockCourse: function(userEmail, language) {
            const user = this.users[userEmail];
            if (user && ['russian', 'english'].includes(language)) {
                user.unlockedLanguages[language] = true;
                this.users[userEmail] = user;
                this.saveUsers();
                
                // Обновляем текущего пользователя если он авторизован
                if (STATE.currentUser && STATE.currentUser.email === userEmail) {
                    STATE.currentUser = user;
                }
                
                return true;
            }
            return false;
        },
        
        // Обновление прогресса пользователя
        updateProgress: function(userEmail, language, progress) {
            const user = this.users[userEmail];
            if (user && ['russian', 'english'].includes(language)) {
                user.progress[language] = Math.max(user.progress[language] || 0, progress);
                this.users[userEmail] = user;
                this.saveUsers();
                
                // Обновляем текущего пользователя если он авторизован
                if (STATE.currentUser && STATE.currentUser.email === userEmail) {
                    STATE.currentUser = user;
                }
                
                return true;
            }
            return false;
        },
        
        // Обновление прогресса урока
        updateLessonProgress: function(userEmail, language, lessonId, progress) {
            const user = this.users[userEmail];
            if (user) {
                if (!user.lessonProgress) user.lessonProgress = {};
                if (!user.lessonProgress[language]) user.lessonProgress[language] = {};
                
                user.lessonProgress[language][lessonId] = Math.max(
                    user.lessonProgress[language][lessonId] || 0, 
                    progress
                );
                
                this.users[userEmail] = user;
                this.saveUsers();
                
                // Обновляем текущего пользователя если он авторизован
                if (STATE.currentUser && STATE.currentUser.email === userEmail) {
                    STATE.currentUser = user;
                }
                
                return true;
            }
            return false;
        },
        
        // Генерация ID пользователя
        generateUserId: function() {
            return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        // Хеширование пароля (упрощенное для демонстрации)
        hashPassword: function(password) {
            // В реальном проекте используйте bcrypt или другой алгоритм хеширования
            return btoa(encodeURIComponent(password)); // Просто для демонстрации
        },
        
        // Проверка сложности пароля
        validatePassword: function(password) {
            if (password.length < CONFIG.minPasswordLength) {
                return { valid: false, message: `Пароль должен содержать минимум ${CONFIG.minPasswordLength} символов` };
            }
            return { valid: true, message: '' };
        }
    };
    
    // Данные курсов
    const COURSES_DATA = {
        russian: {
            title: "Русский язык",
            icon: "fa-book",
            color: "#4a6fa5",
            lessons: [
                {
                    id: 1,
                    title: "Фонетика",
                    description: "",
                    videoId: "MOOxkGH2nto",
                    notesUrl: "https://disk.yandex.by/i/Utakin8_aMd3-Q",
                    duration: "1:32"
                },
                {
                    id: 2,
                    title: "Лексика",
                    description: "",
                    videoId: "v0oHIb51oA8", 
                    notesUrl: "https://disk.yandex.by/i/34CQbWalAtZzxw",
                    duration: "1:30"
                },
                {
                    id: 3,
                    title: "Именные части речи",
                    description: "",
                    videoId: "YI3ai5StduE",
                    notesUrl: "https://disk.yandex.by/i/g11IYA-4g4yGMg",
                    duration: "1:36"
                },
                {
                    id: 4,
                    title: "Глагол",
                    description: "",
                    videoId: "osw1YXAZfV4", 
                    notesUrl: "https://disk.yandex.by/i/_jLmVy837mr5rw",
                    duration: "1:45"
                },
                {
                    id: 5,
                    title: "Служебные части речи",
                    description: "",
                    videoId: "G7CjRq3lgtc", 
                    notesUrl: "https://disk.yandex.by/i/ju3MrvCjFyCWlA",
                    duration: "1:32"
                },
                {
                    id: 6,
                    title: "Состав слова",
                    description: "",
                    videoId: "fS2G1QS0We4",
                    notesUrl: "https://disk.yandex.by/i/CosVVXrZuJKGmg",
                    duration: "1:33"
                },
                {
                    id: 7,
                    title: "Образование слов",
                    description: "",
                    videoId: "OwqALgOkGWw", 
                    notesUrl: "https://disk.yandex.by/i/AFPan-BAgo1vig",
                    duration: "1:31"
                },
                {
                    id: 8,
                    title: "Правописание гласных",
                    description: "",
                    videoId: "wX5P4w1f1Z0",
                    notesUrl: "https://disk.yandex.by/i/VA6MOB-HH6rZEw",
                    duration: "1:27"
                },
                {
                    id: 9,
                    title: "Правописание о-ё после шипящих, ы-и после ц и приставоок",
                    description: "",
                    videoId: "5Dr7EbhIfKU", 
                    notesUrl: "https://disk.yandex.by/i/ZLjF5Tbw4Hvj1g",
                    duration: "1:31"
                },
                {
                    id: 10,
                    title: "Правописание согласных, приставок",
                    description: "",
                    videoId: "WDBi1CeMHog",
                    notesUrl: "https://disk.yandex.by/i/Vbyr4SfGx-a_Yw",
                    duration: "1:29"
                },
                {
                    id: 11,
                    title: "Правописание Ъ и Ь",
                    description: "",
                    videoId: "oCgV83sep-c", 
                    notesUrl: "https://disk.yandex.by/i/rBG79u5LXMzNmA",
                    duration: "1:32"
                },
                {
                    id: 12,
                    title: "Правописание существительный и прилагательных",
                    description: "",
                    videoId: "g3k0O0LrLqs", 
                    notesUrl: "https://disk.yandex.by/i/FGr50Rkkdcf76A",
                    duration: "1:29"
                },
                {
                    id: 13,
                    title: "Правописание глаголов",
                    description: "",
                    videoId: "PTA5TXhfJ5o", 
                    notesUrl: "https://disk.yandex.by/i/VqmKKkNM1vfGvA",
                    duration: "1:30"
                },
                {
                    id: 14,
                    title: "Правописание -н- и -нн- в разных частях речи",
                    description: "",
                    videoId: "l1l0rw1GH4w", 
                    notesUrl: "https://disk.yandex.by/i/4J2dpvybCasZsA",
                    duration: "1:34"
                },
                {
                    id: 15,
                    title: "Правописание сложных существительных и прилагательных",
                    description: "",
                    videoId: "BO5le5fOzMQ", 
                    notesUrl: "https://disk.yandex.by/i/O90TSPNu7ESBwQ",
                    duration: "1:30"
                },
                {
                    id: 16,
                    title: "Правописание наречий",
                    description: "",
                    videoId: "geKgR-VKGBU", 
                    notesUrl: "https://disk.yandex.by/i/dne5_H4hpViOqA",
                    duration: "1:32"
                },
                {
                    id: 17,
                    title: "Правописание частиц НЕ и НИ",
                    description: "",
                    videoId: "vuN1xiJXllQ",
                    notesUrl: "https://disk.yandex.by/i/DOPPhxkkRN411g",
                    duration: "1:31"
                },
                {
                    id: 18,
                    title: "Словосочетание",
                    description: "",
                    videoId: "iByPTtm7VS0", 
                    notesUrl: "https://disk.yandex.by/i/xz07C1kAd9IKPA",
                    duration: "1:34"
                },
                {
                    id: 19,
                    title: "Простое предложение",
                    description: "",
                    videoId: "WMbjY9amFDY", 
                    notesUrl: "https://disk.yandex.by/i/K7LkG-sSj3Ta5Q",
                    duration: "1:32"
                },
                {
                    id: 20,
                    title: "Второстепенные члены предложения. Синтаксическая функция инфинитива. Односоставные предложения",
                    description: "",
                    videoId: "Sjqu3ugAqYw", 
                    notesUrl: "https://disk.yandex.by/i/KSMjZj664KQPzw",
                    duration: "1:33"
                },
                {
                    id: 21,
                    title: "Осложненное предложение. Однородные члены. Вводные слова",
                    description: "",
                    videoId: "Vqvx0oFGwA0", 
                    notesUrl: "https://disk.yandex.by/i/VRe3JvD7tX8k5g",
                    duration: "1:32"
                },
                
            ]
        },
        english: {
            title: "Английский язык",
            icon: "fa-globe",
            color: "#ff416c",
            lessons: [
                {
                    id: 1,
                    title: "Present Simple. Present Continuous. Past Simple. Past Continuous",
                    description: "",
                    videoId: "DG3KRyKWkhg", 
                    notesUrl: "",
                    duration: "1:33"
                },
                {
                    id: 2,
                    title: "Present Perfect. Present Perfect Continuous",
                    description: "",
                    videoId: "mAIFcmeBeuk", 
                    notesUrl: "",
                    duration: "1:27"
                },
                {
                    id: 3,
                    title: "Past Perfect. Past Perfect Continuous",
                    description: "",
                    videoId: "l7sQ91gFDQ4", 
                    notesUrl: "",
                    duration: "1:31"
                },
                {
                    id: 4,
                    title: "Способы выражения будущего времени", 
                    description: "",
                    videoId: "DD89M2Dqa48", 
                    notesUrl: "",
                    duration: "1:35"
                },
                {
                    id: 5,
                    title: "Времена в страдательном залоге",
                    description: "",
                    videoId: "kRvDyAngNAM",
                    notesUrl: "",
                    duration: "1:30"
                },
                {
                    id: 6,
                    title: "Исчисляемые и неисчисляемые существительные. Согласование подлежащего и сказуемого",
                    description: "",
                    videoId: "i-nSHirec8A",
                    notesUrl: "",
                    duration: "1:29"
                },
                {
                    id: 7,
                    title: "Притяжательный падеж существительных",
                    description: "",
                    videoId: "n3D8KjveSgs", 
                    notesUrl: "",
                    duration: "1:29"
                },
                {
                    id: 8,
                    title: "Употребление неопределенного артикля",
                    description: "",
                    videoId: "QCLZJGQhpZM", 
                    notesUrl: "",
                    duration: "1:25"
                },
                {
                    id: 9,
                    title: "Употребление определенного артикля",
                    description: "",
                    videoId: "qngLI_WiHXU", 
                    notesUrl: "",
                    duration: "1:32"
                },
                {
                    id: 10,
                    title: "Употребление нулевого артикля",
                    description: "",
                    videoId: "JcjEyR6TjNI", 
                    notesUrl: "",
                    duration: "1:30"
                },
                {
                    id: 11,
                    title: "Употребление артикля с именами собственными",
                    description: "",
                    videoId: "4yxLKWM5rBs", 
                    notesUrl: "",
                    duration: "1:34"
                },
                {
                    id: 12,
                    title: "Предлоги времени и места",
                    description: "",
                    videoId: "MbRWMf_aqts", 
                    notesUrl: "",
                    duration: "1:28"
                },
                {
                    id: 13,
                    title: "Предлоги с разными частями речи",
                    description: "",
                    videoId: "nfrDNNBxq3w",
                    notesUrl: "",
                    duration: "1:28"
                },
                {
                    id: 14,
                    title: "Фразовые глаголы",
                    description: "",
                    videoId: "h703k7rEXrE", 
                    notesUrl: "",
                    duration: "1:25"
                },
                {
                    id: 15,
                    title: "Прилагательные и наречия",
                    description: "",
                    videoId: "iqhJU7_zIsk", 
                    notesUrl: "",
                    duration: "1:35"
                },
                {
                    id: 16,
                    title: "Числительные",
                    description: "",
                    videoId: "3j1Dz2tAq6k",  
                    notesUrl: "",
                    duration: "1:25"
                },
                {
                    id: 17,
                    title: "Притяжательные местоимения. Возвратные местоимения. Указательные местоимения. Местоимения it, there",
                    description: "",
                    videoId: "drMNsD4iMtk", 
                    notesUrl: "",
                    duration: "1:32"
                },
                {
                    id: 18,
                    title: "Относительные местоимения. Неопределенные местоимения some, any, no и их производные",
                    description: "",
                    videoId: "suBR0cH1i9o", 
                    notesUrl: "",
                    duration: "1:32"
                },
                {
                    id: 19,
                    title: "Местоимения every, each. Местоимения all, the whole",
                    description: "",
                    videoId: "-Cr0Z_E39Dg", 
                    notesUrl: "",
                    duration: "1:28"
                },
                {
                    id: 20,
                    title: "Местоимения, выражающие количество: many, much, few, little",
                    description: "",
                    videoId: "_nhUtDTXEwA", 
                    notesUrl: "",
                    duration: "1:27"
                },
                {
                    id: 21,
                    title: "Местоимения either, neither, both, none. Местоимения another, (the) other",
                    description: "",
                    videoId: "28NSXQQdAwE", 
                    notesUrl: "",
                    duration: "1:30"
                },
                {
                    id: 22,
                    title: "Союзы",
                    description: "",
                    videoId: "m1b2W5OIcrs", 
                    notesUrl: "",
                    duration: "1:37"
                },
                {
                    id: 23,
                    title: "Модальные глаголы",
                    description: "",
                    videoId: "E5KeWN71sXA", 
                    notesUrl: "",
                    duration: "1:33"
                },
                {
                    id: 24,
                    title: "Инфинитив. Герундий",
                    description: "",
                    videoId: "4R2l3TAl5d0",
                    notesUrl: "",
                    duration: "1:28"
                },
                {
                    id: 25,
                    title: "Разделительные вопросы (Tag questions)",
                    description: "",
                    videoId: "oc51SM0pY2g", 
                    notesUrl: "",
                    duration: "1:21"
                },
                
            ]
        }
    };
    
    // Утилиты
    const Utils = {
        // Определение мобильного устройства
        isMobileDevice: function() {
            return window.innerWidth <= CONFIG.mobileBreakpoint || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        // Безопасное экранирование HTML
        escapeHTML: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        // Форматирование времени
        formatDuration: function(duration) {
            return duration || '--:--';
        },
        
        // Форматирование даты
        formatDate: function(dateString) {
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            } catch (e) {
                return dateString;
            }
        },
        
        // Плавная прокрутка
        smoothScroll: function(element, offset = 0) {
            if (!element) return;
            
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        },
        
        // Задержка выполнения
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Анимация fadeIn
        fadeIn: function(element, duration = 300) {
            element.style.opacity = 0;
            element.style.display = 'block';
            
            let last = +new Date();
            const tick = function() {
                element.style.opacity = +element.style.opacity + (new Date() - last) / duration;
                last = +new Date();
                
                if (+element.style.opacity < 1) {
                    (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
                }
            };
            
            tick();
        },
        
        // Анимация fadeOut
        fadeOut: function(element, duration = 300) {
            element.style.opacity = 1;
            
            let last = +new Date();
            const tick = function() {
                element.style.opacity = +element.style.opacity - (new Date() - last) / duration;
                last = +new Date();
                
                if (+element.style.opacity > 0) {
                    (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
                } else {
                    element.style.display = 'none';
                }
            };
            
            tick();
        },
        
        // Очистка ошибки
        clearError: function(errorElement) {
            if (errorElement) {
                errorElement.classList.remove('active');
                errorElement.textContent = '';
            }
        },
        
        // Показать ошибку
        showError: function(errorElement, message) {
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('active');
            }
        },
        
        // Очистка ошибки пароля
        clearPasswordError: function() {
            DOM.passwordError.classList.remove('active');
            DOM.passwordError.classList.add('hidden');
            DOM.passwordInput.classList.remove('shake');
        },
        
        // Показать ошибку пароля
        showPasswordError: function(message) {
            DOM.passwordError.querySelector('span').textContent = message || 'Неверный пароль. Попробуйте снова.';
            DOM.passwordError.classList.remove('hidden');
            DOM.passwordError.classList.add('active');
            DOM.passwordInput.classList.add('shake');
            DOM.passwordInput.focus();
            
            setTimeout(() => {
                DOM.passwordInput.classList.remove('shake');
            }, 500);
        },
        
        // Валидация email
        validateEmail: function(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }
    };
    
    // Основные функции приложения
    const App = {
        // Инициализация приложения
        init: function() {
            UserSystem.init();
            this.detectDevice();
            this.bindEvents();
            this.loadSavedState();
            this.checkAuthStatus();
            
            console.log('Онлайн курсы инициализированы');
        },
        
        // Проверка статуса авторизации
        checkAuthStatus: function() {
            if (STATE.currentUser) {
                this.showMainContent();
            } else {
                this.showAuthForms();
            }
        },
        
        // Показать формы авторизации
        showAuthForms: function() {
            DOM.authContainer.style.display = 'block';
            DOM.mainContent.style.display = 'none';
            DOM.mainContent.classList.add('hidden');
            DOM.userMenuBtn.style.display = 'none';
        },
        
        // Показать основной контент
        showMainContent: function() {
            DOM.authContainer.style.display = 'none';
            DOM.mainContent.style.display = 'block';
            DOM.mainContent.classList.remove('hidden');
            DOM.userMenuBtn.style.display = 'flex';
            
            this.updateUserDisplay();
            this.showInitialMessage();
        },
        
        // Обновление отображения пользователя
        updateUserDisplay: function() {
            if (STATE.currentUser) {
                DOM.usernameDisplay.textContent = STATE.currentUser.name;
                this.updateUserModal();
            }
        },
        
        // Обновление модального окна пользователя
        updateUserModal: function() {
            if (STATE.currentUser) {
                DOM.userModalName.textContent = STATE.currentUser.name;
                DOM.userModalEmail.textContent = STATE.currentUser.email;
                DOM.userRegDate.textContent = Utils.formatDate(STATE.currentUser.registeredAt);
                
                // Обновляем прогресс
                DOM.russianProgress.textContent = `${STATE.currentUser.progress.russian || 0}%`;
                DOM.englishProgress.textContent = `${STATE.currentUser.progress.english || 0}%`;
                DOM.russianProgressBar.style.width = `${STATE.currentUser.progress.russian || 0}%`;
                DOM.englishProgressBar.style.width = `${STATE.currentUser.progress.english || 0}%`;
                
                // Обновляем доступ к курсам
                if (STATE.currentUser.unlockedLanguages.russian) {
                    DOM.russianAccess.textContent = 'Доступ открыт';
                    DOM.russianAccess.classList.add('unlocked');
                } else {
                    DOM.russianAccess.textContent = 'Заблокирован';
                    DOM.russianAccess.classList.remove('unlocked');
                }
                
                if (STATE.currentUser.unlockedLanguages.english) {
                    DOM.englishAccess.textContent = 'Доступ открыт';
                    DOM.englishAccess.classList.add('unlocked');
                } else {
                    DOM.englishAccess.textContent = 'Заблокирован';
                    DOM.englishAccess.classList.remove('unlocked');
                }
            }
        },
        
        // Показать начальное сообщение
        showInitialMessage: function() {
            DOM.currentLanguageTitle.textContent = 'Выберите курс для просмотра уроков';
            DOM.lessonsList.innerHTML = `
                <div class="select-course-message">
                    <i class="fas fa-key"></i>
                    <h3>Доступ к урокам защищен паролем</h3>
                    <p>Выберите курс и введите пароль для просмотра уроков</p>
                </div>
            `;
        },
        
        // Определение типа устройства
        detectDevice: function() {
            STATE.isMobile = Utils.isMobileDevice();
            
            if (STATE.isMobile) {
                DOM.body.classList.add('mobile-device');
                console.log('Мобильное устройство обнаружено');
            }
            
            // Обработчик изменения размера окна
            window.addEventListener('resize', Utils.debounce(() => {
                const wasMobile = STATE.isMobile;
                STATE.isMobile = Utils.isMobileDevice();
                
                if (wasMobile !== STATE.isMobile) {
                    DOM.body.classList.toggle('mobile-device', STATE.isMobile);
                    console.log('Тип устройства изменен:', STATE.isMobile ? 'мобильное' : 'десктоп');
                }
            }, 250));
        },
        
        // Привязка событий
        bindEvents: function() {
            // Переключение вкладок авторизации
            DOM.loginTab.addEventListener('click', () => this.switchAuthTab('login'));
            DOM.registerTab.addEventListener('click', () => this.switchAuthTab('register'));
            DOM.switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthTab('register');
            });
            DOM.switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthTab('login');
            });
            
            // Кнопки авторизации
            DOM.loginBtn.addEventListener('click', () => this.login());
            DOM.registerBtn.addEventListener('click', () => this.register());
            
            // Enter для отправки форм
            DOM.loginPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.login();
            });
            DOM.registerConfirmPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.register();
            });
            
            // Кнопки переключения языка
            DOM.russianBtn.addEventListener('click', () => this.requestLanguageAccess('russian'));
            DOM.englishBtn.addEventListener('click', () => this.requestLanguageAccess('english'));
            
            // Кнопки видеоплеера
            DOM.closePlayerBtn.addEventListener('click', () => this.closeVideoPlayer());
            DOM.backToLessonsBtn.addEventListener('click', () => this.closeVideoPlayer());
            
            // Закрытие видео при клике на overlay
            DOM.videoOverlay.addEventListener('click', () => this.closeVideoPlayer());
            
            // Закрытие по Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (!DOM.videoPlayer.classList.contains('hidden')) {
                        this.closeVideoPlayer();
                    }
                    if (!DOM.passwordModal.classList.contains('hidden')) {
                        this.closePasswordModal();
                    }
                    if (!DOM.userModal.classList.contains('hidden')) {
                        this.closeUserModal();
                    }
                }
                
                // Enter для отправки пароля
                if (e.key === 'Enter' && !DOM.passwordModal.classList.contains('hidden')) {
                    e.preventDefault();
                    this.submitPassword();
                }
            });
            
            // Переключение темы
            DOM.themeToggle.addEventListener('click', () => this.toggleTheme());
            
            // Кнопка личного кабинета
            DOM.userMenuBtn.addEventListener('click', () => this.openUserModal());
            
            // События для модального окна пароля
            DOM.submitPasswordBtn.addEventListener('click', () => this.submitPassword());
            DOM.cancelPasswordBtn.addEventListener('click', () => this.closePasswordModal());
            DOM.closeModalBtn.addEventListener('click', () => this.closePasswordModal());
            DOM.passwordModal.addEventListener('click', (e) => {
                if (e.target === DOM.passwordModal) {
                    this.closePasswordModal();
                }
            });
            
            // События для модального окна пользователя
            DOM.closeUserModalBtn.addEventListener('click', () => this.closeUserModal());
            DOM.logoutBtn.addEventListener('click', () => this.logout());
            DOM.userModal.addEventListener('click', (e) => {
                if (e.target === DOM.userModal) {
                    this.closeUserModal();
                }
            });
            
            // Показать/скрыть пароль
            DOM.togglePasswordBtn.addEventListener('click', () => {
                const type = DOM.passwordInput.getAttribute('type');
                const newType = type === 'password' ? 'text' : 'password';
                DOM.passwordInput.setAttribute('type', newType);
                DOM.togglePasswordBtn.innerHTML = newType === 'password' ? 
                    '<i class="fas fa-eye"></i>' : 
                    '<i class="fas fa-eye-slash"></i>';
            });
            
            // Обработчики для кнопок показа пароля в формах
            document.querySelectorAll('.toggle-password-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const input = document.getElementById(targetId);
                    if (input) {
                        const type = input.getAttribute('type');
                        const newType = type === 'password' ? 'text' : 'password';
                        input.setAttribute('type', newType);
                        this.innerHTML = newType === 'password' ? 
                            '<i class="fas fa-eye"></i>' : 
                            '<i class="fas fa-eye-slash"></i>';
                    }
                });
            });
            
            // Сброс ошибки при вводе
            DOM.passwordInput.addEventListener('input', () => {
                Utils.clearPasswordError();
            });
            
            // Сохранение состояния при закрытии
            window.addEventListener('beforeunload', () => {
                if (CONFIG.saveScrollPosition) {
                    localStorage.setItem('online-courses-scrollPosition', window.pageYOffset);
                }
                localStorage.setItem('online-courses-theme', STATE.currentTheme);
                
                if (STATE.currentUser) {
                    UserSystem.saveCurrentUser();
                }
            });
            
            // Предотвращение быстрого двойного тапа на мобильных
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, { passive: false });
            
            // Обработка сенсорных событий для плавности
            if ('ontouchstart' in window) {
                document.addEventListener('touchstart', () => {}, { passive: true });
            }
        },
        
        // Загрузка сохраненного состояния
        loadSavedState: function() {
            // Загрузка текущего пользователя
            UserSystem.loadCurrentUser();
            
            // Загрузка позиции прокрутки
            if (CONFIG.saveScrollPosition) {
                const savedScroll = localStorage.getItem('online-courses-scrollPosition');
                if (savedScroll) {
                    setTimeout(() => {
                        window.scrollTo(0, parseInt(savedScroll));
                    }, 100);
                }
            }
            
            // Загрузка темы
            const savedTheme = localStorage.getItem('online-courses-theme') || CONFIG.defaultTheme;
            this.setTheme(savedTheme);
        },
        
        // Переключение вкладки авторизации
        switchAuthTab: function(tab) {
            if (tab === 'login') {
                DOM.loginTab.classList.add('active');
                DOM.registerTab.classList.remove('active');
                DOM.loginForm.classList.add('active');
                DOM.registerForm.classList.remove('active');
                Utils.clearError(DOM.loginError);
                Utils.clearError(DOM.registerError);
            } else {
                DOM.registerTab.classList.add('active');
                DOM.loginTab.classList.remove('active');
                DOM.registerForm.classList.add('active');
                DOM.loginForm.classList.remove('active');
                Utils.clearError(DOM.loginError);
                Utils.clearError(DOM.registerError);
            }
        },
        
        // Авторизация
        login: function() {
            const email = DOM.loginEmail.value.trim();
            const password = DOM.loginPassword.value.trim();
            
            // Валидация
            if (!email || !password) {
                Utils.showError(DOM.loginError, 'Заполните все поля');
                return;
            }
            
            if (!Utils.validateEmail(email)) {
                Utils.showError(DOM.loginError, 'Введите корректный email');
                return;
            }
            
            // Попытка авторизации
            const result = UserSystem.login(email, password);
            
            if (result.success) {
                STATE.currentUser = result.user;
                UserSystem.saveCurrentUser();
                this.showMainContent();
                this.showSuccessMessage('Авторизация успешна!');
            } else {
                Utils.showError(DOM.loginError, result.message);
            }
        },
        
        // Регистрация
        register: function() {
            const name = DOM.registerName.value.trim();
            const email = DOM.registerEmail.value.trim();
            const password = DOM.registerPassword.value.trim();
            const confirmPassword = DOM.registerConfirmPassword.value.trim();
            
            // Валидация
            if (!name || !email || !password || !confirmPassword) {
                Utils.showError(DOM.registerError, 'Заполните все поля');
                return;
            }
            
            if (!Utils.validateEmail(email)) {
                Utils.showError(DOM.registerError, 'Введите корректный email');
                return;
            }
            
            const passwordValidation = UserSystem.validatePassword(password);
            if (!passwordValidation.valid) {
                Utils.showError(DOM.registerError, passwordValidation.message);
                return;
            }
            
            if (password !== confirmPassword) {
                Utils.showError(DOM.registerError, 'Пароли не совпадают');
                return;
            }
            
            // Попытка регистрации
            const result = UserSystem.register(name, email, password);
            
            if (result.success) {
                STATE.currentUser = result.user;
                UserSystem.saveCurrentUser();
                
                // Очистка формы
                DOM.registerName.value = '';
                DOM.registerEmail.value = '';
                DOM.registerPassword.value = '';
                DOM.registerConfirmPassword.value = '';
                
                this.showMainContent();
                this.showSuccessMessage('Регистрация успешна! Добро пожаловать!');
            } else {
                Utils.showError(DOM.registerError, result.message);
            }
        },
        
        // Выход
        logout: function() {
            UserSystem.logout();
            this.closeUserModal();
            this.showAuthForms();
            this.showSuccessMessage('Вы вышли из системы');
        },
        
        // Показать сообщение об успехе
        showSuccessMessage: function(message) {
            // Можно добавить уведомления или другие способы показа сообщений
            console.log(message);
        },
        
        // Установка темы
        setTheme: function(theme) {
            if (theme !== 'light' && theme !== 'dark') {
                theme = CONFIG.defaultTheme;
            }
            
            STATE.currentTheme = theme;
            DOM.html.setAttribute('data-theme', theme);
            
            // Обновляем иконки в переключателе
            const moonIcon = DOM.themeToggle.querySelector('.fa-moon');
            const sunIcon = DOM.themeToggle.querySelector('.fa-sun');
            
            if (theme === 'dark') {
                if (moonIcon) moonIcon.style.opacity = '0.5';
                if (sunIcon) sunIcon.style.opacity = '1';
            } else {
                if (moonIcon) moonIcon.style.opacity = '1';
                if (sunIcon) sunIcon.style.opacity = '0.5';
            }
            
            console.log(`Тема установлена: ${theme}`);
        },
        
        // Переключение темы
        toggleTheme: function() {
            const newTheme = STATE.currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
            localStorage.setItem('online-courses-theme', newTheme);
        },
        
        // Открытие модального окна пользователя
        openUserModal: function() {
            this.updateUserModal();
            DOM.userModal.classList.remove('hidden');
            setTimeout(() => {
                DOM.userModal.classList.add('active');
            }, 10);
            
            // Блокируем скролл на мобильных
            if (STATE.isMobile) {
                DOM.body.style.overflow = 'hidden';
            }
        },
        
        // Закрытие модального окна пользователя
        closeUserModal: function() {
            DOM.userModal.classList.remove('active');
            setTimeout(() => {
                DOM.userModal.classList.add('hidden');
            }, 300);
            
            // Восстанавливаем скролл
            DOM.body.style.overflow = '';
        },
        
        // Запрос доступа к языку
        requestLanguageAccess: function(language) {
            if (!STATE.currentUser) {
                this.showAuthForms();
                return;
            }
            
            // Если язык уже разблокирован, просто переключаемся
            if (STATE.currentUser.unlockedLanguages[language]) {
                this.switchLanguage(language);
                return;
            }
            
            // Сохраняем выбранный язык
            STATE.selectedLanguage = language;
            
            // Настраиваем модальное окно
            const course = COURSES_DATA[language];
            DOM.modalMessage.textContent = `Введите пароль для доступа к курсу "${course.title}"`;
            
            // Показываем модальное окно
            this.openPasswordModal();
        },
        
        // Открытие модального окна пароля
        openPasswordModal: function() {
            // Сбрасываем ошибки и поле ввода
            Utils.clearPasswordError();
            DOM.passwordInput.value = '';
            DOM.passwordInput.setAttribute('type', 'password');
            DOM.togglePasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
            
            // Показываем модальное окно
            DOM.passwordModal.classList.remove('hidden');
            setTimeout(() => {
                DOM.passwordModal.classList.add('active');
                DOM.passwordInput.focus();
            }, 10);
            
            // Блокируем скролл на мобильных
            if (STATE.isMobile) {
                DOM.body.style.overflow = 'hidden';
            }
        },
        
        // Закрытие модального окна пароля
        closePasswordModal: function() {
            // Скрываем модальное окно
            DOM.passwordModal.classList.remove('active');
            setTimeout(() => {
                DOM.passwordModal.classList.add('hidden');
            }, 300);
            
            // Восстанавливаем скролл
            DOM.body.style.overflow = '';
            
            // Очищаем поле ввода
            DOM.passwordInput.value = '';
            Utils.clearPasswordError();
        },
        
        // Проверка пароля
        submitPassword: function() {
            const password = DOM.passwordInput.value.trim();
            const language = STATE.selectedLanguage;
            
            if (!language) {
                Utils.showPasswordError('Ошибка: язык не выбран');
                return;
            }
            
            const correctPassword = CONFIG.passwords[language];
            
            if (!correctPassword) {
                Utils.showPasswordError('Ошибка: пароль для этого курса не настроен');
                return;
            }
            
            if (password === correctPassword) {
                // Пароль верный - разблокируем курс
                UserSystem.unlockCourse(STATE.currentUser.email, language);
                this.updateLanguageButtonState(language, true);
                
                // Закрываем модальное окно
                this.closePasswordModal();
                
                // Переключаемся на выбранный язык
                this.switchLanguage(language);
                
                // Обновляем личный кабинет
                this.updateUserModal();
                
                console.log(`Доступ к курсу "${COURSES_DATA[language].title}" предоставлен пользователю ${STATE.currentUser.name}`);
            } else {
                // Неверный пароль
                Utils.showPasswordError('Неверный пароль. Попробуйте снова.');
            }
        },
        
        // Обновление состояния кнопки языка
        updateLanguageButtonState: function(language, unlocked) {
            const button = language === 'russian' ? DOM.russianBtn : DOM.englishBtn;
            
            if (unlocked) {
                button.classList.add('active');
                const lockIcon = button.querySelector('.lock-icon');
                if (lockIcon) {
                    lockIcon.style.display = 'none';
                }
            } else {
                button.classList.remove('active');
                const lockIcon = button.querySelector('.lock-icon');
                if (lockIcon) {
                    lockIcon.style.display = 'inline';
                }
            }
        },
        
        // Переключение языка (после успешного ввода пароля)
        switchLanguage: function(language) {
            if (!STATE.currentUser || !STATE.currentUser.unlockedLanguages[language]) {
                console.warn(`Попытка переключиться на неразблокированный язык: ${language}`);
                this.requestLanguageAccess(language);
                return;
            }
            
            if (STATE.currentLanguage === language) {
                return;
            }
            
            // Сохраняем позицию прокрутки
            if (CONFIG.saveScrollPosition) {
                STATE.scrollPosition = window.pageYOffset;
            }
            
            // Закрываем видеоплеер если открыт
            if (!DOM.videoPlayer.classList.contains('hidden')) {
                this.closeVideoPlayer();
            }
            
            // Обновляем состояние
            STATE.currentLanguage = language;
            
            // Обновляем UI
            this.updateLanguageButtons(language);
            this.renderLessons(language);
            
            // Восстанавливаем позицию прокрутки
            if (CONFIG.saveScrollPosition) {
                setTimeout(() => {
                    window.scrollTo(0, STATE.scrollPosition);
                }, 50);
            }
            
            console.log(`Язык переключен: ${COURSES_DATA[language].title}`);
        },
        
        // Обновление кнопок языка
        updateLanguageButtons: function(language) {
            if (!STATE.currentUser) return;
            
            // Только разблокированные языки могут быть активными
            DOM.russianBtn.classList.toggle('active', 
                language === 'russian' && STATE.currentUser.unlockedLanguages.russian);
            DOM.englishBtn.classList.toggle('active', 
                language === 'english' && STATE.currentUser.unlockedLanguages.english);
        },
        
        // Рендеринг уроков
        renderLessons: function(language) {
            const course = COURSES_DATA[language];
            if (!course) return;
            
            // Обновляем заголовок
            DOM.currentLanguageTitle.textContent = `${course.title} - Уроки`;
            
            // Очищаем список
            DOM.lessonsList.innerHTML = '';
            
            // Рендерим каждый урок
            course.lessons.forEach((lesson, index) => {
                const lessonElement = this.createLessonElement(lesson, index, language);
                DOM.lessonsList.appendChild(lessonElement);
            });
            
            // Анимация появления
            this.animateLessons();
        },
        
        // Создание элемента урока
        createLessonElement: function(lesson, index, language) {
            const lessonElement = document.createElement('div');
            lessonElement.className = 'lesson-card';
            lessonElement.dataset.id = lesson.id;
            lessonElement.dataset.videoId = lesson.videoId;
            lessonElement.dataset.language = language;
            lessonElement.style.setProperty('--index', index);
            
            // Получаем прогресс урока для текущего пользователя
            let lessonProgress = 0;
            if (STATE.currentUser && 
                STATE.currentUser.lessonProgress && 
                STATE.currentUser.lessonProgress[language] &&
                STATE.currentUser.lessonProgress[language][lesson.id]) {
                lessonProgress = STATE.currentUser.lessonProgress[language][lesson.id];
            } else {
                // Генерация случайного прогресса для нового урока
                lessonProgress = this.getRandomProgress();
            }
            
            lessonElement.innerHTML = `
                <div class="lesson-number">${index + 1}</div>
                <h3>${Utils.escapeHTML(lesson.title)}</h3>
                <p>${Utils.escapeHTML(lesson.description)}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${lessonProgress}%" data-progress="${lessonProgress}"></div>
                </div>
                <div class="lesson-meta">
                    <span><i class="far fa-clock"></i> ${Utils.formatDuration(lesson.duration)}</span>
                </div>
            `;
            
            // Обработчики событий
            lessonElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openVideoPlayer(lesson, language);
            });
            
            lessonElement.addEventListener('touchstart', (e) => {
                lessonElement.classList.add('touch-active');
            }, { passive: true });
            
            lessonElement.addEventListener('touchend', () => {
                setTimeout(() => {
                    lessonElement.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
            
            // Поддержка клавиатуры
            lessonElement.setAttribute('tabindex', '0');
            lessonElement.setAttribute('role', 'button');
            lessonElement.setAttribute('aria-label', `Урок ${index + 1}: ${lesson.title}`);
            
            lessonElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openVideoPlayer(lesson, language);
                }
            });
            
            return lessonElement;
        },
        
        // Генерация случайного прогресса
        getRandomProgress: function() {
            return Math.floor(Math.random() * 30) + 20; // 20-50% для новых уроков
        },
        
        // Анимация появления уроков
        animateLessons: function() {
            const lessons = DOM.lessonsList.querySelectorAll('.lesson-card');
            lessons.forEach((lesson, index) => {
                lesson.style.animationDelay = `${index * 0.05}s`;
            });
        },
        
        // Открытие видеоплеера
        openVideoPlayer: function(lesson, language) {
            // Сохраняем текущий урок
            STATE.currentLesson = lesson;
            STATE.currentLanguage = language;
            STATE.isVideoPlaying = true;
            
            // Блокируем скролл на мобильных
            if (STATE.isMobile) {
                DOM.body.style.overflow = 'hidden';
            }
            
            // Показываем overlay
            DOM.videoOverlay.classList.remove('hidden');
            setTimeout(() => {
                DOM.videoOverlay.classList.add('active');
            }, 10);
            
            // Обновляем UI
            DOM.lessonTitle.textContent = lesson.title;
            
            // Настраиваем материалы урока
            this.setupLessonMaterials(lesson);
            
            // Загружаем видео
            this.loadYouTubeVideo(lesson.videoId);
            
            // Показываем плеер
            DOM.videoPlayer.classList.remove('hidden');
            
            // Фокус на кнопку закрытия для доступности
            setTimeout(() => {
                DOM.closePlayerBtn.focus();
            }, 100);
            
            // Обновляем прогресс после просмотра
            this.updateLessonProgressAfterView(lesson, language);
            
            console.log(`Открыт урок: ${lesson.title}`);
        },
        
        // Обновление прогресса после просмотра урока
        updateLessonProgressAfterView: function(lesson, language) {
            if (!STATE.currentUser) return;
            
            // Обновляем прогресс урока
            UserSystem.updateLessonProgress(
                STATE.currentUser.email, 
                language, 
                lesson.id, 
                100
            );
            
            // Обновляем общий прогресс по курсу
            const course = COURSES_DATA[language];
            if (course && course.lessons) {
                const totalLessons = course.lessons.length;
                const completedLessons = Object.keys(STATE.currentUser.lessonProgress[language] || {}).length;
                const courseProgress = Math.round((completedLessons / totalLessons) * 100);
                
                UserSystem.updateProgress(
                    STATE.currentUser.email,
                    language,
                    courseProgress
                );
                
                // Обновляем отображение в личном кабинете
                this.updateUserModal();
            }
        },
        
        // Настройка материалов урока
        setupLessonMaterials: function(lesson) {
            if (lesson.notesUrl && lesson.notesUrl.trim() !== '') {
                DOM.notesLink.href = lesson.notesUrl;
                DOM.notesLink.textContent = `Скачать конспект урока ${lesson.id} (PDF)`;
                DOM.notesLink.style.display = 'flex';
                DOM.materialsTitle.style.display = 'flex';
            } else {
                DOM.notesLink.style.display = 'none';
                DOM.materialsTitle.style.display = 'none';
            }
        },
        
        // Загрузка YouTube видео
        loadYouTubeVideo: function(videoId) {
            if (!videoId) {
                console.error('ID видео не указан');
                return;
            }
            
            const videoUrl = `${CONFIG.youtubeEmbedUrl}/${videoId}?${CONFIG.youtubeParams}`;
            
            // Очищаем предыдущее видео
            DOM.youtubeVideo.src = '';
            
            // Даем время для очистки iframe
            setTimeout(() => {
                DOM.youtubeVideo.src = videoUrl;
            }, 50);
        },
        
        // Закрытие видеоплеера
        closeVideoPlayer: function() {
            // Восстанавливаем скролл
            DOM.body.style.overflow = '';
            
            // Скрываем overlay
            DOM.videoOverlay.classList.remove('active');
            setTimeout(() => {
                DOM.videoOverlay.classList.add('hidden');
            }, 300);
            
            // Скрываем плеер
            DOM.videoPlayer.classList.add('hidden');
            
            // Останавливаем видео
            DOM.youtubeVideo.src = '';
            STATE.isVideoPlaying = false;
            
            // Возвращаем фокус
            setTimeout(() => {
                if (STATE.currentLanguage) {
                    const activeLangBtn = STATE.currentLanguage === 'russian' ? DOM.russianBtn : DOM.englishBtn;
                    activeLangBtn.focus();
                }
            }, 100);
            
            console.log('Видеоплеер закрыт');
        },
        
        // Проверка сетевого соединения
        checkNetworkStatus: function() {
            if ('connection' in navigator) {
                const connection = navigator.connection;
                
                if (connection.saveData === true) {
                    console.log('Режим экономии данных включен');
                    DOM.body.classList.add('save-data-mode');
                }
                
                if (connection.effectiveType) {
                    console.log(`Тип соединения: ${connection.effectiveType}`);
                    
                    if (connection.effectiveType.includes('2g') || connection.effectiveType.includes('slow-2g')) {
                        DOM.body.classList.add('slow-connection');
                    }
                }
            }
        }
    };
    
    // Инициализация при загрузке страницы
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
        App.checkNetworkStatus();
        
        // Отложенная загрузка YouTube API если нужно
        setTimeout(() => {
            if (STATE.isVideoPlaying) {
                console.log('YouTube API готово к использованию');
            }
        }, 2000);
    });
    
    // Экспорт для отладки
    window.OnlineCourses = {
        App,
        UserSystem,
        Utils,
        STATE,
        CONFIG
    };
    
    console.log('Онлайн курсы с системой пользователей загружены успешно!');
})();
