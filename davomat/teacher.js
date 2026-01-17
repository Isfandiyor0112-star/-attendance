const translations = {
    ru: {
        teacher_prefix: "Учитель: ",
        management_desc: "Управление посещаемостью класса",
        general_info: "Общая информация",
        label_class: "Класс",
        label_date: "Дата",
        label_total: "Всего по списку",
        absence_data: "Данные об отсутствии",
        label_sick: "Кол-во болеющих",
        label_names: "Имена (через запятую)",
        label_reason: "Причина",
        mark_btn: "🚀 Отправить отчет в базу",
        absent_list: "Список отсутствующих",
        today: "Сегодня"
    },
    uz: {
        teacher_prefix: "O'qituvchi: ",
        management_desc: "Sinf davomatini boshqarish",
        general_info: "Umumiy ma'lumot",
        label_class: "Sinf",
        label_date: "Sana",
        label_total: "Ro'yxat bo'yicha jami",
        absence_data: "Yo'qlama ma'lumotlari",
        label_sick: "Kasal bo'lganlar soni",
        label_names: "Ismlar (vergul bilan)",
        label_reason: "Sababi",
        mark_btn: "🚀 Hisobotni yuborish",
        absent_list: "Yo'qlama ro'yxati",
        today: "Bugun"
    }
};

// Функция смены языка (Глобальная)
window.setLang = function(lang) {
    document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) activeBtn.classList.add('active');

    const group = document.getElementById('langGroup');
    if (group) group.setAttribute('data-active', lang);

    // Перевод текстов
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });

    // Перевод имени учителя
    const teacher = JSON.parse(localStorage.getItem('teacher'));
    if (teacher) {
        document.getElementById('teacherName').textContent = `${translations[lang].teacher_prefix}${teacher.name}`;
    }

    localStorage.setItem('lang', lang);
};

document.addEventListener('DOMContentLoaded', function() {
    const teacher = JSON.parse(localStorage.getItem('teacher'));
    if (!teacher) { window.location.href = 'index.html'; return; }

    const savedLang = localStorage.getItem('lang') || 'ru';
    setLang(savedLang);

    document.getElementById('className').value = teacher.className;
    const form = document.getElementById('attendanceForm');
    const absentList = document.getElementById('absentList');

    async function updateList() {
        absentList.innerHTML = '<div class="text-center p-3 text-white-50">Загрузка...</div>';
        try {
            const res = await fetch('https://attendancesrv.vercel.app/api/absents');
            const allAbsents = await res.json();
            const myAbsents = allAbsents.filter(item => item.teacher === teacher.name);
            
            absentList.innerHTML = '';
            myAbsents.forEach(item => {
                const li = document.createElement('li');
                li.className = "list-group-item d-flex justify-content-between align-items-center bg-transparent border-light text-white";
                li.innerHTML = `
                    <span>${item.date} | ${item.studentName} — ${item.reason}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-light me-1" onclick="editEntry('${item._id}', '${item.studentName}')">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteEntry('${item._id}', '${item.studentName}')">🗑️</button>
                    </div>
                `;
                absentList.appendChild(li);
            });
        } catch (e) { absentList.innerHTML = "Ошибка связи с сервером"; }
    }

    // Выносим функции в window для onclick
    window.deleteEntry = async (id, name) => {
        if (confirm(`Удалить ${name}?`)) {
            await fetch(`https://attendancesrv.vercel.app/api/absent/${id}`, { method: 'DELETE' });
            updateList();
        }
    };

    window.editEntry = async (id, oldName) => {
        const newName = prompt('Новое имя:', oldName);
        if (newName && newName !== oldName) {
            await fetch(`https://attendancesrv.vercel.app/api/absent/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentName: newName })
            });
            updateList();
        }
    };

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const studentNames = document.getElementById('studentName').value.split(',').map(s => s.trim());
        
        for (const name of studentNames) {
            if (!name) continue;
            await fetch('https://attendancesrv.vercel.app/api/absent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacher: teacher.name,
                    className: teacher.className,
                    date: document.getElementById('date').value,
                    count: document.getElementById('count').value,
                    studentName: name,
                    reason: document.getElementById('reason').value,
                    allstudents: document.getElementById('allstudents').value
                })
            });
        }
        form.reset();
        document.getElementById('className').value = teacher.className;
        updateList();
    });

    updateList();
});
