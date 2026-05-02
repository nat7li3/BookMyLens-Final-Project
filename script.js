const form = document.getElementById("packageForm");

form.addEventListener("input", updatePreview);
form.addEventListener("submit", savePackage);

function updatePreview() {
    const name = document.getElementById("name").value || "Package Name";
    const category = document.getElementById("category").value || "Category";
    const basePrice = Number(document.getElementById("price").value) || 0;
    const photos = document.getElementById("photos").value || 0;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value || "Description";
    const people = Number(document.getElementById("people").value) || 1;

    let addonTotal = 0;
    document.querySelectorAll(".addon:checked").forEach(a => {
        addonTotal += Number(a.value);
    });

    let locationFee = 0;
    if (location === "Outdoor") locationFee = 25;
    if (location === "Custom") locationFee = 50;

    let peopleFee = (people - 1) * 15;
    const total = basePrice + addonTotal + locationFee + peopleFee;

    document.getElementById("previewContent").innerHTML = `
        <p class="preview-label">Package Name</p>
        <p class="preview-name">${name}</p>
        <p class="preview-label">Category</p>
        <p class="preview-value">${category}</p>
        <p class="preview-label">Location</p>
        <p class="preview-value">${location} (+$${locationFee})</p>
        <p class="preview-label">People</p>
        <p class="preview-value">${people} (+$${peopleFee})</p>
        <p class="preview-label">Photos</p>
        <p class="preview-value">${photos}</p>
        <p class="preview-label">Add-ons</p>
        <p class="preview-value">$${addonTotal}</p>
        <p class="preview-label">Description</p>
        <p class="preview-value">${description}</p>
        <div class="preview-total">$${total}</div>
    `;
}

function savePackage(e) {
    e.preventDefault();

    const email = localStorage.getItem("userEmail");
    const userType = localStorage.getItem("userType");
    if (!email || !userType) return alert("You must be logged in to create a package!");

    const basePrice = Number(document.getElementById("price").value);
    const location = document.getElementById("location").value;
    const people = Number(document.getElementById("people").value) || 1;

    let locationFee = 0;
    if (location === "Outdoor") locationFee = 25;
    if (location === "Custom") locationFee = 50;

    let peopleFee = (people - 1) * 15;

    const addons = [];
    document.querySelectorAll(".addon:checked").forEach(a => {
        addons.push({ name: a.dataset.name, price: Number(a.value) });
    });

    let addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
    const total = basePrice + addonTotal + locationFee + peopleFee;

    const packageData = {
        email,
        creator_type: userType,
        name: document.getElementById("name").value,
        category: document.getElementById("category").value,
        price: total,
        photos_included: Number(document.getElementById("photos").value),
        location,
        description: document.getElementById("description").value,
        people,
        addons
    };

    fetch('http://localhost:3000/package/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
    }).then(res => res.text()).then(msg => {
        alert(msg);
        displayPackages();
        form.reset();
        updatePreview();
    }).catch(err => {
        console.error(err);
        alert("Server error. Try again.");
    });
}

// ---- Edit package modal ----
let editingPackageId = null;
let editingType = null; // 'own' or 'saved'

function openEditModal(p, type) {
    editingPackageId = type === 'own' ? p.package_id : p.save_id;
    editingType = type;

    document.getElementById("editName").value = p.name;
    document.getElementById("editCategory").value = p.category;
    document.getElementById("editPrice").value = p.price;
    document.getElementById("editPhotos").value = p.photos_included;
    document.getElementById("editLocation").value = p.location;
    document.getElementById("editDescription").value = p.description;
    document.getElementById("editPeople").value = p.people;
    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
    editingPackageId = null;
    editingType = null;
}

document.getElementById("editForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const email = localStorage.getItem("userEmail");

    const data = {
        email,
        name: document.getElementById("editName").value,
        category: document.getElementById("editCategory").value,
        price: Number(document.getElementById("editPrice").value),
        photos_included: Number(document.getElementById("editPhotos").value),
        location: document.getElementById("editLocation").value,
        description: document.getElementById("editDescription").value,
        people: Number(document.getElementById("editPeople").value)
    };

    const url = editingType === 'own'
        ? `http://localhost:3000/package/${editingPackageId}/edit`
        : `http://localhost:3000/package/saved/${editingPackageId}/edit`;

    fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.text()).then(msg => {
        alert(msg);
        closeEditModal();
        displayPackages();
    });
});

function displayPackages() {
    const email = localStorage.getItem("userEmail");
    if (!email) return;

    // Load own packages
    fetch(`http://localhost:3000/packages?email=${email}`)
        .then(res => res.json())
        .then(packages => {
            const list = document.getElementById("savedList");
            list.innerHTML = "<p class='section-label'>My Packages</p>";

            packages.forEach(p => {
                const item = document.createElement("div");
                item.className = "package-item";
                item.innerHTML = `
                    <div>
                        <strong>${p.name}</strong> — ${p.category} ($${p.price})
                        <span class="package-status ${p.status === 'taken' ? 'status-taken' : 'status-open'}">
                            ${p.status === 'taken' ? 'Taken' : 'Open'}
                        </span>
                    </div>
                    <div class="package-item-actions">
                        <button class="edit-btn" data-package='${JSON.stringify(p)}' data-type="own">Edit</button>
                        ${p.status === 'open' ? `<button class="close-btn" data-id="${p.package_id}">Mark as Taken</button>` : ''}
                    </div>
                `;
                list.appendChild(item);
            });

            // Load saved packages
            fetch(`http://localhost:3000/packages/saved?email=${email}`)
                .then(res => res.json())
                .then(saved => {
                    if (saved.length > 0) {
                        const label = document.createElement("p");
                        label.className = "section-label";
                        label.textContent = "Saved Packages";
                        list.appendChild(label);

                        saved.forEach(p => {
                            const item = document.createElement("div");
                            item.className = "package-item";
                            item.innerHTML = `
                                <div>
                                    <strong>${p.name}</strong> — ${p.category} ($${p.price})
                                    <span class="package-status status-saved">Saved Copy</span>
                                </div>
                                <div class="package-item-actions">
                                    <button class="edit-btn" data-package='${JSON.stringify(p)}' data-type="saved">Edit</button>
                                </div>
                            `;
                            list.appendChild(item);
                        });
                    }

                    // Attach edit listeners
                    document.querySelectorAll(".edit-btn").forEach(btn => {
                        btn.addEventListener("click", () => {
                            const p = JSON.parse(btn.dataset.package);
                            const type = btn.dataset.type;
                            openEditModal(p, type);
                        });
                    });

                    // Attach close listeners
                    document.querySelectorAll(".close-btn").forEach(btn => {
                        btn.addEventListener("click", () => {
                            const package_id = btn.dataset.id;
                            fetch(`http://localhost:3000/package/${package_id}/close`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email })
                            }).then(res => res.text()).then(msg => {
                                alert(msg);
                                displayPackages();
                            });
                        });
                    });
                });
        })
        .catch(err => console.error(err));
}

displayPackages();