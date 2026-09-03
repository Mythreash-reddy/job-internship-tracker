// ==========================================
// JOB & INTERNSHIP TRACKER - FRONTEND
// ==========================================
// Wrapped in DOMContentLoaded so this works no matter where the
// <script> tag sits in the page, instead of requiring it to load
// after every referenced element already exists in the DOM.

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // GLOBAL VARIABLES
    // ==========================================

    let applications = [];
    let editingId = null;

    // ==========================================
    // DOM ELEMENTS
    // ==========================================

    const authSection = document.getElementById("authSection");
    const appSection = document.getElementById("appSection");
    const loginView = document.getElementById("loginView");
    const registerView = document.getElementById("registerView");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const showRegisterButton = document.getElementById("showRegisterButton");
    const showLoginButton = document.getElementById("showLoginButton");
    const logoutButton = document.getElementById("logoutButton");
    const welcomeUser = document.getElementById("welcomeUser");
    const applicationForm = document.getElementById("applicationForm");
    const applicationList = document.getElementById("applicationList");
    const followUpList = document.getElementById("followUpList");
    const deadlineList = document.getElementById("deadlineList");
    const actionCenterList = document.getElementById("actionCenterList");
    const remindersList = document.getElementById("remindersList");
    const submitButton = document.getElementById("submitButton");
    const cancelButton = document.getElementById("cancelButton");
    const formTitle = document.getElementById("formTitle");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const priorityFilter = document.getElementById("priorityFilter");

    // ==========================================
    // AUTH VIEW SWITCHING
    // ==========================================

    function showLogin() {
        loginView.style.display = "block";
        registerView.style.display = "none";
        clearAuthMessages();
    }

    function showRegister() {
        loginView.style.display = "none";
        registerView.style.display = "block";
        clearAuthMessages();
    }

    function clearAuthMessages() {
        const loginMessage = document.getElementById("loginMessage");
        const registerMessage = document.getElementById("registerMessage");

        loginMessage.textContent = "";
        registerMessage.textContent = "";
        loginMessage.className = "auth-message";
        registerMessage.className = "auth-message";
    }

    function showAuthMessage(elementId, message, type = "error") {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `auth-message ${type}`;
    }

    function showApplicationSection(user) {
        authSection.style.display = "none";
        appSection.style.display = "block";

        if (user) {
            welcomeUser.textContent = `Welcome, ${user.name}`;
        }
    }

    function showAuthSection() {
        authSection.style.display = "flex";
        appSection.style.display = "none";
        applications = [];
        editingId = null;
        showLogin();
    }

    // ==========================================
    // SESSION
    // ==========================================

    async function checkSession() {
        try {
            const response = await fetch("/api/me", { credentials: "include" });

            if (!response.ok) {
                showAuthSection();
                return;
            }

            const user = await response.json();
            showApplicationSection(user);
            await loadApplications();

        } catch (error) {
            console.error(error);
            showAuthSection();
        }
    }

    // ==========================================
    // LOGIN
    // ==========================================

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            loginForm.reset();
            showApplicationSection(data.user);
            await loadApplications();

        } catch (error) {
            console.error(error);
            showAuthMessage("loginMessage", error.message || "Login failed.");
        }
    });

    // ==========================================
    // REGISTER
    // ==========================================

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;

        if (password.length < 6) {
            showAuthMessage("registerMessage", "Password must be at least 6 characters.");
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            registerForm.reset();
            showApplicationSection(data.user);
            await loadApplications();

        } catch (error) {
            console.error(error);
            showAuthMessage("registerMessage", error.message || "Registration failed.");
        }
    });

    // ==========================================
    // LOGOUT
    // ==========================================

    logoutButton.addEventListener("click", async () => {
        try {
            const response = await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Failed to logout.");
            }

            applications = [];
            editingId = null;
            applicationForm.reset();
            showAuthSection();

        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to logout.");
        }
    });

    // ==========================================
    // LOAD APPLICATIONS
    // ==========================================

    async function loadApplications() {
        try {
            const response = await fetch("/api/applications", { credentials: "include" });

            if (response.status === 401) {
                showAuthSection();
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to load applications.");
            }

            applications = await response.json();

            displayApplications();
            updateDashboard();
            updateAnalytics();
            displayFollowUps();
            displayReminders();
            displayDeadlines();
            updateActionCenter();

        } catch (error) {
            console.error(error);
            applicationList.innerHTML = `
                <p class="error-message">Failed to load applications.</p>
            `;
        }
    }

    // ==========================================
    // FILTERING
    // ==========================================

    function getFilteredApplications() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const selectedStatus = statusFilter ? statusFilter.value : "All";
        const selectedPriority = priorityFilter ? priorityFilter.value : "All";

        return applications.filter((application) => {
            const matchesSearch =
                !searchTerm ||
                (application.company || "").toLowerCase().includes(searchTerm) ||
                (application.role || "").toLowerCase().includes(searchTerm) ||
                (application.notes || "").toLowerCase().includes(searchTerm);

            const matchesStatus =
                selectedStatus === "All" || application.status === selectedStatus;

            const matchesPriority =
                selectedPriority === "All" ||
                (application.priority || "Medium") === selectedPriority;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }

    // ==========================================
    // DISPLAY APPLICATIONS
    // ==========================================

    function displayApplications(list = getFilteredApplications()) {
        if (list.length === 0) {
            applicationList.innerHTML = `
                <p class="no-applications">No applications found.</p>
            `;
            updateApplicationCount(0);
            return;
        }

        applicationList.innerHTML = "";
        updateApplicationCount(list.length);

        list.forEach((application) => {
            const card = document.createElement("div");
            card.className = "application-card";

            const priority = application.priority || "Medium";
            const priorityClass = priority.toLowerCase();
            const statusClass = application.status.toLowerCase();

            card.innerHTML = `
                <div class="application-header">
                    <h3>${escapeHTML(application.company)}</h3>
                    <span class="priority ${priorityClass}">
                        ${getPriorityEmoji(priority)} ${escapeHTML(priority)}
                    </span>
                </div>

                <p><strong>Role:</strong> ${escapeHTML(application.role)}</p>

                <p>
                    <strong>Status:</strong>
                    <span class="status-badge status-${statusClass}">
                        ${escapeHTML(application.status)}
                    </span>
                </p>

                ${application.deadline ? `
                    <p>
                        <strong>Deadline:</strong>
                        ${formatDate(application.deadline)}
                        ${getUrgencyLabel(application.deadline)}
                    </p>
                ` : ""}

                ${application.follow_up_date ? `
                    <p>
                        <strong>Follow-up:</strong>
                        ${formatDate(application.follow_up_date)}
                        ${getUrgencyLabel(application.follow_up_date)}
                    </p>
                ` : ""}

                ${application.job_url ? `
                    <p>
                        <strong>Job Posting:</strong>
                        <a href="${escapeHTML(application.job_url)}" target="_blank" rel="noopener noreferrer">
                            View Job Posting
                        </a>
                    </p>
                ` : ""}

                ${application.notes ? `
                    <div class="application-notes">
                        <strong>📝 Notes</strong>
                        <p>${escapeHTML(application.notes)}</p>
                    </div>
                ` : ""}

                <div class="card-buttons">
                    <button class="edit-button" data-id="${application.id}">Edit</button>
                    <button class="delete-button" data-id="${application.id}">Delete</button>
                </div>
            `;

            card.querySelector(".edit-button")
                .addEventListener("click", () => editApplication(application.id));

            card.querySelector(".delete-button")
                .addEventListener("click", () => deleteApplication(application.id));

            applicationList.appendChild(card);
        });
    }

    // ==========================================
    // ADD / EDIT APPLICATION
    // ==========================================

    applicationForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const application = {
            company: document.getElementById("company").value.trim(),
            role: document.getElementById("role").value.trim(),
            status: document.getElementById("status").value,
            priority: document.getElementById("priority").value,
            job_url: document.getElementById("job_url").value.trim(),
            deadline: document.getElementById("deadline").value,
            notes: document.getElementById("notes").value.trim(),
            follow_up_date: document.getElementById("follow_up_date").value
        };

        if (!application.company || !application.role || !application.status) {
            alert("Company, role and status are required.");
            return;
        }

        try {
            const url = editingId !== null
                ? `/api/applications/${editingId}`
                : "/api/applications";

            const method = editingId !== null ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(application)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to save application.");
            }

            resetForm();
            await loadApplications();

        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to save application.");
        }
    });

    // ==========================================
    // EDIT APPLICATION
    // ==========================================

    function editApplication(id) {
        const application = applications.find((app) => app.id === id);

        if (!application) {
            alert("Application not found.");
            return;
        }

        editingId = id;

        document.getElementById("company").value = application.company || "";
        document.getElementById("role").value = application.role || "";
        document.getElementById("status").value = application.status || "Applied";
        document.getElementById("priority").value = application.priority || "Medium";
        document.getElementById("job_url").value = application.job_url || "";
        document.getElementById("notes").value = application.notes || "";

        // Postgres DATE columns can come back as "2026-09-10" or as a full
        // ISO timestamp — normalize before putting the value into a
        // <input type="date">, which only accepts YYYY-MM-DD.
        document.getElementById("deadline").value = normalizeDate(application.deadline) || "";
        document.getElementById("follow_up_date").value = normalizeDate(application.follow_up_date) || "";

        formTitle.textContent = "Edit Application";
        submitButton.textContent = "Save Changes";
        cancelButton.style.display = "inline-block";

        applicationForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    cancelButton.addEventListener("click", resetForm);

    function resetForm() {
        applicationForm.reset();
        editingId = null;
        formTitle.textContent = "Add Application";
        submitButton.textContent = "Add Application";
        cancelButton.style.display = "none";
        document.getElementById("priority").value = "Medium";
    }

    // ==========================================
    // DELETE APPLICATION
    // ==========================================

    async function deleteApplication(id) {
        const confirmed = confirm("Are you sure you want to delete this application?");

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`/api/applications/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete application.");
            }

            await loadApplications();

        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to delete application.");
        }
    }

    // ==========================================
    // DASHBOARD
    // ==========================================

    function updateDashboard() {
        updateElement("totalApplications", applications.length);
        updateElement("appliedCount", countByStatus("Applied"));
        updateElement("interviewCount", countByStatus("Interview"));
        updateElement("offerCount", countByStatus("Offer"));
        updateElement("rejectedCount", countByStatus("Rejected"));
    }

    function countByStatus(status) {
        return applications.filter((app) => app.status === status).length;
    }

    // ==========================================
    // ANALYTICS
    // ==========================================

    function updateAnalytics() {
        const total = applications.length;
        const interviews = countByStatus("Interview");
        const offers = countByStatus("Offer");
        const rejected = countByStatus("Rejected");
        const active = applications.filter(
            (app) => app.status !== "Rejected" && app.status !== "Offer"
        ).length;

        const rate = (count) => (total === 0 ? 0 : Math.round((count / total) * 100));

        updateElement("interviewRate", `${rate(interviews)}%`);
        updateElement("offerRate", `${rate(offers)}%`);
        updateElement("rejectionRate", `${rate(rejected)}%`);
        updateElement("activeCount", active);
    }

    // ==========================================
    // URGENCY HELPER
    // ==========================================
    // Deadlines, follow-ups, the action center, and reminders all
    // classify a date the same way (overdue / today / soon / future).
    // This one function replaces four copies of the same if/else chain.

    function getUrgency(dateValue) {
        const days = daysUntil(dateValue);

        if (Number.isNaN(days)) {
            return { days, level: "unknown", label: "Date unavailable" };
        }

        if (days < 0) {
            return { days, level: "overdue", label: `${Math.abs(days)} day(s) overdue` };
        }

        if (days === 0) {
            return { days, level: "today", label: "Today" };
        }

        if (days <= 3) {
            return { days, level: "soon", label: `In ${days} day(s)` };
        }

        return { days, level: "future", label: `In ${days} day(s)` };
    }

    function getUrgencyLabel(dateValue) {
        const { level, label } = getUrgency(dateValue);

        if (level === "future" || level === "unknown") {
            return "";
        }

        return `<span class="urgency-label urgency-${level}">— ${escapeHTML(label)}</span>`;
    }

    // ==========================================
    // SMART ACTION CENTER
    // ==========================================

    function updateActionCenter() {
        if (!actionCenterList) {
            return;
        }

        const actions = [];

        applications.forEach((application) => {
            if (application.status === "Rejected") {
                return;
            }

            if (application.status === "Offer") {
                actions.push({
                    priority: 1,
                    type: "action-success",
                    title: `${application.company} — Offer`,
                    message: "Review the offer and decide your next step."
                });
                return;
            }

            if (application.follow_up_date) {
                const { days, level, label } = getUrgency(application.follow_up_date);

                if (level === "overdue" || level === "today") {
                    actions.push({
                        priority: 1,
                        type: "action-danger",
                        title: `${application.company} — Follow-up`,
                        message: level === "today" ? "Follow up today." : `${label}.`
                    });
                } else if (level === "soon") {
                    actions.push({
                        priority: 2,
                        type: "action-warning",
                        title: `${application.company} — Follow-up`,
                        message: `Follow up ${label.toLowerCase()}.`
                    });
                }
            }

            if (application.deadline) {
                const { level, label } = getUrgency(application.deadline);

                if (level === "overdue") {
                    actions.push({
                        priority: 1,
                        type: "action-danger",
                        title: `${application.company} — Deadline`,
                        message: "Application deadline has passed."
                    });
                } else if (level === "today" || level === "soon") {
                    actions.push({
                        priority: 2,
                        type: "action-warning",
                        title: `${application.company} — Deadline`,
                        message: level === "today" ? "Deadline is today." : `Deadline ${label.toLowerCase()}.`
                    });
                }
            }
        });

        actions.sort((a, b) => a.priority - b.priority);

        if (actions.length === 0) {
            actionCenterList.innerHTML = `
                <p class="empty-message">No urgent actions right now.</p>
            `;
            return;
        }

        actionCenterList.innerHTML = "";

        actions.forEach((action) => {
            const card = document.createElement("div");
            card.className = `action-card ${action.type}`;
            card.innerHTML = `
                <strong>${escapeHTML(action.title)}</strong>
                <p>${escapeHTML(action.message)}</p>
            `;
            actionCenterList.appendChild(card);
        });
    }

    // ==========================================
    // DEADLINES / FOLLOW-UPS / REMINDERS
    // ==========================================
    // These three lists share the same shape: filter applications that
    // have the relevant date, sort them, and render one card per item.

    function renderDateList(container, dateField, cardClassPrefix, emptyMessage, buildCardHTML) {
        if (!container) {
            return;
        }

        const items = applications
            .filter((app) => app[dateField])
            .sort((a, b) => normalizeDate(a[dateField]).localeCompare(normalizeDate(b[dateField])));

        if (items.length === 0) {
            container.innerHTML = `<p class="empty-message">${emptyMessage}</p>`;
            return;
        }

        container.innerHTML = "";

        items.forEach((application) => {
            const { level, label } = getUrgency(application[dateField]);
            const card = document.createElement("div");
            card.className = `${cardClassPrefix}-card ${cardClassPrefix}-${level}`;
            card.innerHTML = buildCardHTML(application, label);
            container.appendChild(card);
        });
    }

    function displayDeadlines() {
        renderDateList(
            deadlineList,
            "deadline",
            "deadline",
            "No upcoming deadlines.",
            (application, label) => `
                <strong>${escapeHTML(application.company)}</strong>
                <span>${escapeHTML(application.role)}</span>
                <br>
                <small>${formatDate(application.deadline)} — ${label}</small>
            `
        );
    }

    function displayFollowUps() {
        renderDateList(
            followUpList,
            "follow_up_date",
            "follow-up",
            "No upcoming follow-ups.",
            (application, label) => `
                <strong>${escapeHTML(application.company)}</strong>
                <span>${escapeHTML(application.role)}</span>
                <br>
                <small>${formatDate(application.follow_up_date)} — ${label}</small>
            `
        );
    }

    // ==========================================
    // REMINDERS
    // ==========================================
    // Combines deadline + follow-up urgency into a single sorted feed.

    function displayReminders() {
        if (!remindersList) {
            return;
        }

        const reminders = [];

        applications.forEach((application) => {
            if (application.deadline) {
                const { level, label } = getUrgency(application.deadline);

                if (level === "overdue" || level === "today" || level === "soon") {
                    reminders.push({
                        type: `deadline-${level}`,
                        priority: level === "overdue" ? 1 : level === "today" ? 2 : 3,
                        title: application.company,
                        role: application.role,
                        message: `Application deadline: ${label.toLowerCase()}.`,
                        date: application.deadline
                    });
                }
            }

            if (application.follow_up_date) {
                const { level, label } = getUrgency(application.follow_up_date);

                if (level === "overdue" || level === "today" || level === "soon") {
                    reminders.push({
                        type: `followup-${level}`,
                        priority: level === "overdue" ? 1 : level === "today" ? 2 : 3,
                        title: application.company,
                        role: application.role,
                        message: `Follow-up: ${label.toLowerCase()}.`,
                        date: application.follow_up_date
                    });
                }
            }
        });

        reminders.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return normalizeDate(a.date).localeCompare(normalizeDate(b.date));
        });

        if (reminders.length === 0) {
            remindersList.innerHTML = `
                <p class="empty-message">✅ No reminders right now.</p>
            `;
            return;
        }

        remindersList.innerHTML = "";

        reminders.forEach((reminder) => {
            const card = document.createElement("div");
            card.className = `reminder-card ${reminder.type}`;
            card.innerHTML = `
                <div class="reminder-icon">${getReminderEmoji(reminder.priority)}</div>
                <div class="reminder-content">
                    <strong>${escapeHTML(reminder.title)}</strong>
                    <span>${escapeHTML(reminder.role)}</span>
                    <p>${escapeHTML(reminder.message)}</p>
                    <small>${formatDate(reminder.date)}</small>
                </div>
            `;
            remindersList.appendChild(card);
        });
    }

    function getReminderEmoji(priority) {
        if (priority === 1) return "🔴";
        if (priority === 2) return "🟠";
        return "🟡";
    }

    // ==========================================
    // DATE HELPERS
    // ==========================================

    // PostgreSQL can return dates as "2026-09-10" or as a full ISO
    // timestamp like "2026-09-10T00:00:00.000Z" — this extracts just
    // the YYYY-MM-DD portion so every other helper can rely on one format.
    function normalizeDate(dateValue) {
        if (!dateValue) {
            return null;
        }

        const match = String(dateValue).trim().match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : null;
    }

    function daysUntil(dateValue) {
        const normalized = normalizeDate(dateValue);

        if (!normalized) {
            return NaN;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [year, month, day] = normalized.split("-").map(Number);
        const target = new Date(year, month - 1, day);

        const difference = target.getTime() - today.getTime();
        return Math.round(difference / (1000 * 60 * 60 * 24));
    }

    function formatDate(dateValue) {
        const normalized = normalizeDate(dateValue);

        if (!normalized) {
            return "Invalid Date";
        }

        const [year, month, day] = normalized.split("-").map(Number);

        // Using the numeric Date constructor avoids timezone-related
        // date shifts that occur when parsing "YYYY-MM-DD" as UTC.
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function getPriorityEmoji(priority) {
        if (priority === "High") return "🔴";
        if (priority === "Low") return "🟢";
        return "🟡";
    }

    // ==========================================
    // UI HELPERS
    // ==========================================

    function updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    function updateApplicationCount(count) {
        const element = document.getElementById("applicationCountLabel");
        if (!element) {
            return;
        }
        element.textContent = count === 1 ? "1 application" : `${count} applications`;
    }

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }
        const div = document.createElement("div");
        div.textContent = String(value);
        return div.innerHTML;
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    if (searchInput) {
        searchInput.addEventListener("input", () => displayApplications());
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => displayApplications());
    }

    if (priorityFilter) {
        priorityFilter.addEventListener("change", () => displayApplications());
    }

    if (showRegisterButton) {
        showRegisterButton.addEventListener("click", showRegister);
    }

    if (showLoginButton) {
        showLoginButton.addEventListener("click", showLogin);
    }

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    checkSession();
});