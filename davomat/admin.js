const API_URL = 'https://attendancesrv.vercel.app/api/absents';
let absentsData = [];
const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2', '#fd7e14', '#20c997'];

// Список всех учителей для проверки статуса (✅/❌)
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
        total_absent: "Всего отсутствующих", excel_err: "Недостаточно данных!", 
        col_teacher: "Учитель", col_class: "Класс", col_perc: "Процент %", col_status: "Статус",
        col_date: "Дата", col_student: "Ученик", col_reason: "Причина"
    },
    uz: { 
        total_absent: "Jami yo'qlar", excel_err: "Ma'lumot yetarli emas!", 
        col_teacher: "O'qituvchi", col_class: "Sinf", col_perc: "Foiz %", col_status: "Holat",
        col_date: "Sana", col_student: "O'quvchi", col_reason: "Sabab"
    }
};

function applyTranslations(lang) {
    const group = document.getElementById('langGroup');
    if (lang === 'uz') group.classList.add('uz-active');
    else group.classList.remove('uz-active');
    
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Перевод из основного объекта в HTML (если есть)
    });
}

// ЭКСПОРТ EXCEL
window.handleExcelExport = async function(type) {
    const lang = localStorage.getItem('lang') || 'ru';
    const t = translations[lang];
    const selectedDate = document.getElementById('dateFilter').value;
    const uniqueDays = [...new Set(absentsData.map(a => a.date))].sort();

    // ПРОВЕРКА НАКОПЛЕНИЯ
    if (type === 'week' && uniqueDays.length < 6) return alert(t.excel_err);
    if (type === 'month' && uniqueDays.length < 20) return alert(t.excel_err);

    let filtered = [];
    if (type === 'day') filtered = absentsData.filter(a => a.date === selectedDate);
    else if (type === 'week') filtered = absentsData.filter(a => uniqueDays.slice(-6).includes(a.date));
    else if (type === 'month') filtered = absentsData.filter(a => a.date.startsWith(selectedDate.substring(0, 7)));

    const wb = XLSX.utils.book_new();

    // 1. ОБЩАЯ СТАТИСТИКА (РЕЙТИНГ С ГАЛОЧКАМИ)
    const summaryData = users.map(u => {
        const userAbsents = filtered.filter(a => a.teacher.trim() === u.name.trim());
        let totalStudents = 0, absentCount = 0;
        
        userAbsents.forEach(a => {
            totalStudents += Number(a.allstudents) || 0;
            absentCount += Number(a.count) || 1; 
        });

        const percent = totalStudents > 0 ? (((totalStudents - absentCount) / totalStudents) * 100).toFixed(1) : "100";
        const status = userAbsents.length > 0 ? "✅" : "❌";

        return {
            [t.col_date]: selectedDate,
            [t.col_teacher]: u.name,
            [t.col_class]: u.className,
            [t.col_perc]: percent + "%",
            [t.col_status]: status
        };
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "ОБЩАЯ СТАТИСТИКА");

    // 2. ЛИСТЫ ПО КЛАССАМ (ПОДРОБНО)
    const classes = [...new Set(filtered.map(a => a.className))].sort();
    classes.forEach(cls => {
        const classData = filtered.filter(a => a.className === cls).map(a => ({
            [t.col_date]: a.date,
            [t.col_student]: a.studentName,
            [t.col_reason]: a.reason
        }));
        const wsClass = XLSX.utils.json_to_sheet(classData);
        XLSX.utils.book_append_sheet(wb, wsClass, `Класс ${cls}`);
    });

    XLSX.writeFile(wb, `School22_${type}_Report.xlsx`);
};

// ЗАГРУЗКА И ОТРИСОВКА
async function loadAbsents() {
    const res = await fetch(API_URL);
    absentsData = await res.json();
    const dates = [...new Set(absentsData.map(a => a.date))].sort().reverse();
    const select = document.getElementById('dateFilter');
    if (select) {
        select.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
        select.onchange = renderDashboard;
    }
    renderDashboard();
}

function renderDashboard() {
    const val = document.getElementById('dateFilter').value;
    const filtered = absentsData.filter(a => a.date === val);
    const totalEl = document.getElementById('totalAbsent');
    if (totalEl) totalEl.textContent = filtered.length;

    // График
    const counts = {};
    filtered.forEach(a => counts[a.reason] = (counts[a.reason] || 0) + 1);
    const ctx = document.getElementById('reasonChart');
    if (ctx && window.Chart) {
        if (window.myChart) window.myChart.destroy();
        window.myChart = new window.Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(counts),
                datasets: [{ data: Object.values(counts), backgroundColor: reasonColors }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Карточки классов
    const container = document.getElementById('classChartsContainer');
    if (container) {
        container.innerHTML = "";
        const classMap = {};
        filtered.forEach(a => {
            if (!classMap[a.className]) classMap[a.className] = [];
            classMap[a.className].push(a.studentName);
        });
        Object.keys(classMap).sort().forEach(cls => {
            const div = document.createElement('div');
            div.className = "col";
            div.innerHTML = `<div class="card stat-card h-100"><div class="card-body"><h5>${cls}</h5><p>Yo'q: ${classMap[cls].length}</p><small>${classMap[cls].join(', ')}</small></div></div>`;
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
