const API_URL = "http://localhost:5000/api/tasks";

let tasks = [];


/* LOAD TASKS FROM SQLITE */
async function loadTasks() {
    try {
        const response = await fetch(API_URL);
        tasks = await response.json();

        displayTasks();
        updateDashboard();
        showDeadlineAlerts();

    } catch (error) {
        console.error("Failed to load tasks:", error);
        alert("Cannot connect to backend.");
    }
}


/* ADD TASK */
async function addTask() {

    const taskInput = document.getElementById("taskInput");
    const priorityInput = document.getElementById("priorityInput");
    const categoryInput = document.getElementById("categoryInput");
    const dueDateInput = document.getElementById("dueDateInput");

    const title = taskInput.value.trim();
    const priority = priorityInput.value;
    const category = categoryInput.value;
    const dueDate = dueDateInput.value;

    if (title === "") {
        alert("Please enter a task.");
        return;
    }

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                priority: priority,
                category: category,
                dueDate: dueDate
            })
        });

        if (!response.ok) {
            throw new Error("Failed to add task");
        }

        taskInput.value = "";
        dueDateInput.value = "";

        await loadTasks();

    } catch (error) {
        console.error(error);
        alert("Failed to add task.");
    }
}


/* DISPLAY TASKS */
function displayTasks() {

    const taskList = document.getElementById("taskList");

    taskList.innerHTML = "";

    tasks.forEach(function(task) {

        const li = document.createElement("li");

        li.className = task.completed
            ? "completed-task"
            : "pending-task";

        li.innerHTML = `
            <div class="task-info">

                <strong>${task.title}</strong>

                <span>
                    Priority: ${task.priority || "Normal"}
                </span>

                <span>
                    Category: ${task.category || "General"}
                </span>

                <span>
                     Due: ${task.dueDate || "No date"}
                       ${
                     task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.completed == 0
                      ? " 🔴 OVERDUE"
                       : ""
                      }          
                </span>

            </div>

            <div class="task-buttons">

                <button onclick="editTask(${task.id})">
                    ✏️ Edit
                </button>

                <button onclick="completeTask(${task.id})">
                    ${task.completed ? "Undo" : "Complete"}
                </button>

                <button onclick="deleteTask(${task.id})">
                    Delete
                </button>

            </div>
        `;

        taskList.appendChild(li);
    });
}


/* COMPLETE / UNDO TASK */
async function completeTask(id) {

    const task = tasks.find(function(task) {
        return task.id === id;
    });

    if (!task) return;

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    completed: task.completed ? 0 : 1
                })
            }
        );

        if (!response.ok) {
            throw new Error("Failed to update task");
        }

        await loadTasks();

    } catch (error) {
        console.error(error);
        alert("Failed to update task.");
    }
}


/* DELETE TASK */
async function deleteTask(id) {

    if (!confirm("Delete this task?")) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete task");
        }

        await loadTasks();

    } catch (error) {
        console.error(error);
        alert("Failed to delete task.");
    }
}


/* DASHBOARD */
function updateDashboard() {

    const total = tasks.length;

    const completed = tasks.filter(function(task) {
        return task.completed == 1 || task.completed === true;
    }).length;

    const pending = total - completed;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("completedTasks").textContent = completed;

    const percentage = total === 0
    ? 0
    : Math.round((completed / total) * 100);

    document.getElementById("completionPercentage").textContent =
    percentage + "%";

    document.getElementById("progressFill").style.width =
    percentage + "%";

}


/* LOAD WHEN PAGE OPENS */
loadTasks();

/* SEARCH & FILTER */
function filterTasks() {
    const searchText = document
        .getElementById("searchInput")
        .value
        .toLowerCase();

    const status = document.getElementById("statusFilter").value;
    const priority = document.getElementById("priorityFilter").value;
    const category = document.getElementById("categoryFilter").value;
    const dateFilter = document.getElementById("dateFilter").value;

    const filteredTasks = tasks.filter(function(task) {

        const matchesSearch =
            (task.title || "")
            .toLowerCase()
            .includes(searchText);

        const matchesStatus =
            status === "all" ||
            (status === "completed" && task.completed == 1) ||
            (status === "pending" && task.completed == 0);

        const matchesPriority =
            priority === "all" ||
            task.priority === priority;

        const matchesCategory =
            category === "all" ||
            task.category === category;

            const today = new Date().toISOString().split("T")[0];

const matchesDate =
    dateFilter === "all" ||
    (dateFilter === "today" && task.dueDate === today) ||
    (dateFilter === "upcoming" && task.dueDate > today) ||
    (dateFilter === "overdue" &&
        task.dueDate < today &&
        task.completed == 0);

        return matchesSearch &&
               matchesStatus &&
               matchesPriority &&
               matchesCategory &&
               matchesDate;
    });

    displayFilteredTasks(filteredTasks);
}

function filterTasks() {
    const searchText = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const statusFilter = document.getElementById("statusFilter").value;
    const priorityFilter = document.getElementById("priorityFilter").value;
    const categoryFilter = document.getElementById("categoryFilter").value;
    const dateFilter = document.getElementById("dateFilter").value;

    const today = new Date().toISOString().split("T")[0];

    const filteredTasks = tasks.filter(task => {

        // Search task name
        const matchesSearch =
            task.title.toLowerCase().includes(searchText);

        // Status
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "pending" && task.completed == 0) ||
            (statusFilter === "completed" && task.completed == 1);

        // Priority
        const matchesPriority =
            priorityFilter === "all" ||
            task.priority === priorityFilter;

        // Category
        const matchesCategory =
            categoryFilter === "all" ||
            task.category === categoryFilter;

        // Date
        const matchesDate =
            dateFilter === "all" ||
            (dateFilter === "today" && task.dueDate === today) ||
            (dateFilter === "upcoming" && task.dueDate > today) ||
            (dateFilter === "overdue" &&
                task.dueDate < today &&
                task.completed == 0);

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesCategory &&
            matchesDate
        );
    });

    displayFilteredTasks(filteredTasks);
}


/* DISPLAY FILTERED TASKS */
function displayFilteredTasks(filteredTasks) {
    const taskList = document.getElementById("taskList");

    taskList.innerHTML = "";

    filteredTasks.forEach(function(task) {

        const li = document.createElement("li");

        const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.completed == 0;

li.className = isOverdue
    ? "overdue-task"
    : (task.completed
        ? "completed-task"
        : "pending-task");

        li.innerHTML = `
            <div class="task-info">
                <strong>${task.title}</strong>

                <span>
                    Priority: ${task.priority || "Normal"}
                </span>

                <span>
                    Due: ${task.dueDate || "No date"}
                </span>
            </div>

            <div class="task-buttons">

                <button onclick="editTask(${task.id})">
                  ✏️ Edit
                </button>

                <button onclick="completeTask(${task.id})">
                    ${task.completed ? "Undo" : "Complete"}
                </button>

                <button onclick="deleteTask(${task.id})">
                    Delete
                </button>

            </div>
        `;

        taskList.appendChild(li);
    });
}

/* EDIT TASK */
function editTask(id) {
    const task = tasks.find(function(task) {
        return task.id === id;
    });

    if (!task) return;

    const newTitle = prompt("Edit task name:", task.title);

    if (newTitle === null || newTitle.trim() === "") {
        return;
    }

    const newPriority = prompt(
        "Priority (Low / Medium / High):",
        task.priority || "Medium"
    );

    const newCategory = prompt(
        "Category (Study / Work / Personal / Project):",
        task.category || "Personal"
    );

    const newDueDate = prompt(
        "Due date (YYYY-MM-DD):",
        task.dueDate || ""
    );

    updateTask(
        id,
        newTitle.trim(),
        newPriority,
        newCategory,
        newDueDate
    );
}

/* UPDATE EDITED TASK */
async function updateTask(id, title, priority, category, dueDate) {
    try {
        const response = await fetch(`${API_URL}/${id}/edit`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                priority: priority,
                category: category,
                dueDate: dueDate
            })
        });

        if (!response.ok) {
            throw new Error("Failed to edit task");
        }

        await loadTasks();

        alert("Task updated successfully!");
    } catch (error) {
        console.error(error);
        alert("Failed to update task.");
    }
}

/* DARK MODE */
function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    const button = document.getElementById("themeToggle");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        button.textContent = "☀️ Light Mode";
    } else {
        localStorage.setItem("theme", "light");
        button.textContent = "🌙 Dark Mode";
    }
}

/* LOAD SAVED THEME */
function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    const button = document.getElementById("themeToggle");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        button.textContent = "☀️ Light Mode";
    }
}

loadTheme();

/* DEADLINE ALERTS */
function showDeadlineAlerts() {
    const alertBox = document.getElementById("deadlineAlert");

    if (!alertBox) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = tasks.filter(task => {
        if (!task.dueDate || task.completed) return false;

        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);

        return due < today;
    });

    const dueToday = tasks.filter(task => {
        if (!task.dueDate || task.completed) return false;

        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);

        return due.getTime() === today.getTime();
    });

    if (overdue.length > 0) {
        alertBox.innerHTML =
            `🔴 <strong>${overdue.length}</strong> overdue task(s)! Please check your deadlines.`;
        alertBox.className = "deadline-alert overdue-alert";
    }
    else if (dueToday.length > 0) {
        alertBox.innerHTML =
            `🟠 <strong>${dueToday.length}</strong> task(s) are due today!`;
        alertBox.className = "deadline-alert today-alert";
    }
    else {
        alertBox.innerHTML =
            "✅ No urgent deadlines. You're on track!";
        alertBox.className = "deadline-alert normal-alert";
    }
}

/* LOGOUT */
function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}