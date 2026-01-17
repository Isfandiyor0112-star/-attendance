document.addEventListener('DOMContentLoaded', function() {
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  document.getElementById('teacherName').textContent = `Учитель: ${teacher ? teacher.name : ''}`;

  // Подставляем класс учителя
  document.getElementById('className').value = teacher.className;
  

  const form = document.getElementById('attendanceForm');
  const absentList = document.getElementById('absentList');
  


  async function getMyAbsents() {
    const res = await fetch('https://attendancesrv.vercel.app/api/absents');
    const allAbsents = await res.json();
    return allAbsents.filter(item => item.teacher === teacher.name);
  }

  async function updateList() {
    absentList.innerHTML = '';
    const myAbsents = await getMyAbsents();
    myAbsents.forEach(item => {
      const li = document.createElement('li');
      li.className = "list-group-item";
      li.textContent = `${item.date} | ${item.className} | ${item.studentName} — (${item.reason})`;
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
    await updateList(); // обновить список после отправки!
  });

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
});

