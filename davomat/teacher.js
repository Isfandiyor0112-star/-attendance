// Объект с переводами
const translations = {
    ru: {
        teacher_panel: "Панель учителя",
        mark_btn: "🚀 Отправить отчет в базу",
        absent_list: "Список отсутствующих"
    },
    uz: {
        teacher_panel: "O'qituvchi paneli",
        mark_btn: "🚀 Hisobotni yuborish",
        absent_list: "Yo'qlama ro'yxati"
    }
};

// ГЛОБАЛЬНАЯ функция переключения языка (чтобы работала из HTML onclick)
window.setLang = function(lang) {
    // 1. Управляем активным классом кнопок
    document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) activeBtn.classList.add('active');

    // 2. ДВИГАЕМ ПОЛЗУНОК
    const group = document.getElementById('langGroup');
    if (group) group.setAttribute('data-active', lang);

    // 3. ПЕРЕВОДИМ ТЕКСТ (элементы с data-i18n)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Сохраняем выбор
    localStorage.setItem('lang', lang);
};

document.addEventListener('DOMContentLoaded', function() {
    // --- ИНИЦИАЛИЗАЦИЯ ЯЗЫКА ---
    const savedLang = localStorage.getItem('lang') || 'ru';
    setLang(savedLang);

    // --- ТВОЯ ЛОГИКА СЕРВЕРА ---
    const teacher = JSON.parse(localStorage.getItem('teacher'));
    const teacherDisplay = document.getElementById('teacherName');
    
    if (teacher) {
        // Устанавливаем имя, сохраняя возможность перевода заголовка если нужно, 
        // но здесь просто выводим как ты просил
        teacherDisplay.textContent = `Учитель: ${teacher.name}`;
        document.getElementById('className').value = teacher.className;
    }

    const form = document.getElementById('attendanceForm');
    const absentList = document.getElementById('absentList');

    async function getMyAbsents() {
        try {
            const res = await fetch('https://attendancesrv.vercel.app/api/absents');
            const allAbsents = await res.json();
            return allAbsents.filter(item => item.teacher === teacher.name);
        } catch (err) {
            console.error("Ошибка загрузки:", err);
            return [];
        }
    }

    async function updateList() {
        absentList.innerHTML = '';
        const myAbsents = await getMyAbsents();
        
        myAbsents.forEach(item => {
            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            
            const textSpan = document.createElement('span');
            textSpan.textContent = `${item.date} | ${item.className} | ${item.studentName} — (${item.reason})`;
            
            const btnGroup = document.createElement('div');

            // Кнопка РЕДАКТИРОВАТЬ
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '✏️';
            editBtn.className = 'btn btn-sm btn-outline-primary me-2';
            editBtn.onclick = async () => {
                const newName = prompt('Изменить имя ученика:', item.studentName);
                if (newName && newName !== item.studentName) {
                    await fetch(`https://attendancesrv.vercel.app/api/absent/${item._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentName: newName })
                    });
                    updateList();
                }
            };

            // Кнопка УДАЛИТЬ
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.onclick = async () => {
                if (confirm(`Удалить запись об ученике ${item.studentName}?`)) {
                    await fetch(`https://attendancesrv.vercel.app/api/absent/${item._id}`, {
                        method: 'DELETE'
                    });
                    updateList();
                }
            };

            btnGroup.appendChild(editBtn);
            btnGroup.appendChild(deleteBtn);
            li.appendChild(textSpan);
            li.appendChild(btnGroup);
            absentList.appendChild(li);
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const className = document.getElementById('className').value;
        const date = document.getElementById('date').value;
        const count = document.getElementById('count').value;
        const studentNames = document.getElementById('studentName').value.split(',').map(s => s.trim());
        const reason = document.getElementById('reason').value;
        const allstudents = document.getElementById('allstudents').value;

        for (const name of studentNames) {
            if (!name) continue;
            const absentData = {
                teacher: teacher.name,
                className,
                date,
                count,
                studentName: name,
                reason,
                allstudents 
            };
            await fetch('https://attendancesrv.vercel.app/api/absent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(absentData)
            });
        }
        form.reset();
        document.getElementById('className').value = teacher.className;
        await updateList();
    });

    updateList();
});
