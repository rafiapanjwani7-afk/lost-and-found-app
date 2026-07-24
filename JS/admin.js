import { supabase, supabaseAdmin } from './supabase.js';

// Elements safely loaded
const adminTableBody = document.getElementById('admin-table-body');
const logoutBtn = document.getElementById('logout-btn');

async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = "/index.html";
        return;
    }
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You are not authorized to view this page!',
            confirmButtonColor: '#d33'
        }).then(() => {
            window.location.href = "dashboard.html";
        });
        return;
    } else {
        console.log("Welcome admin!", user.email);
        fetchAdminItems();
        sideNav(); // Sidebar functionality set karne ke liye
    }
}

document.addEventListener('DOMContentLoaded', checkAuth);

// 1. Fetch and Display All Items for Admin Control
async function fetchAdminItems() {
    if (!adminTableBody) {
        console.error("Target element #admin-table-body not found in HTML!");
        return;
    }

    // Initial Loading State
    adminTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-5">
                <div class="spinner-border text-info" role="status"></div>
            </td>
        </tr>`;

    // Fetch from 'lostor found table'
    const { data: posts, error } = await supabase
        .from('lostor found table')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Admin Fetch Error:", error.message);
        adminTableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center fw-bold">Error loading items: ${error.message}</td></tr>`;
        return;
    }

    if (!posts || posts.length === 0) {
        adminTableBody.innerHTML = `<tr><td colspan="5" class="text-muted text-center py-5">No reports found in the database.</td></tr>`;
        return;
    }

    // Map through posts safely
    adminTableBody.innerHTML = posts.map(post => {
        const itemImg = post.image_url || post['image-url'] || post.imageUrl || 'https://placehold.co/100x100/1e293b/f8fafc?text=No+Image';
        const currentStatus = post.status ? post.status.trim() : 'Lost';
        const isResolved = currentStatus.toLowerCase() === 'resolved';

        let badgeClass = 'bg-danger';
        if (currentStatus.toLowerCase() === 'found') badgeClass = 'bg-success';
        if (isResolved) badgeClass = 'bg-info text-dark';

        let actionElement = '';
        if (isResolved) {
            actionElement = `
                <span class="px-3 py-2 fw-bold d-inline-block" 
                      style="background-color: #e6fdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 10px; font-size: 0.85rem;">
                    ✓ Completed
                </span>
            `;
        } else {
            actionElement = `
                <button class="btn btn-sm py-2 px-3 fw-bold text-white resolve-action-btn" 
                        data-id="${post.id}" 
                        style="background-color: #022c16; border: 1px solid #044321; border-radius: 10px; font-size: 0.85rem; transition: all 0.2s ease;">
                    Mark Resolved
                </button>
            `;
        }

        return `
            <tr id="row-${post.id}">
                <td>
                    <img src="${itemImg}" alt="Item preview" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #334155;">
                </td>
                <td>
                    <h6 class="text-info fw-bold mb-1">${post.item_name || 'Untitled Item'}</h6>
                    <small class="text-secondary d-block text-truncate" style="max-width: 260px;">${post.description || 'No description provided.'}</small>
                </td>
                <td>
                    <span id="badge-${post.id}" class="badge ${badgeClass} px-3 py-1.5" style="border-radius: 12px;">${currentStatus}</span>
                </td>
                <td>
                    <span class="font-monospace small text-secondary">${post.user_id ? post.user_id.substring(0, 8) + '...' : 'System'}</span>
                </td>
                <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center gap-3">
                        <div id="action-container-${post.id}">
                            ${actionElement}
                        </div>
                        <button class="btn delete-post-btn d-flex align-items-center justify-content-center" 
                                data-id="${post.id}" 
                                style="width: 36px; height: 36px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; transition: all 0.25s ease;"
                                onmouseenter="this.style.backgroundColor='#ef4444'; this.style.color='#ffffff';"
                                onmouseleave="this.style.backgroundColor='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444';">
                            <i class="fa-solid fa-trash-can" style="font-size: 0.85rem;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Event Listeners for items
    document.querySelectorAll('.delete-post-btn').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            deleteItemReport(id);
        });
    });

    document.querySelectorAll('.resolve-action-btn').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            triggerResolveProcess(id);
        });
    });
}

// 2. Load All Users Panel
async function loadAllUsers() {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;

        const users = data.users;
        const tableBody = document.getElementById("users-table-body");
        if (!tableBody) return;

        if (!users || users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No users registered yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = "";
        users.forEach((user, index) => {
            const joinedDate = new Date(user.created_at).toLocaleDateString();
            const fullName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'Anonymous User';
            const role = user.user_metadata?.role || 'user';

            tableBody.innerHTML += `
    <tr>
        <td class="text-white-50">${index + 1}</td>
        <td><strong class="text-white">${fullName}</strong></td>
        <td class="text-white-50">${user.email}</td>
        <td><span class="badge ${role === 'admin' ? 'bg-danger' : 'bg-success'}">${role}</span></td>
        <td class="text-white-50">${joinedDate}</td>
        <td>
            <button class="btn btn-sm btn-danger px-3" style="border-radius:8px;" onclick="deleteUser('${user.id}')">
                <i class="fa-solid fa-trash-can me-1"></i> Delete
            </button>
        </td>
    </tr>`;
        });

        const totalUsersEl = document.getElementById("total-users");
        if (totalUsersEl) totalUsersEl.innerText = users.length;

    } catch (err) {
        console.error("Error loading users with supabaseAdmin:", err.message);
    }
}
window.loadAllUsers = loadAllUsers;

// 3. Sidebar Navigation Panel Switcher Setup
function sideNav() {
    const navLinks = document.querySelectorAll('.nav-link-custom');
    const sectionItems = document.getElementById('section-items');
    const sectionUsers = document.getElementById('section-users');
    const sectionComments = document.getElementById('section-comments');

    if (navLinks.length >= 2) {
        // Tab 1: All Reports Click
        navLinks[0].addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            navLinks[0].classList.add('active');

            if (sectionItems) sectionItems.classList.remove('d-none');
            if (sectionUsers) sectionUsers.classList.add('d-none');
            if (sectionComments) sectionComments.classList.add('d-none');
            fetchAdminItems();
        });

        // Tab 2: Manage Users Click
        navLinks[1].addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            navLinks[1].classList.add('active');

            if (sectionItems) sectionItems.classList.add('d-none');
            if (sectionUsers) sectionUsers.classList.remove('d-none');
            if (sectionComments) sectionComments.classList.add('d-none');
            loadAllUsers();
        });
    }
}

// 🚀 Action Methods (Resolve & Delete)
async function triggerResolveProcess(itemId) {
    const result = await Swal.fire({
        title: 'Mark as Resolved?',
        text: "This will status sync this item to Completed state!",
        icon: 'question',
        iconColor: '#00b4d8',
        background: '#1c2541',
        color: '#f8fafc',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#475569',
        confirmButtonText: 'Yes, Resolve!'
    });

    if (result.isConfirmed) {
        Swal.showLoading();
        try {
            const { data, error } = await supabase
                .from('lostor found table')
                .update({ status: 'Resolved' })
                .eq('id', itemId)
                .select();

            if (error) throw error;

            await Swal.fire({
                title: 'Success!',
                text: 'Item status updated to Resolved.',
                icon: 'success',
                background: '#1c2541',
                color: '#f8fafc',
                timer: 1500,
                showConfirmButton: false
            });
            fetchAdminItems();
        } catch (err) {
            Swal.fire({ title: 'Error', text: err.message, icon: 'error', background: '#1c2541', color: '#f8fafc' });
        }
    }
}

async function deleteItemReport(itemId) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This item will be permanently wiped from the database logs!",
        icon: 'warning',
        iconColor: '#ef4444',
        background: '#1c2541',
        color: '#f8fafc',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#475569',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            const { error } = await supabase.from('lostor found table').delete().eq('id', itemId);
            if (error) throw error;

            await Swal.fire({ title: 'Deleted!', text: 'Report has been expunged.', icon: 'success', background: '#1c2541', color: '#f8fafc', timer: 1500, showConfirmButton: false });
            const row = document.getElementById(`row-${itemId}`);
            if (row) row.remove();
        } catch (err) {
            Swal.fire({ title: 'Error', text: err.message, icon: 'error', background: '#1c2541', color: '#f8fafc' });
        }
    }
}

// Global Delete User Trigger Handler 
window.deleteUser = async function (userId) {
    const result = await Swal.fire({
        title: 'Delete User Account?',
        text: "This will permanently wipe this user out from auth storage!",
        icon: 'warning',
        iconColor: '#ef4444',
        background: '#1c2541',
        color: '#f8fafc',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Delete User'
    });

    if (result.isConfirmed) {
        try {
            const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
            
            if (error) {
                console.error("Auth error:", error);
                let errorMessage = error.message;
                if (error.message.includes("service_role")) {
                    errorMessage = "Admin permissions error. Please check your service role key.";
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: errorMessage,
                    background: '#1e293b',
                    color: '#fff'
                });
                return;
            }

            console.log("User deleted successfully:", data);
            Swal.fire({
                title: 'User Deleted', 
                icon: 'success',
                text: 'User aur unka saara data system se remove kar diya gaya hai.',
                background: '#1c2541', 
                color: '#f8fafc', 
                timer: 1200, 
                showConfirmButton: false
            });
            
            loadAllUsers();
        } catch (err) {
            Swal.fire({ title: 'Failed to Delete', text: err.message, icon: 'error', background: '#1c2541', color: '#f8fafc' });
        }
    }
}

// 🚪 Admin Logout Handler
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}