// Конфигурация API
const API_URL = 'https://attendancesrv.vercel.app/api/absents';
const API_USERS = 'https://attendancesrv.vercel.app/api/users'; 

let absentsData = [];
let allTeachers = []; 
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
        report_month: "За месяц (22 дн.)",
        xl_date: "Дата", xl_teacher: "Учитель", xl_class: "Класс", xl_total: "Всего учеников",
        xl_absent: "Отсутствует", xl_perc: "Процент %", xl_status: "Статус",
        xl_student: "Ученик", xl_reason: "Причина",
        hamma_darsda: "Все на уроках",
        err_no_data: "Недостаточно данных! Нужно минимум {n} дн."
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
        report_month: "Oylik (22 kun)",
        xl_date: "Sana", xl_teacher: "O'qituvchi", xl_class: "Sinf", xl_total: "Jami o'quvchi",
        xl_absent: "Yo'qlar", xl_perc: "Foiz %", xl_status: "Holat",
        xl_student: "O'quvchi", xl_reason: "Sababi",
        hamma_darsda: "Hamma darsda",
        err_no_data: "Ma'lumot yetarli emas! Kamida {n} kun kerak."
    }
};

function applyTranslations(lang) {
    const group = document.getElementById('langGroup');
    if (group) group.setAttribute('data-active', lang);
    localStorage.setItem('lang', lang);

    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    renderDashboard();
}

async function loadAbsents() {
    try {
        const [absRes, usersRes] = await Promise.all([
            fetch(API_URL),
            fetch(API_USERS)
        ]);
        
        absentsData = await absRes.json();
        allTeachers = await usersRes.json();

        const select = document.getElementById('dateFilter');
        if (select && absentsData.length > 0) {
            const dates = [...new Set(absentsData.map(a => a.date))].sort().reverse();
            select.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
            select.onchange = renderDashboard;
        }
        renderDashboard();
    } catch (e) { console.error("Ошибка загрузки:", e); }
}

window.handleExcelExport = async function(type) {
    const lang = localStorage.getItem('lang') || 'ru';
    const t = translations[lang];
    const selectedDate = document.getElementById('dateFilter').value;
    if (!selectedDate || allTeachers.length === 0) return;

    const uniqueDays = [...new Set(absentsData.map(a => a.date))].sort();
    let filtered = [];

    // ПРОВЕРКИ ПЕРИОДА
    if (type === 'day') {
        filtered = absentsData.filter(a => a.date === selectedDate);
    } else if (type === 'week') {
        if (uniqueDays.length < 6) return alert(t.err_no_data.replace('{n}', 6));
        const lastSix = uniqueDays.slice(-6);
        filtered = absentsData.filter(a => lastSix.includes(a.date));
    } else if (type === 'month') {
        if (uniqueDays.length < 22) return alert(t.err_no_data.replace('{n}', 22));
        const monthPart = selectedDate.substring(0, 7);
        filtered = absentsData.filter(a => a.date.startsWith(monthPart));
    }

    const wb = XLSX.utils.book_new();

    // 1. ЛИСТ СВОДКИ (С РЕЙТИНГОМ ПО ПРОЦЕНТУ)
    const summary = allTeachers.filter(u => u.role !== 'admin').map(u => {
        const matches = filtered.filter(a => a.className === u.className);
        const hasData = matches.length > 0;
        let total = hasData ? Number(matches[0].allstudents) : 0;
        
        const realAbsents = matches.filter(m => 
            m.studentName !== translations.ru.hamma_darsda && 
            m.studentName !== translations.uz.hamma_darsda
        );
        let absentCount = realAbsents.length;
        let perc = (hasData && total > 0) ? (((total - absentCount) / total) * 100).toFixed(1) : 0;

        return {
            [t.xl_date]: selectedDate,
            [t.xl_teacher]: u.name,
            [t.xl_class]: u.className,
            [t.xl_total]: total || "-",
            [t.xl_absent]: hasData ? absentCount : "-",
            [t.xl_perc]: hasData ? Number(perc) : 0,
            [t.xl_status]: hasData ? "✅" : "❌"
        };
    });

    // СОРТИРОВКА: Сначала ✅, потом по убыванию %
    summary.sort((a, b) => {
        if (a[t.xl_status] !== b[t.xl_status]) return a[t.xl_status] === "✅" ? -1 : 1;
        return b[t.xl_perc] - a[t.xl_perc];
    });

    const wsSummary = XLSX.utils.json_to_sheet(summary);
    // РАСШИРЯЕМ КОЛОНКИ (Teacher = 35)
    wsSummary['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Сводка");

    // 2. ПОДРОБНЫЙ ЛИСТ (СПИСОК КЛАССОВ С ИМЕНАМИ)
    const detailList = filtered.filter(a => 
        a.studentName !== translations.ru.hamma_darsda && 
        a.studentName !== translations.uz.hamma_darsda
    ).map(a => ({
        [t.xl_date]: a.date,
        [t.xl_class]: a.className,
        [t.xl_student]: a.studentName,
        [t.xl_reason]: a.reason,
        [t.xl_teacher]: a.teacher
    }));

    const wsDetails = XLSX.utils.json_to_sheet(detailList);
    wsDetails['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 25 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsDetails, "Детальный список");

    XLSX.writeFile(wb, `School22_Report_${type}_${selectedDate}.xlsx`);
};

function renderDashboard() {
    const val = document.getElementById('dateFilter').value;
    if (!val) return;
    const lang = localStorage.getItem('lang') || 'ru';
    const filtered = absentsData.filter(a => a.date === val);
    
    const realAbsents = filtered.filter(a => 
        a.studentName !== translations.ru.hamma_darsda && 
        a.studentName !== translations.uz.hamma_darsda
    );
    
    document.getElementById('totalAbsent').textContent = realAbsents.length;

    const ctx = document.getElementById('reasonChart');
    if (ctx) {
        const counts = {};
        realAbsents.forEach(a => counts[a.reason] = (counts[a.reason] || 0) + 1);
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
        filtered.forEach(a => { 
            if(!map[a.className]) map[a.className] = []; 
            map[a.className].push(a.studentName); 
        });
        
        Object.keys(map).sort().forEach(cls => {
            const div = document.createElement('div');
            div.className = "col";
            const absentsOnly = map[cls].filter(n => 
                n !== translations.ru.hamma_darsda && n !== translations.uz.hamma_darsda
            );
            
            div.innerHTML = `
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <h5 class="text-primary">${cls}</h5>
                        <p class="mb-1">Отсутствует: ${absentsOnly.length}</p>
                        <small class="text-white-50 d-block" style="min-height: 20px;">
                            ${absentsOnly.length > 0 ? absentsOnly.join(', ') : translations[lang].hamma_darsda}
                        </small>
                    </div>
                </div>`;
            container.appendChild(div);
        });
    }
}

async function clearHistory() {
    const lang = localStorage.getItem('lang') || 'ru';
    if (!confirm(lang === 'ru' ? "Удалить всю историю?" : "Barcha ma'lumotlar o'chirilsinmi?")) return;
    await fetch(API_URL, { method: 'DELETE' });
    location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations(localStorage.getItem('lang') || 'ru');
    loadAbsents();
    document.getElementById('lang-ru').onclick = () => applyTranslations('ru');
    document.getElementById('lang-uz').onclick = () => applyTranslations('uz');
});
