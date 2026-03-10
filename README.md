# Task Manager (Vanilla JavaScript)

A multi-feature **Task Management Web Application** built with **semantic HTML**, **responsive CSS**, and **vanilla JavaScript** (no frameworks, no external libraries).  
This project demonstrates **DOM manipulation**, **Object-Oriented Programming (OOP)**, and **event handling** through a clean, accessible user interface.

## Live Demo
- **Live App:** https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO-NAME/

---

## Features (Assignment Requirements ✅)

### Task CRUD Operations
- **Create** tasks with: **title**, **description**, **priority** (low/medium/high), and **category**
- **Read/List** tasks dynamically (no page refresh)
- **Update/Edit** tasks using an accessible modal (`<dialog>`)
- **Delete** tasks instantly from the list

### Categories + Filtering
- Organize tasks into categories (e.g., Personal, Work, Urgent, School)
- Filter tasks by:
  - **Category**
  - **Status** (Active / Completed)

### Priority Notifications (3–5 seconds)
- On-screen notifications automatically disappear after 3–5 seconds
- **High-priority** tasks trigger special alerts when:
  - Added
  - Updated
  - Marked completed

### OOP Design
- `Task` class encapsulates task data and behaviors (update, toggle completion)
- `TaskManager` class manages state and operations:
  - add, update, delete, filter, sort, search
- Data persists using `localStorage`

### UI / UX
- Responsive layout for **desktop and mobile**
- **Search** tasks by title, description, or category
- Mark tasks **completed** (visual strike-through + state update)
- **Dark/Light Theme Toggle** saved to `localStorage`
- Instant UI updates via DOM rendering

---

## Extra Features (For “Excellent” ⭐)
- **Undo Delete** via toast action button (prevents accidental deletion)
- **Export Tasks** to JSON (download)
- **Import Tasks** from JSON (upload)
- Respects **prefers-reduced-motion** for accessibility
- Keyboard shortcut: press **/** to focus search

---

## Accessibility Highlights
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- **Skip link** for keyboard navigation
- Proper labels and helper/error text with `aria-describedby`
- `aria-live` regions for notifications (screen-reader friendly)
- Strong `:focus-visible` styles
- Accessible edit modal using native `<dialog>`

---

## Project Structure
```text
task-manager/
  index.html
  styles.css
  app.js
  README.md