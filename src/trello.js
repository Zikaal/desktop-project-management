const { ipcRenderer } = require('electron');

// Глобальная переменная для drag-and-drop
let draggedTask = null;

// Функция отображения модального окна
function openTaskModal(columnId) {
  const modal = document.getElementById('taskModal');
  const input = document.getElementById('taskInput');
  const saveButton = document.getElementById('saveTaskButton');
  
  modal.style.display = 'block';
  input.value = '';
  input.focus();
  
  saveButton.onclick = function () {
    addTask(columnId, input.value);
    modal.style.display = 'none';
  };
}

// Функция добавления задачи
function addTask(columnId, taskText) {
  if (taskText && taskText.trim()) {
    const currentProject = localStorage.getItem('currentProject') || 'Untitled';
    
    ipcRenderer.invoke('save-task', currentProject, columnId, taskText)
      .then(result => {
        if (result.success) {
          const taskContainer = document.querySelector(`#${columnId} .task-container`);
          if (taskContainer) {
            const task = createTaskElement(taskText, result.task.id);
            taskContainer.appendChild(task);
          } else {
            console.error('Не найден контейнер для задач в колонке:', columnId);
          }
        } else {
          console.error('Не удалось сохранить задачу:', result.error);
          alert('Не удалось сохранить задачу. Пожалуйста, попробуйте снова.');
        }
      })
      .catch(err => {
        console.error('Ошибка при сохранении задачи:', err);
        alert('Ошибка при сохранении задачи: ' + err.message);
      });
  }
}

function goBackToProjects() {
  window.location.href = "index.html";
}

// Функция создания DOM-элемента задачи
function createTaskElement(text, id) {
  const task = document.createElement('div');
  task.className = 'task';
  task.setAttribute('draggable', 'true');
  task.setAttribute('data-id', id);

  // Создаем span для текста задачи
  const taskTextSpan = document.createElement('span');
  taskTextSpan.className = 'task-text';
  taskTextSpan.textContent = text;
  task.appendChild(taskTextSpan);

  // Кнопка редактирования
  const editButton = document.createElement('button');
  editButton.className = 'edit-button';
  editButton.textContent = '✏️';
  editButton.addEventListener('click', () => {
    const currentText = taskTextSpan.textContent;
    
    // Создаем input для редактирования текста задачи
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'edit-input';
    
    // Заменяем span на input
    task.replaceChild(input, taskTextSpan);
    
    // Скрываем кнопки редактирования и удаления
    editButton.style.display = 'none';
    deleteButton.style.display = 'none';
    
    // Создаем кнопки "Сохранить" и "Отмена"
    const saveButton = document.createElement('button');
    saveButton.className = 'save-edit-button';
    saveButton.textContent = 'Сохранить';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-edit-button';
    cancelButton.textContent = 'Отмена';
    
    task.appendChild(saveButton);
    task.appendChild(cancelButton);
    
    // Сохранение изменений
    saveButton.addEventListener('click', async () => {
      const newText = input.value.trim();
      if (newText && newText !== currentText) {
        const result = await ipcRenderer.invoke('edit-task', id, newText);
        if (result.success) {
          taskTextSpan.textContent = newText;
        } else {
          alert('Ошибка: ' + result.error);
        }
      }
      // Восстанавливаем исходное отображение
      task.replaceChild(taskTextSpan, input);
      task.removeChild(saveButton);
      task.removeChild(cancelButton);
      editButton.style.display = '';
      deleteButton.style.display = '';
    });
    
    // Отмена редактирования
    cancelButton.addEventListener('click', () => {
      task.replaceChild(taskTextSpan, input);
      task.removeChild(saveButton);
      task.removeChild(cancelButton);
      editButton.style.display = '';
      deleteButton.style.display = '';
    });
  });

  // Кнопка удаления
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '🗑';
  deleteButton.addEventListener('click', async () => {
    if (confirm('Удалить эту задачу?')) {
      await ipcRenderer.invoke('delete-task', id);
      await loadTasks();
    }
  });
  
  task.appendChild(editButton);
  task.appendChild(deleteButton);
  
  task.addEventListener('dragstart', function() {
    draggedTask = this;
    setTimeout(() => this.style.display = 'none', 0);
  });
  
  task.addEventListener('dragend', function() {
    this.style.display = 'block';
    draggedTask = null;
  });
  
  return task;
}


// Функция настройки drag-and-drop
function setupDragAndDrop() {
  document.querySelectorAll('.task-container').forEach(column => {
    column.addEventListener('dragover', e => e.preventDefault());
    column.addEventListener('dragenter', e => e.preventDefault());
    
    column.addEventListener('drop', e => {
      e.preventDefault();
      if (draggedTask) {
        column.appendChild(draggedTask);
        
        // Обновляем позицию задачи в базе данных
        const taskId = draggedTask.getAttribute('data-id');
        const newColumn = column.closest('.column').id;
        
        ipcRenderer.invoke('update-task-column', taskId, newColumn)
          .catch(error => {
            console.error('Ошибка при обновлении позиции задачи:', error);
          });
      }
    });
  });
}

// Функция загрузки задач из базы данных
async function loadTasks() {
  try {
    const currentProject = localStorage.getItem('currentProject') || 'Untitled';
    const tasks = await ipcRenderer.invoke('load-tasks', currentProject);
    console.log('Загруженные задачи:', tasks);
    
    // Очищаем существующие задачи
    document.querySelectorAll('.task-container').forEach(container => {
      container.innerHTML = '';
    });
    
    // Добавляем задачи в соответствующие колонки
    tasks.forEach(task => {
      const taskContainer = document.querySelector(`#${task.column} .task-container`);
      if (taskContainer) {
        const taskElement = createTaskElement(task.text, task.id || task._id);
        taskContainer.appendChild(taskElement);
      } else {
        console.error('Не найден контейнер для колонки:', task.column);
      }
    });
  } catch (error) {
    console.error('Ошибка загрузки задач:', error);
    alert('Не удалось загрузить задачи. Пожалуйста, попробуйте снова.');
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM полностью загружен');
  
  // Обновляем заголовок проекта
  const projectTitle = document.getElementById('projectTitle');
  const currentProject = localStorage.getItem('currentProject') || 'Untitled';
  projectTitle.textContent = `Task Planning for Project: ${currentProject}`;
  
  // Настройка обработчиков событий для кнопок
  document.querySelectorAll('.column button').forEach(button => {
    button.addEventListener('click', function() {
      const columnId = this.closest('.column').id;
      console.log('Кнопка нажата для колонки:', columnId);
      openTaskModal(columnId);
    });
  });

  // Загружаем задачи для текущего проекта
  await loadTasks();
  
  // Настраиваем функциональность drag-and-drop
  setupDragAndDrop();
});