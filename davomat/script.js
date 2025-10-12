// НЕ храните users здесь!

document.addEventListener('DOMContentLoaded', function() {
 
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    const res = await fetch('https://attendancesrv.onrender.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    const data = await res.json();

    if (data.status === "ok") {
      localStorage.setItem('teacher', JSON.stringify(data.user));
      if (data.user.login === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "teacher.html";
      }
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  });
});

const translations = {
  ru: {
    login_title: "Вход",
    login_label: "Логин",
    password_label: "Пароль",
    login_btn: "Войти",
    login_error: "Неверный логин или пароль"
    // ...добавьте остальные тексты
  },
  uz: {
    login_title: "Kirish",
    login_label: "Login",
    password_label: "Parol",
    login_btn: "Kirish",
    login_error: "Login yoki parol noto'g'ri"
    // ...добавьте остальные тексты
  }
};

function setLang(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });
  localStorage.setItem('lang', lang);
}

document.getElementById('lang-ru').onclick = () => setLang('ru');
document.getElementById('lang-uz').onclick = () => setLang('uz');

// При загрузке страницы
setLang(localStorage.getItem('lang') || 'ru');

document.getElementById('logoutBtn').onclick = function() {
  localStorage.removeItem('teacher');
  window.location.href = "index.html";
};
