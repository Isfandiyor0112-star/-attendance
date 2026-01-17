document.addEventListener('DOMContentLoaded', function() {
  // --- ЛОГИКА ВХОДА ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const login = document.getElementById('login').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('https://attendancesrv.vercel.app/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, password })
        });
        const data = await res.json();

        if (data.status === "ok") {
          localStorage.setItem('teacher', JSON.stringify(data.user));
          const adminLogins = ["shaxnoza", "furkat", "matlyuba", "admin"];

          if (adminLogins.includes(data.user.login)) {
            window.location.href = "admin.html";
          } else {
            window.location.href = "teacher.html";
          }
        } else {
          document.getElementById('loginError').style.display = 'block';
        }
      } catch (err) {
        console.error("Ошибка входа:", err);
        alert("Ошибка сервера");
      }
    });
  }

  // --- ИНИЦИАЛИЗАЦИЯ ЯЗЫКА ПРИ ЗАГРУЗКЕ ---
  const savedLang = localStorage.getItem('lang') || 'ru';
  setLang(savedLang);
});

// --- ОБЪЕКТ ПЕРЕВОДОВ ---
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

// --- ГЛОБАЛЬНАЯ ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ---
window.setLang = function(lang) {
  // 1. ДВИГАЕМ ПОЛЗУНОК (обновляем атрибут контейнера)
  const group = document.getElementById('langGroup');
  if (group) {
    group.setAttribute('data-active', lang);
  }

  // 2. МЕНЯЕМ АКТИВНУЮ КНОПКУ (для цвета текста)
  document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`lang-${lang}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // 3. ПЕРЕВОДИМ ТЕКСТ
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // 4. СОХРАНЯЕМ ВЫБОР
  localStorage.setItem('lang', lang);
};
