"use strict";

/* =========================================================
   Task Manager • Vanilla JS (No libraries)
   Features:
   - CRUD (add/list/edit/delete)
   - Categories + filter + status filter
   - Sort + Search
   - Completion state
   - High-priority notifications (add/update/complete)
   - Toast notifications auto-dismiss 3–5s
   - Undo delete
   - Export/Import JSON
   - Dark/Light theme with persistence
   - OOP: Task + TaskManager classes
========================================================= */

/* ---------- Utilities ---------- */
const $ = (sel, root = document) => root.querySelector(sel);

const uid = () => crypto?.randomUUID?.() ?? `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const nowISO = () => new Date().toISOString();
const priorityRank = (p) => ({ low: 1, medium: 2, high: 3 }[p] ?? 0);

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- Classes (OOP) ---------- */
class Task {
  constructor({
    id = uid(),
    title,
    description,
    priority,
    category,
    completed = false,
    createdAt = nowISO(),
    updatedAt = nowISO()
  }) {
    this.id = id;
    this.title = title.trim();
    this.description = description.trim();
    this.priority = priority;
    this.category = category.trim();
    this.completed = completed;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toggleComplete() {
    this.completed = !this.completed;
    this.updatedAt = nowISO();
    return this.completed;
  }

  update({ title, description, priority, category }) {
    if (typeof title === "string") this.title = title.trim();
    if (typeof description === "string") this.description = description.trim();
    if (typeof priority === "string") this.priority = priority;
    if (typeof category === "string") this.category = category.trim();
    this.updatedAt = nowISO();
  }

  isHighPriority() {
    return this.priority === "high";
  }

  matchesQuery(q) {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      this.title.toLowerCase().includes(s) ||
      this.description.toLowerCase().includes(s) ||
      this.category.toLowerCase().includes(s)
    );
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      priority: this.priority,
      category: this.category,
      completed: this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(obj) {
    return new Task(obj);
  }
}

class TaskManager {
  constructor(storageKey = "tm_tasks_v3") {
    this.storageKey = storageKey;
    this.tasks = [];
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.tasks = Array.isArray(data) ? data.map(Task.fromJSON) : [];
    } catch {
      this.tasks = [];
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.tasks.map(t => t.toJSON())));
  }

  add(taskData) {
    const task = new Task(taskData);
    this.tasks.unshift(task);
    this.save();
    return task;
  }

  update(id, patch) {
    const t = this.getById(id);
    if (!t) return null;
    t.update(patch);
    this.save();
    return t;
  }

  delete(id) {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const [removed] = this.tasks.splice(idx, 1);
    this.save();
    return removed;
  }

  insert(task) {
    // Used for undo delete
    this.tasks.unshift(task);
    this.save();
  }

  toggleComplete(id) {
    const t = this.getById(id);
    if (!t) return null;
    t.toggleComplete();
    this.save();
    return t;
  }

  clear() {
    this.tasks = [];
    this.save();
  }

  getById(id) {
    return this.tasks.find(t => t.id === id) ?? null;
  }

  getCategories() {
    const set = new Set(this.tasks.map(t => t.category).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  query({ category = "all", status = "all", sortBy = "createdDesc", search = "" }) {
    let list = [...this.tasks];

    if (category !== "all") list = list.filter(t => t.category === category);
    if (status === "active") list = list.filter(t => !t.completed);
    if (status === "completed") list = list.filter(t => t.completed);
    if (search.trim()) list = list.filter(t => t.matchesQuery(search));

    const sorters = {
      createdDesc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      createdAsc:  (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      priorityDesc:(a, b) => priorityRank(b.priority) - priorityRank(a.priority),
      priorityAsc: (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
      titleAsc:    (a, b) => a.title.localeCompare(b.title),
      titleDesc:   (a, b) => b.title.localeCompare(a.title)
    };

    list.sort(sorters[sortBy] ?? sorters.createdDesc);
    return list;
  }

  stats() {
    const total = this.tasks.length;
    const done = this.tasks.filter(t => t.completed).length;
    const active = total - done;
    return { total, active, done };
  }
}

/* ---------- App State ---------- */
const manager = new TaskManager();
manager.load();

const ui = {
  form: $("#taskForm"),
  errorSummary: $("#errorSummary"),
  title: $("#title"),
  description: $("#description"),
  category: $("#category"),
  customCategory: $("#customCategory"),

  search: $("#search"),
  filterCategory: $("#filterCategory"),
  filterStatus: $("#filterStatus"),
  sortBy: $("#sortBy"),

  list: $("#taskList"),
  empty: $("#emptyState"),

  statTotal: $("#statTotal"),
  statActive: $("#statActive"),
  statDone: $("#statDone"),

  toastArea: $("#toastArea"),
  alertArea: $("#alertArea"),

  themeToggle: $("#themeToggle"),
  seedBtn: $("#seedBtn"),
  clearBtn: $("#clearBtn"),

  exportBtn: $("#exportBtn"),
  importFile: $("#importFile"),

  editDialog: $("#editDialog"),
  editForm: $("#editForm"),
  editId: $("#editId"),
  editTitle: $("#editTaskTitle"),
  editDesc: $("#editTaskDescription"),
  editCat: $("#editCategory"),
  editPrio: $("#editPriority"),
  editTitleError: $("#editTitleError"),
  editDescError: $("#editDescError")
};

const filters = { category: "all", status: "all", sortBy: "createdDesc", search: "" };

let lastDeleted = null;
let undoTimer = null;

/* ---------- Theme ---------- */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("tm_theme", theme);
  ui.themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
}

function initTheme() {
  const saved = localStorage.getItem("tm_theme");
  if (saved === "light" || saved === "dark") {
    applyTheme(saved);
  } else {
    const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
    applyTheme(prefersLight ? "light" : "dark");
  }
}

/* ---------- Toasts / Notifications ---------- */
function toast({ title, message = "", kind = "info", ms = 4000, important = false, actionText = "", onAction = null }) {
  const t = document.createElement("div");
  t.className = "toast progress";
  t.setAttribute("role", important ? "alert" : "status");
  t.style.setProperty("--toast-ms", `${ms}ms`);

  const icon = kind === "danger" ? "⚠️" : kind === "success" ? "✅" : kind === "high" ? "🔥" : "ℹ️";

  const safeTitle = escapeHtml(title);
  const safeMsg = escapeHtml(message);

  // ✅ Fix #4: Proper action button markup + selector
  t.innerHTML = `
    <div class="toast-top">
      <div>
        <strong>${icon} ${safeTitle}</strong>
        ${safeMsg ? `<div><small>${safeMsg}</small></div>` : ""}
      </div>
      <div class="toast-actions">
        ${actionText ? `<button class="btn ghost" type="button" data-toast-action="1">${escapeHtml(actionText)}</button>` : ""}
        <button class="btn ghost icon" type="button" aria-label="Dismiss notification">✖</button>
      </div>
    </div>
  `;

  const dismissBtn = t.querySelector('button[aria-label="Dismiss notification"]');
  dismissBtn.addEventListener("click", () => t.remove());

  const actBtn = t.querySelector('button[data-toast-action="1"]');
  if (actBtn && typeof onAction === "function") {
    actBtn.addEventListener("click", () => {
      onAction();
      t.remove();
    });
  }

  ui.toastArea.appendChild(t);

  if (important) {
    ui.alertArea.textContent = `${title}. ${message}`;
  }

  window.setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(8px)";
    t.style.transition = "opacity 200ms ease, transform 200ms ease";
    window.setTimeout(() => t.remove(), 220);
  }, ms);
}

/* ---------- Validation ---------- */
function setFieldError(input, errorEl, msg) {
  if (msg) {
    input.setAttribute("aria-invalid", "true");
    errorEl.textContent = msg;
  } else {
    input.removeAttribute("aria-invalid");
    errorEl.textContent = "";
  }
}

function validateCreateForm() {
  let ok = true;
  const errs = [];

  const title = ui.title.value.trim();
  const desc = ui.description.value.trim();
  const custom = ui.customCategory.value.trim();
  const selected = ui.category.value.trim();
  const category = custom || selected;
  const priority = (ui.form.priority?.value ?? "").trim();

  // Title
  if (title.length < 2) { ok = false; errs.push("Title must be at least 2 characters."); }
  if (title.length > 60) { ok = false; errs.push("Title must be 60 characters or fewer."); }

  // Description
  if (desc.length < 5) { ok = false; errs.push("Description must be at least 5 characters."); }
  if (desc.length > 240) { ok = false; errs.push("Description must be 240 characters or fewer."); }

  // Category
  if (!category) { ok = false; errs.push("Please select or type a category."); }

  // Priority
  if (!priority) { ok = false; errs.push("Please choose a priority."); }

  setFieldError(ui.title, $("#titleError"), title.length < 2 ? "Please enter a meaningful title." : "");
  setFieldError(ui.description, $("#descError"), desc.length < 5 ? "Please enter a longer description." : "");

  // If custom category exists, dropdown isn't required visually
  setFieldError(ui.category, $("#catError"), !category ? "Category is required." : "");

  $("#priorityError").textContent = !priority ? "Priority is required." : "";

  if (!ok) {
    ui.errorSummary.hidden = false;
    ui.errorSummary.innerHTML =
      `<strong>Please fix the following:</strong><ul>${errs.map(e => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`;
  } else {
    ui.errorSummary.hidden = true;
    ui.errorSummary.textContent = "";
  }

  return { ok, data: { title, description: desc, category, priority } };
}

function validateEditForm() {
  let ok = true;
  const title = ui.editTitle.value.trim();
  const desc = ui.editDesc.value.trim();

  setFieldError(ui.editTitle, ui.editTitleError, title.length < 2 ? "Title must be at least 2 characters." : "");
  setFieldError(ui.editDesc, ui.editDescError, desc.length < 5 ? "Description must be at least 5 characters." : "");

  if (title.length < 2 || title.length > 60) ok = false;
  if (desc.length < 5 || desc.length > 240) ok = false;

  return ok;
}

/* ---------- Rendering ---------- */
function renderCategories() {
  const cats = manager.getCategories();
  const current = ui.filterCategory.value || "all";

  ui.filterCategory.innerHTML =
    `<option value="all">All</option>` +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  ui.filterCategory.value = cats.includes(current) ? current : "all";
}

function renderStats() {
  const { total, active, done } = manager.stats();
  ui.statTotal.textContent = String(total);
  ui.statActive.textContent = String(active);
  ui.statDone.textContent = String(done);
}

function taskCard(task) {
  const prioClass = `prio-${task.priority}`;
  const doneClass = task.completed ? "completed" : "";
  const created = new Date(task.createdAt).toLocaleString();

  // ✅ Fix #3: Real buttons with dataset actions
  return `
  <li class="task" data-id="${escapeHtml(task.id)}">
    <div class="task-top">
      <div class="task-left">
        <input class="task-check" type="checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task completed" />
        <div>
          <p class="task-title ${doneClass}">${escapeHtml(task.title)}</p>
          <p class="task-desc">${escapeHtml(task.description)}</p>
          <div class="badges" aria-label="Task metadata">
            <span class="badge ${prioClass}" aria-label="Priority ${escapeHtml(task.priority)}">${task.priority.toUpperCase()}</span>
            <span class="badge" aria-label="Category ${escapeHtml(task.category)}">${escapeHtml(task.category)}</span>
            <span class="badge" aria-label="Created at ${escapeHtml(created)}">🕒 ${escapeHtml(created)}</span>
          </div>
        </div>
      </div>

      <div class="task-actions">
        <button class="btn ghost" type="button" data-action="edit" aria-label="Edit task">✏️ Edit</button>
        <button class="btn danger ghost" type="button" data-action="delete" aria-label="Delete task">🗑️ Delete</button>
      </div>
    </div>
  </li>`;
}

function render() {
  renderCategories();
  renderStats();

  const list = manager.query(filters);
  ui.list.innerHTML = list.map(taskCard).join("");

  ui.empty.hidden = list.length !== 0;
  ui.list.setAttribute("aria-label", `Task list, ${list.length} item${list.length === 1 ? "" : "s"}`);
}

/* ---------- Edit Dialog ---------- */
function openEditDialog(id) {
  const t = manager.getById(id);
  if (!t) return;

  ui.editId.value = t.id;
  ui.editTitle.value = t.title;
  ui.editDesc.value = t.description;
  ui.editCat.value = t.category;
  ui.editPrio.value = t.priority;

  ui.editTitleError.textContent = "";
  ui.editDescError.textContent = "";
  ui.editTitle.removeAttribute("aria-invalid");
  ui.editDesc.removeAttribute("aria-invalid");

  ui.editDialog.showModal();
  ui.editTitle.focus();
}

/* ---------- Event Handlers ---------- */
ui.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const { ok, data } = validateCreateForm();
  if (!ok) {
    toast({ title: "Fix form errors", message: "Please correct the highlighted fields.", kind: "danger", ms: 4500 });
    return;
  }

  const t = manager.add(data);
  render();

  // High priority notifications
  if (t.isHighPriority()) {
    toast({
      title: "High-priority task added",
      message: `"${t.title}" was added.`,
      kind: "high",
      important: true,
      ms: 4800
    });
  } else {
    toast({ title: "Task added", message: `"${t.title}"`, kind: "success", ms: 3200 });
  }

  ui.form.reset();
  ui.customCategory.value = "";
  ui.title.focus();
});

ui.form.addEventListener("reset", () => {
  ui.errorSummary.hidden = true;
  ui.errorSummary.textContent = "";
  setFieldError(ui.title, $("#titleError"), "");
  setFieldError(ui.description, $("#descError"), "");
  setFieldError(ui.category, $("#catError"), "");
  $("#priorityError").textContent = "";
});

ui.search.addEventListener("input", () => {
  filters.search = ui.search.value;
  render();
});

ui.filterCategory.addEventListener("change", () => {
  filters.category = ui.filterCategory.value;
  render();
});

ui.filterStatus.addEventListener("change", () => {
  filters.status = ui.filterStatus.value;
  render();
});

ui.sortBy.addEventListener("change", () => {
  filters.sortBy = ui.sortBy.value;
  render();
});

// Event delegation: edit/delete
ui.list.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  const li = e.target.closest("li.task");
  if (!li || !btn) return;

  const id = li.dataset.id;

  if (btn.dataset.action === "edit") {
    openEditDialog(id);
  }

  if (btn.dataset.action === "delete") {
    const removed = manager.delete(id);
    render();
    if (!removed) return;

    lastDeleted = removed;
    clearTimeout(undoTimer);

    toast({
      title: "Task deleted",
      message: `"${removed.title}" removed.`,
      kind: "info",
      ms: 5000,
      actionText: "Undo",
      onAction: () => {
        if (lastDeleted) {
          manager.insert(lastDeleted);
          lastDeleted = null;
          render();
          toast({ title: "Restored", message: "Task restored successfully.", kind: "success", ms: 2800 });
        }
      }
    });

    undoTimer = setTimeout(() => { lastDeleted = null; }, 5000);
  }
});

// Completion checkbox
ui.list.addEventListener("change", (e) => {
  const cb = e.target.closest("input.task-check");
  const li = e.target.closest("li.task");
  if (!cb || !li) return;

  const id = li.dataset.id;
  const t = manager.toggleComplete(id);
  render();

  if (!t) return;
  const action = t.completed ? "completed" : "marked active";

  toast({
    title: t.isHighPriority() ? "High-priority task updated" : "Task updated",
    message: `"${t.title}" ${action}.`,
    kind: t.isHighPriority() ? "high" : "success",
    important: t.isHighPriority(),
    ms: 4200
  });
});

// Edit form
ui.editForm.addEventListener("submit", (e) => {
  const value = e.submitter?.value ?? "confirm";
  if (value !== "confirm") return;

  if (!validateEditForm()) {
    e.preventDefault(); // keep dialog open
    toast({ title: "Fix edit errors", message: "Please correct highlighted fields.", kind: "danger", ms: 4500 });
    return;
  }

  const id = ui.editId.value;
  const updated = manager.update(id, {
    title: ui.editTitle.value,
    description: ui.editDesc.value,
    category: (ui.editCat.value || "General").trim(),
    priority: ui.editPrio.value
  });

  render();

  toast({
    title: updated?.isHighPriority() ? "High-priority task updated" : "Task updated",
    message: `"${updated?.title ?? "Task"}" saved.`,
    kind: updated?.isHighPriority() ? "high" : "success",
    important: !!updated?.isHighPriority(),
    ms: 4200
  });
});

/* ---------- Demo + Clear ---------- */
ui.seedBtn.addEventListener("click", () => {
  const samples = [
    { title: "Submit Assignment 4", description: "Confirm CRUD, filter, sort, search, completion, theme, accessibility.", priority: "high", category: "School" },
    { title: "Grocery shopping", description: "Milk, bread, eggs, fruits.", priority: "low", category: "Personal" },
    { title: "Team meeting prep", description: "Prepare agenda and key updates.", priority: "medium", category: "Work" }
  ];
  samples.forEach(s => manager.add(s));
  render();
  toast({ title: "Demo tasks added", message: "Edit or delete them anytime.", kind: "success", ms: 3500 });
});

ui.clearBtn.addEventListener("click", () => {
  if (!manager.tasks.length) {
    toast({ title: "Nothing to clear", message: "No tasks in the list.", kind: "info", ms: 2600 });
    return;
  }
  if (!confirm("Clear all tasks? This cannot be undone.")) return;

  manager.clear();
  render();
  toast({ title: "All tasks cleared", message: "Your list is now empty.", kind: "info", ms: 3200 });
});

/* ---------- Export / Import JSON ---------- */
ui.exportBtn.addEventListener("click", () => {
  const payload = JSON.stringify(manager.tasks.map(t => t.toJSON()), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks-export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  toast({ title: "Exported", message: "Downloaded tasks-export.json", kind: "success", ms: 2800 });
});

ui.importFile.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error("Invalid JSON format (expected an array).");

    const existingIds = new Set(manager.tasks.map(t => t.id));
    data.forEach(obj => {
      const safe = { ...obj };
      if (existingIds.has(safe.id)) safe.id = uid();

      manager.add({
        id: safe.id,
        title: (safe.title ?? "Imported task").toString(),
        description: (safe.description ?? "").toString(),
        priority: ["low", "medium", "high"].includes(safe.priority) ? safe.priority : "low",
        category: (safe.category ?? "Imported").toString(),
        completed: !!safe.completed,
        createdAt: safe.createdAt ?? nowISO(),
        updatedAt: safe.updatedAt ?? nowISO()
      });
    });

    render();
    toast({ title: "Imported", message: "Tasks imported successfully.", kind: "success", ms: 3200 });
  } catch (err) {
    toast({ title: "Import failed", message: err.message, kind: "danger", ms: 4800 });
  } finally {
    ui.importFile.value = "";
  }
});

/* ---------- Keyboard UX ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    ui.search.focus();
  }
});

/* ---------- Theme Toggle ---------- */
ui.themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  toast({ title: `Theme: ${next}`, message: "Preference saved.", kind: "info", ms: 2400 });
});

/* ---------- Init ---------- */
initTheme();
render();