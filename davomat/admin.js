// ==========================================
// 1. ДАННЫЕ И НАСТРОЙКИ
// ==========================================
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
let absentsData = []; // Храним данные здесь
const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2', '#fd7e14', '#20c997'];

const translations = {
    ru: { 
        admin_panel_title: "Админ-панель №22", choose_date: "Выберите дату:", total_absent: "Всего отсутствующих", 
        reason_stats: "Статистика причин", clear_history: "Очистить историю", export_excel: "Excel отчёт",
        select_period: "Выберите период", report_day: "За 1 день", report_week: "За неделю (6 дн.)",
        report_month: "За месяц", total_label: "ИТОГО:", avg_label: "Средний %:", status_col: "Статус",
        sheet_summary: "СВОДКА", sheet_rating: "РЕЙТИНГ", 
        col_date: "Дата", col_class: "Класс", col_teacher: "Учитель", col_student: "Ученик", col_reason: "Причина",
        col_total: "Всего уч.", col_absent: "Нет", col_perc: "Посещ. %", msg_nodata: "Нет данных!"
    },
    uz: { 
        admin_panel_title: "22-maktab admin paneli", choose_date: "Sanani tanlang:", total_absent: "Jami yo'qlar", 
        reason_stats: "Sabablar statistikasi", clear_history: "Tozalash", export_excel: "Excel yuklash",
        select_period: "Hisobot davrini tanlang", report_day: "1 kunlik", report_week: "Haftalik (6 kun)",
        report_month: "Oylik", total_label: "YAKUN:", avg_label: "O'rtacha %:", status_col: "Holat",
        sheet_summary: "UMUMIY", sheet_rating: "REYTING",
        col_date: "Sana", col_class: "Sinf", col_teacher: "O'qituvchi", col_student: "O'quvchi", col_reason: "Sabab",
        col_total: "Jami o'q.", col_absent: "Yo'q", col_perc: "Davomat %", msg_nodata: "Ma'lumot yo'q!"
    }
};

// ==========================================
// 2. ГЛОБАЛЬНЫЕ ФУНКЦИИ (ДЛЯ КНОПОК)
// ==========================================

// Функция экспорта (вызывается из HTML onclick)
window.handleExcelExport = async function(type) {
    const selectedDate = document.getElementById('dateFilter').value;
    const lang = localStorage.getItem('lang') || 'ru';
    const t = translations[lang];

    if (!selectedDate) {
        alert(lang === 'ru' ? 'Выберите дату!' : 'Sanani tanlang!');
        return;
    }

    try {
        // Всегда берем свежие данные перед отчетом
        const res = await fetch(API_URL);
        const allData = await res.json();
        
        let filtered = [];
        const uniqueDates = [...new Set(allData.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));

        // Логика фильтрации
        if (type === 'day') {
            filtered = allData.filter(a => a.date === selectedDate);
        } else if (type === 'week') {
            const last6 = uniqueDates.slice(0, 6);
            filtered = allData.filter(a => last6.includes(a.date));
        } else if (type === 'month') {
            const d = new Date(selectedDate);
            filtered = allData.filter(item => {
                const id = new Date(item.date);
                return id.getFullYear() === d.getFullYear() && id.getMonth() === d.getMonth();
            });
        }

        if (filtered.length === 0) {
            alert(t.msg_nodata);
            return;
        }

        generateDetailedExcel(filtered, selectedDate, type, lang);
        
        // Закрываем модалку
        const modalEl = document.getElementById('excelModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

    } catch (e) {
        console.error(e);
        alert("Error generating Excel");
    }
};

// ==========================================
// 3. ЛОГИКА EXCEL (ПОДРОБНАЯ)
// ==========================================
function generateDetailedExcel(filtered, dateLabel, type, lang) {
    const wb = XLSX.utils.book_new();
    const t = translations[lang];
    const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
    
    // --- ЛИСТ 1: СВОДКА (SUMMARY) ---
    const summaryData = [];
    summaryData.push({ [t.col_class]: t.sheet_summary.toUpperCase() + ": " + type.toUpperCase() }); // Заголовок
    
    let globalTotalStudents = 0;
    let globalTotalAbsent = 0;

    // Считаем общую статистику
    const activeDates = [...new Set(filtered.map(a => a.date))].sort();
    
    // --- ЛИСТ 2: РЕЙТИНГ (RATING) ---
    const ratingRows = users.map(u => {
        const matches = filtered.filter(i => norm(i.teacher) === norm(u.name));
        let tot = 0, abs = 0;
        matches.forEach(m => { 
            tot += parseFloat(m.allstudents) || 0; 
            abs += parseFloat(m.count) || 0; 
        });
        
        globalTotalStudents += tot;
        globalTotalAbsent += abs;

        const p = tot > 0 ? (((tot - abs) / tot) * 100).toFixed(1) : 0;
        
        // Галочки/Крестики по дням
        let statusIcons = "";
        activeDates.forEach(d => { 
            statusIcons += matches.some(m => m.date === d) ? "✅ " : "❌ "; 
        });

        return {
            [t.col_teacher]: u.name,
            [t.col_class]: u.className,
            [t.col_perc]: parseFloat(p), // Для сортировки числом
            "View": p + "%",
            [t.status_col]: statusIcons
        };
    }).sort((a, b) => b[t.col_perc] - a[t.col_perc]);

    // Преобразуем рейтинг для красивого вида
    const finalRating = ratingRows.map(r => ({
        [t.col_teacher]: r[t.col_teacher],
        [t.col_class]: r[t.col_class],
        [t.col_perc]: r["View"],
        [t.status_col]: r[t.status_col]
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finalRating), t.sheet_rating);

    // --- ЛИСТЫ 3+: КЛАССЫ (ПОДРОБНО) ---
    // Группируем по классам
    const grp = {};
    filtered.forEach(i => { 
        if(!grp[i.className]) grp[i.className] = []; 
        grp[i.className].push(i); 
    });

    Object.keys(grp).sort().forEach(className => {
        const classRows = grp[className];
        const sheetData = [];
        
        let cTotal = 0;
        let cAbsent = 0;

        // Строки данных
        classRows.forEach(row => {
            const tot = parseFloat(row.allstudents) || 0;
            const abs = parseFloat(row.count) || 0;
            cTotal += tot;
            cAbsent += abs;

            sheetData.push({
                [t.col_date]: row.date,
                [t.col_student]: row.studentName, // Имена отсутствующих
                [t.col_reason]: row.reason,
                [t.col_total]: tot,
                [t.col_absent]: abs
            });
        });

        // ИТОГОВАЯ СТРОКА (ЖИРНАЯ В СМЫСЛЕ ДАННЫХ)
        const cPerc = cTotal > 0 ? (((cTotal - cAbsent) / cTotal) * 100).toFixed(1) : 0;
        
        sheetData.push({}); // Пустая строка
        sheetData.push({
            [t.col_date]: t.total_label, // "ИТОГО"
            [t.col_student]: "",
            [t.col_reason]: "",
            [t.col_total]: cTotal,
            [t.col_absent]: cAbsent,
            ["%"]: cPerc + "%"
        });

        const ws = XLSX.utils.json_to_sheet(sheetData);
        // Устанавливаем ширину колонок (костыль для JS версии, но работает)
        ws['!cols'] = [{wch:12}, {wch:30}, {wch:20}, {wch:10}, {wch:10}, {wch:10}];
        
        XLSX.utils.book_append_sheet(wb, ws, className);
    });

    // Сохраняем файл
    XLSX.writeFile(wb, `School22_${type.toUpperCase()}_Report.xlsx`);
}

// ==========================================
// 4. ОСНОВНАЯ ЛОГИКА ИНТЕРФЕЙСА
// ==========================================

function applyTranslations() {
    const lang = localStorage.getItem('lang') || 'ru';
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    
    // Обновляем активный класс кнопок языка
    document.getElementById('lang-ru').classList.toggle('active', lang === 'ru');
    document.getElementById('lang-uz').classList.toggle('active', lang === 'uz');
    
    // Двигаем слайдер (визуально)
    const group = document.getElementById('langGroup');
    if(group) {
        if(lang === 'uz') group.classList.add('uz-active');
        else group.classList.remove('uz-active');
    }
}

async function loadAbsents() {
    try {
        const res = await fetch(API_URL);
        absentsData = await res.json();
        
        const dateSelect = document.getElementById('dateFilter');
        const uniqueDates = [...new Set(absentsData.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));
        
        dateSelect.innerHTML = uniqueDates.map(d => `<option value="${d}">${d}</option>`).join('');
        
        if (uniqueDates.length > 0) {
            renderDashboard();
        } else {
            document.getElementById('totalAbsent').textContent = "0";
        }
    } catch (e) {
        console.error("API Error:", e);
    }
}

function renderDashboard() {
    const selectedDate = document.getElementById('dateFilter').value;
    const filtered = absentsData.filter(a => a.date === selectedDate);
    
    // 1. Счетчик
    document.getElementById('totalAbsent').textContent = filtered.length;

    // 2. График (Причины)
    const stats = {}; 
    filtered.forEach(i => stats[i.reason] = (stats[i.reason] || 0) + 1);
    
    const ctx = document.getElementById('reasonChart');
    if (window.myChart instanceof Chart) window.myChart.destroy();
    
    window.myChart = new Chart(ctx, { 
        type: 'doughnut', 
        data: { 
            labels: Object.keys(stats), 
            datasets: [{ 
                data: Object.values(stats), 
                backgroundColor: reasonColors,
                borderWidth: 0 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#fff' } } }
        }
    });

    // 3. Карточки классов
    const container = document.getElementById('classChartsContainer');
    container.innerHTML = "";
    
    const classMap = {};
    filtered.forEach(a => { 
        if(!classMap[a.className]) classMap[a.className] = []; 
        classMap[a.className].push(a); 
    });

    Object.keys(classMap).sort().forEach(cls => {
        const list = classMap[cls];
        const names = list.map(u => u.studentName).join(', ');
        
        const col = document.createElement('div');
        col.className = "col";
        col.innerHTML = `
            <div class="card stat-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="fw-bold text-warning mb-0">${cls}</h5>
                        <span class="badge bg-danger rounded-pill">${list.length}</span>
                    </div>
                    <p class="text-white-50 small mb-0">${names}</p>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// ==========================================
// 5. ИНИЦИАЛИЗАЦИЯ (СТАРТ)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Применяем язык
    applyTranslations();
    
    // 2. Загружаем данные
    loadAbsents();

    // 3. Вешаем события на кнопки
    document.getElementById('dateFilter').addEventListener('change', renderDashboard);

    document.getElementById('lang-ru').addEventListener('click', () => {
        localStorage.setItem('lang', 'ru');
        location.reload();
    });

    document.getElementById('lang-uz').addEventListener('click', () => {
        localStorage.setItem('lang', 'uz');
        location.reload();
    });

    document.getElementById('clearHistory').addEventListener('click', async () => {
        const lang = localStorage.getItem('lang') || 'ru';
        const msg = lang === 'ru' ? 'Вы уверены? История будет удалена!' : 'Ishonchingiz komilmi? Tarix o\'chiriladi!';
        if (confirm(msg)) {
            try {
                await fetch(API_URL, { method: 'DELETE' });
                location.reload();
            } catch(e) { alert("Error clearing"); }
        }
    });
});
