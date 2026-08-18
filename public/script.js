const form = document.getElementById("applicationForm");
const applicationList = document.getElementById("applicationList");

const formTitle = document.getElementById("formTitle");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");

let editingId = null;


// ===============================
// Load applications
// ===============================

async function loadApplications() {

    const response = await fetch("/api/applications");

    const applications = await response.json();

    applicationList.innerHTML = "";

    applications.forEach(application => {
        displayApplication(application);
    });
}


// ===============================
// Add / Edit application
// ===============================

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const application = {

        company: document.getElementById("company").value,

        role: document.getElementById("role").value,

        status: document.getElementById("status").value,

        deadline: document.getElementById("deadline").value
    };


    // EDIT MODE

    if (editingId !== null) {

        const response = await fetch(
            `/api/applications/${editingId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(application)
            }
        );


        if (!response.ok) {

            alert("Failed to update application.");

            return;
        }


        editingId = null;

        form.reset();

        formTitle.textContent = "Add Application";

        submitButton.textContent = "Add Application";

        cancelButton.style.display = "none";

        await loadApplications();

        return;
    }


    // ADD MODE

    const response = await fetch(
        "/api/applications",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(application)
        }
    );


    if (!response.ok) {

        alert("Failed to add application.");

        return;
    }


    form.reset();

    await loadApplications();
});


// ===============================
// Display application
// ===============================

function displayApplication(application) {

    const card = document.createElement("div");

    card.classList.add("application-card");


    card.innerHTML = `

        <h3>${application.company}</h3>

        <p>
            <strong>Role:</strong>
            ${application.role}
        </p>

        <p>
            <strong>Status:</strong>
            ${application.status}
        </p>

        <p>
            <strong>Deadline:</strong>
            ${application.deadline || "Not specified"}
        </p>

        <button class="edit-button">
            Edit
        </button>

        <button class="delete-button">
            Delete
        </button>
    `;


    const editButton =
        card.querySelector(".edit-button");

    const deleteButton =
        card.querySelector(".delete-button");


    editButton.addEventListener(
        "click",
        function () {

            startEditing(application);

        }
    );


    deleteButton.addEventListener(
        "click",
        function () {

            deleteApplication(application.id);

        }
    );


    applicationList.appendChild(card);
}


// ===============================
// Start editing
// ===============================

function startEditing(application) {

    editingId = application.id;


    document.getElementById("company").value =
        application.company;

    document.getElementById("role").value =
        application.role;

    document.getElementById("status").value =
        application.status;

    document.getElementById("deadline").value =
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


// ===============================
// Cancel editing
// ===============================

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


// ===============================
// Delete application
// ===============================

async function deleteApplication(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this application?"
    );


    if (!confirmed) {

        return;
    }


    const response = await fetch(
        `/api/applications/${id}`,
        {
            method: "DELETE"
        }
    );


    if (!response.ok) {

        alert("Failed to delete application.");

        return;
    }


    await loadApplications();
}


// ===============================
// Start application
// ===============================

loadApplications();