async function loadAbsents() {
  const res = await fetch('https://attendancesrv.onrender.com/api/absents');
  absents = await res.json();

  let absents = JSON.parse(localStorage.getItem('absents')) || [];

  // Получаем уникальные даты
  const allDates = [...new Set(absents.map(item => item.date))];

  // Заполняем выпадающий список дат
  const dateFilter = document.getElementById('dateFilter');
  allDates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    dateFilter.appendChild(option);
  });

  // По умолчанию показываем первую дату
  let selectedDate = allDates[0] || '';
  dateFilter.value = selectedDate;

  // Обновление графиков и списков по выбранной дате
  function renderByDate(date) {
    document.getElementById('totalAbsent').textContent =
      absents.filter(item => item.date === date).length;

    // Очищаем контейнер для графиков
    const oldCharts = document.querySelectorAll('.class-charts-row');
    oldCharts.forEach(el => el.remove());

    // Получаем классы за выбранную дату
    const classes = [...new Set(absents.filter(item => item.date === date).map(item => item.className))];

    // Контейнер для графиков и списков
    const chartsContainer = document.createElement('div');
    chartsContainer.className = "row class-charts-row";
    document.querySelector('.container').appendChild(chartsContainer);

    classes.forEach(className => {
      const classAbsents = absents.filter(item => item.date === date && item.className === className);

      // Группируем по причинам
      const stats = {};
      classAbsents.forEach(item => {
        stats[item.reason] = (stats[item.reason] || 0) + 1;
      });
      const labels = Object.keys(stats);
      const data = Object.values(stats);

      // Элементы для графика и списка
      const col = document.createElement('div');
      col.className = "col-md-4 mb-4";
      const card = document.createElement('div');
      card.className = "card";
      const cardBody = document.createElement('div');
      cardBody.className = "card-body";
      const title = document.createElement('h5');
      title.textContent = `Класс: ${className}`;
      const canvas = document.createElement('canvas');
      canvas.height = 120;

      // Список отсутствующих для этого класса
      const ul = document.createElement('ul');
      ul.className = "list-group mt-3";
      classAbsents.forEach(item => {
        const li = document.createElement('li');
        li.className = "list-group-item";
        li.textContent = `${item.studentName} (${item.reason})`;
        ul.appendChild(li);
      });

      cardBody.appendChild(title);
      cardBody.appendChild(canvas);
      cardBody.appendChild(ul);
      card.appendChild(cardBody);
      col.appendChild(card);
      chartsContainer.appendChild(col);

      // Рисуем pie chart
      new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'Причины',
            data: data,
            backgroundColor: [
              '#0d6efd', '#e67e22', '#e74c3c', '#2ecc71', '#f1c40f', '#8e44ad'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const reason = context.label;
                  const count = context.parsed;
                  return [
                    `Причина: ${reason}`,
                    `Всего: ${count}`
                  ];
                }
              }
            }
          }
        }
      });
    });

    // Статистика по всем классам
    const allStats = {};
    absents.filter(item => item.date === date).forEach(item => {
      allStats[item.reason] = (allStats[item.reason] || 0) + 1;
    });
    const allLabels = Object.keys(allStats);
    const allData = Object.values(allStats);

    // График причин отсутствия
    const reasonChartCanvas = document.getElementById('reasonChart');
    if (window.reasonChart) {
      window.reasonChart.destroy();
    }
    window.reasonChart = new Chart(reasonChartCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: allLabels,
        datasets: [{
          label: 'Причины отсутствия',
          data: allData,
          backgroundColor: '#0d6efd'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const reason = context.label;
                const count = context.parsed;
                return [
                  `Причина: ${reason}`,
                  `Всего: ${count}`
                ];
              }
            }
          }
        }
      }
    });
  } // <-- вот эта скобка должна быть!

  // Слушаем изменение даты
  dateFilter.addEventListener('change', function() {
    selectedDate = this.value;
    renderByDate(selectedDate);
  });

  // Первый рендер
  if (selectedDate) renderByDate(selectedDate);

  // Кнопка очистки истории
  document.getElementById('clearHistory').onclick = function() {
    if (confirm('Вы уверены, что хотите очистить всю историю отсутствующих?')) {
      localStorage.removeItem('absents');
      location.reload();
    }
  };
}

document.addEventListener('DOMContentLoaded', loadAbsents);

