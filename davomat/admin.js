const translations = {
  ru: {
    admin_panel_title: "Админ-панель школы №22",
    choose_date: "Выберите дату:",
    total_absent: "Всего отсутствующих",
    reason_stats: "Статистика причин отсутствия",
    clear_history: "Очистить историю",
    absent_list: "Список отсутствующих"
  },
  uz: {
    admin_panel_title: "22-maktab admin paneli",
    choose_date: "Sana tanlang:",
    total_absent: "Yo‘qlarning jami",
    reason_stats: "Yo‘qlik sabablari statistikasi",
    clear_history: "Tarixni tozalash",
    absent_list: "Yo‘qliklar ro‘yxati"
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
setLang(localStorage.getItem('lang') || 'ru');

let absents = [];

async function loadAbsents() {
  const res = await fetch('https://attendancesrv.onrender.com/api/absents');
  absents = await res.json();
  renderByDate();
  fillDateFilter();
}

function fillDateFilter() {
  const dateFilter = document.getElementById('dateFilter');
  dateFilter.innerHTML = '';
  const dates = [...new Set(absents.map(a => a.date))];
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    dateFilter.appendChild(option);
  });
  dateFilter.onchange = () => renderByDate();
}

function renderByDate() {
  const date = document.getElementById('dateFilter').value;
  const filtered = date ? absents.filter(a => a.date === date) : absents;
  document.getElementById('totalAbsent').textContent = filtered.length;
  renderReasonBarChart(filtered);
  renderAbsentList(filtered);
}

function renderReasonBarChart(data) {
  const stats = {};
  data.forEach(item => {
    stats[item.reason] = (stats[item.reason] || 0) + 1;
  });
  const labels = Object.keys(stats);
  const values = Object.values(stats);

  if (window.reasonChart && typeof window.reasonChart.destroy === 'function') {
    window.reasonChart.destroy();
  }

  const ctx = document.getElementById('reasonChart').getContext('2d');
  window.reasonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Причины',
        data: values,
        backgroundColor: '#0d6efd'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderAbsentList(data) {
  const list = document.getElementById('adminAbsentList');
  list.innerHTML = '';
  data.forEach(item => {
    const li = document.createElement('li');
    li.className = "list-group-item";
    li.textContent = `${item.date} | ${item.className} | ${item.studentName} — (${item.reason})`;
    list.appendChild(li);
  });
}

document.getElementById('clearHistory').onclick = async function() {
  if (confirm('Вы уверены, что хотите очистить всю историю отсутствующих?')) {
    await fetch('https://attendancesrv.onrender.com/api/absents', { method: 'DELETE' });
    location.reload();
  }
};

document.addEventListener('DOMContentLoaded', loadAbsents);


