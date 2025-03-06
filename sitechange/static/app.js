let selectedRow = null;
let originalData = [];

const toggleSwitch = document.getElementById('toggle-switch');
const toggleState = document.getElementById('toggle-state');

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


toggleSwitch.addEventListener('change', function() {
    if (this.checked) {
        toggleState.textContent = 'Update';
    } else {
        toggleState.textContent = 'Read Only';
    }
});

async function loadHistory() {
    const response = await fetch("history");
    const data = await response.json();
    const now = Date.now();

    if (data.error) {
        document.body.innerHTML = `<h3 style="color: red;">${data.error}</h3>`;
        return;
    }

    
    originalData = JSON.parse(JSON.stringify(data));

    const tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";

    data.forEach(site => {
        site.oldestDaysAgo = getDaysAgo(now, site.oldest);
        site.beforeLastDaysAgo = getDaysAgo(now, site.beforeLast);
        site.lastDaysAgo = getDaysAgo(now, site.last);
    });

    data.sort((a, b) => {
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
        oldest: data.map(site => site.oldestDaysAgo),
        beforeLast: data.map(site => site.beforeLastDaysAgo),
        last: data.map(site => site.lastDaysAgo)
    };

    const minMax = {
        oldest: [Math.min(...allDays.oldest), Math.max(...allDays.oldest)],
        beforeLast: [Math.min(...allDays.beforeLast), Math.max(...allDays.beforeLast)],
        last: [Math.min(...allDays.last), Math.max(...allDays.last)]
    };

    data.forEach(site => {
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
}

async function loadBackupTable(epoch) {
    const response = await fetch("revert/?q="+epoch);
    const data = await response.json();
    const now = Date.now();

    if (data.error) {
        document.body.innerHTML = `<h3 style="color: red;">${data.error}</h3>`;
        return;
    }

    const tbody = document.querySelector("#backupTable tbody");
    tbody.innerHTML = "";

    data.forEach(site => {
        site.oldestDaysAgo = getDaysAgo(now, site.oldest);
        site.beforeLastDaysAgo = getDaysAgo(now, site.beforeLast);
        site.lastDaysAgo = getDaysAgo(now, site.last);
    });

    data.sort((a, b) => {
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
        oldest: data.map(site => site.oldestDaysAgo),
        beforeLast: data.map(site => site.beforeLastDaysAgo),
        last: data.map(site => site.lastDaysAgo)
    };

    const minMax = {
        oldest: [Math.min(...allDays.oldest), Math.max(...allDays.oldest)],
        beforeLast: [Math.min(...allDays.beforeLast), Math.max(...allDays.beforeLast)],
        last: [Math.min(...allDays.last), Math.max(...allDays.last)]
    };

    data.forEach(site => {
        const row = document.createElement("tr");
        

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

        tbody.appendChild(row);
    });
    const restoreTable = document.getElementById("rTab");
    const backupView = document.getElementById("bTab");
    restoreTable.style.display = "none";
    backupView.style.display = "block";
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
    const updatedData = modifiedData.map(item => {
        if (item.site === site) {
            
            item.oldest = item.beforeLast;
            item.beforeLast = item.last;
            item.last = Date.now();
        }
        return item;
    });

    
    updateData(updatedData);

    closeModal();
}

async function updateData(modifiedData) {
    const payload = {
        prev: originalData,
        new: modifiedData
    };

    const response = await fetch("history", {
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
        
        loadHistory(); 
    } else {
        
        siteContainer.style.display = "none";
        backupRestore.style.display = "block";
        
        showBackupRestore(); 
    }
}

async function deleteBackup(epoch) {
    const response = await fetch("revert/?t=" + epoch, {
        method: "DELETE"
    });
    const result = await response.json();
    if (response.ok) {
        showResponseModal("Backup deleted successfully!", false);
        showBackupRestore(); 
    } else {
        showResponseModal(`Failed to restore backup: ${result.error}`, true);
    }

}

function showBackupRestore() {
    
    fetch("revert")
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
    const response = await fetch("revert", {
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

function handleLogout() {
    fetch('../logout', {
        method: 'GET',
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        } else if (!response.ok) {
            console.error('Logout failed:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
}
