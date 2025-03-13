let selectedRow = null;
let originalData = {};
let currentSiteCode = null;
let siteToDelete = null;

const toggleSwitch = document.getElementById('toggle-switch');
const toggleState = document.getElementById('toggle-state');
const addSiteButton = document.getElementById('add-site-btn');

const CACHE_NAME = 'site-rotation-v1';
const ASSETS = [
    './',
    './index.html',
    './static/styles.css',
    './static/app.js',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});

const fetchHandleRedirect = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (response.redirected) {
        window.location.href = response.url;
        throw new Error("Redirecting...");
    }
    return response;
};

toggleSwitch.addEventListener('change', function () {
    if (this.checked) {
        toggleState.textContent = 'Update';
        addSiteButton.style.display = 'block';
    } else {
        toggleState.textContent = 'Read Only';
        addSiteButton.style.display = 'none';
    }
});

function dataToSitesArray(data) {
    const now = Date.now();

    // Convert the object to an array for sorting and rendering
    const sitesArray = Object.entries(data).map(([siteCode, site]) => ({
        site: siteCode,
        ...site
    }));

    sitesArray.forEach(site => {
        site.oldestDaysAgo = getDaysAgo(now, site.oldest);
        site.beforeLastDaysAgo = getDaysAgo(now, site.beforeLast);
        site.lastDaysAgo = getDaysAgo(now, site.last);
    });

    sitesArray.sort((a, b) => {
        const aPriority = a.lastDaysAgo === null ? -1 : 0;
        const bPriority = b.lastDaysAgo === null ? -1 : 0;

        return (
            aPriority - bPriority ||
            b.lastDaysAgo - a.lastDaysAgo ||
            b.beforeLastDaysAgo - a.beforeLastDaysAgo ||
            b.oldestDaysAgo - a.oldestDaysAgo
        );
    });


    const allDays = {
        oldest: sitesArray.map(site => site.oldestDaysAgo),
        beforeLast: sitesArray.map(site => site.beforeLastDaysAgo),
        last: sitesArray.map(site => site.lastDaysAgo)
    };

    const minMax = {
        oldest: [Math.min(...allDays.oldest), Math.max(...allDays.oldest)],
        beforeLast: [Math.min(...allDays.beforeLast), Math.max(...allDays.beforeLast)],
        last: [Math.min(...allDays.last), Math.max(...allDays.last)]
    };

    return { sitesArray, minMax }

}

async function loadHistory() {
    try {
        const response = await fetchHandleRedirect("history");
        const data = await response.json();

        if (data.error) {
            document.body.innerHTML = `<h3 style="color: red;">${data.error}</h3>`;
            return;
        }

        originalData = data; // Store the data as an object

        const tbody = document.querySelector("#historyTable tbody");
        tbody.innerHTML = "";

        const { sitesArray, minMax } = dataToSitesArray(data);

        sitesArray.forEach(site => {
            const row = document.createElement("tr");
            row.classList.add("hover-effect");

            function replaceNull(d) { return d === null ? "Never" : d }

            row.innerHTML =
                `<td>${site.site}</td>

                <td style="background-color: ${getGradientColor(site.oldestDaysAgo, minMax.oldest)}">
                    ${replaceNull(site.oldestDaysAgo)}
                </td>
                <td style="background-color: ${getGradientColor(site.beforeLastDaysAgo, minMax.beforeLast)}">
                    ${replaceNull(site.beforeLastDaysAgo)}
                </td>
                <td style="background-color: ${getGradientColor(site.lastDaysAgo, minMax.last)}">
                    ${replaceNull(site.lastDaysAgo)}
                </td>`;

            row.addEventListener("click", () => handleRowClick(row, site));

            tbody.appendChild(row);
        });
    } catch (error) {
        if (error.message !== "Redirecting...") {
            console.error("Fetch failed:", error);
        }
    }
}

async function loadBackupTable(epoch) {
    try {
        const response = await fetchHandleRedirect("revert/?q=" + epoch);
        const data = await response.json();

        if (data.error) {
            document.body.innerHTML = `<h3 style="color: red;">${data.error}</h3>`;
            return;
        }

        const tbody = document.querySelector("#backupTable tbody");
        tbody.innerHTML = "";
        const { sitesArray, minMax } = dataToSitesArray(data);


        sitesArray.forEach(site => {
            const row = document.createElement("tr");


            function replaceNull(d) { return d === null ? "Never" : d }

            row.innerHTML =
                `<td style="background-color: #DBDBDB !important">${site.site}</td>
                
                <td style="background-color: ${getGradientColor(site.oldestDaysAgo, minMax.oldest)}">
                    ${replaceNull(site.oldestDaysAgo)}
                </td>
                <td style="background-color: ${getGradientColor(site.beforeLastDaysAgo, minMax.beforeLast)}">
                    ${replaceNull(site.beforeLastDaysAgo)}
                </td>
                <td style="background-color: ${getGradientColor(site.lastDaysAgo, minMax.last)}">
                    ${replaceNull(site.lastDaysAgo)}
                </td>`;

            tbody.appendChild(row);
        });
        const restoreTable = document.getElementById("rTab");
        const backupView = document.getElementById("bTab");
        restoreTable.style.display = "none";
        backupView.style.display = "block";
    } catch (error) {
        if (error.message !== "Redirecting...") {
            console.error("Fetch failed:", error);
        }
    }
}

function backToRestore() {
    const restoreTable = document.getElementById("rTab");
    const backupView = document.getElementById("bTab");
    backupView.style.display = "none";
    restoreTable.style.display = "block";
    showBackupRestore();
}


function useSite(site) {
    const modifiedData = JSON.parse(JSON.stringify(originalData));
    modifiedData[site].oldest = modifiedData[site].beforeLast;
    modifiedData[site].beforeLast = modifiedData[site].last;
    modifiedData[site].last = Date.now();
    updateData(modifiedData);
    closeModal();
}

async function updateData(modifiedData, skipTwoHourCheck = false) {
    const payload = {
        prev: originalData,
        new: modifiedData,
        skipTwoHourCheck: skipTwoHourCheck
    };
    try {
        const response = await fetchHandleRedirect("history", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showResponseModal('Data updated successfully!', false);
            loadHistory();
        } else {
            showResponseModal(`Failed to update data: ${result.error}`, true);
        }
    } catch (error) {
        if (error.message !== "Redirecting...") {
            console.error("Fetch failed:", error);
        }
    }
}

function showResponseModal(message, isError = false) {
    const modal = document.getElementById("responseModal");
    const modalContent = document.getElementById("responseContent");


    modal.classList.remove("error");


    modalContent.innerHTML = `
        <h3>${isError ? "❌ " : "✅"} ${message}</h3>
        <button class="confirm-btn" onclick="closeResponseModal()">OK</button>
    `;


    if (isError) {
        modal.classList.add("error");
    }


    modal.style.display = "block";
}

function closeResponseModal() {
    document.getElementById("responseModal").style.display = "none";
}

function handleRowClick(row, site) {

    if (selectedRow && selectedRow !== row) {
        selectedRow.classList.remove("selected");
    }


    const isSelected = row.classList.contains("selected");
    row.classList.toggle("selected", !isSelected);
    selectedRow = isSelected ? null : row;

    if (!isSelected) {
        showModal(site);
    }
}

function showModal(site) {
    const modal = document.getElementById("siteModal");
    const modalContent = document.getElementById("modalContent");
    const buttons = toggleSwitch.checked
        ? `
            <button class="confirm-btn" onclick="useSite('${site.site}', '${site.orientation}')">Use this site?</button>
            <button class="modify-btn" onclick="modifySite('${site.site}')">Modify</button>
            <button class="delete-btn" onclick="showDeleteConfirmation('${site.site}')">Delete</button>
            <button class="cancel-btn" onclick="closeModal()">Choose another</button>
        `
        : `
            <button class="cancel-btn" onclick="closeModal()">Close</button>
        `;

    modalContent.innerHTML = `
        <h3>${site.full}</h3>
        <h4>Last three dates the site was used</h4>
        <p>${formatDate(site.last)}</p>
        <p>${formatDate(site.beforeLast)}</p>
        <p>${formatDate(site.oldest)}</p>
        ${buttons}
    `;

    modal.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById("siteModal");
    modal.style.display = "none";
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = "";
    
    if (selectedRow) {
        selectedRow.classList.remove("selected");
        selectedRow = null;
    }
}


function getDaysAgo(now, epoch) {
    return epoch === 0 ? null : Math.floor((now - epoch) / (24 * 60 * 60 * 1000));
}

function formatDate(epoch) {
    return epoch === 0 ? "Never" : new Date(epoch).toLocaleDateString();
}

function getGradientColor(daysAgo, [min, max]) {
    if (daysAgo === null) return "#ffffff !important";

    const ratio = (daysAgo - min) / (max - min || 1);
    const red = Math.round(255 * (1 - ratio));
    const green = Math.round(255 * ratio);
    return `rgb(${red}, ${green}, 100) !important`;
}

function toggleView() {
    const siteContainer = document.getElementById("site-container");
    const backupRestore = document.getElementById("backup-restore");


    if (siteContainer.style.display === "none") {

        siteContainer.style.display = "block";
        backupRestore.style.display = "none";

        const restoreTable = document.getElementById("rTab");
        const backupView = document.getElementById("bTab");
        restoreTable.style.display = "block";
        backupView.style.display = "none";

        loadHistory();
    } else {

        siteContainer.style.display = "none";
        backupRestore.style.display = "block";

        showBackupRestore();
    }
}

async function deleteBackup(epoch) {
    try {
        const response = await fetchHandleRedirect("revert/?t=" + epoch, {
            method: "DELETE"
        });
        const result = await response.json();
        if (response.ok) {
            showResponseModal("Backup deleted successfully!", false);
            showBackupRestore();
        } else {
            showResponseModal(`Failed to delete backup: ${result.error}`, true);
        }
    } catch (error) {
        if (error.message !== "Redirecting...") {
            console.error("Fetch failed:", error);
        }
    }

}

function showBackupRestore() {

    fetchHandleRedirect("revert")
        .then(response => response.json())
        .then(backups => {
            const tbody = document.querySelector("#backup-table tbody");
            tbody.innerHTML = "";


            backups.sort((a, b) => b - a);


            backups.forEach(timestamp => {
                const row = document.createElement("tr");


                const date = new Date(timestamp * 1000).toLocaleString();

                const deleteIco = `<i class="fa-solid fa-trash" style="font-size:18px;color:red; cursor:pointer;margin-right:13px" onclick="showModalMsgAction('Do you wish to delete backup dated ${date}', 'Delete', ${timestamp}, deleteBackup)"></i>`;
                const restoreIco = `<i class="fa-solid fa-rotate-left" style="font-size:18px;color:blue; cursor:pointer" onclick="showModalMsgAction('Do you wish to restore backup dated ${date}', 'Restore', ${timestamp}, restoreBackup)"></i>`;
                const viewIco = `<i class="fa-regular fa-eye" style="font-size:18px;color:grey; cursor:pointer;margin-left:13px" onclick="loadBackupTable(${timestamp})"></i>`;

                row.innerHTML = `
                    <td>${date}</td>
                    <td>${deleteIco} ${restoreIco} ${viewIco}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Failed to fetch backups:", error);
        });
}

function hideBackupRestore() {

    toggleView();
}

async function restoreBackup(timestamp) {
    try {
        const response = await fetchHandleRedirect("revert", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ timestamp })
        });

        const result = await response.json();
        if (response.ok) {
            showResponseModal("Backup restored successfully!", false);
        } else {
            showResponseModal(`Failed to restore backup: ${result.error}`, true);
        }
    } catch (error) {
        if (error.message !== "Redirecting...") {
            console.error("Fetch failed:", error);
        }
    }
}

function showModalMsgAction(msg, actionButtonMsg, timestamp, func) {
    const modal = document.getElementById("siteModal");
    const modalContent = document.getElementById("modalContent");


    modalContent.innerHTML = `
        <h3>${msg}</h3>
        <button class="confirm-btn" id="confirmAction">${actionButtonMsg}</button>
        <button class="cancel-btn" onclick="closeModal()">Cancel</button>
    `;


    document.getElementById("confirmAction").addEventListener("click", () => {
        func(timestamp);
        closeModal();
    });


    modal.style.display = "block";
}

async function handleLogout() {
    try {
        const response = await fetchHandleRedirect('../logout', {
            method: 'GET',
        });

        if (!response.ok) {
            console.error('Logout failed:', response.statusText);
        }
    } catch (error) {
        if (error.message !== "Redirecting...") {
            console.error('Error during logout:', error);
        }
    }
}

function clearInput(inputId) {
    document.getElementById(inputId).value = "";
}

function openAddSiteModal() {
    const modal = document.getElementById("add-site-modal");
    if (currentSiteCode) {
        document.getElementById("form-confirm-btn").textContent = "Update Site";
        document.getElementById("site").readOnly = true;
        document.getElementById("site").style.background = "#DBDBDB";
    } else {
        document.getElementById("form-confirm-btn").textContent = "Add Site";
        document.getElementById("site").readOnly = false;
        document.getElementById("site").style.background = "#FFFFFF";
    }
    modal.style.display = "block";
}

function closeAddSiteModal() {
    const modal = document.getElementById("add-site-modal");
    modal.style.display = "none";
    currentSiteCode = null;
    document.getElementById("add-site-form").reset();
}

document.getElementById("add-site-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const site = document.getElementById("site").value;
    const full = document.getElementById("full").value;
    const date1 = document.getElementById("date1").value;
    const date2 = document.getElementById("date2").value;
    const date3 = document.getElementById("date3").value;

    const dates = [date1, date2, date3]
        .map(date => date ? Date.parse(date) : 0)
        .sort((a, b) => a - b);

    const [oldest = 0, beforeLast = 0, last = 0] = dates;

    const siteData = {
        full,
        oldest,
        beforeLast,
        last
    };

    if (currentSiteCode) {
        const newData = JSON.parse(JSON.stringify(originalData));
        newData[currentSiteCode] = siteData;
        await updateData(newData, true);
        currentSiteCode = null;
    } else {
        const newData = { ...originalData, [site]: siteData };
        await updateData(newData, true);
    }
    closeAddSiteModal();
    loadHistory();
});

function showDeleteConfirmation(siteCode) {
    siteToDelete = siteCode;
    const modal = document.getElementById("confirm-delete-modal");
    modal.style.display = "block";
}

function closeDeleteConfirmation() {
    const modal = document.getElementById("confirm-delete-modal");
    modal.style.display = "none";
    siteToDelete = null;
}

async function deleteSite() {
    if (!siteToDelete) return;
    const newData = JSON.parse(JSON.stringify(originalData));
    delete newData[siteToDelete];
    await updateData(newData, true);
    closeDeleteConfirmation();
    loadHistory();
    closeModal();

    siteToDelete = null;
}

function modifySite(siteCode) {
    const site = originalData[siteCode];

    if (site) {
        currentSiteCode = siteCode;
        document.getElementById("site").value = siteCode;
        document.getElementById("full").value = site.full;
        document.getElementById("date1").value = site.oldest ? new Date(site.oldest).toISOString().slice(0, 16) : "";
        document.getElementById("date2").value = site.beforeLast ? new Date(site.beforeLast).toISOString().slice(0, 16) : "";
        document.getElementById("date3").value = site.last ? new Date(site.last).toISOString().slice(0, 16) : "";
        openAddSiteModal();
        closeModal();
    }
}