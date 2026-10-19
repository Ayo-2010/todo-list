const STORE_KEY = 'taskly.tasks';
const THEME_KEY = 'taskly.theme';

let tasks = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
let filter = 'all';
let editingId = null;

const taskList = document.getElementById('taskList');
const addForm = document.getElementById('addForm');
const taskInput = document.getElementById('taskInput');
const filters = document.getElementById('filters');
const emptyState = document.getElementById('emptyState');
const itemsLeft = document.getElementById('itemsLeft');
const clearDone = document.getElementById('clearDone');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const progressPct = document.getElementById('progressPct');
const themeBtn = document.getElementById('themeBtn');
const dateLine = document.getElementById('dateLine');
const toast = document.getElementById('toast');

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function render() {
  const visible = tasks.filter((t) => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  taskList.innerHTML = '';
  emptyState.hidden = visible.length !== 0;
  emptyState.textContent =
    tasks.length === 0
      ? 'Nothing here yet — add your first task above.'
      : 'No tasks match this filter.';

  visible.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    if (editingId === task.id) {
      const input = document.createElement('input');
      input.className = 'edit-input';
      input.value = task.text;
      li.appendChild(input);
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      const commit = () => {
        const value = input.value.trim();
        if (value) task.text = value;
        editingId = null;
        save();
        render();
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') { editingId = null; render(); }
      });
    } else {
      li.innerHTML = `
        <button class="check" aria-label="Toggle complete">✓</button>
        <span class="task-text"></span>
        <div class="task-actions">
          <button class="icon-btn edit" aria-label="Edit">✏️</button>
          <button class="icon-btn del" aria-label="Delete">🗑️</button>
        </div>`;
      li.querySelector('.task-text').textContent = task.text;
      li.querySelector('.check').addEventListener('click', () => toggle(task.id));
      li.querySelector('.edit').addEventListener('click', () => {
        editingId = task.id;
        render();
      });
      li.querySelector('.del').addEventListener('click', () => remove(task.id, li));
    }

    taskList.appendChild(li);
  });

  const doneCount = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  itemsLeft.textContent = `${tasks.filter((t) => !t.done).length} items left`;
  progressFill.style.width = pct + '%';
  progressLabel.textContent = `${doneCount} of ${total} done`;
  progressPct.textContent = pct + '%';
}

function addTask(text) {
  tasks.unshift({ id: uid(), text, done: false, created: Date.now() });
  save();
  render();
}

function toggle(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.done = !task.done;
    save();
    render();
  }
}

function remove(id, el) {
  el.classList.add('removing');
  setTimeout(() => {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
    showToast('Task deleted');
  }, 250);
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = taskInput.value.trim();
  if (!value) {
    taskInput.focus();
    return;
  }
  addTask(value);
  taskInput.value = '';
  taskInput.focus();
});

filters.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter');
  if (!btn) return;
  filter = btn.dataset.filter;
  document.querySelectorAll('.filter').forEach((f) => f.classList.toggle('is-active', f === btn));
  render();
});

clearDone.addEventListener('click', () => {
  const count = tasks.filter((t) => t.done).length;
  if (count === 0) {
    showToast('No completed tasks');
    return;
  }
  tasks = tasks.filter((t) => !t.done);
  save();
  render();
  showToast(`Cleared ${count} task${count > 1 ? 's' : ''}`);
});

function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  themeBtn.textContent = dark ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
}

themeBtn.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark'));
});

dateLine.textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
});

applyTheme(localStorage.getItem(THEME_KEY) === 'dark');
render();
