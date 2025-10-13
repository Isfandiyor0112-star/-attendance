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

// Цвета для разных причин (можно расширить)
const reasonColors = [
  '#4B0082', // Фиолетовый
  '#FF4500', // Оранжево-красный
  '#FFD700', // Золотой
  '#90EE90', // Светло-зеленый
  '#4682B4', // Стальной синий
  '#8A2BE2', // Синий-фиолетовый
  '#FF69B4', // Розовый
  '#20B2AA', // Бирюзовый
];

// --- Общая диаграмма и легенда ---
function renderReasonPieChart(data) {
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
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => reasonColors[i % reasonColors.length])
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Легенда для общей диаграммы
  const legend = labels.map((label, i) =>
    `<div style="display:flex;align-items:center;margin-bottom:4px;">
      <span style="display:inline-block;width:16px;height:16px;background:${reasonColors[i % reasonColors.length]};margin-right:8px;border-radius:3px;"></span>
      <span>${label}</span>
    </div>`
  ).join('');
  document.getElementById('reasonLegend').innerHTML = legend;
}

// --- Диаграммы по классам ---
function renderClassPieCharts(data) {
  const container = document.getElementById('classChartsContainer');
  container.innerHTML = '';

  // Группируем по классам
  const classMap = {};
  data.forEach(item => {
    if (!classMap[item.className]) classMap[item.className] = [];
    classMap[item.className].push(item);
  });

  Object.keys(classMap).sort().forEach((className, idx) => {
    const classData = classMap[className];

    // --- добавьте это для статистики по причинам ---
    const stats = {};
    classData.forEach(item => {
      stats[item.reason] = (stats[item.reason] || 0) + 1;
    });
    const labels = Object.keys(stats);
    const values = Object.values(stats);
    // ----------------------------------------------

    // Карточка для класса
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 col-sm-12 mb-1 d-flex';

    const card = document.createElement('div');
    card.className = 'card flex-fill';
    card.style.maxWidth = '320px';
    card.style.minWidth = '220px';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body p-2 d-flex flex-column align-items-center';

    // Заголовок
    const title = document.createElement('h6');
    title.textContent = `Класс ${className}`;
    title.className = 'mb-2 w-100 text-center';
    cardBody.appendChild(title);

    // Диаграмма и легенда в строку
    const chartRow = document.createElement('div');
    chartRow.className = 'd-flex w-100 justify-content-center align-items-center mb-1';

    // Диаграмма с небольшим отступом
    const chartDiv = document.createElement('div');
    chartDiv.style.marginLeft = '10px';
    chartDiv.style.marginRight = '10px';
    chartDiv.style.display = 'flex';
    chartDiv.style.alignItems = 'center';
    const canvas = document.createElement('canvas');
    canvas.id = `classChart${idx}`;
    canvas.width = 100;
    canvas.height = 100;
    chartDiv.appendChild(canvas);

    // Легенда справа
    const legendDiv = document.createElement('div');
    legendDiv.className = 'ms-2';
    legendDiv.style.fontSize = '0.9em';
    legendDiv.innerHTML = labels.map((label, i) =>
      `<div style="display:flex;align-items:center;margin-bottom:2px;">
        <span style="display:inline-block;width:12px;height:12px;background:${reasonColors[i % reasonColors.length]};margin-right:6px;border-radius:2px;"></span>
        <span>${label}</span>
      </div>`
    ).join('');

    chartRow.appendChild(chartDiv);
    chartRow.appendChild(legendDiv);
    cardBody.appendChild(chartRow);

    // Список отсутствующих компактно с полосками
    const list = document.createElement('div');
    list.className = 'mt-1 w-100 text-center';
    list.style.fontSize = '0.92em';
    classData.forEach((item, i) => {
      const p = document.createElement('div');
      p.textContent = `${item.date} | ${item.className} | ${item.studentName} — (${item.reason})`;
      list.appendChild(p);
      // Добавляем полоску, кроме последнего элемента
      if (i < classData.length - 1) {
        const hr = document.createElement('hr');
        hr.className = 'my-1';
        list.appendChild(hr);
      }
    });
    cardBody.appendChild(list);

    card.appendChild(cardBody);
    col.appendChild(card);
    container.appendChild(col);

    // --- рисуем pie chart ---
    new Chart(canvas.getContext('2d'), {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: labels.map((_, i) => reasonColors[i % reasonColors.length])
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  });
}

// Обновить функцию renderByDate
function renderByDate() {
  const date = document.getElementById('dateFilter').value;
  const filtered = date ? absents.filter(a => a.date === date) : absents;
  document.getElementById('totalAbsent').textContent = filtered.length;
  renderReasonPieChart(filtered); // Общая диаграмма в первом блоке
  renderClassPieCharts(filtered); // Диаграммы по классам внизу
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

// Назначаем обработчик кнопки очистки истории вне функции renderAbsentList
document.getElementById('clearHistory').onclick = async function() {
  if (confirm('Вы уверены, что хотите очистить всю историю отсутствующих?')) {
    await fetch('https://attendancesrv.onrender.com/api/absents', { method: 'DELETE' });
    location.reload();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Проверка роли учителя
  if (!localStorage.getItem('teacher')) {
    window.location.href = 'index.html';
  } else {
    const teacher = JSON.parse(localStorage.getItem('teacher'));
   const allowedAdmins = ["admin", "shaxnoza", "furkat", "matlyuba"];
if (!teacher || !allowedAdmins.includes(teacher.login)) {

      window.location.href = 'index.html';
    }
  }

  loadAbsents();
});

document.getElementById('exportExcel').addEventListener('click', async () => {
  try {
    const selectedDate = document.getElementById('dateFilter').value;

    const res = await fetch('https://attendancesrv.onrender.com/api/absents');
    const data = await res.json();

    // 🔍 Фильтруем по выбранной дате
    const filtered = selectedDate ? data.filter(a => a.date === selectedDate) : [];

    if (filtered.length === 0) {
      alert("Нет данных за выбранную дату.");
      return;
    }

    // 📁 Группируем по классам
    const classMap = {};
    filtered.forEach(item => {
      if (!classMap[item.className]) classMap[item.className] = [];
      classMap[item.className].push({
        Дата: item.date,
        Учитель: item.teacher,
        Ученик: item.studentName,
        Причина: item.reason       
      });
    });

    // 📊 Создаём Excel-книгу
    const workbook = XLSX.utils.book_new();
    Object.keys(classMap).sort().forEach(className => {
      const sheet = XLSX.utils.json_to_sheet(classMap[className]);
      // 👉 Устанавливаем ширину колонок
sheet['!cols'] = [
  { wch: 12 }, // Дата
  { wch: 20 }, // Учитель — увеличим!
  { wch: 20 }, // Ученик
  { wch: 18 }, // Причина
];
      XLSX.utils.book_append_sheet(workbook, sheet, `Класс ${className}`);
    });

    // 📥 Скачиваем файл с датой в названии
    XLSX.writeFile(workbook, `DAVOMAT_${selectedDate}.xlsx`);
  } catch (error) {
    console.error("Ошибка при экспорте:", error);
    alert("Не удалось создать отчёт. Попробуйте позже.");
  }
});





