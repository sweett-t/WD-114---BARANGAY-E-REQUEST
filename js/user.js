// Load user profile
const defaultProfile = {
    fullName: "Juan Dela Cruz",
    email: "juan@email.com",
    phone: "09123456789",
    address: "Barangay Sample, City"
};

if (!localStorage.getItem("profile")) {
    localStorage.setItem("profile", JSON.stringify(defaultProfile));
}

const profile = JSON.parse(localStorage.getItem("profile"));

// Display name in dashboard
if (document.getElementById("userName")) {
    document.getElementById("userName").textContent = profile.fullName;
}

// Populate profile form
if (document.getElementById("profileForm")) {
    document.getElementById("fullName").value = profile.fullName;
    document.getElementById("email").value = profile.email;
    document.getElementById("phone").value = profile.phone;
    document.getElementById("address").value = profile.address;

    document.getElementById("profileForm").addEventListener("submit", function(e) {
        e.preventDefault();

        const updatedProfile = {
            fullName: document.getElementById("fullName").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            address: document.getElementById("address").value
        };

        localStorage.setItem("profile", JSON.stringify(updatedProfile));
        alert("Profile updated successfully!");
    });
}

// Load Requests
if (!localStorage.getItem("requests")) {
    localStorage.setItem("requests", JSON.stringify([
        { service: "Barangay Clearance", date: "Feb 20, 2026", status: "Approved" },
        { service: "Business Permit", date: "Feb 22, 2026", status: "Pending" }
    ]));
}

const requests = JSON.parse(localStorage.getItem("requests"));

// Dashboard stats
if (document.getElementById("totalRequests")) {
    document.getElementById("totalRequests").textContent = requests.length;
    document.getElementById("approvedRequests").textContent =
        requests.filter(r => r.status === "Approved").length;
    document.getElementById("pendingRequests").textContent =
        requests.filter(r => r.status === "Pending").length;
}

// Populate tables
function populateTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    requests.forEach(req => {
        table.innerHTML += `
            <tr>
                <td>${req.service}</td>
                <td>${req.date}</td>
                <td class="${req.status.toLowerCase()}">${req.status}</td>
            </tr>
        `;
    });
}

populateTable("recentRequests");
populateTable("requestTable");