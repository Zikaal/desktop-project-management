const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { connect, Project, Task } = require('./db');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,    
      contextIsolation: false 
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

};

app.whenReady().then(async () => {
  await connect();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Save a new project
ipcMain.handle('save-project', async (event, projectName) => {
  try {
    // Check if project already exists
    const existingProject = await Project.findOne({ name: projectName });
    if (existingProject) {
      return { 
        success: false, 
        error: 'A project with this name already exists' 
      };
    }

    const project = new Project({ name: projectName });
    const savedProject = await project.save();
    
    console.log('Project saved successfully:', savedProject);
    
    // Convert the MongoDB document to a plain object and stringify the _id
    const plainProject = {
      name: savedProject.name,
      id: savedProject._id.toString(),
      createdAt: savedProject.createdAt
    };
    
    // Return the serializable project object
    return { 
      success: true, 
      project: plainProject 
    };
  } catch (error) {
    console.error('Error saving project:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Load all projects
ipcMain.handle('load-projects', async () => {
  try {
    const projects = await Project.find({}).sort({ name: 1 });
    console.log('Projects loaded:', projects.length);
    
    // Convert MongoDB documents to plain objects
    const plainProjects = projects.map(project => ({
      name: project.name,
      id: project._id.toString(),
      createdAt: project.createdAt
    }));
    
    return plainProjects;
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
});

// Save a new task
ipcMain.handle('save-task', async (event, projectName, column, text) => {
  try {
    const task = new Task({ project: projectName, column, text });
    const savedTask = await task.save();
    
    // Convert the MongoDB document to a plain object
    const plainTask = {
      id: savedTask._id.toString(),
      project: savedTask.project,
      column: savedTask.column,
      text: savedTask.text,
      createdAt: savedTask.createdAt
    };
    
    return { success: true, task: plainTask };
  } catch (error) {
    console.error('Error saving task:', error);
    return { success: false, error: error.message };
  }
});

// Update task column when moved
ipcMain.handle('update-task-column', async (event, taskId, newColumn) => {
  try {
    const task = await Task.findByIdAndUpdate(
      taskId, 
      { column: newColumn },
      { new: true }
    );
    
    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    
    // Convert the MongoDB document to a plain object
    const plainTask = {
      id: task._id.toString(),
      project: task.project,
      column: task.column,
      text: task.text,
      createdAt: task.createdAt
    };
    
    return { success: true, task: plainTask };
  } catch (error) {
    console.error('Error updating task:', error);
    return { success: false, error: error.message };
  }
});

// Load tasks for a specific project
ipcMain.handle('load-tasks', async (event, projectName) => {
  try {
    const tasks = await Task.find({ project: projectName });
    
    // Convert MongoDB documents to plain objects
    const plainTasks = tasks.map(task => ({
      id: task._id.toString(),
      project: task.project,
      column: task.column,
      text: task.text,
      createdAt: task.createdAt
    }));
    
    return plainTasks;
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
});

// Редактирование проекта
ipcMain.handle('edit-project', async (event, oldName, newName) => {
  try {
      const project = await Project.findOneAndUpdate({ name: oldName }, { name: newName }, { new: true });
      if (!project) return { success: false, error: 'Проект не найден' };
      return { success: true, project };
  } catch (error) {
      console.error('Ошибка редактирования проекта:', error);
      return { success: false, error: error.message };
  }
});

// Удаление проекта (и всех задач внутри)
ipcMain.handle('delete-project', async (event, projectName) => {
  try {
      const project = await Project.findOneAndDelete({ name: projectName });
      if (!project) return { success: false, error: 'Проект не найден' };

      await Task.deleteMany({ project: projectName }); // Удаляем все связанные задачи
      return { success: true };
  } catch (error) {
      console.error('Ошибка удаления проекта:', error);
      return { success: false, error: error.message };
  }
});

// Редактирование задачи
ipcMain.handle('edit-task', async (event, taskId, newText) => {
  try {
      const task = await Task.findByIdAndUpdate(taskId, { text: newText }, { new: true });
      if (!task) return { success: false, error: 'Задача не найдена' };
      return { success: true, task };
  } catch (error) {
      console.error('Ошибка редактирования задачи:', error);
      return { success: false, error: error.message };
  }
});

// Удаление задачи
ipcMain.handle('delete-task', async (event, taskId) => {
  try {
      const task = await Task.findByIdAndDelete(taskId);
      if (!task) return { success: false, error: 'Задача не найдена' };
      return { success: true };
  } catch (error) {
      console.error('Ошибка удаления задачи:', error);
      return { success: false, error: error.message };
  }
});
