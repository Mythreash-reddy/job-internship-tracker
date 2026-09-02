// ==========================================
// GLOBAL VARIABLES
// ==========================================

let applications = [];
let editingId = null;


// ==========================================
// DOM ELEMENTS
// ==========================================

const authSection =
    document.getElementById("authSection");

const appSection =
    document.getElementById("appSection");

const loginView =
    document.getElementById("loginView");

const registerView =
    document.getElementById("registerView");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const showRegisterButton =
    document.getElementById("showRegisterButton");

const showLoginButton =
    document.getElementById("showLoginButton");

const logoutButton =
    document.getElementById("logoutButton");

const welcomeUser =
    document.getElementById("welcomeUser");

const applicationForm =
    document.getElementById("applicationForm");

const applicationList =
    document.getElementById("applicationList");

const followUpList =
    document.getElementById("followUpList");

const deadlineList =
    document.getElementById("deadlineList");

const actionCenterList =
    document.getElementById("actionCenterList");

const submitButton =
    document.getElementById("submitButton");

const cancelButton =
    document.getElementById("cancelButton");

const formTitle =
    document.getElementById("formTitle");


// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

    loginView.style.display = "block";

    registerView.style.display = "none";

    clearAuthMessages();

}


// ==========================================
// SHOW REGISTER
// ==========================================

function showRegister() {

    loginView.style.display = "none";

    registerView.style.display = "block";

    clearAuthMessages();

}


// ==========================================
// AUTH MESSAGES
// ==========================================

function clearAuthMessages() {

    const loginMessage =
        document.getElementById("loginMessage");

    const registerMessage =
        document.getElementById("registerMessage");

    loginMessage.textContent = "";

    registerMessage.textContent = "";

    loginMessage.className =
        "auth-message";

    registerMessage.className =
        "auth-message";

}


function showAuthMessage(
    elementId,
    message,
    type = "error"
) {

    const element =
        document.getElementById(elementId);

    element.textContent = message;

    element.className =
        `auth-message ${type}`;

}


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;

        try {

            const response =
                await fetch(
                    "/api/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body:
                            JSON.stringify({
                                email,
                                password
                            })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Login failed."
                );

            }

            loginForm.reset();

            showApplicationSection(
                data.user
            );

            await loadApplications();

        } catch (error) {

            console.error(error);

            showAuthMessage(
                "loginMessage",
                error.message ||
                    "Login failed."
            );

        }

    }
);


// ==========================================
// REGISTER
// ==========================================

registerForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const name =
            document
                .getElementById("registerName")
                .value
                .trim();

        const email =
            document
                .getElementById("registerEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("registerPassword")
                .value;

        if (password.length < 6) {

            showAuthMessage(
                "registerMessage",
                "Password must be at least 6 characters."
            );

            return;

        }

        try {

            const response =
                await fetch(
                    "/api/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body:
                            JSON.stringify({
                                name,
                                email,
                                password
                            })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Registration failed."
                );

            }

            registerForm.reset();

            showApplicationSection(
                data.user
            );

            await loadApplications();

        } catch (error) {

            console.error(error);

            showAuthMessage(
                "registerMessage",
                error.message ||
                    "Registration failed."
            );

        }

    }
);


// ==========================================
// LOGOUT
// ==========================================

logoutButton.addEventListener(
    "click",
    async function() {

        try {

            const response =
                await fetch(
                    "/api/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            if (!response.ok) {

                throw new Error(
                    "Failed to logout."
                );

            }

            applications = [];

            editingId = null;

            applicationForm.reset();

            showAuthSection();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Failed to logout."
            );

        }

    }
);


// ==========================================
// SHOW APPLICATION SECTION
// ==========================================

function showApplicationSection(user) {

    authSection.style.display = "none";

    appSection.style.display = "block";

    if (user) {

        welcomeUser.textContent =
            `Welcome, ${user.name}`;

    }

}


// ==========================================
// SHOW AUTH SECTION
// ==========================================

function showAuthSection() {

    authSection.style.display = "flex";

    appSection.style.display = "none";

    applications = [];

    editingId = null;

    showLogin();

}


// ==========================================
// CHECK CURRENT SESSION
// ==========================================

async function checkSession() {

    try {

        const response =
            await fetch(
                "/api/me",
                {
                    credentials: "include"
                }
            );

        if (!response.ok) {

            showAuthSection();

            return;

        }

        const user =
            await response.json();

        showApplicationSection(user);

        await loadApplications();

    } catch (error) {

        console.error(error);

        showAuthSection();

    }

}


// ==========================================
// LOAD APPLICATIONS
// ==========================================

async function loadApplications() {

    try {

        const response =
            await fetch(
                "/api/applications",
                {
                    credentials: "include"
                }
            );

        if (response.status === 401) {

            showAuthSection();

            return;

        }

        if (!response.ok) {

            throw new Error(
                "Failed to load applications."
            );

        }

        applications =
            await response.json();

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
            <p class="error-message">
                Failed to load applications.
            </p>
        `;

    }

}


// ==========================================
// DISPLAY APPLICATIONS
// ==========================================

function displayApplications(
    list = getFilteredApplications()
) {

    if (list.length === 0) {

        applicationList.innerHTML = `
            <p class="no-applications">
                No applications found.
            </p>
        `;

        updateApplicationCount(0);

        return;

    }

    applicationList.innerHTML = "";

    updateApplicationCount(
        list.length
    );

    list.forEach(application => {

        const card =
            document.createElement("div");

        card.className =
            "application-card";

        const priority =
            application.priority ||
            "Medium";

        const priorityClass =
            priority.toLowerCase();

        const statusClass =
            application.status
                .toLowerCase();

        card.innerHTML = `

            <div class="application-header">

                <h3>
                    ${escapeHTML(
                        application.company
                    )}
                </h3>

                <span
                    class="priority ${priorityClass}"
                >
                    ${getPriorityEmoji(priority)}
                    ${escapeHTML(priority)}
                </span>

            </div>


            <p>
                <strong>Role:</strong>
                ${escapeHTML(
                    application.role
                )}
            </p>


            <p>
                <strong>Status:</strong>

                <span
                    class="status-badge status-${statusClass}"
                >
                    ${escapeHTML(
                        application.status
                    )}
                </span>
            </p>


            ${
                application.deadline
                    ? `
                        <p>
                            <strong>
                                Deadline:
                            </strong>

                            ${formatDate(
                                application.deadline
                            )}

                            ${getDeadlineLabel(
                                application.deadline
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                application.follow_up_date
                    ? `
                        <p>
                            <strong>
                                Follow-up:
                            </strong>

                            ${formatDate(
                                application.follow_up_date
                            )}

                            ${getFollowUpLabel(
                                application.follow_up_date
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                application.job_url
                    ? `
                        <p>
                            <strong>
                                Job Posting:
                            </strong>

                            <a
                                href="${escapeHTML(
                                    application.job_url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Job Posting
                            </a>
                        </p>
                    `
                    : ""
            }


            ${
                application.notes
                    ? `
                        <div
                            class="application-notes"
                        >

                            <strong>
                                📝 Notes
                            </strong>

                            <p>
                                ${escapeHTML(
                                    application.notes
                                )}
                            </p>

                        </div>
                    `
                    : ""
            }


            <div class="card-buttons">

                <button
                    class="edit-button"
                    data-id="${application.id}"
                >
                    Edit
                </button>


                <button
                    class="delete-button"
                    data-id="${application.id}"
                >
                    Delete
                </button>

            </div>

        `;

        card
            .querySelector(".edit-button")
            .addEventListener(
                "click",
                () => {
                    editApplication(
                        application.id
                    );
                }
            );

        card
            .querySelector(".delete-button")
            .addEventListener(
                "click",
                () => {
                    deleteApplication(
                        application.id
                    );
                }
            );

        applicationList.appendChild(card);

    });

}


// ==========================================
// GET FILTERED APPLICATIONS
// ==========================================

function getFilteredApplications() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        );

    const searchTerm =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";

    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "All";

    const selectedPriority =
        priorityFilter
            ? priorityFilter.value
            : "All";

    return applications.filter(
        application => {

            const matchesSearch =
                !searchTerm ||

                (application.company || "")
                    .toLowerCase()
                    .includes(searchTerm) ||

                (application.role || "")
                    .toLowerCase()
                    .includes(searchTerm) ||

                (application.notes || "")
                    .toLowerCase()
                    .includes(searchTerm);

            const matchesStatus =
                selectedStatus === "All" ||
                application.status ===
                    selectedStatus;

            const matchesPriority =
                selectedPriority === "All" ||
                (application.priority ||
                    "Medium") ===
                    selectedPriority;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );

        }
    );

}


// ==========================================
// ADD / EDIT APPLICATION
// ==========================================

applicationForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const application = {

            company:
                document
                    .getElementById("company")
                    .value
                    .trim(),

            role:
                document
                    .getElementById("role")
                    .value
                    .trim(),

            status:
                document
                    .getElementById("status")
                    .value,

            priority:
                document
                    .getElementById("priority")
                    .value,

            job_url:
                document
                    .getElementById("job_url")
                    .value
                    .trim(),

            deadline:
                document
                    .getElementById("deadline")
                    .value,

            notes:
                document
                    .getElementById("notes")
                    .value
                    .trim(),

            follow_up_date:
                document
                    .getElementById("follow_up_date")
                    .value

        };

        if (
            !application.company ||
            !application.role ||
            !application.status
        ) {

            alert(
                "Company, role and status are required."
            );

            return;

        }

        try {

            let response;

            if (editingId !== null) {

                response =
                    await fetch(
                        `/api/applications/${editingId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify(
                                    application
                                )
                        }
                    );

            } else {

                response =
                    await fetch(
                        "/api/applications",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify(
                                    application
                                )
                        }
                    );

            }

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to save application."
                );

            }

            resetForm();

            await loadApplications();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Failed to save application."
            );

        }

    }
);


// ==========================================
// EDIT APPLICATION
// ==========================================

function editApplication(id) {

    const application =
        applications.find(
            app => app.id === id
        );

    if (!application) {

        alert("Application not found.");

        return;

    }

    editingId = id;

    document.getElementById("company")
        .value =
        application.company || "";

    document.getElementById("role")
        .value =
        application.role || "";

    document.getElementById("status")
        .value =
        application.status || "Applied";

    document.getElementById("priority")
        .value =
        application.priority || "Medium";

    document.getElementById("job_url")
        .value =
        application.job_url || "";

    document.getElementById("deadline")
        .value =
        application.deadline || "";

    document.getElementById("notes")
        .value =
        application.notes || "";

    document.getElementById("follow_up_date")
        .value =
        application.follow_up_date || "";

    formTitle.textContent =
        "Edit Application";

    submitButton.textContent =
        "Save Changes";

    cancelButton.style.display =
        "inline-block";

    applicationForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ==========================================
// CANCEL EDIT
// ==========================================

cancelButton.addEventListener(
    "click",
    function() {

        resetForm();

    }
);


// ==========================================
// RESET FORM
// ==========================================

function resetForm() {

    applicationForm.reset();

    editingId = null;

    formTitle.textContent =
        "Add Application";

    submitButton.textContent =
        "Add Application";

    cancelButton.style.display =
        "none";

    document.getElementById(
        "priority"
    ).value = "Medium";

}


// ==========================================
// DELETE APPLICATION
// ==========================================

async function deleteApplication(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this application?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/applications/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to delete application."
            );

        }

        await loadApplications();

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Failed to delete application."
        );

    }

}


// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {

    const total =
        applications.length;

    const applied =
        applications.filter(
            app =>
                app.status === "Applied"
        ).length;

    const interviews =
        applications.filter(
            app =>
                app.status === "Interview"
        ).length;

    const offers =
        applications.filter(
            app =>
                app.status === "Offer"
        ).length;

    const rejected =
        applications.filter(
            app =>
                app.status === "Rejected"
        ).length;

    updateElement(
        "totalApplications",
        total
    );

    updateElement(
        "appliedCount",
        applied
    );

    updateElement(
        "interviewCount",
        interviews
    );

    updateElement(
        "offerCount",
        offers
    );

    updateElement(
        "rejectedCount",
        rejected
    );

}


// ==========================================
// ANALYTICS
// ==========================================

function updateAnalytics() {

    const total =
        applications.length;

    const interviews =
        applications.filter(
            app =>
                app.status === "Interview"
        ).length;

    const offers =
        applications.filter(
            app =>
                app.status === "Offer"
        ).length;

    const rejected =
        applications.filter(
            app =>
                app.status === "Rejected"
        ).length;

    const active =
        applications.filter(
            app =>
                app.status !== "Rejected" &&
                app.status !== "Offer"
        ).length;

    const interviewRate =
        total === 0
            ? 0
            : Math.round(
                (interviews / total) * 100
            );

    const offerRate =
        total === 0
            ? 0
            : Math.round(
                (offers / total) * 100
            );

    const rejectionRate =
        total === 0
            ? 0
            : Math.round(
                (rejected / total) * 100
            );

    updateElement(
        "interviewRate",
        `${interviewRate}%`
    );

    updateElement(
        "offerRate",
        `${offerRate}%`
    );

    updateElement(
        "rejectionRate",
        `${rejectionRate}%`
    );

    updateElement(
        "activeCount",
        active
    );

}


// ==========================================
// SMART ACTION CENTER
// ==========================================

function updateActionCenter() {

    if (!actionCenterList) {
        return;
    }

    const actions = [];

    applications.forEach(
        application => {

            if (
                application.status ===
                "Rejected"
            ) {
                return;
            }

            if (
                application.status ===
                "Offer"
            ) {
                actions.push({
                    priority: 1,
                    type: "action-success",
                    title:
                        `${application.company} — Offer`,
                    message:
                        "Review the offer and decide your next step."
                });

                return;
            }

            if (
                application.follow_up_date
            ) {

                const days =
                    daysUntil(
                        application.follow_up_date
                    );

                if (days <= 0) {

                    actions.push({
                        priority: 1,
                        type: "action-danger",
                        title:
                            `${application.company} — Follow-up`,
                        message:
                            days < 0
                                ? `${Math.abs(days)} day(s) overdue.`
                                : "Follow up today."
                    });

                } else if (days <= 3) {

                    actions.push({
                        priority: 2,
                        type: "action-warning",
                        title:
                            `${application.company} — Follow-up`,
                        message:
                            `Follow up in ${days} day(s).`
                    });

                }

            }

            if (
                application.deadline
            ) {

                const days =
                    daysUntil(
                        application.deadline
                    );

                if (days < 0) {

                    actions.push({
                        priority: 1,
                        type: "action-danger",
                        title:
                            `${application.company} — Deadline`,
                        message:
                            "Application deadline has passed."
                    });

                } else if (days <= 3) {

                    actions.push({
                        priority: 2,
                        type: "action-warning",
                        title:
                            `${application.company} — Deadline`,
                        message:
                            days === 0
                                ? "Deadline is today."
                                : `Deadline in ${days} day(s).`
                    });

                }

            }

        }
    );

    actions.sort(
        (a, b) =>
            a.priority - b.priority
    );

    if (actions.length === 0) {

        actionCenterList.innerHTML = `
            <p class="empty-message">
                No urgent actions right now.
            </p>
        `;

        return;

    }

    actionCenterList.innerHTML = "";

    actions.forEach(action => {

        const card =
            document.createElement("div");

        card.className =
            `action-card ${action.type}`;

        card.innerHTML = `

            <strong>
                ${escapeHTML(
                    action.title
                )}
            </strong>

            <p>
                ${escapeHTML(
                    action.message
                )}
            </p>

        `;

        actionCenterList.appendChild(card);

    });

}


// ==========================================
// DEADLINES
// ==========================================

function displayDeadlines() {

    if (!deadlineList) {
        return;
    }

    const deadlines =
        applications
            .filter(
                app =>
                    app.deadline
            )
            .sort(
                (a, b) =>
                    a.deadline.localeCompare(
                        b.deadline
                    )
            );

    if (deadlines.length === 0) {

        deadlineList.innerHTML = `
            <p class="empty-message">
                No upcoming deadlines.
            </p>
        `;

        return;

    }

    deadlineList.innerHTML = "";

    deadlines.forEach(
        application => {

            const days =
                daysUntil(
                    application.deadline
                );

            let className =
                "deadline-future";

            let message;

            if (days < 0) {

                className =
                    "deadline-overdue";

                message =
                    `${Math.abs(days)} day(s) overdue`;

            } else if (days === 0) {

                className =
                    "deadline-overdue";

                message =
                    "Deadline today";

            } else if (days <= 3) {

                className =
                    "deadline-soon";

                message =
                    `Deadline in ${days} day(s)`;

            } else {

                message =
                    `Deadline in ${days} day(s)`;

            }

            const card =
                document.createElement("div");

            card.className =
                `deadline-card ${className}`;

            card.innerHTML = `

                <strong>
                    ${escapeHTML(
                        application.company
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        application.role
                    )}
                </span>

                <br>

                <small>
                    ${formatDate(
                        application.deadline
                    )}
                    — ${message}
                </small>

            `;

            deadlineList.appendChild(card);

        }
    );

}


// ==========================================
// FOLLOW-UPS
// ==========================================

function displayFollowUps() {

    if (!followUpList) {
        return;
    }

    const withFollowUps =
        applications
            .filter(
                app =>
                    app.follow_up_date
            )
            .sort(
                (a, b) =>
                    a.follow_up_date.localeCompare(
                        b.follow_up_date
                    )
            );

    if (withFollowUps.length === 0) {

        followUpList.innerHTML = `
            <p class="empty-message">
                No upcoming follow-ups.
            </p>
        `;

        return;

    }

    followUpList.innerHTML = "";

    withFollowUps.forEach(
        application => {

            const days =
                daysUntil(
                    application.follow_up_date
                );

            let className =
                "follow-up-future";

            let message;

            if (days < 0) {

                className =
                    "follow-up-today";

                message =
                    `${Math.abs(days)} day(s) overdue`;

            } else if (days === 0) {

                className =
                    "follow-up-today";

                message =
                    "Follow up today";

            } else if (days <= 3) {

                className =
                    "follow-up-soon";

                message =
                    `Follow up in ${days} day(s)`;

            } else {

                message =
                    `Follow up in ${days} day(s)`;

            }

            const card =
                document.createElement("div");

            card.className =
                `follow-up-card ${className}`;

            card.innerHTML = `

                <strong>
                    ${escapeHTML(
                        application.company
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        application.role
                    )}
                </span>

                <br>

                <small>
                    ${formatDate(
                        application.follow_up_date
                    )}
                    — ${message}
                </small>

            `;

            followUpList.appendChild(card);

        }
    );

}


// ==========================================
// DAYS UNTIL
// ==========================================

function daysUntil(dateString) {

    if (!dateString) {
        return 999999;
    }

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const target =
        new Date(
            dateString +
            "T00:00:00"
        );

    const difference =
        target.getTime() -
        today.getTime();

    return Math.round(
        difference /
        (1000 * 60 * 60 * 24)
    );

}


// ==========================================
// DEADLINE LABEL
// ==========================================

function getDeadlineLabel(dateString) {

    const days =
        daysUntil(dateString);

    if (days < 0) {

        return `
            <span class="deadline-label">
                — overdue
            </span>
        `;

    }

    if (days === 0) {

        return `
            <span class="deadline-label">
                — today
            </span>
        `;

    }

    if (days <= 3) {

        return `
            <span class="deadline-label">
                — soon
            </span>
        `;

    }

    return "";

}


// ==========================================
// FOLLOW-UP LABEL
// ==========================================

function getFollowUpLabel(dateString) {

    const days =
        daysUntil(dateString);

    if (days < 0) {

        return `
            <span>
                — overdue
            </span>
        `;

    }

    if (days === 0) {

        return `
            <span>
                — today
            </span>
        `;

    }

    if (days <= 3) {

        return `
            <span>
                — soon
            </span>
        `;

    }

    return "";

}


// ==========================================
// PRIORITY EMOJI
// ==========================================

function getPriorityEmoji(priority) {

    if (priority === "High") {
        return "🔴";
    }

    if (priority === "Low") {
        return "🟢";
    }

    return "🟡";

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


// ==========================================
// UPDATE ELEMENT
// ==========================================

function updateElement(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


// ==========================================
// UPDATE APPLICATION COUNT
// ==========================================

function updateApplicationCount(count) {

    const element =
        document.getElementById(
            "applicationCountLabel"
        );

    if (!element) {
        return;
    }

    element.textContent =
        count === 1
            ? "1 application"
            : `${count} applications`;

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;

}


// ==========================================
// SEARCH EVENT
// ==========================================

const searchInput =
    document.getElementById(
        "searchInput"
    );

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            displayApplications();

        }
    );

}


// ==========================================
// STATUS FILTER EVENT
// ==========================================

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        function() {

            displayApplications();

        }
    );

}


// ==========================================
// PRIORITY FILTER EVENT
// ==========================================

const priorityFilter =
    document.getElementById(
        "priorityFilter"
    );

if (priorityFilter) {

    priorityFilter.addEventListener(
        "change",
        function() {

            displayApplications();

        }
    );

}


// ==========================================
// AUTH BUTTON EVENTS
// ==========================================

if (showRegisterButton) {

    showRegisterButton.addEventListener(
        "click",
        showRegister
    );

}

if (showLoginButton) {

    showLoginButton.addEventListener(
        "click",
        showLogin
    );

}


// ==========================================
// INITIAL START
// ==========================================

// ==========================================
// REMINDERS
// ==========================================

function displayReminders() {

    const remindersList =
        document.getElementById("remindersList");

    if (!remindersList) {
        return;
    }

    const reminders = [];

    applications.forEach(application => {

        // ------------------------------
        // DEADLINE REMINDER
        // ------------------------------

        if (application.deadline) {

            const days =
                daysUntil(application.deadline);

            if (days < 0) {

                reminders.push({
                    type: "deadline-overdue",
                    priority: 1,
                    title: application.company,
                    role: application.role,
                    message:
                        `Application deadline was ${Math.abs(days)} day(s) ago.`,
                    date:
                        application.deadline
                });

            } else if (days === 0) {

                reminders.push({
                    type: "deadline-today",
                    priority: 2,
                    title: application.company,
                    role: application.role,
                    message:
                        "Application deadline is today.",
                    date:
                        application.deadline
                });

            } else if (days <= 3) {

                reminders.push({
                    type: "deadline-soon",
                    priority: 3,
                    title: application.company,
                    role: application.role,
                    message:
                        `Application deadline is in ${days} day(s).`,
                    date:
                        application.deadline
                });

            }

        }


        // ------------------------------
        // FOLLOW-UP REMINDER
        // ------------------------------

        if (application.follow_up_date) {

            const days =
                daysUntil(
                    application.follow_up_date
                );

            if (days < 0) {

                reminders.push({
                    type: "followup-overdue",
                    priority: 1,
                    title: application.company,
                    role: application.role,
                    message:
                        `Follow-up was ${Math.abs(days)} day(s) ago.`,
                    date:
                        application.follow_up_date
                });

            } else if (days === 0) {

                reminders.push({
                    type: "followup-today",
                    priority: 2,
                    title: application.company,
                    role: application.role,
                    message:
                        "Follow up with this company today.",
                    date:
                        application.follow_up_date
                });

            } else if (days <= 3) {

                reminders.push({
                    type: "followup-soon",
                    priority: 3,
                    title: application.company,
                    role: application.role,
                    message:
                        `Follow up in ${days} day(s).`,
                    date:
                        application.follow_up_date
                });

            }

        }

    });


    // ------------------------------
    // SORT REMINDERS
    // ------------------------------

    reminders.sort(
        (a, b) => {

            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }

            return a.date.localeCompare(b.date);

        }
    );


    // ------------------------------
    // NO REMINDERS
    // ------------------------------

    if (reminders.length === 0) {

        remindersList.innerHTML = `
            <p class="empty-message">
                ✅ No reminders right now.
            </p>
        `;

        return;

    }


    // ------------------------------
    // DISPLAY REMINDERS
    // ------------------------------

    remindersList.innerHTML = "";


    reminders.forEach(reminder => {

        const card =
            document.createElement("div");

        card.className =
            `reminder-card ${reminder.type}`;


        card.innerHTML = `

            <div class="reminder-icon">
                ${getReminderEmoji(reminder.type)}
            </div>

            <div class="reminder-content">

                <strong>
                    ${escapeHTML(
                        reminder.title
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        reminder.role
                    )}
                </span>

                <p>
                    ${escapeHTML(
                        reminder.message
                    )}
                </p>

                <small>
                    ${formatDate(
                        reminder.date
                    )}
                </small>

            </div>

        `;


        remindersList.appendChild(card);

    });

}


// ==========================================
// REMINDER EMOJI
// ==========================================

function getReminderEmoji(type) {

    if (
        type === "deadline-overdue" ||
        type === "followup-overdue"
    ) {
        return "🔴";
    }


    if (
        type === "deadline-today" ||
        type === "followup-today"
    ) {
        return "🟠";
    }


    return "🟡";

}
checkSession();