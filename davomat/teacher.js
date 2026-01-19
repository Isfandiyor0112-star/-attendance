// Конфигурация API
const API_GET = 'https://attendancesrv.vercel.app/api/absents'; 
const API_ACTION = 'https://attendancesrv.vercel.app/api/absent';

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
        today: "Сегодня",
        msg_success: "Отчет успешно отправлен!",
        msg_error: "Ошибка при отправке",
        hamma_darsda: "Все на уроках",
        reason_100: "100% посещаемость",
        loading: "Загрузка...",
        no_records: "На сегодня записей нет",
        confirm_del: "Удалить запись: ",
        prompt_edit: "Изменить имя ученика:",
        err_server: "Сервер недоступен",
        support: "Поддержка: @imamaliev_11"
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
        today: "Bugun",
        msg_success: "Muvaffaqiyatli yuborildi!",
        msg_error: "Yuborishda xato!",
        hamma_darsda: "Hamma darsda",
        reason_100: "100% davomat",
        loading: "Yuklanmoqda...",
        no_records: "Bugun uchun yozuvlar yo'q",
        confirm_del: "O'chirilsinmi: ",
        prompt_edit: "Ismni tahrirlash:",
        err_server: "Server bilan aloqa yo'q",
        support: "Yordam: @imamaliev_11"
    }
};

// --- ГЛОБАЛЬНЫЕ ФУНКЦИИ ---

window.setLang = function(lang) {
    localStorage.setItem('lang', lang);
    const group = document.getElementById('langGroup');
    if (group) group.setAttribute('data-active', lang);

    // Переключаем активный класс на кнопках
    document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Переводим все элементы с data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            // Если внутри элемента есть <span> (как в кнопке отправки), переводим только его
            const span = el.querySelector('span');
            if (span) {
                span.textContent = translations[lang][key];
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });

    // ОБНОВЛЕНИЕ ИМЕНИ УЧИТЕЛЯ
    const teacher = JSON.parse(localStorage.getItem('teacher'));
    if (teacher) {
        document.getElementById('teacherName').textContent = `${translations[lang].teacher_prefix}${teacher.name}`;
    }
};

window.editEntry = async (id, oldName) => {
    const lang = localStorage.getItem('lang') || 'ru';
    const newName = prompt(translations[lang].prompt_edit, oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
        try {
            const res = await fetch(`${API_ACTION}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentName: newName.trim() })
            });
            if (res.ok) window.location.reload(); 
            else alert(translations[lang].msg_error);
        } catch (err) { alert(translations[lang].err_server); }
    }
};

window.deleteEntry = async (id, name) => {
    const lang = localStorage.getItem('lang') || 'ru';
    if (confirm(`${translations[lang].confirm_del}${name}?`)) {
        try {
            const res = await fetch(`${API_ACTION}/${id}`, { method: 'DELETE' });
            if (res.ok) window.location.reload();
            else alert(translations[lang].msg_error);
        } catch (err) { alert(translations[lang].err_server); }
    }
};

// --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ---

document.addEventListener('DOMContentLoaded', function() {
    const teacher = JSON.parse(localStorage.getItem('teacher'));
    if (!teacher) { window.location.href = 'index.html'; return; }

    const savedLang = localStorage.getItem('lang') || 'ru';
    setLang(savedLang);

    document.getElementById('className').value = teacher.className;
    const form = document.getElementById('attendanceForm');
    const absentList = document.getElementById('absentList');

    async function updateList() {
        const lang = localStorage.getItem('lang') || 'ru';
        absentList.innerHTML = `<div class="text-center p-3 text-white-50 small">${translations[lang].loading}</div>`;
        try {
            const res = await fetch(API_GET);
            const allAbsents = await res.json();
            // Фильтруем записи только этого учителя
            const myAbsents = allAbsents.filter(item => item.teacher === teacher.name);
            
            absentList.innerHTML = '';
            if (myAbsents.length === 0) {
                absentList.innerHTML = `<div class="text-center p-3 text-white-50">${translations[lang].no_records}</div>`;
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
            absentList.innerHTML = '<div class="text-danger small">Ошибка связи</div>'; 
        }
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const lang = localStorage.getItem('lang') || 'ru';
        const countInput = document.getElementById('count').value;
        const namesInput = document.getElementById('studentName').value;
        
        let studentNames = [];
        let finalReason = document.getElementById('reason').value;

        if (countInput === "0" || countInput === "") {
            studentNames = [translations[lang].hamma_darsda]; 
            finalReason = translations[lang].reason_100;
        } else {
            studentNames = namesInput.split(',').map(s => s.trim()).filter(s => s !== "");
        }

        try {
            for (const name of studentNames) {
                await fetch(API_ACTION, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teacher: teacher.name,
                        className: teacher.className,
                        date: document.getElementById('date').value,
                        count: countInput || "0",
                        studentName: name,
                        reason: finalReason,
                        allstudents: document.getElementById('allstudents').value
                    })
                });
            }
            alert(translations[lang].msg_success);
            window.location.reload();
        } catch (err) { 
            alert(translations[lang].msg_error); 
        }
    };

    updateList();
});
