const API_URL = 'https://attendancesrv.vercel.app/api/absents';
let absentsData = [];
const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2', '#fd7e14', '#20c997'];

const users = [
    { name: "Dadabayeva.I.D.", className: "1A" }, { name: "Cherimitsina.A.K.", className: "1B" },
    { name: "Ermakova.D.Y.", className: "1V" }, { name: "Nurmatova.N.R.", className: "1G" },
    { name: "Musamatova.G.M.", className: "2A" }, { name: "Toshmatova.Y.Z.", className: "2B" },
    { name: "Movlonova.U.U.", className: "2V" }, { name: "Matluba.M.M.", className: "2G" },
    { name: "Ismoilova.N.E.", className: "2D" }, { name: "Izalxan.L.I.", className: "3A" },
    { name: "Matkarimova.N.B.", className: "3B" }, { name: "Qarshibayeva.N.A.", className: "3V" },
    { name: "Djamalova.F.A.", className: "3D" }, { name: "Kambarova.K.M.", className: "4A" },
    { name: "Polyakova.V.A.", className: "4B" }, { name: "Normuratova.D.X.", className: "4V" },
    { name: "Madaminova.S.Y.", className: "4G" }, { name: "Sheranova.D.T.", className: "4D" },
    { name: "Zokirxonova.G.B.", className: "5A" }, { name: "Abdumavlonova.X.M.", className: "5B" },
    { name: "Ermatova.X.A.", className: "5V" }, { name: "Mamatqulova.O.S.", className: "5G" },
    { name: "Raximov.R.R.", className: "6A" }, { name: "Ismoilov.A.K.", className: "6B" },
    { name: "Yettiyeva.D.M.", className: "6V" }, { name: "Malikova.B.A.", className: "6G" },
    { name: "Normatova.G.D.", className: "6D" }, { name: "Nefyodova.N.A.", className: "7A" },
    { name: "Xakimova.D.A.", className: "7B" }, { name: "Fozilov.I.O.", className: "7V" },
    { name: "Buligina.V.Y.", className: "8A" }, { name: "Yardamova.M.M.", className: "8B" },
    { name: "Mandiyev.O.A.", className: "8V" }, { name: "Pardayeva.N.M.", className: "9A" },
    { name: "Aripov.A.I.", className: "9B" }, { name: "Mamajanova.M.A.", className: "9V" },
    { name: "Xodjahanov.A.O.", className: "9G" }, { name: "Ismoilova.M.A.", className: "9D" },
    { name: "Xasanova.O.G.", className: "10A" }, { name: "Satimova.D.F.", className: "10B" },
    { name: "Ruzmatova.S.M.", className: "10V" }, { name: "Baltabayeva.M.T.", className: "11A" },
    { name: "Ryabinina.S.Y.", className: "11B" }, { name: "Abdullayeva.M.R.", className: "11V" },
    { name: "Aliyeva.N.M.", className: "11G" }
];

const translations = {
    ru: { 
        admin_panel_title: "Админ-панель №22", choose_date: "Выберите дату:", total_absent: "Всего отсутствующих", 
        reason_stats: "Статистика причин", clear_history: "Очистить историю", export_excel: "Excel отчёт",
        col_teacher: "Учитель", col_class: "Класс", col_perc: "Процент %", col_status: "Статус",
        col_date: "Дата", col_student: "Ученик", col_reason: "Причина", err_data: "Недостаточно данных!"
    },
    uz: { 
        admin_panel_title: "22-maktab admin paneli", choose_date: "Sanani tanlang:", total_absent: "Jami yo'qlar", 
        reason_stats: "Sabablar statistikasi", clear_history: "Tozalash", export_excel: "Excel yuklash",
        col_teacher: "O'qituvchi", col_class: "Sinf", col_perc: "Foiz %", col_status: "Holat",
        col_date: "Sana", col_student: "O'quvchi", col_reason: "Sabab", err_data: "Ma'lumot yetarli emas!"
    }
};

// 1. ПЛАШКА (СЛАЙДЕР) И ПЕРЕВОД
function applyTranslations(lang) {
    const group = document.getElementById('langGroup');
    const t = translations[lang];

    if (group) {
        // Устанавливаем атрибут для твоего CSS (двигаем плашку)
        group.setAttribute('data-active', lang);
        
        // Подсвечиваем активную кнопку
        group.querySelectorAll('.btn-lang').forEach(btn => {
            btn.classList.toggle('active', btn.id === `lang-${lang}`);
        });
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    localStorage.setItem('lang', lang);
}

// 2. EXCEL (С ПОДРОБНОСТЯМИ И ПРОВЕРКОЙ)
window.handleExcelExport = async function(type) {
    const lang = localStorage.getItem('lang') || 'ru';
    const t = translations[lang];
    const selectedDate = document.getElementById('dateFilter').value;
    const uniqueDays = [...new Set(absentsData.map(a => a.date))].sort();

    // Проверка накопления рабочих дней
    if (type === 'week' && uniqueDays.length < 6) return alert(t.err_data + " (Нужно 6 дней)");
    if (type === 'month' && uniqueDays.length < 20) return alert(t.err_data + " (Нужно 20 дней)");

    let filtered = [];
    if (type === 'day') filtered = absentsData.filter(a => a.date === selectedDate);
    else if (type === 'week') filtered = absentsData.filter(a => uniqueDays.slice(-6).includes(a.date));
    else if (type === 'month') filtered = absentsData.filter(a => a.date.startsWith(selectedDate.substring(0, 7)));

    const wb = XLSX.utils.book_new();

    // ЛИСТ 1: РЕЙТИНГ И СТАТУС ✅/❌
    const summary = users.map(u => {
        const matches = filtered.filter(a => a.teacher.trim() === u.name.trim());
        let total = 0, absent = 0;
        matches.forEach(m => { total += Number(m.allstudents); absent += Number(m.count); });
        const perc = total > 0 ? (((total - absent) / total) * 100).toFixed(1) : "100";
        return {
            [t.col_date]: selectedDate,
            [t.col_teacher]: u.name,
            [t.col_class]: u.className,
            [t.col_perc]: perc + "%",
            [t.col_status]: matches.length > 0 ? "✅" : "❌"
        };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "STATISTICS");

    // ЛИСТЫ ПО КЛАССАМ
    const classes = [...new Set(filtered.map(a => a.className))].sort();
    classes.forEach(cls => {
        const classRows = filtered.filter(a => a.className === cls).map(a => ({
            [t.col_date]: a.date,
            [t.col_student]: a.studentName,
            [t.col_reason]: a.reason
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classRows), `Class ${cls}`);
    });

    XLSX.writeFile(wb, `School22_${type}_Report.xlsx`);
};

// 3. ЗАГРУЗКА И СТАТИСТИКА
async function loadAbsents() {
    try {
        const res = await fetch(API_URL);
        absentsData = await res.json();
        const dates = [...new Set(absentsData.map(a => a.date))].sort().reverse();
        const select = document.getElementById('dateFilter');
        if (select && dates.length > 0) {
            select.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
            select.onchange = renderDashboard;
        }
        renderDashboard();
    } catch (e) { console.error("API Error"); }
}

function renderDashboard() {
    const val = document.getElementById('dateFilter').value;
    const filtered = absentsData.filter(a => a.date === val);
    const totalEl = document.getElementById('totalAbsent');
    if (totalEl) totalEl.textContent = filtered.length;

    const ctx = document.getElementById('reasonChart');
    if (ctx && window.Chart) {
        const counts = {};
        filtered.forEach(a => counts[a.reason] = (counts[a.reason] || 0) + 1);
        if (window.myChart) window.myChart.destroy();
        window.myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(counts),
                datasets: [{ data: Object.values(counts), backgroundColor: reasonColors }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const container = document.getElementById('classChartsContainer');
    if (container) {
        container.innerHTML = "";
        const map = {};
        filtered.forEach(a => { if(!map[a.className]) map[a.className] = []; map[a.className].push(a.studentName); });
        Object.keys(map).sort().forEach(cls => {
            const div = document.createElement('div');
            div.className = "col";
            div.innerHTML = `<div class="card stat-card h-100"><div class="card-body"><h5>${cls}</h5><p>Yo'q: ${map[cls].length}</p><small>${map[cls].join(', ')}</small></div></div>`;
            container.appendChild(div);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const lang = localStorage.getItem('lang') || 'ru';
    applyTranslations(lang);
    loadAbsents();
    document.getElementById('lang-ru').onclick = () => applyTranslations('ru');
    document.getElementById('lang-uz').onclick = () => applyTranslations('uz');
});
