<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Вход в систему | School №22</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="manifest.json">
    <link rel="icon" type="image/png" sizes="32x32" href="web191.png">
    <link rel="apple-touch-icon" href="web191.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="theme-color" content="#0d6efd">
</head>
<body>

<div class="language-picker">
    <div class="glass-btn-group" id="langGroup" data-active="ru">
        <div class="lang-slider"></div>
        <button id="lang-ru" class="btn-lang active" onclick="setLang('ru')">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f3/Flag_of_Russia.svg" alt="RU"> <span>Рус</span>
        </button>
        <button id="lang-uz" class="btn-lang" onclick="setLang('uz')">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Flag_of_Uzbekistan.svg" alt="UZ"> <span>Uzb</span>
        </button>
    </div>
</div>

<div id="videoIntro" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background:#000;display:flex;justify-content:center;align-items:center;">
    <video src="intro.mp4" autoplay muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>
</div>

<div id="loginContainer" style="display:none;">
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-12 col-sm-8 col-md-6 col-lg-4">
                <div class="card shadow login-card">
                    <div class="card-body p-4">
                        <h3 class="mb-4 text-center fw-bold" data-i18n="login_title">Вход</h3>
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="login" class="form-label fw-bold" data-i18n="login_label">Логин</label>
                                <input type="text" class="form-control custom-input" id="login" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label fw-bold" data-i18n="password_label">Пароль</label>
                                <input type="password" class="form-control custom-input" id="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary-custom w-100 py-2 fw-bold" data-i18n="login_btn">Войти</button>
                            <div id="loginError" class="text-danger mt-2 text-center" style="display:none;" data-i18n="login_error">Неверный логин или пароль</div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="script.js"></script>

<script>
    // Объект переводов
    const translations = {
        ru: {
            login_title: "Вход",
            login_label: "Логин",
            password_label: "Пароль",
            login_btn: "Войти",
            login_error: "Неверный логин или пароль"
        },
        uz: {
            login_title: "Kirish",
            login_label: "Login",
            password_label: "Parol",
            login_btn: "Kirish",
            login_error: "Login yoki parol noto'g'ri"
        }
    };

    // Функция переключения (Глобальная)
    window.setLang = function(lang) {
        // 1. Двигаем ползунок
        const group = document.getElementById('langGroup');
        if (group) group.setAttribute('data-active', lang);

        // 2. Активная кнопка
        document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`lang-${lang}`).classList.add('active');

        // 3. Перевод текста
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) el.textContent = translations[lang][key];
        });

        localStorage.setItem('lang', lang);
    }

    // Запуск интро и инициализация
    document.addEventListener('DOMContentLoaded', () => {
        const savedLang = localStorage.getItem('lang') || 'ru';
        setLang(savedLang);

        setTimeout(() => {
            document.getElementById('videoIntro').style.fadeOut = 'slow';
            document.getElementById('videoIntro').style.display = 'none';
            document.getElementById('loginContainer').style.display = 'block';
        }, 5000);
    });
</script>

<script>
    // PWA Установка
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (!isStandalone) {
            const installBanner = document.createElement('div');
            installBanner.className = "pwa-banner";
            installBanner.innerHTML = `
                <div class="alert alert-info shadow m-3 text-center">
                    <p class="mb-2">📲 Установите приложение<br>Davomat dasturini yuklab oling</p>
                    <button id="installBtn" class="btn btn-sm btn-success px-4">Установить</button>
                </div>
            `;
            document.body.appendChild(installBanner);

            document.getElementById('installBtn').addEventListener('click', () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(() => {
                    deferredPrompt = null;
                    installBanner.remove();
                });
            });
        }
    });
</script>
</body>
</html>
