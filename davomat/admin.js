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

// Функция смены языка
function setLang(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    // Переключаем активный класс на кнопках
    document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    localStorage.setItem('lang', lang);
}

document.getElementById('lang-ru').onclick = () => setLang('ru');
document.getElementById('lang-uz').onclick = () => setLang('uz');
setLang(localStorage.getItem('lang') || 'ru');

let absents = [];

// Загрузка данных
async function loadAbsents() {
    try {
        const res = await fetch('https://attendancesrv.vercel.app/api/absents');
        absents = await res.json();
        fillDateFilter();
    } catch (err) {
        console.error("Ошибка загрузки:", err);
    }
}

function fillDateFilter() {
    const dateFilter = document.getElementById('dateFilter');
    dateFilter.innerHTML = '';
    
    const dates = [...new Set(absents.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));
    const today = new Date().toISOString().split('T')[0];

    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        if (date === today) option.selected = true;
        dateFilter.appendChild(option);
    });

    if (!dateFilter.value && dates.length > 0) dateFilter.selectedIndex = 0;
    dateFilter.onchange = () => renderByDate();
    renderByDate();
}

const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2'];

// --- Общая диаграмма (Фикс "половинки") ---
function renderReasonPieChart(data) {  
    const stats = {};
    data.forEach(item => { stats[item.reason] = (stats[item.reason] || 0) + 1; });
    const labels = Object.keys(stats);
    const values = Object.values(stats);

    if (window.reasonChart instanceof Chart) {
        window.reasonChart.destroy();
    }

    const ctx = document.getElementById('reasonChart').getContext('2d');
    window.reasonChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map((_, i) => reasonColors[i % reasonColors.length]),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // КРИТИЧНО: чтобы круг не резался
            plugins: { legend: { display: false } }
        }
    });

    const legend = labels.map((label, i) =>
        `<div class="legend-item">
          <span class="legend-marker" style="background:${reasonColors[i % reasonColors.length]}"></span>
          <span>${label}</span>
        </div>`
    ).join('');
    document.getElementById('reasonLegend').innerHTML = legend;
}

// --- Диаграммы по классам ---
function renderClassPieCharts(data) {
    const container = document.getElementById('classChartsContainer');
    container.innerHTML = '';

    const classMap = {};
    data.forEach(item => {
        if (!classMap[item.className]) classMap[item.className] = [];
        classMap[item.className].push(item);
    });

    Object.keys(classMap).sort().forEach((className, idx) => {
        const classData = classMap[className];
        const stats = {};
        classData.forEach(item => { stats[item.reason] = (stats[item.reason] || 0) + 1; });
        const labels = Object.keys(stats);
        const values = Object.values(stats);

        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 col-12 mb-4 d-flex';

        col.innerHTML = `
            <div class="card flex-fill shadow-sm">
                <div class="card-body p-3">
                    <h6 class="text-center fw-bold mb-3">Класс ${className}</h6>
                    <div class="chart-wrapper">
                        <div class="canvas-container">
                            <canvas id="classChart${idx}"></canvas>
                        </div>
                        <div class="custom-legend">
                            ${labels.map((label, i) => `
                                <div class="legend-item">
                                    <span class="legend-marker" style="background:${reasonColors[i % reasonColors.length]}"></span>
                                    <span style="font-size: 0.8rem">${label}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="mt-3 small border-top pt-2">
                        ${classData.map(item => `
                            <div class="py-1">
                                <strong>${item.studentName}</strong> — ${item.reason} 
                                <span class="text-muted">(${item.allstudents ? 'из '+item.allstudents : ''})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        container.appendChild(col);

        const ctx = document.getElementById(`classChart${idx}`).getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: labels.map((_, i) => reasonColors[i % reasonColors.length]),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    });
}

function renderByDate() {
    const date = document.getElementById('dateFilter').value;
    const filtered = date ? absents.filter(a => a.date === date) : absents;
    document.getElementById('totalAbsent').textContent = filtered.length;
    renderReasonPieChart(filtered);
    renderClassPieCharts(filtered);
}

// Кнопка очистки
document.getElementById('clearHistory').onclick = async function() {
    if (confirm('Вы уверены, что хотите очистить всю историю?')) {
        try {
            await fetch('https://attendancesrv.vercel.app/api/absents', { method: 'DELETE' });
            location.reload();
        } catch (err) { alert("Ошибка при удалении"); }
    }
};

// Проверка доступа
document.addEventListener('DOMContentLoaded', () => {
    const teacherData = localStorage.getItem('teacher');
    if (!teacherData) {
        window.location.href = 'index.html';
        return;
    }
    const teacher = JSON.parse(teacherData);
    const allowedAdmins = ["admin", "shaxnoza", "furkat", "matlyuba"];
    if (!allowedAdmins.includes(teacher.login)) {
        window.location.href = 'index.html';
        return;
    }
    loadAbsents();
});

// Экспорт в Excel (исправленный)
document.getElementById('exportExcel').addEventListener('click', async () => {
    const selectedDate = document.getElementById('dateFilter').value;
    if (!selectedDate) return alert("Выберите дату!");

    const filtered = absents.filter(a => a.date === selectedDate);
    const workbook = XLSX.utils.book_new();

    // Лист по классам
    const classRows = filtered.map(item => ({
        Дата: item.date,
        Класс: item.className,
        Учитель: item.teacher,
        Ученик: item.studentName,
        Причина: item.reason,
        Всего: item.allstudents || ''
    }));

    const sheet = XLSX.utils.json_to_sheet(classRows);
    XLSX.utils.book_append_sheet(workbook, sheet, "Отчет по ученикам");
    XLSX.writeFile(workbook, `DAVOMAT_${selectedDate}.xlsx`);
});
