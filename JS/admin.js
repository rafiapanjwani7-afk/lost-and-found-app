import { supabase } from './supabase.js';

// Elements safely loaded
const adminTableBody = document.getElementById('admin-table-body');
const logoutBtn = document.getElementById('logout-btn');

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

    // Map through posts safely (Duplication removed)
    adminTableBody.innerHTML = posts.map(post => {
        const itemImg = post.image_url || post['image-url'] || post.imageUrl || 'https://placehold.co/100x100/1e293b/f8fafc?text=No+Image';

        // Loose comparison taake 'Resolved', 'resolved', 'RESOLVED' sab handle ho sakein
        const currentStatus = post.status ? post.status.trim() : 'Lost';
        const isResolved = currentStatus.toLowerCase() === 'resolved';

        // Dynamic Badge Styling
        let badgeClass = 'bg-danger';
        if (currentStatus.toLowerCase() === 'found') badgeClass = 'bg-success';
        if (isResolved) badgeClass = 'bg-info text-dark';

        // Action UI Switch
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
                    <span class="font-monospace small text-muted">${post.user_id ? post.user_id.substring(0, 8) + '...' : 'System'}</span>
                </td>
                <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center gap-3">
                        <div id="action-container-${post.id}">
                            ${actionElement}
                        </div>
                        <button class="btn delete-post-btn d-flex align-items-center justify-content-center" 
        data-id="${post.id}" 
        style="width: 36px; height: 36px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; transition: all 0.25s ease;"
        onmouseenter="this.style.backgroundColor='#ef4444'; this.style.color='#ffffff'; this.style.boxShadow='0 0 12px rgba(239, 68, 68, 0.4)';"
        onmouseleave="this.style.backgroundColor='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444'; this.style.boxShadow='none';">
    <i class="fa-solid fa-trash-can" style="font-size: 0.85rem;"></i>
</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    // Re-attach Delete Event Listeners
    document.querySelectorAll('.delete-post-btn').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            deleteItemReport(id);
        });
    });

    // Re-attach Resolve Event Listeners
    document.querySelectorAll('.resolve-action-btn').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            triggerResolveProcess(id);
        });
    });
}

// 🚀 Action Process Execution Function
async function triggerResolveProcess(itemId) {
    const result = await Swal.fire({
        title: 'Mark as Resolved?',
        text: "This will status sync this item to Completed state!",
        icon: 'question',
        iconColor: '#00b4d8', // Cyan/Blue matching icon
        background: '#1c2541', // Dark card background
        color: '#f8fafc', // White text
        showCancelButton: true,
        confirmButtonColor: '#059669', // Emerald Green Success
        cancelButtonColor: '#475569', // Slate Gray Cancel
        confirmButtonText: 'Yes, Resolve!',
        customClass: {
            popup: 'border border-secondary rounded-4'
        }
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

            if (!data || data.length === 0) {
                throw new Error("Database rejected the update. Check RLS Policies!");
            }

            await Swal.fire({
                title: 'Success!',
                text: 'Item status updated to Resolved.',
                icon: 'success',
                iconColor: '#10b981',
                background: '#1c2541',
                color: '#f8fafc',
                timer: 1500,
                showConfirmButton: false
            });
            
            fetchAdminItems();

        } catch (err) {
            Swal.fire({
                title: 'Permission Denied',
                text: err.message,
                icon: 'error',
                iconColor: '#ef4444',
                background: '#1c2541',
                color: '#f8fafc'
            });
        }
    }
}
async function deleteItemReport(itemId) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This item will be permanently wiped from the database logs!",
        icon: 'warning',
        iconColor: '#ef4444', // Red warning icon
        background: '#1c2541', // Dark card background
        color: '#f8fafc', // White text
        showCancelButton: true,
        confirmButtonColor: '#dc2626', // Solid Danger Red
        cancelButtonColor: '#475569', // Slate Gray
        confirmButtonText: 'Yes, delete it!',
        customClass: {
            popup: 'border border-secondary rounded-4'
        }
    });

    if (result.isConfirmed) {
        try {
            const { error } = await supabase
                .from('lostor found table')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            await Swal.fire({
                title: 'Deleted!',
                text: 'Report has been expunged successfully.',
                icon: 'success',
                iconColor: '#10b981',
                background: '#1c2541',
                color: '#f8fafc',
                timer: 1500,
                showConfirmButton: false
            });

            const row = document.getElementById(`row-${itemId}`);
            if (row) row.remove();

        } catch (err) {
            Swal.fire({
                title: 'Error',
                text: err.message,
                icon: 'error',
                iconColor: '#ef4444',
                background: '#1c2541',
                color: '#f8fafc'
            });
        }
    }
}

// 🚪 Admin Logout Handler
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        Swal.fire({
            title: 'Logged Out',
            text: 'Returning to main gateway...',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    });
}

// 🔒 Security Check
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = "index.html";
    } else {
        fetchAdminItems();
    }
}

document.addEventListener('DOMContentLoaded', checkAuth);