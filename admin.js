import { supabase } from './app.js';

// Verify Admin Status first
async function checkAdminSecurity() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!data || data.role !== 'admin') {
            window.location.href = 'dashboard.html';
        }
    }
}
checkAdminSecurity();

const postsTable = document.getElementById('admin-posts-table');
const usersTable = document.getElementById('admin-users-table');

// 1. Fetch & Load Admin Posts Table
async function loadAdminPosts() {
    const { data: posts } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    postsTable.innerHTML = posts.map(post => `
        <tr>
            <td><img src="${post.image_url}" style="width: 50px; height: 50px; object-fit:cover; border-radius: 6px;"></td>
            <td class="fw-bold text-info">${post.item_name}</td>
            <td><span class="badge ${post.status === 'Lost' ? 'bg-danger' : 'bg-success'}">${post.status}</span></td>
            <td>${post.description}</td>
            <td>
                <button class="btn btn-sm btn-outline-warning me-1 edit-post-btn" data-id="${post.id}" data-name="${post.item_name}" data-status="${post.status}" data-desc="${post.description}">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-post-btn" data-id="${post.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    attachPostEventListeners();
}

// 2. Fetch & Load Admin Users Table
async function loadAdminUsers() {
    const { data: users } = await supabase.from('profiles').select('*');
    usersTable.innerHTML = users.map(user => `
        <tr>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${user.role}</span></td>
            <td>
                ${user.role !== 'admin' ? `
                    <button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${user.id}">
                        <i class="fa-solid fa-user-slash"></i> Remove
                    </button>
                ` : '<span class="text-muted">No Action</span>'}
            </td>
        </tr>
    `).join('');

    attachUserEventListeners();
}

// 3. Post Actions (Edit / Delete)
function attachPostEventListeners() {
    // Delete Post click action
    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "Delete this post from server?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Yes, Delete!'
            });

            if (result.isConfirmed) {
                await supabase.from('posts').delete().eq('id', id);
                Swal.fire('Deleted!', 'Post successfully removed.', 'success');
                loadAdminPosts();
            }
        });
    });

    // Edit Post Modal Setup
    document.querySelectorAll('.edit-post-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const data = e.currentTarget.dataset;
            document.getElementById('edit-post-id').value = data.id;
            document.getElementById('edit-item-name').value = data.name;
            document.getElementById('edit-item-status').value = data.status;
            document.getElementById('edit-item-desc').value = data.desc;
            
            const editModal = new bootstrap.Modal(document.getElementById('adminEditModal'));
            editModal.show();
        });
    });
}

// Edit Form submit action
document.getElementById('admin-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-post-id').value;
    const item_name = document.getElementById('edit-item-name').value;
    const status = document.getElementById('edit-item-status').value;
    const description = document.getElementById('edit-item-desc').value;

    const { error } = await supabase
        .from('posts')
        .update({ item_name, status, description })
        .eq('id', id);

    if (error) return Swal.fire('Error', error.message, 'error');

    Swal.fire('Updated!', 'Post updated successfully.', 'success');
    bootstrap.Modal.getInstance(document.getElementById('adminEditModal')).hide();
    loadAdminPosts();
});

// 4. User Actions (Delete)
function attachUserEventListeners() {
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            const result = await Swal.fire({
                title: 'Remove User?',
                text: "This will remove user profile access!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Remove'
            });

            if (result.isConfirmed) {
                await supabase.from('profiles').delete().eq('id', id);
                Swal.fire('Removed!', 'User deleted successfully.', 'success');
                loadAdminUsers();
            }
        });
    });
}

// Initial Loads
if (postsTable) loadAdminPosts();
if (usersTable) loadAdminUsers();