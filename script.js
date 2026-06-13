
    const taskForm = document.getElementById("taskForm");
    const taskInput = document.getElementById("taskInput");
    const dateInput = document.getElementById("dateInput");
    const timeInput = document.getElementById("timeInput");
    const categoryInput = document.getElementById("categoryInput");
    const taskList = document.getElementById("taskList");
    const emptyState = document.getElementById("emptyState");
    const clearCompletedBtn = document.getElementById("clearCompletedBtn");
    const submitBtn = document.getElementById("submitBtn");
    const totalTasks = document.getElementById("totalTasks");
    const completedTasks = document.getElementById("completedTasks");
    const remainingTasks = document.getElementById("remainingTasks");
    const dueSoonTasks = document.getElementById("dueSoonTasks");
    const statusText = document.getElementById("statusText");
    const statusDot = document.getElementById("statusDot");

    const filters = Array.from(document.querySelectorAll("[data-filter]"));

    const STORAGE_KEY = "skillcraft_task04_todos";

    let tasks = loadTasks();
    let filter = "all";
    let editingId = null;

    function setStatus(text, color) {
      statusText.textContent = text;
      statusDot.style.background = color;
      statusDot.style.boxShadow = `0 0 0 6px ${color}22`;
    }

    function loadTasks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    function saveTasks() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    function formatDateTime(dateValue, timeValue) {
      if (!dateValue && !timeValue) return "No due date";
      const datePart = dateValue || "No date";
      const timePart = timeValue || "No time";
      return `${datePart} ${timePart}`.trim();
    }

    function isDueSoon(task) {
      if (!task.date) return false;
      const due = new Date(`${task.date}T${task.time || "23:59"}`);
      const now = new Date();
      const diff = due - now;
      return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
    }

    function updateOverview() {
      const total = tasks.length;
      const completed = tasks.filter((task) => task.completed).length;
      const remaining = total - completed;
      const dueSoon = tasks.filter((task) => !task.completed && isDueSoon(task)).length;

      totalTasks.textContent = total;
      completedTasks.textContent = completed;
      remainingTasks.textContent = remaining;
      dueSoonTasks.textContent = dueSoon;

      if (total === 0) {
        setStatus("Ready", varAccent());
      } else if (remaining === 0) {
        setStatus("All done", "var(--ok)");
      } else {
        setStatus("Working", "var(--accent)");
      }
    }

    function varAccent() {
      return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#5fd8c8";
    }

    function renderTasks() {
      const items = tasks.filter((task) => {
        if (filter === "active") return !task.completed;
        if (filter === "completed") return task.completed;
        return true;
      });

      taskList.innerHTML = "";

      if (items.length === 0) {
        taskList.appendChild(emptyState);
        emptyState.innerHTML = filter === "all"
          ? "<div><strong>No tasks yet</strong>Add your first task using the form above.</div>"
          : "<div><strong>No matching tasks</strong>Try a different filter.</div>";
      } else {
        items.forEach((task) => taskList.appendChild(createTaskItem(task)));
      }

      updateOverview();
      saveTasks();
      clearCompletedBtn.disabled = tasks.length === 0 || tasks.every((task) => !task.completed);
    }

    function createTaskItem(task) {
      const li = document.createElement("li");
      li.className = `task-item${task.completed ? " completed" : ""}`;
      li.dataset.id = task.id;

      li.innerHTML = `
        <div class="task-main">
          <input class="check" type="checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task as complete">
          <div>
            <p class="task-title"></p>
            <div class="task-meta">
              <span class="tag">${escapeHtml(task.category)}</span>
              <span class="tag">${escapeHtml(formatDateTime(task.date, task.time))}</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn btn-ghost edit-btn" type="button">Edit</button>
            <button class="btn btn-danger delete-btn" type="button">Delete</button>
          </div>
        </div>
      `;

      li.querySelector(".task-title").textContent = task.title;
      li.querySelector(".check").addEventListener("change", (event) => {
        task.completed = event.target.checked;
        renderTasks();
      });

      li.querySelector(".edit-btn").addEventListener("click", () => startEdit(task));
      li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

      return li;
    }

    function escapeHtml(text) {
      return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function resetForm() {
      taskForm.reset();
      categoryInput.value = "General";
      editingId = null;
      submitBtn.textContent = "Add Task";
    }

    function startEdit(task) {
      editingId = task.id;
      taskInput.value = task.title;
      dateInput.value = task.date || "";
      timeInput.value = task.time || "";
      categoryInput.value = task.category || "General";
      submitBtn.textContent = "Update Task";
      taskInput.focus();
      setStatus("Editing task", "var(--warn)");
    }

    function deleteTask(id) {
      tasks = tasks.filter((task) => task.id !== id);
      if (editingId === id) resetForm();
      renderTasks();
    }

    function addOrUpdateTask(event) {
      event.preventDefault();

      const title = taskInput.value.trim();
      if (!title) return;

      const payload = {
        id: editingId || crypto.randomUUID(),
        title,
        date: dateInput.value || "",
        time: timeInput.value || "",
        category: categoryInput.value || "General",
        completed: false
      };

      if (editingId) {
        const index = tasks.findIndex((task) => task.id === editingId);
        if (index !== -1) {
          payload.completed = tasks[index].completed;
          tasks[index] = payload;
        }
      } else {
        tasks.unshift(payload);
      }

      resetForm();
      setStatus("Task saved", "var(--ok)");
      renderTasks();
    }

    function clearCompleted() {
      tasks = tasks.filter((task) => !task.completed);
      if (editingId && !tasks.some((task) => task.id === editingId)) {
        resetForm();
      }
      setStatus("Completed tasks cleared", "var(--accent)");
      renderTasks();
    }

    taskForm.addEventListener("submit", addOrUpdateTask);
    clearCompletedBtn.addEventListener("click", clearCompleted);

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        filters.forEach((chip) => chip.classList.remove("active"));
        button.classList.add("active");
        filter = button.dataset.filter;
        renderTasks();
      });
    });

    renderTasks();