const API_URL = 'https://attendancesrv.vercel.app/api/absents';
let absentsData = [];
const reasonColors = ['#09ff00', '#ff0000', '#0d6efd', '#ffc107', '#6610f2', '#fd7e14', '#20c997'];

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

// ПЕРЕВОД И ПЛАШКА
function applyTranslations(lang) {
    const group = document.getElementById('langGroup');
    if (group) group.setAttribute('data-active', lang);
    localStorage.setItem('lang', lang);
}

// ЭКСПОРТ EXCEL
window.handleExcelExport = async function(type) {
    const selectedDate = document.getElementById('dateFilter').value;
    const uniqueDays = [...new Set(absentsData.map(a => a.date))].sort();

    if (type === 'week' && uniqueDays.length < 6) return alert("Мало данных для недели!");
    if (type === 'month' && uniqueDays.length < 20) return alert("Мало данных для месяца!");

    let filtered = [];
    if (type === 'day') filtered = absentsData.filter(a => a.date === selectedDate);
    else if (type === 'week') filtered = absentsData.filter(a => uniqueDays.slice(-6).includes(a.date));
    else if (type === 'month') filtered = absentsData.filter(a => a.date.startsWith(selectedDate.substring(0, 7)));

    const wb = XLSX.utils.book_new();

    // 1. ЛИСТ ОБЩЕЙ СТАТИСТИКИ (С СОРТИРОВКОЙ)
    const summary = users.map(u => {
        const matches = filtered.filter(a => a.className === u.className);
        let totalStudentsInClass = matches.length > 0 ? Number(matches[0].allstudents) : 0;
        let absentCount = matches.length; 
        
        let perc = 100;
        if (totalStudentsInClass > 0) {
            perc = (((totalStudentsInClass - absentCount) / totalStudentsInClass) * 100).toFixed(1);
        }

        return {
            "Учитель": u.name,
            "Класс": u.className,
            "Всего": totalStudentsInClass || "-",
            "Отсутствует": absentCount,
            "Процент %": Number(perc),
            "Статус": matches.length > 0 ? "✅" : "❌"
        };
    });

    // СОРТИРОВКА: Сначала те, кто сдал (✅), затем по убыванию процента
    summary.sort((a, b) => {
        if (a.Статус !== b.Статус) return a.Статус === "✅" ? -1 : 1;
        return b["Процент %"] - a["Процент %"];
    });

    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, "ОБЩИЙ ОТЧЕТ");

    // 2. ПОДРОБНЫЕ ЛИСТЫ ПО КЛАССАМ
    const classes = [...new Set(filtered.map(a => a.className))].sort();
    classes.forEach(cls => {
        const classInfo = filtered.filter(a => a.className === cls);
        const detailedRows = classInfo.map(a => ({
            "Дата": a.date,
            "Ученик": a.studentName,
            "Причина": a.reason,
            "Всего в классе": a.allstudents
        }));
        
        const wsClass = XLSX.utils.json_to_sheet(detailedRows);
        XLSX.utils.book_append_sheet(wb, wsClass, `Класс ${cls}`);
    });

    XLSX.writeFile(wb, `School22_${type}_${selectedDate}.xlsx`);
};

// ОЧИСТКА ИСТОРИИ (ИСПРАВЛЕНО)
async function clearHistory() {
    if (confirm("ВНИМАНИЕ! Вы точно хотите полностью очистить всю базу данных?")) {
        try {
            const res = await fetch(API_URL, { method: 'DELETE' });
            if (res.ok) {
                alert("База успешно очищена!");
                location.reload();
            } else {
                alert("Ошибка при очистке");
            }
        } catch (e) {
            alert("Ошибка сервера");
        }
    }
}

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

    const container = document.getElementById('classChartsContainer');
    if (container) {
        container.innerHTML = "";
        const map = {};
        filtered.forEach(a => { if(!map[a.className]) map[a.className] = []; map[a.className].push(a.studentName); });
        Object.keys(map).sort().forEach(cls => {
            const div = document.createElement('div');
            div.className = "col";
            div.innerHTML = `<div class="card stat-card h-100"><div class="card-body"><h5>${cls}</h5><p>Yo'q: ${map[cls].length}</p><small>${map[cls].join(', ')}</small></div></div>`;
            container.appendChild(div);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations(localStorage.getItem('lang') || 'ru');
    loadAbsents();
    document.getElementById('lang-ru').onclick = () => applyTranslations('ru');
    document.getElementById('lang-uz').onclick = () => applyTranslations('uz');
    
    // Привязываем очистку к кнопке
    const clearBtn = document.getElementById('clearHistory');
    if (clearBtn) clearBtn.onclick = clearHistory;
});
