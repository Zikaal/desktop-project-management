// db.js
const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://alikhanzinetov06:gDBSrKtQb5pbRgCF@cluster0.pfu4s.mongodb.net/trello?retryWrites=true&w=majority'; 

// Define Project schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// Define Task schema
const taskSchema = new mongoose.Schema({
  project: { type: String, required: true },
  column: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);

// Database connection function
async function connect() {
  try {
    await mongoose.connect(mongoURI, {
      // Mongoose 6+ no longer needs these options explicitly
      // useNewUrlParser and useUnifiedTopology are now default
    });
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error; // Re-throw to handle in the main process
  }
}

module.exports = { connect, Project, Task };