---

# Desktop Project Management App

This is a cross-platform desktop application for managing projects and tasks, developed using Electron.js, Node.js, MongoDB, and Mongoose. The application demonstrates creating, editing, and deleting projects, as well as adding, editing, deleting, and moving tasks using drag-and-drop functionality.

## Author
- **Zinetov Alikhan**
## Features

- **Project Management:** Create, edit, and delete projects.
- **Task Management:** Add, edit, and delete tasks.
- **Drag-and-Drop:** Move tasks between columns (To Do, In Progress, Done).
- **Data Storage:** Utilize MongoDB and Mongoose for data persistence.
- **Cross-Platform:** The application runs on Windows, macOS, and Linux.

## Technologies Used

- [Electron.js](https://www.electronjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- JavaScript, HTML, CSS

## Installation

### Requirements

- [Node.js](https://nodejs.org/en/) (latest LTS version is recommended)
- Access to MongoDB (locally or via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Git (for cloning the repository)

### Installation Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Zikaal/desktop-project-management.git
   cd desktop-project-management
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure MongoDB Connection:**

   Open the `db.js` file and update the `mongoURI` variable with your MongoDB connection string.

4. **Run the application in development mode:**

   ```bash
   npm run start
   ```

   The application will launch in an Electron window.

5. **Build the installation package:**

   To build the application, use the command:

   ```bash
   npm run build
   ```

## Usage

1. When the application starts, create a new project by entering its name and clicking the "Create Project" button.
2. From the list of projects, select the desired project by clicking the "Go to Planning" button to navigate to the task board.
3. On the task board, add new tasks to the appropriate columns (To Do, In Progress, Done) using the "Add task" button.
4. Edit or delete tasks using the corresponding buttons on each task.
5. Move tasks between columns using the drag-and-drop functionality.

## Project Structure

- **index.js:** The main Electron file that creates the application window and manages IPC communication.
- **db.js:** Connects to the MongoDB database and defines schemas for projects and tasks.
- **index.html, index.css, script.js:** Interface files for managing projects.
- **trello.html, trello.js:** Interface files for planning tasks on the board.

---
