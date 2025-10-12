const teacher = JSON.parse(localStorage.getItem('teacher'));
document.getElementById('teacherName').textContent = `Учитель: ${teacher ? teacher.name : ''}`;

// Подставляем класс учителя
document.getElementById('className').value = teacher.className;

const form = document.getElementById('attendanceForm');
const absentList = document.getElementById('absentList');
let absents = JSON.parse(localStorage.getItem('absents')) || [];

// Фильтруем только свои отметки
function getMyAbsents() {
  return absents.filter(item => item.teacher === teacher.name);
}

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const className = document.getElementById('className').value;
  const date = document.getElementById('date').value;
  const count = document.getElementById('count').value;
  const studentNames = document.getElementById('studentName').value.split(',').map(s => s.trim());
  const reason = document.getElementById('reason').value;
  studentNames.forEach(name => {
    absents.push({
      teacher: teacher.name,
      className,
      date,
      count,
      studentName: name,
      reason
    });
  });
  localStorage.setItem('absents', JSON.stringify(absents));
  updateList();
  form.reset();
  // После сброса формы снова подставляем класс учителя
  document.getElementById('className').value = teacher.className;
});

function updateList() {
  absentList.innerHTML = '';
  getMyAbsents().forEach(item => {
    const li = document.createElement('li');
    li.className = "list-group-item";
    li.textContent = `${item.date} | ${item.className} | ${item.studentName} — (${item.reason})`;
    absentList.appendChild(li);
  });
}

// Показываем только свои отметки при загрузке
updateList();

// Автоматически заполняем список классов
const classSelect = document.getElementById('className');
const parallels = ['А', 'Б'];
for (let i = 1; i <= 11; i++) {
  parallels.forEach(parallel => {
    const option = document.createElement('option');
    option.value = `${i}${parallel}`;
    option.textContent = `${i}${parallel}`;
    classSelect.appendChild(option);
  });
}
