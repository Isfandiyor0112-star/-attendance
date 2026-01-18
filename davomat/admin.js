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

function applyTranslations(lang) {
    const group = document.getElementById('langGroup');
    if (group) group.setAttribute('data-active', lang);
    localStorage.setItem('lang', lang);
    // (Тут можно добавить логику перевода текста через data-i18n если нужно)
}

window.handleExcelExport = async function(type) {
    const selectedDate = document.getElementById('dateFilter').value;
    if (!selectedDate) return alert("Выберите дату!");

    const uniqueDays = [...new Set(absentsData.map(a => a.date))].sort();
    if (type === 'week' && uniqueDays.length < 6) return alert("Недостаточно данных для недели (минимум 6 дн.)");
    if (type === 'month' && uniqueDays.length < 20) return alert("Недостаточно данных для месяца (минимум 20 дн.)");

    let filtered = [];
    if (type === 'day') filtered = absentsData.filter(a => a.date === selectedDate);
    else if (type === 'week') filtered = absentsData.filter(a => uniqueDays.slice(-6).includes(a.date));
    else if (type === 'month') filtered = absentsData.filter(a => a.date.startsWith(selectedDate.substring(0, 7)));

    const wb = XLSX.utils.book_new();

    // 1. ОБЩИЙ ЛИСТ С УМНОЙ СОРТИРОВКОЙ
    const summary = users.map(u => {
        const matches = filtered.filter(a => a.className === u.className);
        const hasData = matches.length > 0;
        
        // Берем данные об общем кол-ве учеников из записи, если она есть
        let totalCount = hasData ? Number(matches[0].allstudents) : 0;
        // Считаем уникальные записи отсутствующих для этого класса
        let absentCount = hasData ? [...new Set(matches.map(m => m.studentName))].length : 0;
        
        let perc = 0;
        if (hasData && totalCount > 0) {
            perc = (((totalCount - absentCount) / totalCount) * 100).toFixed(1);
        } else if (!hasData) {
            perc = 0; // Чтобы те, кто не сдал, улетели вниз
        }

        return {
            "Дата": selectedDate,
            "Учитель": u.name,
            "Класс": u.className,
            "Всего учеников": totalCount || "-",
            "Отсутствует": hasData ? absentCount : "-",
            "Процент %": Number(perc),
            "Статус": hasData ? "✅" : "❌"
        };
    });

    // СОРТИРОВКА: Сначала ✅ (те кто сдал), потом по убыванию Процента. ❌ всегда внизу.
    summary.sort((a, b) => {
        if (a.Статус !== b.Статус) return a.Статус === "✅" ? -1 : 1;
        return b["Процент %"] - a["Процент %"];
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "ОБЩАЯ СТАТИСТИКА");

    // 2. ЛИСТЫ ПО КЛАССАМ (ПОДРОБНО)
    const activeClasses = [...new Set(filtered.map(a => a.className))].sort();
    activeClasses.forEach(cls => {
        const classData = filtered.filter(a => a.className === cls).map(a => ({
            "Дата": a.date,
            "Учитель": a.teacher,
            "Ученик": a.studentName,
            "Причина": a.reason,
            "Всего в классе": a.allstudents
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classData), `Класс ${cls}`);
    });

    XLSX.writeFile(wb, `School22_Report_${type}_${selectedDate}.xlsx`);
};

// Функция очистки (вынесена отдельно для надежности)
async function clearHistory() {
    if (!confirm("ВНИМАНИЕ! Вы точно хотите безвозвратно удалить ВСЮ историю посещаемости?")) return;
    
    try {
        const response = await fetch(API_URL, { method: 'DELETE' });
        if (response.ok) {
            alert("База данных успешно очищена.");
            location.reload();
        } else {
            alert("Ошибка при удалении данных.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Ошибка соединения с сервером.");
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
        console.error("Load error:", e);
    }
}

function renderDashboard() {
    const val = document.getElementById('dateFilter').value;
    if (!val) return;

    const filtered = absentsData.filter(a => a.date === val);
    document.getElementById('totalAbsent').textContent = filtered.length;

    // График причин
    const counts = {};
    filtered.forEach(a => counts[a.reason] = (counts[a.reason] || 0) + 1);
    
    const ctx = document.getElementById('reasonChart');
    if (ctx) {
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

    // Карточки классов
    const container = document.getElementById('classChartsContainer');
    if (container) {
        container.innerHTML = "";
        const map = {};
        filtered.forEach(a => {
            if (!map[a.className]) map[a.className] = [];
            map[a.className].push(a.studentName);
        });
        Object.keys(map).sort().forEach(cls => {
            const div = document.createElement('div');
            div.className = "col";
            div.innerHTML = `
                <div class="card stat-card h-100">
                    <div class="card-body">
                        <h5 class="fw-bold text-warning">${cls}</h5>
                        <p class="mb-1">Yo'q: <b>${map[cls].length}</b></p>
                        <small class="text-white-50">${map[cls].join(', ')}</small>
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
    
    // Кнопка очистки
    const clearBtn = document.getElementById('clearHistory');
    if (clearBtn) {
        clearBtn.onclick = clearHistory;
    }
});
