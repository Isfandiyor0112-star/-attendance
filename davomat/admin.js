// 1. БАЗА ДАННЫХ УЧИТЕЛЕЙ
const users = [
    { name: "Dadabayeva.I.D.", className: "1A" },
    { name: "Cherimitsina.A.K.", className: "1B" },
    { name: "Ermakova.D.Y.", className: "1V" },
    { name: "Nurmatova.N.R.", className: "1G" },
    { name: "Musamatova.G.M.", className: "2A" },
    { name: "Toshmatova.Y.Z.", className: "2B" },
    { name: "Movlonova.U.U.", className: "2V" },
    { name: "Matluba.M.M.", className: "2G" }, // Поправил имя в базе
    { name: "Ismoilova.N.E.", className: "2D" },
    { name: "Izalxan.L.I.", className: "3A" },
    { name: "Matkarimova.N.B.", className: "3B" },
    { name: "Qarshibayeva.N.A.", className: "3V" },
    { name: "Djamalova.F.A.", className: "3D" },
    { name: "Kambarova.K.M.", className: "4A" },
    { name: "Polyakova.V.A.", className: "4B" },
    { name: "Normuratova.D.X.", className: "4V" },
    { name: "Madaminova.S.Y.", className: "4G" },
    { name: "Sheranova.D.T.", className: "4D" },
    { name: "Zokirxonova.G.B.", className: "5A" },
    { name: "Abdumavlonova.X.M.", className: "5B" },
    { name: "Ermatova.X.A.", className: "5V" },
    { name: "Mamatqulova.O.S.", className: "5G" },
    { name: "Raximov.R.R.", className: "6A" },
    { name: "Ismoilov.A.K.", className: "6B" },
    { name: "Yettiyeva.D.M.", className: "6V" },
    { name: "Malikova.B.A.", className: "6G" },
    { name: "Normatova.G.D.", className: "6D" },
    { name: "Nefyodova.N.A.", className: "7A" },
    { name: "Xakimova.D.A.", className: "7B" },
    { name: "Fozilov.I.O.", className: "7V" },
    { name: "Buligina.V.Y.", className: "8A" },
    { name: "Yardamova.M.M.", className: "8B" },
    { name: "Mandiyev.O.A.", className: "8V" },
    { name: "Pardayeva.N.M.", className: "9A" },
    { name: "Aripov.A.I.", className: "9B" },
    { name: "Mamajanova.M.A.", className: "9V" },
    { name: "Xodjahanov.A.O.", className: "9G" },
    { name: "Ismoilova.M.A.", className: "9D" },
    { name: "Xasanova.O.G.", className: "10A" },
    { name: "Satimova.D.F.", className: "10B" },
    { name: "Ruzmatova.S.M.", className: "10V" },
    { name: "Baltabayeva.M.T.", className: "11A" },
    { name: "Ryabinina.S.Y.", className: "11B" },
    { name: "Abdullayeva.M.R.", className: "11V" },
    { name: "Aliyeva.N.M.", className: "11G" }
].filter(u => u.className);

const API_URL = 'https://attendancesrv.vercel.app/api/absents';
let absents = [];

const translations = {
    ru: { 
        admin_panel_title: "Админ-панель №22", 
        choose_date: "Дата:", 
        total_absent: "Отсутствуют", 
        reason_stats: "Статистика", 
        clear_history: "Очистить историю", 
        export_excel: "Excel отчёт",
        select_period: "Выберите период отчета",
        report_day: "Однодневный отчет",
        report_week: "Шестидневный отчет",
        not_enough_data: "Отчет еще не накопился! Нужно минимум 6 дней данных."
    },
    uz: { 
        admin_panel_title: "22-maktab admin paneli", 
        choose_date: "Sana:", 
        total_absent: "Yo'qlar", 
        reason_stats: "Statistika", 
        clear_history: "Tozalash", 
        export_excel: "Excel yuklash",
        select_period: "Hisobot davrini tanlang",
        report_day: "Bir kunlik hisobot",
        report_week: "Olti kunlik hisobot",
        not_enough_data: "Hisobot hali yig'ilmadi! Kamida 6 kunlik ma'lumot kerak."
    }
};

function setLang(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');
    document.getElementById('langGroup').setAttribute('data-active', lang);
    localStorage.setItem('lang', lang);
}

document.getElementById('lang-ru').onclick = () => setLang('ru');
document.getElementById('lang-uz').onclick = () => setLang('uz');

// --- НОВАЯ ЛОГИКА ЭКСПОРТА ---

async function handleExcelExport(type) {
    const selectedDate = document.getElementById('dateFilter').value;
    const lang = localStorage.getItem('lang') || 'ru';
    
    if (!selectedDate) return alert(lang === 'ru' ? "Выберите дату!" : "Sana tanlang!");

    try {
        const res = await fetch(API_URL);
        const allData = await res.json();
        let filtered = [];

        if (type === 'day') {
            filtered = allData.filter(a => a.date === selectedDate);
        } else {
            // Берем уникальные даты и проверяем их количество
            const uniqueDates = [...new Set(allData.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));
            
            if (uniqueDates.length < 6) {
                alert(translations[lang].not_enough_data);
                return;
            }
            
            // Берем последние 6 дней
            const last6 = uniqueDates.slice(0, 6);
            filtered = allData.filter(a => last6.includes(a.date));
        }

        generateExcelFile(filtered, selectedDate, type, lang);
        
        // Закрываем модалку
        const modal = bootstrap.Modal.getInstance(document.getElementById('excelModal'));
        if (modal) modal.hide();

    } catch (e) {
        alert("Ошибка: " + e.message);
    }
}

function generateExcelFile(filtered, date, type, lang) {
    const wb = XLSX.utils.book_new();
    const norm = (s) => s.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');

    // Лист 1: Общий рейтинг
    const summaryRows = users.map(u => {
        const matches = filtered.filter(i => norm(i.teacher) === norm(u.name));
        let total = 0, absent = 0;
        matches.forEach(m => {
            total += parseFloat(m.allstudents) || 0;
            absent += parseFloat(m.count) || 0;
        });
        const perc = total > 0 ? (((total - absent) / total) * 100).toFixed(1) : 0;

        return {
            [lang==='ru'?'Учитель':'O\'qituvchi']: u.name,
            "Sinf": u.className,
            "Hozir (%)": perc + "%",
            [lang==='ru'?'Заполнено':'Holati']: matches.length > 0 ? "✅" : "❌"
        };
    });

    const ws1 = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Rating');

    // Лист 2: Подробный список по пропускам
    const detailRows = filtered.map(i => ({
        "Sana": i.date,
        "Sinf": i.className,
        "O'quvchi": i.studentName,
        "Sabab": i.reason,
        "O'qituvchi": i.teacher
    }));

    const ws2 = XLSX.utils.json_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Details');

    XLSX.writeFile(wb, `Report_22_School_${type}_${date}.xlsx`);
}

// --- СТАНДАРТНЫЕ ФУНКЦИИ ---

async function loadAbsents() {
    try {
        const res = await fetch(API_URL);
        absents = await res.json();
        const filter = document.getElementById('dateFilter');
        const dates = [...new Set(absents.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));
        filter.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
        if (dates.length > 0) renderByDate();
        filter.onchange = renderByDate;
    } catch (err) {}
}

const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2'];

function renderByDate() {
    const date = document.getElementById('dateFilter').value;
    const filtered = absents.filter(a => a.date === date);
    document.getElementById('totalAbsent').textContent = filtered.length;
    renderReasonPieChart(filtered);
    renderClassPieCharts(filtered);
}

function renderReasonPieChart(data) {
    const stats = {};
    data.forEach(i => stats[i.reason] = (stats[i.reason] || 0) + 1);
    const labels = Object.keys(stats);
    if (window.reasonChart instanceof Chart) window.reasonChart.destroy();
    window.reasonChart = new Chart(document.getElementById('reasonChart'), {
        type: 'pie',
        data: { labels: labels, datasets: [{ data: Object.values(stats), backgroundColor: reasonColors, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    document.getElementById('reasonLegend').innerHTML = labels.map((l, i) => `<div class="legend-item"><span class="legend-marker" style="background:${reasonColors[i % reasonColors.length]}"></span>${l}</div>`).join('');
}

function renderClassPieCharts(data) {
    const container = document.getElementById('classChartsContainer');
    container.innerHTML = '';
    const classMap = {};
    data.forEach(i => { if(!classMap[i.className]) classMap[i.className] = []; classMap[i.className].push(i); });
    Object.keys(classMap).sort().forEach((cls, idx) => {
        const classData = classMap[cls];
        const stats = {}; classData.forEach(i => stats[i.reason] = (stats[i.reason] || 0) + 1);
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `<div class="card h-100 stat-card p-3"><h6 class="text-center fw-bold" style="color:#0d6efd">Класс ${cls}</h6><div style="height:150px"><canvas id="classChart${idx}"></canvas></div><div class="mt-2 small border-top pt-2" style="max-height:100px; overflow-y:auto">${classData.map(i => `<div>• ${i.studentName} (${i.reason})</div>`).join('')}</div></div>`;
        container.appendChild(col);
        new Chart(document.getElementById(`classChart${idx}`), { type: 'pie', data: { labels: Object.keys(stats), datasets: [{ data: Object.values(stats), backgroundColor: reasonColors }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    });
}

document.getElementById('clearHistory').onclick = async () => { if (confirm('Очистить ВСЮ базу?')) { await fetch(API_URL, { method: 'DELETE' }); location.reload(); } };

document.addEventListener('DOMContentLoaded', () => { 
    loadAbsents(); 
    setLang(localStorage.getItem('lang') || 'ru'); 
});
