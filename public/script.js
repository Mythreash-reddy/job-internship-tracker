// ==========================================
// ELEMENTS
// ==========================================

const form =
    document.getElementById("applicationForm");

const applicationList =
    document.getElementById("applicationList");

const formTitle =
    document.getElementById("formTitle");

const submitButton =
    document.getElementById("submitButton");

const cancelButton =
    document.getElementById("cancelButton");

const searchInput =
    document.getElementById("searchInput");

const filterStatus =
    document.getElementById("filterStatus");


// Dashboard elements

const totalCount =
    document.getElementById("totalCount");

const appliedCount =
    document.getElementById("appliedCount");

const interviewCount =
    document.getElementById("interviewCount");

const offerCount =
    document.getElementById("offerCount");

const rejectedCount =
    document.getElementById("rejectedCount");


// ==========================================
// VARIABLES
// ==========================================

let editingId = null;

let allApplications = [];


// ==========================================
// LOAD APPLICATIONS
// ==========================================

async function loadApplications() {

    try {

        const response =
            await fetch("/api/applications");


        if (!response.ok) {

            throw new Error(
                "Failed to load applications"
            );

        }


        allApplications =
            await response.json();


        // Update dashboard

        updateDashboard();


        // Update application list

        filterApplications();


    } catch (error) {

        console.error(error);

        applicationList.innerHTML = `
            <p>
                Unable to load applications.
            </p>
        `;

    }

}


// ==========================================
// UPDATE DASHBOARD
// ==========================================

function updateDashboard() {

    const total =
        allApplications.length;


    const applied =
        allApplications.filter(
            application =>
                application.status === "Applied"
        ).length;


    const interview =
        allApplications.filter(
            application =>
                application.status === "Interview"
        ).length;


    const offer =
        allApplications.filter(
            application =>
                application.status === "Offer"
        ).length;


    const rejected =
        allApplications.filter(
            application =>
                application.status === "Rejected"
        ).length;


    totalCount.textContent =
        total;


    appliedCount.textContent =
        applied;


    interviewCount.textContent =
        interview;


    offerCount.textContent =
        offer;


    rejectedCount.textContent =
        rejected;

}


// ==========================================
// ADD / EDIT APPLICATION
// ==========================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const application = {

            company:
                document.getElementById(
                    "company"
                ).value.trim(),

            role:
                document.getElementById(
                    "role"
                ).value.trim(),

            status:
                document.getElementById(
                    "status"
                ).value,

            deadline:
                document.getElementById(
                    "deadline"
                ).value

        };


        // ==================================
        // EDIT MODE
        // ==================================

        if (editingId !== null) {

            try {

                const response =
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


                if (!response.ok) {

                    throw new Error(
                        "Failed to update application"
                    );

                }


                editingId = null;


                form.reset();


                formTitle.textContent =
                    "Add Application";


                submitButton.textContent =
                    "Add Application";


                cancelButton.style.display =
                    "none";


                await loadApplications();


            } catch (error) {

                console.error(error);

                alert(
                    "Failed to update application."
                );

            }


            return;

        }


        // ==================================
        // ADD MODE
        // ==================================

        try {

            const response =
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


            if (!response.ok) {

                throw new Error(
                    "Failed to add application"
                );

            }


            form.reset();


            await loadApplications();


        } catch (error) {

            console.error(error);

            alert(
                "Failed to add application."
            );

        }

    }
);


// ==========================================
// DISPLAY APPLICATION
// ==========================================

function displayApplication(application) {

    const card =
        document.createElement("div");


    card.classList.add(
        "application-card"
    );


    card.innerHTML = `

        <h3>
            ${escapeHTML(application.company)}
        </h3>


        <p>
            <strong>Role:</strong>
            ${escapeHTML(application.role)}
        </p>


        <p>
            <strong>Status:</strong>
            ${escapeHTML(application.status)}
        </p>


        <p>
            <strong>Deadline:</strong>
            ${
                application.deadline
                    ? escapeHTML(
                        application.deadline
                    )
                    : "Not specified"
            }
        </p>


        <div class="card-buttons">

            <button
                class="edit-button"
            >
                Edit
            </button>


            <button
                class="delete-button"
            >
                Delete
            </button>

        </div>

    `;


    // ==================================
    // EDIT BUTTON
    // ==================================

    const editButton =
        card.querySelector(
            ".edit-button"
        );


    editButton.addEventListener(
        "click",
        function () {

            startEditing(
                application
            );

        }
    );


    // ==================================
    // DELETE BUTTON
    // ==================================

    const deleteButton =
        card.querySelector(
            ".delete-button"
        );


    deleteButton.addEventListener(
        "click",
        function () {

            deleteApplication(
                application.id
            );

        }
    );


    applicationList.appendChild(
        card
    );

}


// ==========================================
// START EDITING
// ==========================================

function startEditing(application) {

    editingId =
        application.id;


    document.getElementById(
        "company"
    ).value =
        application.company;


    document.getElementById(
        "role"
    ).value =
        application.role;


    document.getElementById(
        "status"
    ).value =
        application.status;


    document.getElementById(
        "deadline"
    ).value =
        application.deadline || "";


    formTitle.textContent =
        "Edit Application";


    submitButton.textContent =
        "Save Changes";


    cancelButton.style.display =
        "block";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ==========================================
// CANCEL EDIT
// ==========================================

cancelButton.addEventListener(
    "click",
    function () {

        editingId = null;


        form.reset();


        formTitle.textContent =
            "Add Application";


        submitButton.textContent =
            "Add Application";


        cancelButton.style.display =
            "none";

    }
);


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


        if (!response.ok) {

            throw new Error(
                "Failed to delete application"
            );

        }


        await loadApplications();


    } catch (error) {

        console.error(error);

        alert(
            "Failed to delete application."
        );

    }

}


// ==========================================
// SEARCH + FILTER
// ==========================================

function filterApplications() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedStatus =
        filterStatus.value;


    const filteredApplications =
        allApplications.filter(
            function (application) {

                const companyMatch =
                    application.company
                        .toLowerCase()
                        .includes(searchText);


                const roleMatch =
                    application.role
                        .toLowerCase()
                        .includes(searchText);


                const matchesSearch =
                    companyMatch ||
                    roleMatch;


                const matchesStatus =
                    selectedStatus === "All" ||
                    application.status ===
                        selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    applicationList.innerHTML = "";


    if (
        filteredApplications.length === 0
    ) {

        applicationList.innerHTML = `
            <p class="no-results">
                No applications found.
            </p>
        `;

        return;

    }


    filteredApplications.forEach(
        function (application) {

            displayApplication(
                application
            );

        }
    );

}


// ==========================================
// SEARCH EVENT
// ==========================================

searchInput.addEventListener(
    "input",
    function () {

        filterApplications();

    }
);


// ==========================================
// FILTER EVENT
// ==========================================

filterStatus.addEventListener(
    "change",
    function () {

        filterApplications();

    }
);


// ==========================================
// SECURITY HELPER
// ==========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ==========================================
// START APPLICATION
// ==========================================

loadApplications();