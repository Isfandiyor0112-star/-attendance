// 1. БАЗА ДАННЫХ УЧИТЕЛЕЙ (Из твоего списка)
const users = [
    { name: "Dadabayeva.I.D.", className: "1A" },
    { name: "Cherimitsina.A.K.", className: "1B" },
    { name: "Ermakova.D.Y.", className: "1V" },
    { name: "Nurmatova.N.R.", className: "1G" },
    { name: "Musamatova.G.M.", className: "2A" },
    { name: "Toshmatova.Y.Z.", className: "2B" },
    { name: "Movlonova.U.U.", className: "2V" },
    { name: "Ubaydullayeva.M.M.", className: "2G" },
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
const translations = {
    ru: {
        admin_panel_title: "Админ-панель школы №22",
        choose_date: "Выберите дату:",
        total_absent: "Всего отсутствующих",
        reason_stats: "Статистика причин",
        clear_history: "Очистить историю",
        export_btn: "Скачать Excel"
    },
    uz: {
        admin_panel_title: "22-maktab admin paneli",
        choose_date: "Sana tanlang:",
        total_absent: "Yo‘qlarning jami",
        reason_stats: "Sabablar statistikasi",
        clear_history: "Tarixni tozalash",
        export_btn: "Excel yuklash"
    }
};

let absents = [];
const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2'];

// --- СМЕНА ЯЗЫКА ---
function setLang(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });
    document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
    if (document.getElementById(`lang-${lang}`)) document.getElementById(`lang-${lang}`).classList.add('active');
    if (document.getElementById('langGroup')) document.getElementById('langGroup').setAttribute('data-active', lang);
    localStorage.setItem('lang', lang);
}

document.getElementById('lang-ru').onclick = () => setLang('ru');
document.getElementById('lang-uz').onclick = () => setLang('uz');

// --- ЗАГРУЗКА ДАННЫХ ---
async function loadAbsents() {
    try {
        const res = await fetch(API_URL);
        absents = await res.json();
        fillDateFilter();
    } catch (err) { console.error("Ошибка:", err); }
}

function fillDateFilter() {
    const filter = document.getElementById('dateFilter');
    const dates = [...new Set(absents.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));
    filter.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
    if (dates.length > 0) renderByDate();
    filter.onchange = renderByDate;
}

function renderByDate() {
    const date = document.getElementById('dateFilter').value;
    const filtered = absents.filter(a => a.date === date);
    document.getElementById('totalAbsent').textContent = filtered.length;
    renderReasonPieChart(filtered);
    renderClassPieCharts(filtered);
}

// --- ГРАФИКИ ---
function renderReasonPieChart(data) {
    const stats = {};
    data.forEach(i => stats[i.reason] = (stats[i.reason] || 0) + 1);
    const labels = Object.keys(stats);
    if (window.reasonChart instanceof Chart) window.reasonChart.destroy();
    window.reasonChart = new Chart(document.getElementById('reasonChart'), {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{ data: Object.values(stats), backgroundColor: reasonColors, borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    document.getElementById('reasonLegend').innerHTML = labels.map((l, i) => 
        `<div class="legend-item"><span class="legend-marker" style="background:${reasonColors[i % reasonColors.length]}"></span>${l}</div>`).join('');
}

function renderClassPieCharts(data) {
    const container = document.getElementById('classChartsContainer');
    container.innerHTML = '';
    const classMap = {};
    data.forEach(i => { if(!classMap[i.className]) classMap[i.className] = []; classMap[i.className].push(i); });

    Object.keys(classMap).sort().forEach((cls, idx) => {
        const classData = classMap[cls];
        const stats = {};
        classData.forEach(i => stats[i.reason] = (stats[i.reason] || 0) + 1);

        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
            <div class="card h-100 stat-card p-3">
                <h6 class="text-center fw-bold" style="color:#0d6efd">Класс ${cls}</h6>
                <div style="height:150px"><canvas id="classChart${idx}"></canvas></div>
                <div class="mt-2 small border-top pt-2" style="max-height:100px; overflow-y:auto">
                    ${classData.map(i => `<div>• ${i.studentName} (${i.reason})</div>`).join('')}
                </div>
            </div>`;
        container.appendChild(col);
        new Chart(document.getElementById(`classChart${idx}`), {
            type: 'pie',
            data: { labels: Object.keys(stats), datasets: [{ data: Object.values(stats), backgroundColor: reasonColors }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    });
}

// --- EXCEL С РЕЙТИНГОМ ---
document.getElementById('exportExcel').onclick = async () => {
    const date = document.getElementById('dateFilter').value;
    if (!date) return alert("Нет даты!");
    
    const norm = (s) => s.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
    const filtered = absents.filter(a => a.date === date);

    const summaryRows = users.map(u => {
        const match = filtered.find(i => norm(i.teacher) === norm(u.name));
        const total = match ? parseFloat(match.allstudents) : 0;
        const sick = match ? parseFloat(match.count) : 0;
        const perc = total > 0 ? ((total - sick) / total) * 100 : 0;
        return {
            "Учитель": u.name, "Класс": u.className,
            "Пришли (%)": parseFloat(perc.toFixed(1)),
            "Статус": match ? "✅" : "❌"
        };
    }).sort((a, b) => b["Пришли (%)"] - a["Пришли (%)"]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Umumiy');
    
    const classGroups = {};
    filtered.forEach(i => {
        if(!classGroups[i.className]) classGroups[i.className] = [];
        classGroups[i.className].push({ "Ученик": i.studentName, "Причина": i.reason });
    });
    Object.keys(classGroups).sort().forEach(c => {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classGroups[c]), `Класс ${c}`);
    });

    XLSX.writeFile(wb, `Otchet_22_shkola_${date}.xlsx`);
};

// --- ОЧИСТКА ---
document.getElementById('clearHistory').onclick = async () => {
    if (confirm('Очистить ВСЮ базу?')) {
        await fetch(API_URL, { method: 'DELETE' });
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setLang(localStorage.getItem('lang') || 'ru');
    loadAbsents();
});
