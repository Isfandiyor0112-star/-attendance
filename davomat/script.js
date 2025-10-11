// НЕ храните users здесь!

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const login = document.getElementById('login').value;
  const password = document.getElementById('password').value;

  const res = await fetch('https://attendancesrv.onrender.com', {
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