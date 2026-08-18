const form = document.getElementById("applicationForm");
const applicationList = document.getElementById("applicationList");

async function loadApplications() {
    const response = await fetch("/api/applications");
    const applications = await response.json();

    applicationList.innerHTML = "";

    applications.forEach(application => {
        displayApplication(application);
    });
}

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const application = {
        company: document.getElementById("company").value,
        role: document.getElementById("role").value,
        status: document.getElementById("status").value,
        deadline: document.getElementById("deadline").value
    };

    const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(application)
    });

    const savedApplication = await response.json();

    displayApplication(savedApplication);

    form.reset();
});

function displayApplication(application) {
    const card = document.createElement("div");

    card.classList.add("application-card");

    card.innerHTML = `
        <h3>${application.company}</h3>
        <p><strong>Role:</strong> ${application.role}</p>
        <p><strong>Status:</strong> ${application.status}</p>
        <p><strong>Deadline:</strong> ${
            application.deadline || "Not specified"
        }</p>

        <button class="delete-button">Delete</button>
    `;

    const deleteButton = card.querySelector(".delete-button");

    deleteButton.addEventListener("click", function () {
        deleteApplication(application.id);
    });

    applicationList.appendChild(card);
}

async function deleteApplication(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this application?"
    );

    if (!confirmed) {
        return;
    }

    const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert("Failed to delete application.");
        return;
    }

    loadApplications();
}

loadApplications();