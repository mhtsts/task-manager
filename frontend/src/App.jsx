import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

function TaskForm({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setTitle('')
      setDescription('')
      onClose()
      onCreated?.()
    } catch (err) {
      setError(`Failed: ${err.message}`)
    }
  }

  return (
    <form onSubmit={handleCreate} className="form-card">
      <h3>Create Task</h3>
      {error && <div className="error">{error}</div>}
      <input
        placeholder="Title — e.g. Deploy application"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Description — what to do?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Create</button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
      </div>
    </form>
  )
}

function TaskCard({ task, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [status, setStatus] = useState(task.status)

  const handleSave = async () => {
    await fetch(`${API_BASE}/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status }),
    })
    setEditing(false)
    onChanged?.()
  }

  const handleDelete = async () => {
    await fetch(`${API_BASE}/api/tasks/${task.id}`, { method: 'DELETE' })
    onChanged?.()
  }

  if (editing) {
    return (
      <div className="card">
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
        <div className="card-actions">
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
          <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <span className={`badge status-${task.status}`}>{task.status}</span>
      <div className="card-actions">
        <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
      </div>
    </div>
  )
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loadError, setLoadError] = useState('')

  const fetchTasks = async () => {
    try {
      setLoadError('')
      const res = await fetch(`${API_BASE}/api/tasks`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch (err) {
      setLoadError(`Cannot load tasks (${err.message}) — check API at ${API_BASE}`)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  return (
    <div className="app">
      <header>
        <h1>Mini Task Manager</h1>
        <p>Simple demo for DevOps / Kubernetes — tasks with TODO / IN_PROGRESS / DONE</p>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Close' : '+ New Task'}
          </button>
          <button className="btn btn-secondary" onClick={fetchTasks}>↻ Refresh</button>
        </div>
      </header>

      {showForm && (
        <div style={{ marginTop: 16 }}>
          <TaskForm onClose={() => setShowForm(false)} onCreated={fetchTasks} />
        </div>
      )}

      {loadError && <div className="error" style={{ marginTop: 16 }}>{loadError}</div>}

      <div className="tasks">
        {tasks.length === 0 && !loadError ? (
          <div className="empty">No tasks yet — create your first task.</div>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} onChanged={fetchTasks} />)
        )}
      </div>
    </div>
  )
}
