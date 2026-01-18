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
        select_period: "Выберите период", report_day: "За 1 день", report_week: "За неделю",
        report_month: "За месяц", total_label: "ИТОГО", col_date: "Дата", col_teacher: "Учитель", 
        col_student: "Ученик", col_reason: "Причина", col_total: "Всего в классе", col_absent: "Отсутствует", col_perc: "Процент %"
    },
    uz: { 
        admin_panel_title: "22-maktab admin paneli", choose_date: "Sanani tanlang:", total_absent: "Jami yo'qlar", 
        reason_stats: "Sabablar statistikasi", clear_history: "Tozalash", export_excel: "Excel yuklash",
        select_period: "Hisobot davrini tanlang", report_day: "1 kunlik", report_week: "Haftalik",
        report_month: "Oylik", total_label: "YAKUN", col_date: "Sana", col_teacher: "O'qituvchi", 
        col_student: "O'quvchi", col_reason: "Sabab", col_total: "Jami o'quvchi", col_absent: "Yo'qlar", col_perc: "Foiz %"
    }
};

function applyTranslations(lang) {
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    const group = document.getElementById('langGroup');
    if (lang === 'uz') group.classList.add('uz-active');
    else group.classList.remove('uz-active');
    localStorage.setItem('lang', lang);
}

// УМНЫЙ ЭКСПОРТ (Фильтрует от ВЫБРАННОЙ даты)
window.handleExcelExport = async function(type) {
    const selectedDateStr = document.getElementById('dateFilter').value;
    if (!selectedDateStr) return alert("Выберите дату!");
    
    const lang = localStorage.getItem('lang') || 'ru';
    const t = translations[lang];
    const targetDate = new Date(selectedDateStr);

    try {
        const res = await fetch(API_URL);
        const allData = await res.json();
        let filtered = [];

        if (type === 'day') {
            filtered = allData.filter(a => a.date === selectedDateStr);
        } else {
            filtered = allData.filter(item => {
                const itemDate = new Date(item.date);
                const diffTime = targetDate - itemDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (type === 'week') return diffDays >= 0 && diffDays < 7;
                if (type === 'month') return itemDate.getMonth() === targetDate.getMonth() && itemDate.getFullYear() === targetDate.getFullYear();
                return false;
            });
        }

        if (filtered.length === 0) return alert(t.report_day + ": " + (lang === 'ru' ? 'Данных нет' : 'Ma\'lumot yo\'q'));

        const wb = XLSX.utils.book_new();
        
        // Лист 1: Общий список (Подробный)
        const detailedRows = filtered.map(r => ({
            [t.col_date]: r.date,
            [t.col_teacher]: r.teacher,
            "Sinf": r.className,
            [t.col_student]: r.studentName,
            [t.col_reason]: r.reason,
            [t.col_total]: r.allstudents,
            [t.col_absent]: r.count
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedRows), "Detailed_Report");

        // Лист 2: Сводка по классам (Рейтинг)
        const summary = {};
        filtered.forEach(r => {
            if (!summary[r.className]) summary[r.className] = { total: 0, absent: 0, teacher: r.teacher };
            summary[r.className].total += Number(r.allstudents) || 0;
            summary[r.className].absent += Number(r.count) || 0;
        });

        const summaryRows = Object.keys(summary).map(cls => {
            const data = summary[cls];
            const perc = data.total > 0 ? (((data.total - data.absent) / data.total) * 100).toFixed(1) : 0;
            return {
                "Sinf": cls,
                [t.col_teacher]: data.teacher,
                [t.col_total]: data.total,
                [t.col_absent]: data.absent,
                [t.col_perc]: perc + "%"
            };
        }).sort((a,b) => b["Sinf"] < a["Sinf"] ? 1 : -1);

        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Class_Summary");

        XLSX.writeFile(wb, `School22_${type}_${selectedDateStr}.xlsx`);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('excelModal'));
        if (modal) modal.hide();
    } catch (e) { alert("Ошибка загрузки"); }
};

function renderDashboard() {
    const val = document.getElementById('dateFilter').value;
    if(!val) return;
    const filtered = absentsData.filter(a => a.date === val);
    
    document.getElementById('totalAbsent').textContent = filtered.length;

    const s = {}; filtered.forEach(i => s[i.reason] = (s[i.reason] || 0) + 1);
    const ctx = document.getElementById('reasonChart');
    if (window.myChart instanceof Chart) window.myChart.destroy();
    window.myChart = new Chart(ctx, { 
        type: 'doughnut', 
        data: { labels: Object.keys(s), datasets: [{ data: Object.values(s), backgroundColor: reasonColors }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } } }
    });

    const container = document.getElementById('classChartsContainer');
    container.innerHTML = "";
    const classMap = {};
    filtered.forEach(a => { if(!classMap[a.className]) classMap[a.className] = []; classMap[a.className].push(a); });
    
    Object.keys(classMap).sort().forEach(cls => {
        const div = document.createElement('div');
        div.className = "col";
        div.innerHTML = `
            <div class="card stat-card h-100">
                <div class="card-body">
                    <h5 class="fw-bold text-warning">${cls}</h5>
                    <p class="mb-1">Yo'q: <b>${classMap[cls].length}</b></p>
                    <small class="text-white-50">${classMap[cls].map(u => u.studentName).join(', ')}</small>
                </div>
            </div>`;
        container.appendChild(div);
    });
}

async function start() {
    const lang = localStorage.getItem('lang') || 'ru';
    applyTranslations(lang);

    try {
        const res = await fetch(API_URL);
        absentsData = await res.json();
        const dts = [...new Set(absentsData.map(a => a.date))].sort((a, b) => b.localeCompare(a));
        const f = document.getElementById('dateFilter');
        f.innerHTML = dts.map(d => `<option value="${d}">${d}</option>`).join('');
        f.onchange = renderDashboard;
        if(dts.length > 0) renderDashboard();
    } catch(e) { console.error("Data load failed"); }

    document.getElementById('lang-ru').onclick = () => applyTranslations('ru');
    document.getElementById('lang-uz').onclick = () => applyTranslations('uz');
    
    document.getElementById('clearHistory').onclick = async () => {
        if (confirm('Очистить ВСЮ историю?')) {
            await fetch(API_URL, { method: 'DELETE' });
            location.reload();
        }
    };
}

document.addEventListener('DOMContentLoaded', start);
