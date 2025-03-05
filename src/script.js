const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('projectForm');
    const projectList = document.querySelector('#projectList ul');
    const projectNameInput = document.getElementById('projectName');

    // Load project list from database
    await loadProjects();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const projectName = projectNameInput.value.trim();
        
        if (projectName !== '') {
            try {
                const result = await ipcRenderer.invoke('save-project', projectName);
                
                if (result.success) {
                    console.log('Project created successfully:', result.project);
                    addProjectToList(result.project.name);
                    projectNameInput.value = '';
                } else {
                    console.error('Failed to create project:', result.error);
                    alert(`Failed to create project: ${result.error}`);
                }
            } catch (error) {
                console.error('Error creating project:', error);
                alert('An error occurred while creating the project');
            }
        }
    });

    async function loadProjects() {
        try {
            const projects = await ipcRenderer.invoke('load-projects');
            
            // Clear existing list
            projectList.innerHTML = '';
            
            if (projects.length === 0) {
                const emptyMessage = document.createElement('li');
                emptyMessage.className = 'empty-message';
                emptyMessage.textContent = 'No projects yet. Create one to get started.';
                projectList.appendChild(emptyMessage);
            } else {
                console.log('Projects loaded in UI:', projects);
                projects.forEach(project => {
                    console.log('Adding project to list:', project.name);
                    addProjectToList(project.name);
                });
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            alert('Failed to load projects');
        }
    }

    function addProjectToList(name) {
        console.log('Adding project to UI:', name);
        
        const li = document.createElement('li');
        
        // Элемент для отображения названия проекта
        const projectNameSpan = document.createElement('span');
        projectNameSpan.className = 'project-name';
        projectNameSpan.textContent = name;
        li.appendChild(projectNameSpan);
        
        // Кнопка перехода к планированию
        const planButton = document.createElement('button');
        planButton.className = 'plan-button';
        planButton.textContent = 'Go to Planning';
        planButton.addEventListener('click', () => {
            localStorage.setItem('currentProject', name);
            window.location.href = 'trello.html';
        });
        
        // Кнопка редактирования
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = '✏️';
        
        // Кнопка удаления
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = '🗑';
        
        // Обработчик нажатия на кнопку редактирования
        editButton.addEventListener('click', () => {
            const currentName = projectNameSpan.textContent;
            
            // Создаем input для редактирования
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentName;
            input.className = 'edit-input';
            
            // Заменяем span на input
            li.replaceChild(input, projectNameSpan);
            
            // Создаем кнопки "Сохранить" и "Отмена"
            const saveButton = document.createElement('button');
            saveButton.className = 'save-edit-button';
            saveButton.textContent = 'Сохранить';
            
            const cancelButton = document.createElement('button');
            cancelButton.className = 'cancel-edit-button';
            cancelButton.textContent = 'Отмена';
            
            // Скрываем кнопки редактирования и удаления
            editButton.style.display = 'none';
            deleteButton.style.display = 'none';
            
            li.appendChild(saveButton);
            li.appendChild(cancelButton);
            
            // Сохранение изменений
            saveButton.addEventListener('click', async () => {
                const newName = input.value.trim();
                if (newName && newName !== currentName) {
                    const result = await ipcRenderer.invoke('edit-project', currentName, newName);
                    if (result.success) {
                        projectNameSpan.textContent = newName;
                    } else {
                        alert('Ошибка: ' + result.error);
                    }
                }
                // Восстанавливаем исходный вид
                li.replaceChild(projectNameSpan, input);
                li.removeChild(saveButton);
                li.removeChild(cancelButton);
                editButton.style.display = '';
                deleteButton.style.display = '';
            });
            
            // Отмена редактирования
            cancelButton.addEventListener('click', () => {
                li.replaceChild(projectNameSpan, input);
                li.removeChild(saveButton);
                li.removeChild(cancelButton);
                editButton.style.display = '';
                deleteButton.style.display = '';
            });
        });
        
        // Обработчик удаления проекта
        deleteButton.addEventListener('click', async () => {
            if (confirm(`Удалить проект "${name}"?`)) {
                await ipcRenderer.invoke('delete-project', name);
                await loadProjects();
            }
        });
        
        li.appendChild(planButton);
        li.appendChild(editButton);
        li.appendChild(deleteButton);
        projectList.appendChild(li);
    }
    
});