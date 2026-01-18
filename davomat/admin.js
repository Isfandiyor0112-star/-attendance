// 1. БАЗА ДАННЫХ УЧИТЕЛЕЙ
const users = [
    { name: "Dadabayeva.I.D.", className: "1A" },
    { name: "Cherimitsina.A.K.", className: "1B" },
    { name: "Ermakova.D.Y.", className: "1V" },
    { name: "Nurmatova.N.R.", className: "1G" },
    { name: "Musamatova.G.M.", className: "2A" },
    { name: "Toshmatova.Y.Z.", className: "2B" },
    { name: "Movlonova.U.U.", className: "2V" },
    { name: "Matluba.M.M.", className: "2G" },
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
        admin_panel_title: "Админ-панель №22", export_excel: "Excel отчёт", choose_date: "Дата:",
        select_period: "Выберите период", report_day: "За 1 день", report_week: "За неделю (6 дн.)", report_month: "За месяц",
        not_enough_data: "Данных за неделю еще нет!", not_enough_month: "В этом месяце еще нет данных!",
        total_absent: "Отсутствуют", reason_stats: "Статистика причин", clear_history: "Очистить историю"
    },
    uz: { 
        admin_panel_title: "22-maktab admin paneli", export_excel: "Excel yuklash", choose_date: "Sana:",
        select_period: "Davrni tanlang", report_day: "1 kunlik", report_week: "Haftalik (6 kun)", report_month: "Oylik hisobot",
        not_enough_data: "Haftalik ma'lumot yetarli emas!", not_enough_month: "Bu oy uchun ma'lumot yetarli emas!",
        total_absent: "Yo'qlar", reason_stats: "Sabablar statistikasi", clear_history: "Tozalash"
    }
};

// --- ИНИЦИАЛИЗАЦИЯ ЯЗЫКА ---
function setLang(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
    });
    localStorage.setItem('lang', lang);
    const group = document.getElementById('langGroup');
    if(group) group.setAttribute('data-active', lang);
    
    document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`lang-${lang}`);
    if(activeBtn) activeBtn.classList.add('active');
}

// --- УМНЫЙ ЭКСПОРТ ---
async function handleExcelExport(type) {
    const selectedDate = document.getElementById('dateFilter').value;
    const lang = localStorage.getItem('lang') || 'ru';
    if (!selectedDate) return alert(lang === 'ru' ? "Выберите дату!" : "Sana tanlang!");

    try {
        const res = await fetch(API_URL);
        const allData = await res.json();
        let filtered = [];
        const uniqueDates = [...new Set(allData.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));

        if (type === 'day') {
            filtered = allData.filter(a => a.date === selectedDate);
        } 
        else if (type === 'week') {
            const last6 = uniqueDates.slice(0, 6);
            if (last6.length < 1) return alert(translations[lang].not_enough_data);
            filtered = allData.filter(a => last6.includes(a.date));
        } 
        else if (type === 'month') {
            const dateObj = new Date(selectedDate);
            const targetYear = dateObj.getFullYear();
            const targetMonth = dateObj.getMonth();

            filtered = allData.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate.getFullYear() === targetYear && itemDate.getMonth() === targetMonth;
            });

            if (filtered.length === 0) return alert(translations[lang].not_enough_month);
        }

        generateExcel(filtered, selectedDate, type, lang);
        
        const modalEl = document.getElementById('excelModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    } catch (e) { alert("Ошибка: " + e.message); }
}

function generateExcel(filtered, date, type, lang) {
    const wb = XLSX.utils.book_new();
    const norm = (s) => s.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');

    // 1. ЛИСТ: ОБЩИЙ РЕЙТИНГ
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
            "Davomat (%)": perc + "%",
            [lang==='ru'?'Дней':'Kunlar']: [...new Set(matches.map(m => m.date))].length
        };
    }).sort((a, b) => parseFloat(b["Davomat (%)"]) - parseFloat(a["Davomat (%)"]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Rating');

    // 2. ЛИСТ: СТАТИСТИКА (Для Недели и Месяца)
    if (type !== 'day') {
        const stats = [];
        // Статистика по причинам
        const reasons = {};
        filtered.forEach(i => {
            const r = i.reason || (lang==='ru'?'Не указана':'Noma\'lum');
            reasons[r] = (reasons[r] || 0) + 1;
        });
        stats.push({ [lang==='ru'?'АНАЛИЗ':'TAHLIL']: lang==='ru'?'ПО ПРИЧИНАМ':'SABABLAR BO\'YICHA' });
        Object.keys(reasons).forEach(r => stats.push({ [lang==='ru'?'Показатель':'Ko\'rsatkich']: r, [lang==='ru'?'Кол-во':'Soni']: reasons[r] }));
        
        stats.push({ "": "" }, { [lang==='ru'?'АНАЛИЗ':'TAHLIL']: lang==='ru'?'АНТИРЕЙТИНГ КЛАССОВ (Прогулы)':'SINFLAR REYTINGI (Dars qoldirish)' });
        
        // Статистика по классам (кто больше всех гуляет)
        const classStats = {};
        filtered.forEach(i => classStats[i.className] = (classStats[i.className] || 0) + 1);
        Object.keys(classStats).sort((a,b)=>classStats[b]-classStats[a]).forEach(c => {
            stats.push({ [lang==='ru'?'Показатель':'Ko\'rsatkich']: lang==='ru'?`Класс ${c}`:`${c}-sinf`, [lang==='ru'?'Кол-во':'Soni']: classStats[c] });
        });
        
        const wsStats = XLSX.utils.json_to_sheet(stats);
        wsStats['!cols'] = [{wch: 35}, {wch: 15}];
        XLSX.utils.book_append_sheet(wb, wsStats, 'Statistika');
    }

    // 3. ЛИСТЫ КЛАССОВ (Индивидуальные)
    const classGroups = {};
    filtered.forEach(i => {
        if(!classGroups[i.className]) classGroups[i.className] = [];
        classGroups[i.className].push({ 
            [lang==='ru'?'Дата':'Sana']: i.date, 
            [lang==='ru'?'Ученик':'O\'quvchi']: i.studentName, 
            [lang==='ru'?'Причина':'Sabab']: i.reason 
        });
    });
    Object.keys(classGroups).sort().forEach(cls => {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classGroups[cls]), cls);
    });

    // 4. ЛИСТ: ДЕТАЛИ (Все записи)
    const detailRows = filtered.map(i => ({
        "Sana": i.date, "Sinf": i.className, "O'quvchi": i.studentName, "Sabab": i.reason, "O'qituvchi": i.teacher
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), 'Details');

    // Название файла в зависимости от месяца
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(date);
    const fileName = type === 'month' 
        ? `Report_MONTH_${monthNames[d.getMonth()]}_${d.getFullYear()}.xlsx` 
        : `Report_22_School_${type}_${date}.xlsx`;

    XLSX.writeFile(wb, fileName);
}

// --- ЛОГИКА ИНТЕРФЕЙСА ---
async function loadAbsents() {
    try {
        const res = await fetch(API_URL);
        absents = await res.json();
        const filter = document.getElementById('dateFilter');
        const dates = [...new Set(absents.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));
        filter.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
        if (dates.length > 0) renderByDate();
        filter.onchange = renderByDate;
    } catch (err) { console.error("Load error"); }
}

function renderByDate() {
    const date = document.getElementById('dateFilter').value;
    const filtered = absents.filter(a => a.date === date);
    document.getElementById('totalAbsent').textContent = filtered.length;
    
    // Круговая диаграмма
    const stats = {}; 
    filtered.forEach(i => stats[i.reason] = (stats[i.reason] || 0) + 1);
    if (window.reasonChart instanceof Chart) window.reasonChart.destroy();
    window.reasonChart = new Chart(document.getElementById('reasonChart'), {
        type: 'pie',
        data: { 
            labels: Object.keys(stats), 
            datasets: [{ data: Object.values(stats), backgroundColor: ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2'] }] 
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

document.getElementById('clearHistory').onclick = async () => {
    const lang = localStorage.getItem('lang') || 'ru';
    const msg = lang === 'ru' ? 'Очистить ВСЮ базу данных?' : 'Barcha ma\'lumotlarni o\'chirib tashlaysizmi?';
    if (confirm(msg)) {
        await fetch(API_URL, { method: 'DELETE' });
        location.reload();
    }
};

document.getElementById('lang-ru').onclick = () => setLang('ru');
document.getElementById('lang-uz').onclick = () => setLang('uz');

document.addEventListener('DOMContentLoaded', () => { 
    loadAbsents(); 
    setLang(localStorage.getItem('lang') || 'ru'); 
});
