import { useState, useEffect } from "react";
import axios from "axios";
import './App.css';
const API = import.meta.env.VITE_API_URL;
const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const today = formatDate(new Date());

type Task = {
  id: number;
  title: string;
  date: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"today" | "pending" | "overdue">("today");
  const [showAddModal, setShowAddModal] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/tasks`)
      .then(res => {
        const formattedTasks = res.data.map((t: any) => ({
          ...t,
          date: formatDate(t.date),
          completed: Boolean(t.completed)
        }));
        setTasks(formattedTasks);
      })
      .catch(err => console.log(err));
  }, []);

  const priorityColor = {
    high: "#e74c3c",
    medium: "#f39c12",
    low: "#2ecc71",
  };

 const toggleComplete = (id: number) => {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  axios.put(`${API}/tasks/${id}`, { ...task, completed: !task.completed })
    .then(() => setTasks(
      tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    ));
};

const deleteTask = (id: number) => {
  axios.delete(`${API}/tasks/${id}`)
    .then(() => setTasks(tasks.filter(t => t.id !== id)));
};

const updateTaskTitle = (id: number, newTitle: string) => {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  axios.put(`${API}/tasks/${id}`, { ...task, title: newTitle })
    .then(() => setTasks(
      tasks.map(t => t.id === id ? { ...t, title: newTitle } : t)
    ));
};

const updateTaskDate = (id: number, newDate: string) => {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  axios.put(`${API}/tasks/${id}`, { ...task, date: newDate })
    .then(() => setTasks(
      tasks.map(t => t.id === id ? { ...t, date: newDate } : t)
    ));
};

const addTask = (title: string, date: string, priority: "low" | "medium" | "high") => {
  axios.post(`${API}/tasks`, { title, date, priority })
    .then(res => {
      const newTask = res.data;
      setTasks([...tasks, newTask]);
      setActiveTab(newTask.date === today ? 'today' : 'pending');
      setShowAddModal(false);
    });
};

  const getFilteredTasks = () => {
    const sortedTasks = tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pendingTasks = sortedTasks.filter(t => !t.completed);
    const completedTasks = sortedTasks.filter(t => t.completed);

    let filtered: Task[] = [];

    switch (activeTab) {
      case "today":
        filtered = pendingTasks.filter(t => t.date === today);
        break;
      case "pending":
        filtered = pendingTasks.filter(t => t.date >= today);
        break;
      case "overdue":
        filtered = pendingTasks.filter(t => t.date < today);
        break;
    }

    const getTabCount = (tab: "today" | "pending" | "overdue") => {
      if (tab === "today") return pendingTasks.filter(t => t.date === today).length;
      if (tab === "pending") return pendingTasks.filter(t => t.date >= today).length;
      if (tab === "overdue") return pendingTasks.filter(t => t.date < today).length;
      return 0;
    };

    return { active: filtered, completed: completedTasks, getTabCount };
  };

  const { active: activeTasks, completed: completedTasks, getTabCount } = getFilteredTasks();

  const AddTaskModal = () => {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(today);
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (title.trim()) addTask(title.trim(), date, priority);
    };

    return (
      <div className="modal-backdrop">
        <form className="modal" onSubmit={handleSubmit}>
          <h3>Add New Task</h3>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task Title" required />
          <input type="date" value={date} min={formatDate(new Date())} onChange={e => setDate(e.target.value)} required />
          <select value={priority} onChange={e => setPriority(e.target.value as any)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="modal-buttons">
            <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit">Save Task</button>
          </div>
        </form>
      </div>
    );
  };

  const TaskItem = ({ task }: { task: Task }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newTitle, setNewTitle] = useState(task.title);
    const [newDate, setNewDate] = useState(task.date);

    const handleSave = () => {
      if (newTitle.trim() && newTitle.trim() !== task.title) updateTaskTitle(task.id, newTitle.trim());
      if (newDate !== task.date) updateTaskDate(task.id, newDate);
      setIsEditing(false);
    };

    return (
      <li className={`task-item ${task.completed ? "completed" : ""}`}>
        <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id)} />
        <div className="task-content">
          {isEditing ? (
            <>
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </>
          ) : (
            <>
              <span onClick={() => !task.completed && setIsEditing(true)}>{task.title}</span>
              <span className={`task-date ${task.date < today && !task.completed ? "overdue" : ""}`}>{task.date === today ? "Today" : task.date}</span>
            </>
          )}
        </div>
        <span className="priority-dot" style={{ backgroundColor: priorityColor[task.priority] }}></span>
        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)}>{isEditing ? "Save" : "Edit"}</button>
        <button onClick={() => deleteTask(task.id)}>Delete</button>
      </li>
    );
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1>Todo App</h1>
        <p>Organize your priorities</p>
        <div className="tabs">
          {["today", "pending", "overdue"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={activeTab === tab ? "active-tab" : ""}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getTabCount(tab as any)})
            </button>
          ))}
        </div>
        <button className="new-task-btn" onClick={() => setShowAddModal(true)}>+ New Task</button>
      </aside>

      <main className="main">
        <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tasks</h2>
        <ul>
          {activeTasks.length > 0 ? activeTasks.map(task => <TaskItem key={task.id} task={task} />)
          : <p className="no-tasks">No tasks found for "{activeTab}"</p>}
        </ul>

        {completedTasks.length > 0 && (
          <div className="completed-section">
            <h3>Completed ({completedTasks.length})</h3>
            <ul>
              {completedTasks.map(task => <TaskItem key={task.id} task={task} />)}
            </ul>
          </div>
        )}
      </main>

      {showAddModal && <AddTaskModal />}
    </div>
  );
}
