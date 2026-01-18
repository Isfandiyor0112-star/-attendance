// Конфигурация API
const API_GET = 'https://attendancesrv.vercel.app/api/absents';   // Для загрузки (GET)
const API_ACTION = 'https://attendancesrv.vercel.app/api/absent'; // Для действий (POST, PUT, DELETE)

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

// Функция смены языка
window.setLang = function(lang) {
    document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) activeBtn.classList.add('active');

    const group = document.getElementById('langGroup');
    if (group) group.setAttribute('data-active', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

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

    // Функция обновления списка (Использует API_GET)
    async function updateList() {
        absentList.innerHTML = '<div class="text-center p-3 text-white-50 small">Загрузка...</div>';
        try {
            const res = await fetch(API_GET);
            const allAbsents = await res.json();
            // Показываем только записи этого учителя
            const myAbsents = allAbsents.filter(item => item.teacher === teacher.name);
            
            absentList.innerHTML = '';
            if (myAbsents.length === 0) {
                absentList.innerHTML = '<div class="text-center p-3 text-white-50">На сегодня записей нет</div>';
                return;
            }

            myAbsents.forEach(item => {
                const li = document.createElement('li');
                li.className = "list-group-item d-flex justify-content-between align-items-center bg-transparent border-light text-white py-2";
                li.innerHTML = `
                    <div style="font-size: 0.85rem">
                        <span class="text-info">${item.date}</span> | <strong>${item.studentName}</strong>
                        <div class="text-white-50 small">${item.reason}</div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-light border-0" onclick="editEntry('${item._id}', '${item.studentName}')">✏️</button>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteEntry('${item._id}', '${item.studentName}')">🗑️</button>
                    </div>
                `;
                absentList.appendChild(li);
            });
        } catch (e) { 
            absentList.innerHTML = '<div class="text-danger small">Ошибка связи с сервером</div>'; 
        }
    }

    // Удаление записи (Использует API_ACTION + ID)
    window.deleteEntry = async (id, name) => {
        if (confirm(`Удалить запись: ${name}?`)) {
            try {
                const res = await fetch(`${API_ACTION}/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    await updateList();
                } else {
                    alert("Не удалось удалить");
                }
            } catch (err) { alert("Сервер недоступен"); }
        }
    };

    // Редактирование записи (Использует API_ACTION + ID)
    window.editEntry = async (id, oldName) => {
        const newName = prompt('Изменить имя ученика:', oldName);
        if (newName && newName.trim() !== "" && newName !== oldName) {
            try {
                const res = await fetch(`${API_ACTION}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentName: newName.trim() })
                });
                if (res.ok) {
                    await updateList();
                } else {
                    alert("Ошибка при обновлении");
                }
            } catch (err) { alert("Сервер недоступен"); }
        }
    };

    // Отправка формы (Использует API_ACTION)
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;

        const studentNames = document.getElementById('studentName').value.split(',').map(s => s.trim());
        const date = document.getElementById('date').value;
        const count = document.getElementById('count').value;
        const reason = document.getElementById('reason').value;
        const allstudents = document.getElementById('allstudents').value;
        
        try {
            for (const name of studentNames) {
                if (!name) continue;
                await fetch(API_ACTION, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teacher: teacher.name,
                        className: teacher.className,
                        date: date,
                        count: count,
                        studentName: name,
                        reason: reason,
                        allstudents: allstudents
                    })
                });
            }
            form.reset();
            document.getElementById('className').value = teacher.className;
            await updateList();
            alert("Данные успешно отправлены!");
        } catch (err) { 
            alert("Ошибка при отправке"); 
        } finally {
            submitBtn.disabled = false;
        }
    });

    updateList();
});
