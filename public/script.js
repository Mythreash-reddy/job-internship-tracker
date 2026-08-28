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
            throw new Error("Failed to load applications.");
        }

        applications = await response.json();

        displayApplications();

        updateDashboard();

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

function displayApplications(list = applications) {

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
            application.priority || "Medium";


        let priorityClass =
            priority.toLowerCase();


        card.innerHTML = `

            <div class="application-header">

                <h3>
                    ${escapeHTML(application.company)}
                </h3>

                <span class="priority ${priorityClass}">
                    ${getPriorityEmoji(priority)}
                    ${escapeHTML(priority)}
                </span>

            </div>


            <p>
                <strong>Role:</strong>
                ${escapeHTML(application.role)}
            </p>


            <p>
                <strong>Status:</strong>
                ${escapeHTML(application.status)}
            </p>


            <p>
                <strong>Priority:</strong>
                ${getPriorityEmoji(priority)}
                ${escapeHTML(priority)}
            </p>


            ${
                application.deadline
                    ? `
                    <p>
                        <strong>Deadline:</strong>
                        ${formatDate(application.deadline)}
                    </p>
                    `
                    : ""
            }


            ${
                application.job_url
                    ? `
                    <p>
                        <strong>Job Posting:</strong>

                        <a
                            href="${escapeHTML(application.job_url)}"
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
                    <div class="application-notes">

                        <strong>📝 Notes</strong>

                        <p>
                            ${escapeHTML(application.notes)}
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


        // Edit button

        card
            .querySelector(".edit-button")
            .addEventListener("click", () => {

                editApplication(application.id);

            });


        // Delete button

        card
            .querySelector(".delete-button")
            .addEventListener("click", () => {

                deleteApplication(application.id);

            });


        applicationList.appendChild(card);

    });

}


// ==========================================
// GET PRIORITY EMOJI
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
// ADD / EDIT APPLICATION
// ==========================================

applicationForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const application = {

            company:
                document.getElementById("company")
                    .value
                    .trim(),

            role:
                document.getElementById("role")
                    .value
                    .trim(),

            status:
                document.getElementById("status")
                    .value,

            priority:
                document.getElementById("priority")
                    .value,

            job_url:
                document.getElementById("job_url")
                    .value
                    .trim(),

            deadline:
                document.getElementById("deadline")
                    .value,

            notes:
                document.getElementById("notes")
                    .value
                    .trim()

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


            // ==================================
            // EDIT
            // ==================================

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
                                JSON.stringify(application)
                        }
                    );

            }


            // ==================================
            // ADD
            // ==================================

            else {

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
                                JSON.stringify(application)
                        }
                    );

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Something went wrong."
                );

            }


            // Reset form

            resetForm();


            // Reload applications

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


    formTitle.textContent =
        "Edit Application";


    submitButton.textContent =
        "Save Changes";


    cancelButton.style.display =
        "inline-block";


    // Scroll to form

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
    function () {

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


    // Make sure Priority returns to Medium

    const priority =
        document.getElementById("priority");


    if (priority) {

        priority.value =
            "Medium";

    }

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
        document.getElementById("searchInput");


    if (!searchInput) {
        return;
    }


    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    if (!searchTerm) {

        displayApplications();

        return;
    }


    const filtered =
        applications.filter(application => {

            return (

                application.company
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                application.role
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                (application.notes || "")
                    .toLowerCase()
                    .includes(searchTerm)

            );

        });


    displayApplications(filtered);

}


// ==========================================
// STATUS FILTER
// ==========================================

function filterApplications() {

    const filter =
        document.getElementById("statusFilter");


    if (!filter) {
        return;
    }


    const selectedStatus =
        filter.value;


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
// UPDATE ELEMENT
// ==========================================

function updateElement(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

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
            dateString + "T00:00:00"
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

    if (value === null ||
        value === undefined) {

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

loadApplications();