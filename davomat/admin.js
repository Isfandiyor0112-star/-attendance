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

const translations = {
    ru: { 
        msg_wait_week: "Недостаточно данных! Нужно минимум 6 рабочих дней в базе.",
        msg_wait_month: "Недостаточно данных для месячного отчета!",
        msg_no_date: "Выберите дату!"
    },
    uz: { 
        msg_wait_week: "Ma'lumot yetarli emas! Bazada kamida 6 kunlik ma'lumot bo'lishi kerak.",
        msg_wait_month: "Oylik hisobot uchun ma'lumot yetarli emas!",
        msg_no_date: "Sanani tanlang!"
    }
};

// Исправленная плашка
function applyTranslations(lang) {
    const group = document.getElementById('langGroup');
    if (lang === 'uz') {
        group.classList.add('uz-active');
    } else {
        group.classList.remove('uz-active');
    }
    
    localStorage.setItem('lang', lang);
    
    // Здесь должен быть твой обычный код перевода [data-i18n]
    const t = {
        ru: { admin_panel_title: "Админ-панель №22", choose_date: "Выберите дату:", total_absent: "Всего отсутствующих", reason_stats: "Статистика причин", clear_history: "Очистить историю", export_excel: "Excel отчёт", select_period: "Выберите период", report_day: "За 1 день", report_week: "За неделю", report_month: "За месяц" },
        uz: { admin_panel_title: "22-maktab admin paneli", choose_date: "Sanani tanlang:", total_absent: "Jami yo'qlar", reason_stats: "Sabablar statistikasi", clear_history: "Tozalash", export_excel: "Excel yuklash", select_period: "Hisobot davrini tanlang", report_day: "1 kunlik", report_week: "Haftalik", report_month: "Oylik" }
    };
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[lang][key]) el.textContent = t[lang][key];
    });
}

window.handleExcelExport = async function(type) {
    const lang = localStorage.getItem('lang') || 'ru';
    const selectedDate = document.getElementById('dateFilter').value;
    if (!selectedDate) return alert(translations[lang].msg_no_date);

    try {
        const res = await fetch(API_URL);
        const allData = await res.json();
        
        // Считаем уникальные рабочие дни в базе
        const uniqueDays = [...new Set(allData.map(item => item.date))];

        if (type === 'week' && uniqueDays.length < 6) {
            return alert(translations[lang].msg_wait_week);
        }
        
        if (type === 'month' && uniqueDays.length < 20) {
            return alert(translations[lang].msg_wait_month);
        }

        // Логика фильтрации
        let filtered = [];
        if (type === 'day') {
            filtered = allData.filter(a => a.date === selectedDate);
        } else if (type === 'week') {
            const last6Days = uniqueDays.sort().slice(-6);
            filtered = allData.filter(a => last6Days.includes(a.date));
        } else if (type === 'month') {
            const currentMonth = selectedDate.substring(0, 7); // "2024-05"
            filtered = allData.filter(a => a.date.startsWith(currentMonth));
        }

        // Генерация Excel (упрощенно для примера)
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(filtered);
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `Report_${type}.xlsx`);
        
    } catch (e) {
        console.error(e);
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    const savedLang = localStorage.getItem('lang') || 'ru';
    applyTranslations(savedLang);

    document.getElementById('lang-ru').onclick = () => applyTranslations('ru');
    document.getElementById('lang-uz').onclick = () => applyTranslations('uz');

    // Загрузка дат в селект
    const res = await fetch(API_URL);
    absentsData = await res.json();
    const dates = [...new Set(absentsData.map(a => a.date))].sort().reverse();
    const select = document.getElementById('dateFilter');
    select.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
    
    renderDashboard();
});

function renderDashboard() {
    // Твой код отрисовки графиков...
}
