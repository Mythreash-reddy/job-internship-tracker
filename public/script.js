// ==========================================
// GLOBAL VARIABLES
// ==========================================

let applications = [];
let editingId = null;


// ==========================================
// DOM ELEMENTS
// ==========================================

const applicationForm =
    document.getElementById("applicationForm");

const applicationList =
    document.getElementById("applicationList");

const followUpList =
    document.getElementById("followUpList");

const submitButton =
    document.getElementById("submitButton");

const cancelButton =
    document.getElementById("cancelButton");

const formTitle =
    document.getElementById("formTitle");


// ==========================================
// LOAD APPLICATIONS
// ==========================================

async function loadApplications() {

    try {

        const response =
            await fetch("/api/applications");


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
    list = applications
) {

    if (list.length === 0) {

        applicationList.innerHTML = `
            <p class="no-applications">
                No applications found.
            </p>
        `;

        return;

    }


    applicationList.innerHTML = "";


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
                ${escapeHTML(
                    application.status
                )}
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
                    .getElementById(
                        "follow_up_date"
                    )
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
                    method: "DELETE"
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
// SEARCH
// ==========================================

function searchApplications() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    if (!searchTerm) {

        displayApplications();

        return;

    }


    const filtered =
        applications.filter(
            application => {

                return (

                    (
                        application.company ||
                        ""
                    )
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    (
                        application.role ||
                        ""
                    )
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    (
                        application.notes ||
                        ""
                    )
                        .toLowerCase()
                        .includes(searchTerm)

                );

            }
        );


    displayApplications(filtered);

}


// ==========================================
// STATUS FILTER
// ==========================================

function filterApplications() {

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const selectedStatus =
        statusFilter.value;


    if (
        selectedStatus === "All" ||
        selectedStatus === ""
    ) {

        displayApplications();

        return;

    }


    const filtered =
        applications.filter(
            application =>
                application.status ===
                selectedStatus
        );


    displayApplications(filtered);

}


// ==========================================
// DASHBOARD
// ==========================================

function updateElement(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


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

function calculatePercentage(
    count,
    total
) {

    if (total === 0) {
        return 0;
    }


    return Math.round(
        (count / total) * 100
    );

}


function updateAnalytics() {

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


    const interviewRate =
        calculatePercentage(
            interviews,
            total
        );


    const offerRate =
        calculatePercentage(
            offers,
            total
        );


    const rejectionRate =
        calculatePercentage(
            rejected,
            total
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


    const appliedPercentage =
        calculatePercentage(
            applied,
            total
        );


    const interviewPercentage =
        calculatePercentage(
            interviews,
            total
        );


    const offerPercentage =
        calculatePercentage(
            offers,
            total
        );


    const rejectedPercentage =
        calculatePercentage(
            rejected,
            total
        );


    updateElement(
        "appliedPercentage",
        `${appliedPercentage}%`
    );


    updateElement(
        "interviewPercentage",
        `${interviewPercentage}%`
    );


    updateElement(
        "offerPercentage",
        `${offerPercentage}%`
    );


    updateElement(
        "rejectedPercentage",
        `${rejectedPercentage}%`
    );


    updateBar(
        "appliedBar",
        appliedPercentage
    );


    updateBar(
        "interviewBar",
        interviewPercentage
    );


    updateBar(
        "offerBar",
        offerPercentage
    );


    updateBar(
        "rejectedBar",
        rejectedPercentage
    );

}


function updateBar(
    id,
    percentage
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.style.width =
            `${percentage}%`;

    }

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
                    a.follow_up_date
                        .localeCompare(
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
// DAYS UNTIL DATE
// ==========================================

function daysUntil(dateString) {

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
        searchApplications
    );

}


// ==========================================
// FILTER EVENT
// ==========================================

const statusFilter =
    document.getElementById(
        "statusFilter"
    );


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        filterApplications
    );

}


// ==========================================
// INITIAL LOAD
// ==========================================

// ==========================================
// SMART ACTION CENTER
// ==========================================

function updateActionCenter() {

    const actionCenter =
        document.getElementById("actionCenter");

    if (!actionCenter) {
        return;
    }

    const actions = [];

    const today = new Date();

    today.setHours(0, 0, 0, 0);


    applications.forEach(application => {

        // ------------------------------
        // FOLLOW-UP ACTIONS
        // ------------------------------

        if (application.follow_up_date) {

            const days =
                daysUntil(
                    application.follow_up_date
                );


            if (days < 0) {

                actions.push({
                    type: "overdue",
                    title: "🔴 Overdue Follow-up",
                    text:
                        `${application.company} — ${application.role}`,
                    date:
                        `${Math.abs(days)} day(s) overdue`
                });

            } else if (days === 0) {

                actions.push({
                    type: "today",
                    title: "🔔 Follow-up Today",
                    text:
                        `${application.company} — ${application.role}`,
                    date:
                        "Follow up with this company today"
                });

            } else if (days <= 3) {

                actions.push({
                    type: "today",
                    title: "🔔 Follow-up Soon",
                    text:
                        `${application.company} — ${application.role}`,
                    date:
                        `Follow up in ${days} day(s)`
                });

            }

        }


        // ------------------------------
        // DEADLINE ACTIONS
        // ------------------------------

        if (application.deadline) {

            const deadlineDays =
                daysUntil(
                    application.deadline
                );


            if (
                deadlineDays >= 0 &&
                deadlineDays <= 7 &&
                application.status !== "Rejected"
            ) {

                actions.push({
                    type: "deadline",
                    title: "⏰ Deadline Approaching",
                    text:
                        `${application.company} — ${application.role}`,
                    date:
                        deadlineDays === 0
                            ? "Deadline is today"
                            : `Deadline in ${deadlineDays} day(s)`
                });

            }

        }


        // ------------------------------
        // HIGH PRIORITY
        // ------------------------------

        if (
            application.priority === "High" &&
            application.status !== "Rejected" &&
            application.status !== "Offer"
        ) {

            actions.push({
                type: "high",
                title: "⭐ High Priority",
                text:
                    `${application.company} — ${application.role}`,
                date:
                    `Current status: ${application.status}`
            });

        }

    });


    // ------------------------------
    // NO ACTIONS
    // ------------------------------

    if (actions.length === 0) {

        actionCenter.innerHTML = `
            <div class="no-actions">
                ✅ No urgent actions right now.
            </div>
        `;

        return;

    }


    // ------------------------------
    // DISPLAY ACTIONS
    // ------------------------------

    actionCenter.innerHTML = `

        <div class="action-list">

            ${actions.map(action => `

                <div
                    class="action-card action-${action.type}"
                >

                    <strong>
                        ${action.title}
                    </strong>

                    <span>
                        ${escapeHTML(action.text)}
                    </span>

                    <br>

                    <span>
                        ${escapeHTML(action.date)}
                    </span>

                </div>

            `).join("")}

        </div>

    `;

}
loadApplications();