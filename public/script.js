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


// Dashboard

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


// Deadline section

const deadlineList =
    document.getElementById("deadlineList");


// Analytics

const appliedBar =
    document.getElementById("appliedBar");

const interviewBar =
    document.getElementById("interviewBar");

const offerBar =
    document.getElementById("offerBar");

const rejectedBar =
    document.getElementById("rejectedBar");

const appliedPercentage =
    document.getElementById(
        "appliedPercentage"
    );

const interviewPercentage =
    document.getElementById(
        "interviewPercentage"
    );

const offerPercentage =
    document.getElementById(
        "offerPercentage"
    );

const rejectedPercentage =
    document.getElementById(
        "rejectedPercentage"
    );

const interviewRate =
    document.getElementById(
        "interviewRate"
    );

const offerRate =
    document.getElementById(
        "offerRate"
    );

const rejectionRate =
    document.getElementById(
        "rejectionRate"
    );


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


        updateDashboard();

        updateAnalytics();

        updateUpcomingDeadlines();

        filterApplications();


    } catch (error) {

        console.error(error);

        applicationList.innerHTML = `
            <p class="no-results">
                Unable to load applications.
            </p>
        `;

    }

}


// ==========================================
// DASHBOARD
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
// ANALYTICS
// ==========================================

function updateAnalytics() {

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


    // ======================================
    // CALCULATE PERCENTAGES
    // ======================================

    const appliedPercent =
        total === 0
            ? 0
            : Math.round(
                (applied / total) * 100
            );


    const interviewPercent =
        total === 0
            ? 0
            : Math.round(
                (interview / total) * 100
            );


    const offerPercent =
        total === 0
            ? 0
            : Math.round(
                (offer / total) * 100
            );


    const rejectedPercent =
        total === 0
            ? 0
            : Math.round(
                (rejected / total) * 100
            );


    // ======================================
    // UPDATE BARS
    // ======================================

    appliedBar.style.width =
        `${appliedPercent}%`;


    interviewBar.style.width =
        `${interviewPercent}%`;


    offerBar.style.width =
        `${offerPercent}%`;


    rejectedBar.style.width =
        `${rejectedPercent}%`;


    // ======================================
    // UPDATE PERCENTAGE LABELS
    // ======================================

    appliedPercentage.textContent =
        `${appliedPercent}%`;


    interviewPercentage.textContent =
        `${interviewPercent}%`;


    offerPercentage.textContent =
        `${offerPercent}%`;


    rejectedPercentage.textContent =
        `${rejectedPercent}%`;


    // ======================================
    // APPLICATION RATES
    // ======================================

    const interviewRateValue =
        total === 0
            ? 0
            : Math.round(
                (interview / total) * 100
            );


    const offerRateValue =
        total === 0
            ? 0
            : Math.round(
                (offer / total) * 100
            );


    const rejectionRateValue =
        total === 0
            ? 0
            : Math.round(
                (rejected / total) * 100
            );


    interviewRate.textContent =
        `${interviewRateValue}%`;


    offerRate.textContent =
        `${offerRateValue}%`;


    rejectionRate.textContent =
        `${rejectionRateValue}%`;

}


// ==========================================
// UPCOMING DEADLINES
// ==========================================

function updateUpcomingDeadlines() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const upcomingApplications =
        allApplications
            .filter(application => {

                if (!application.deadline) {

                    return false;

                }


                const deadline =
                    new Date(
                        application.deadline +
                        "T00:00:00"
                    );


                return deadline >= today;

            })
            .sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.deadline +
                            "T00:00:00"
                        );


                    const dateB =
                        new Date(
                            b.deadline +
                            "T00:00:00"
                        );


                    return dateA - dateB;

                }
            );


    deadlineList.innerHTML = "";


    if (
        upcomingApplications.length === 0
    ) {

        deadlineList.innerHTML = `
            <p class="no-results">
                No upcoming deadlines.
            </p>
        `;

        return;

    }


    upcomingApplications
        .slice(0, 5)
        .forEach(application => {

            const card =
                document.createElement("div");


            card.classList.add(
                "deadline-card"
            );


            const deadlineDate =
                new Date(
                    application.deadline +
                    "T00:00:00"
                );


            const formattedDate =
                deadlineDate.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                );


            const difference =
                Math.ceil(
                    (
                        deadlineDate - today
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                );


            let urgencyText;


            if (difference === 0) {

                urgencyText =
                    "Due today";

                card.classList.add(
                    "deadline-today"
                );

            } else if (difference <= 3) {

                urgencyText =
                    `${difference} day${
                        difference === 1
                            ? ""
                            : "s"
                    } left`;

                card.classList.add(
                    "deadline-soon"
                );

            } else {

                urgencyText =
                    `${difference} days left`;

                card.classList.add(
                    "deadline-normal"
                );

            }


            card.innerHTML = `

                <div>

                    <h3>
                        ${escapeHTML(
                            application.company
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            application.role
                        )}
                    </p>

                </div>


                <div class="deadline-info">

                    <strong>
                        ${formattedDate}
                    </strong>

                    <span>
                        ${urgencyText}
                    </span>

                </div>

            `;


            deadlineList.appendChild(
                card
            );

        });

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
        // EDIT
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
        // ADD
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
            ${escapeHTML(
                application.company
            )}
        </h3>

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
                type="button"
            >
                Edit
            </button>

            <button
                class="delete-button"
                type="button"
            >
                Delete
            </button>

        </div>

    `;


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
// EDIT APPLICATION
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
// SEARCH EVENTS
// ==========================================

searchInput.addEventListener(
    "input",
    filterApplications
);


filterStatus.addEventListener(
    "change",
    filterApplications
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