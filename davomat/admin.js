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
].filter(u => u.className);

const API_URL = 'https://attendancesrv.vercel.app/api/absents';
let absentsData = [];
const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2', '#fd7e14', '#20c997'];

const translations = {
    ru: { 
        admin_panel_title: "Админ-панель №22", choose_date: "Выберите дату:", total_absent: "Всего отсутствующих", 
        reason_stats: "Статистика причин", clear_history: "Очистить историю", export_excel: "Excel отчёт",
        select_period: "Выберите период", report_day: "За 1 день", report_week: "За неделю (6 дн.)",
        report_month: "За месяц", total_label: "ИТОГО:", avg_label: "Средний %:", status_col: "Статус",
        sheet_rating: "РЕЙТИНГ", col_date: "Дата", col_teacher: "Учитель", col_student: "Ученик", col_reason: "Причина",
        col_total: "Всего", col_absent: "Нет", col_perc: "%", msg_nodata: "Нет данных!"
    },
    uz: { 
        admin_panel_title: "22-maktab admin paneli", choose_date: "Sanani tanlang:", total_absent: "Jami yo'qlar", 
        reason_stats: "Sabablar statistikasi", clear_history: "Tozalash", export_excel: "Excel yuklash",
        select_period: "Hisobot davrini tanlang", report_day: "1 kunlik", report_week: "Haftalik (6 kun)",
        report_month: "Oylik", total_label: "YAKUN:", avg_label: "O'rtacha %:", status_col: "Holat",
        sheet_rating: "REYTING", col_date: "Sana", col_teacher: "O'qituvchi", col_student: "O'quvchi", col_reason: "Sabab",
        col_total: "Jami", col_absent: "Yo'q", col_perc: "%", msg_nodata: "Ma'lumot yo'q!"
    }
};

// Функция ПЕРЕВОДА (без перезагрузки)
function applyTranslations(lang) {
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    // Визуальное переключение слайдера
    const group = document.getElementById('langGroup');
    if (lang === 'uz') group.classList.add('uz-active');
    else group.classList.remove('uz-active');
    
    localStorage.setItem('lang', lang);
}

// Глобальная функция экспорта (для HTML onclick)
window.handleExcelExport = async function(type) {
    const selectedDate = document.getElementById('dateFilter').value;
    const lang = localStorage.getItem('lang') || 'ru';
    const t = translations[lang];

    if (!selectedDate) return alert(t.msg_nodata);

    try {
        const res = await fetch(API_URL);
        const allData = await res.json();
        let filtered = [];
        const uniqueDates = [...new Set(allData.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));

        if (type === 'day') filtered = allData.filter(a => a.date === selectedDate);
        else if (type === 'week') filtered = allData.filter(a => uniqueDates.slice(0, 6).includes(a.date));
        else if (type === 'month') {
            const d = new Date(selectedDate);
            filtered = allData.filter(item => {
                const id = new Date(item.date);
                return id.getFullYear() === d.getFullYear() && id.getMonth() === d.getMonth();
            });
        }

        if (filtered.length === 0) return alert(t.msg_nodata);

        // Генерация Excel
        const wb = XLSX.utils.book_new();
        const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
        
        // Лист Рейтинга
        const activeDates = [...new Set(filtered.map(a => a.date))].sort();
        const ratingData = users.map(u => {
            const matches = filtered.filter(i => norm(i.teacher) === norm(u.name));
            let tot = 0, abs = 0;
            matches.forEach(m => { tot += parseFloat(m.allstudents) || 0; abs += parseFloat(m.count) || 0; });
            const p = tot > 0 ? (((tot - abs) / tot) * 100).toFixed(1) : 0;
            let status = "";
            activeDates.forEach(d => { status += matches.some(m => m.date === d) ? "✅" : "❌"; });
            return { [t.col_teacher]: u.name, "Sinf": u.className, [t.col_perc]: p + "%", [t.status_col]: status };
        }).sort((a, b) => parseFloat(b[t.col_perc]) - parseFloat(a[t.col_perc]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ratingData), t.sheet_rating);

        // Листы классов
        const grp = {};
        filtered.forEach(i => { if(!grp[i.className]) grp[i.className] = []; grp[i.className].push(i); });
        Object.keys(grp).sort().forEach(cls => {
            const rows = [];
            let tT = 0, tA = 0;
            grp[cls].forEach(r => {
                const tot = parseFloat(r.allstudents) || 0, abs = parseFloat(r.count) || 0;
                tT += tot; tA += abs;
                rows.push({ [t.col_date]: r.date, [t.col_student]: r.studentName, [t.col_reason]: r.reason, [t.col_total]: tot, [t.col_absent]: abs });
            });
            rows.push({}, { [t.col_date]: t.total_label, [t.col_reason]: (tT > 0 ? (((tT - tA) / tT) * 100).toFixed(1) : 0) + "%", [t.col_absent]: tA });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), cls);
        });

        XLSX.writeFile(wb, `Report22_${type}.xlsx`);
        bootstrap.Modal.getInstance(document.getElementById('excelModal')).hide();
    } catch (e) { alert("Excel error"); }
};

function renderDashboard() {
    const val = document.getElementById('dateFilter').value;
    if(!val) return;
    const filtered = absentsData.filter(a => a.date === val);
    const lang = localStorage.getItem('lang') || 'ru';
    
    document.getElementById('totalAbsent').textContent = filtered.length;

    // График
    const s = {}; filtered.forEach(i => s[i.reason] = (s[i.reason] || 0) + 1);
    const ctx = document.getElementById('reasonChart');
    if (window.myChart instanceof Chart) window.myChart.destroy();
    window.myChart = new Chart(ctx, { 
        type: 'doughnut', 
        data: { labels: Object.keys(s), datasets: [{ data: Object.values(s), backgroundColor: reasonColors }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#fff' } } } }
    });

    // Карточки
    const container = document.getElementById('classChartsContainer');
    container.innerHTML = "";
    const classMap = {};
    filtered.forEach(a => { if(!classMap[a.className]) classMap[a.className] = []; classMap[a.className].push(a); });
    Object.keys(classMap).sort().forEach(cls => {
        const div = document.createElement('div');
        div.className = "col";
        div.innerHTML = `<div class="card stat-card h-100"><div class="card-body"><h5 class="fw-bold text-warning">${cls}</h5><p class="mb-1">${lang==='ru'?'Нет':'Yo\'q'}: <b>${classMap[cls].length}</b></p><small class="text-white-50">${classMap[cls].map(u => u.studentName).join(', ')}</small></div></div>`;
        container.appendChild(div);
    });
}

async function init() {
    const lang = localStorage.getItem('lang') || 'ru';
    applyTranslations(lang);

    try {
        const res = await fetch(API_URL);
        absentsData = await res.json();
        const dts = [...new Set(absentsData.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));
        const f = document.getElementById('dateFilter');
        f.innerHTML = dts.map(d => `<option value="${d}">${d}</option>`).join('');
        f.onchange = renderDashboard;
        if(dts.length > 0) renderDashboard();
    } catch(e) {}

    // Кнопки языков
    document.getElementById('lang-ru').onclick = () => applyTranslations('ru');
    document.getElementById('lang-uz').onclick = () => applyTranslations('uz');

    // Очистка
    document.getElementById('clearHistory').onclick = async () => {
        if (confirm('Очистить? / Tozalash?')) {
            await fetch(API_URL, { method: 'DELETE' });
            location.reload();
        }
    };
}

document.addEventListener('DOMContentLoaded', init);
