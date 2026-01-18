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
let absents = [];
const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2'];

const translations = {
    ru: { 
        admin_panel_title: "Админ-панель №22", choose_date: "Дата:", total_absent: "Отсутствуют", 
        reason_stats: "Статистика причин", clear_history: "Очистить историю", export_excel: "Excel отчёт",
        select_period: "Выберите период", report_day: "За 1 день", report_week: "За неделю (6 дн.)",
        report_month: "Месячный отчет", not_enough_data: "Нужно минимум 6 дней данных!", not_enough_month: "Данных за этот месяц нет!"
    },
    uz: { 
        admin_panel_title: "22-maktab admin paneli", choose_date: "Sana:", total_absent: "Yo'qlar", 
        reason_stats: "Statistika", clear_history: "Tozalash", export_excel: "Excel yuklash",
        select_period: "Davrni tanlang", report_day: "1 kunlik", report_week: "Haftalik (6 kun)",
        report_month: "Oylik hisobot", not_enough_data: "Kamida 6 kunlik ma'lumot kerak!", not_enough_month: "Bu oy uchun ma'lumot yo'q!"
    }
};

function setLang(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
    });
    localStorage.setItem('lang', lang);
    const langGroup = document.getElementById('langGroup');
    if(langGroup) langGroup.setAttribute('data-active', lang);
}

async function handleExcelExport(type) {
    const selectedDate = document.getElementById('dateFilter').value;
    const lang = localStorage.getItem('lang') || 'ru';
    if (!selectedDate) return;

    try {
        const res = await fetch(API_URL);
        const allData = await res.json();
        let filtered = [];
        const uniqueDates = [...new Set(allData.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));

        if (type === 'day') {
            filtered = allData.filter(a => a.date === selectedDate);
        } else if (type === 'week') {
            if (uniqueDates.length < 6) return alert(translations[lang].not_enough_data);
            const last6 = uniqueDates.slice(0, 6);
            filtered = allData.filter(a => last6.includes(a.date));
        } else if (type === 'month') {
            const d = new Date(selectedDate);
            filtered = allData.filter(item => {
                const id = new Date(item.date);
                return id.getFullYear() === d.getFullYear() && id.getMonth() === d.getMonth();
            });
            if ([...new Set(filtered.map(a => a.date))].length < 2) return alert(translations[lang].not_enough_month);
        }
        generateExcel(filtered, selectedDate, type, lang);
        const modal = bootstrap.Modal.getInstance(document.getElementById('excelModal'));
        if(modal) modal.hide();
    } catch (e) { console.error(e); }
}

function generateExcel(filtered, date, type, lang) {
    const wb = XLSX.utils.book_new();
    const norm = (s) => s.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
    const activeDates = [...new Set(filtered.map(a => a.date))].sort();

    // 1. Лист Рейтинга (Rating)
    const summaryRows = users.map(u => {
        const matches = filtered.filter(i => norm(i.teacher) === norm(u.name));
        let tot = 0, abs = 0;
        matches.forEach(m => { tot += parseFloat(m.allstudents) || 0; abs += parseFloat(m.count) || 0; });
        const p = tot > 0 ? (((tot - abs) / tot) * 100).toFixed(1) : 0;
        let statusIcons = "";
        activeDates.forEach(d => { statusIcons += matches.some(m => m.date === d) ? "✅" : "❌"; });
        return {
            [lang==='ru'?'Учитель':'O\'qituvchi']: u.name,
            "Sinf": u.className,
            "Davomat (%)": p + "%",
            [lang==='ru'?'Статус':'Holat']: statusIcons
        };
    }).sort((a, b) => parseFloat(b["Davomat (%)"]) - parseFloat(a["Davomat (%)"]));

    const wsRating = XLSX.utils.json_to_sheet(summaryRows);
    wsRating['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsRating, 'Rating');

    // 2. Листы Классов
    const grp = {};
    filtered.forEach(i => { if(!grp[i.className]) grp[i.className] = []; grp[i.className].push(i); });

    Object.keys(grp).sort().forEach(c => {
        const classData = grp[c];
        const rows = [];
        let totalSumAll = 0, totalSumAbs = 0;

        classData.forEach(i => {
            const tot = parseFloat(i.allstudents) || 0;
            const absCount = parseFloat(i.count) || 0;
            const perc = tot > 0 ? (((tot - absCount) / tot) * 100).toFixed(1) : 0;
            totalSumAll += tot; totalSumAbs += absCount;

            rows.push({
                [lang==='ru'?'Дата':'Sana']: i.date,
                [lang==='ru'?'Учитель':'O\'qituvchi']: i.teacher,
                [lang==='ru'?'Ученик':'O\'quvchi']: i.studentName,
                [lang==='ru'?'Причина':'Sabab']: i.reason,
                [lang==='ru'?'Всего':'Jami']: tot,
                [lang==='ru'?'Нет':'Yo\'q']: absCount,
                [lang==='ru'?'%']: perc + "%"
            });
        });

        const finalPerc = totalSumAll > 0 ? (((totalSumAll - totalSumAbs) / totalSumAll) * 100).toFixed(1) : 0;
        rows.push({});
        rows.push({
            [lang==='ru'?'Дата':'Sana']: lang==='ru'?'ИТОГО:':'YAKUN:',
            [lang==='ru'?'Причина':'Sabab']: lang==='ru'?'Средний %:':'O\'rtacha %:',
            [lang==='ru'?'Нет':'Yo\'q']: totalSumAbs,
            [lang==='ru'?'%']: finalPerc + "%"
        });

        const wsClass = XLSX.utils.json_to_sheet(rows);
        wsClass['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsClass, c);
    });

    XLSX.writeFile(wb, `School22_${type.toUpperCase()}_${date}.xlsx`);
}

async function loadAbsents() {
    const res = await fetch(API_URL);
    absents = await res.json();
    const f = document.getElementById('dateFilter');
    const dts = [...new Set(absents.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));
    f.innerHTML = dts.map(d => `<option value="${d}">${d}</option>`).join('');
    if (dts.length > 0) renderByDate();
    f.onchange = renderByDate;
}

function renderByDate() {
    const val = document.getElementById('dateFilter').value;
    const filtered = absents.filter(a => a.date === val);
    document.getElementById('totalAbsent').textContent = filtered.length;
    
    const s = {}; filtered.forEach(i => s[i.reason] = (s[i.reason] || 0) + 1);
    if (window.reasonChart instanceof Chart) window.reasonChart.destroy();
    window.reasonChart = new Chart(document.getElementById('reasonChart'), {
        type: 'pie',
        data: { labels: Object.keys(s), datasets: [{ data: Object.values(s), backgroundColor: reasonColors }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

document.getElementById('lang-ru').onclick = () => { setLang('ru'); location.reload(); };
document.getElementById('lang-uz').onclick = () => { setLang('uz'); location.reload(); };
document.addEventListener('DOMContentLoaded', () => { 
    loadAbsents(); 
    setLang(localStorage.getItem('lang') || 'ru'); 
});
