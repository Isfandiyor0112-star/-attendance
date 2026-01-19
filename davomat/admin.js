const API_URL = 'https://attendancesrv.vercel.app/api/absents';
let absentsData = [];
const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2', '#fd7e14', '#20c997'];

const translations = {
    ru: {
        admin_panel_title: "Админ-панель школы №22",
        choose_date: "Выберите дату:",
        export_excel: "Excel отчёт",
        clear_history: "Очистить историю",
        total_absent: "Всего отсутствующих",
        reason_stats: "Статистика причин",
        select_period: "Выберите период отчета",
        report_day: "За 1 день",
        report_week: "За неделю (6 дн.)",
        report_month: "За месяц",
        xl_date: "Дата", xl_teacher: "Учитель", xl_class: "Класс", xl_total: "Всего учеников",
        xl_absent: "Отсутствует", xl_perc: "Процент %", xl_status: "Статус", xl_reason: "Причина"
    },
    uz: {
        admin_panel_title: "22-maktab admin paneli",
        choose_date: "Sanani tanlang:",
        export_excel: "Excel yuklash",
        clear_history: "Tozalash",
        total_absent: "Jami yo'qlar",
        reason_stats: "Sabablar statistikasi",
        select_period: "Hisobot davrini tanlang",
        report_day: "1 kunlik",
        report_week: "Haftalik (6 kun)",
        report_month: "Oylik hisobot",
        xl_date: "Sana", xl_teacher: "O'qituvchi", xl_class: "Sinf", xl_total: "Jami o'quvchi",
        xl_absent: "Yo'qlar", xl_perc: "Foiz %", xl_status: "Holat", xl_reason: "Sabab"
    }
};

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
    { name: "Zokirxonova.G.B.", className: "5A" }, { name: "Umirzakov.A.A.", className: "5B" },
    { name: "Ermatova.X.A.", className: "5V" }, { name: "Mamatqulova.O.S.", className: "5G" },
    { name: "Raximov.R.R.", className: "6A" }, { name: "Ismoilov.A.K.", className: "6B" },
    { name: "Yettiyeva.D.M.", className: "6V" }, { name: "Malikova.B.A.", className: "6G" },
    { name: "Normatova.G.D.", className: "6D" }, { name: "Nefyodova.N.A.", className: "7A" },
    { name: "Xakimova.D.A.", className: "7B" }, { name: "Fozilov.I.O.", className: "7V" },
    { name: "Buligina.V.Y.", className: "8A" }, { name: "Yardamova.M.M.", className: "8B" },
    { name: "Mandiyev.O.A.", className: "8V" }, { name: "Pardayeva.N.M.", className: "9A" },
    { name: "Aripov.A.I.", className: "9B" }, { name: "Mamajanova.M.A.", className: "9V" },
    { name: "Manazarova.D.A.", className: "9G" }, { name: "Ismoilova.M.A.", className: "9D" },
    { name: "Xasanova.O.G.", className: "10A" }, { name: "Satimova.D.F.", className: "10B" },
    { name: "Ruzmatova.S.M.", className: "10V" }, { name: "Baltabayeva.M.T.", className: "11A" },
    { name: "Ryabinina.S.Y.", className: "11B" }, { name: "Abdullayeva.M.R.", className: "11V" },
    { name: "Aliyeva.N.M.", className: "11G" }
];

function applyTranslations(lang) {
    const group = document.getElementById('langGroup');
    if (group) group.setAttribute('data-active', lang);
    localStorage.setItem('lang', lang);

    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
}

window.handleExcelExport = async function(type) {
    const lang = localStorage.getItem('lang') || 'ru';
    const t = translations[lang];
    const selectedDate = document.getElementById('dateFilter').value;
    if (!selectedDate) return;

    // --- ПРОВЕРКА ДАННЫХ ПО ДНЯМ ---
    const uniqueDays = [...new Set(absentsData.map(a => a.date))].sort();
    
    if (type === 'week' && uniqueDays.length < 6) {
        return alert(lang === 'ru' ? `Нужно минимум 6 дней данных. Сейчас: ${uniqueDays.length}` : `Kamida 6 kunlik ma'lumot kerak. Hozir: ${uniqueDays.length}`);
    }
    if (type === 'month' && uniqueDays.length < 20) {
        return alert(lang === 'ru' ? `Нужно минимум 20 дней данных. Сейчас: ${uniqueDays.length}` : `Kamida 20 kunlik ma'lumot kerak. Hozir: ${uniqueDays.length}`);
    }

    let filtered = [];
    if (type === 'day') {
        filtered = absentsData.filter(a => a.date === selectedDate);
    } else if (type === 'week') {
        const lastSix = uniqueDays.slice(-6);
        filtered = absentsData.filter(a => lastSix.includes(a.date));
    } else if (type === 'month') {
        const monthPart = selectedDate.substring(0, 7);
        filtered = absentsData.filter(a => a.date.startsWith(monthPart));
    }

    if (filtered.length === 0) {
        return alert(lang === 'ru' ? "Нет данных для выгрузки!" : "Ma'lumot topilmadi!");
    }

    const wb = XLSX.utils.book_new();

    // 1. ОБЩАЯ СТАТИСТИКА
    const summary = users.map(u => {
        const matches = filtered.filter(a => a.className === u.className);
        const hasData = matches.length > 0;
        let total = hasData ? Number(matches[0].allstudents) : 0;
        let absent = hasData ? [...new Set(matches.map(m => m.studentName))].length : 0;
        let perc = (hasData && total > 0) ? (((total - absent) / total) * 100).toFixed(1) : 0;

        return {
            [t.xl_date]: selectedDate,
            [t.xl_teacher]: u.name,
            [t.xl_class]: u.className,
            [t.xl_total]: total || "-",
            [t.xl_absent]: hasData ? absent : "-",
            [t.xl_perc]: Number(perc),
            [t.xl_status]: hasData ? "✅" : "❌"
        };
    });

    // СОРТИРОВКА: Сначала ✅, затем по убыванию процентов
    summary.sort((a, b) => {
        if (a[t.xl_status] !== b[t.xl_status]) return a[t.xl_status] === "✅" ? -1 : 1;
        return b[t.xl_perc] - a[t.xl_perc];
    });

    const wsSummary = XLSX.utils.json_to_sheet(summary);
    
    // РАСШИРЕНИЕ КОЛОНОК
    wsSummary['!cols'] = [
        { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, "SUMMARY");

    // 2. ПОДРОБНЫЕ ЛИСТЫ ПО КЛАССАМ
    const activeClasses = [...new Set(filtered.map(a => a.className))].sort();
    activeClasses.forEach(cls => {
        const classRows = filtered.filter(a => a.className === cls).map(a => ({
            [t.xl_date]: a.date,
            [t.xl_teacher]: a.teacher,
            [t.xl_class]: a.className,
            [t.xl_absent]: a.studentName,
            [t.xl_reason]: a.reason
        }));
        const wsClass = XLSX.utils.json_to_sheet(classRows);
        wsClass['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 30 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsClass, `Class ${cls}`);
    });

    XLSX.writeFile(wb, `School22_${type}_${selectedDate}.xlsx`);
};

async function clearHistory() {
    const lang = localStorage.getItem('lang') || 'ru';
    const msg = lang === 'ru' ? "Удалить ВСЮ историю безвозвратно?" : "Barcha ma'lumotlarni butunlay o'chirish?";
    if (!confirm(msg)) return;

    try {
        const res = await fetch(API_URL, { method: 'DELETE' });
        if (res.ok) {
            alert("OK!");
            location.reload();
        } else {
            alert("Error!");
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadAbsents() {
    try {
        const res = await fetch(API_URL);
        absentsData = await res.json();
        const select = document.getElementById('dateFilter');
        if (select && absentsData.length > 0) {
            const dates = [...new Set(absentsData.map(a => a.date))].sort().reverse();
            select.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
            select.onchange = renderDashboard;
        }
        renderDashboard();
    } catch (e) {
        console.error(e);
    }
}

function renderDashboard() {
    const val = document.getElementById('dateFilter').value;
    if (!val) return;
    const filtered = absentsData.filter(a => a.date === val);
    const totalEl = document.getElementById('totalAbsent');
    if (totalEl) totalEl.textContent = filtered.length;

    const ctx = document.getElementById('reasonChart');
    if (ctx) {
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
            div.innerHTML = `
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <h5>${cls}</h5>
                        <p>Yo'q: ${map[cls].length}</p>
                        <small>${map[cls].join(', ')}</small>
                    </div>
                </div>`;
            container.appendChild(div);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations(localStorage.getItem('lang') || 'ru');
    loadAbsents();
    document.getElementById('lang-ru').onclick = () => applyTranslations('ru');
    document.getElementById('lang-uz').onclick = () => applyTranslations('uz');
    
    const clearBtn = document.getElementById('clearHistory');
    if (clearBtn) clearBtn.onclick = clearHistory;
});

