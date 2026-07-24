import { supabase } from './supabase.js';

const postsContainer = document.getElementById('posts-container');
const postForm = document.getElementById('post-form');
const logoutBtn = document.getElementById('logout-btn');

// Global Variables
let allPosts = [];
let currentFilter = 'all';

// --- 1. User Profile Setup ---
async function displayUserProfile() {
    const userAvatar = document.getElementById('user-avatar');
    const menuAvatar = document.getElementById('menu-avatar');
    const menuUserName = document.getElementById('menu-user-name');
    const menuUserEmail = document.getElementById('menu-user-email');

    if (!userAvatar) return;

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        console.error("User not logged in:", error);
        window.location.href = "index.html";
        return;
    }

    const fullName = user.user_metadata?.full_name || "User Connected";
    const email = user.email || "No Email Provided";
    const firstLetter = fullName.charAt(0).toUpperCase();

    userAvatar.textContent = firstLetter;
    if (menuAvatar) menuAvatar.textContent = firstLetter;
    if (menuUserName) menuUserName.textContent = fullName;
    if (menuUserEmail) menuUserEmail.textContent = email;

    userAvatar.style.setProperty('display', 'flex', 'important');
}

// Page load listener
document.addEventListener('DOMContentLoaded', () => {
    displayUserProfile();
    if (postsContainer) fetchPosts();

    // Tab Buttons Click Listeners
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => {
                b.classList.remove('active-tab', 'text-white');
                b.classList.add('text-secondary');
            });

            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active-tab', 'text-white');
            targetBtn.classList.remove('text-secondary');

            currentFilter = targetBtn.getAttribute('data-filter');
            filterPosts();
        });
    });
});

// --- 2. Fetch All Posts ---
async function fetchPosts() {
    if (!postsContainer) return;

    postsContainer.innerHTML = `
        <div class="d-flex justify-content-center w-100 my-5">
            <div class="spinner-border text-info" role="status"></div>
        </div>`;

    const { data: posts, error } = await supabase
        .from('lostor found table')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch Error:", error.message);
        postsContainer.innerHTML = `<h5 class="text-danger text-center w-100">Error loading items: ${error.message}</h5>`;
        return;
    }

    // Database posts ko global array mein save karein
    allPosts = posts || [];

    // Filter and Render
    filterPosts();
}

// --- 3. Render Posts to UI ---
function renderPosts(postsToRender) {
    if (!postsContainer) return;

    if (!postsToRender || postsToRender.length === 0) {
        postsContainer.innerHTML = `
            <div class="col-12 text-center py-5 text-muted w-100">
                <i class="fa-solid fa-box-open fs-1 mb-2"></i>
                <h5>No matching items reported yet.</h5>
            </div>`;
        return;
    }

    postsContainer.innerHTML = postsToRender.map(post => {
        const itemImg = post.image_url || post['image-url'] || 'https://placehold.co/600x400/1e293b/f8fafc?text=No+Image';
        const postAuthor = post.user_name || "Community Member";

        // Dynamic Badge Logic
        let badgeHTML = '';
        const statusLower = (post.status || '').toLowerCase();
        const typeLower = (post.item_type || '').toLowerCase();

        if (statusLower === 'resolved') {
            const typeLabel = typeLower === 'lost' ? 'LOST' : 'FOUND';
            badgeHTML = `<span class="badge text-white px-3 py-2" style="background-color: #0f172a; border: 1px solid #334155; border-radius: 20px; font-weight: 600;">
                <i class="fa-solid fa-check text-success me-1"></i> RESOLVED (${typeLabel})
            </span>`;
        } else if (typeLower === 'lost' || statusLower === 'lost') {
            badgeHTML = `<span class="badge bg-danger px-3 py-2" style="border-radius: 20px; font-weight: 600;">
                LOST
            </span>`;
        } else {
            badgeHTML = `<span class="badge px-3 py-2 text-white" style="background-color: #064e3b; border-radius: 20px; font-weight: 600;">
                FOUND
            </span>`;
        }
        const postTime = post.created_at
            ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Recently';
        return `
            <div class="col">
                <div class="card card-custom h-100 text-white" style="background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden;">
                    
                    <!-- Image Box -->
         <div class="card-img-box w-100">
    <img src="${itemImg}" 
         class="card-img-top" 
         alt="${post.item_name || 'Item'}">
</div>

                    <div class="card-body d-flex flex-column p-3">
                        
                        <!-- Dynamic Badge -->
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            ${badgeHTML} 
                            <small class="text-secondary ms-2 opacity-75" style="font-size: 0.75rem;">${postTime}</small>
                        </div>
                       

                        <!-- Title & Description -->
                        <h5 class="card-title text-info fw-bold mb-2 text-truncate">${post.item_name || 'Untitled Item'}</h5>
                        <p class="card-text text-secondary small flex-grow-1 mb-3">${post.description || 'No description provided.'}</p>

                        <!-- Bottom Footer (Reporter Name) -->
                        <div class="pt-2 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                            <small class="text-secondary fw-semibold" style="font-size: 0.8rem;">
                                <i class="fa-regular fa-user me-1 text-info"></i> Reported by
                            </small>
                            <small class="text-white fw-bold text-truncate" style="font-size: 0.82rem; max-width: 130px;">
                                ${postAuthor}
                            </small>
                        </div>

                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- 4.Filter Logic ---
function filterPosts() {
    const filtered = allPosts.filter(post => {
        const postStatus = (post.status || '').toLowerCase();
        const postType = (post.item_type || '').toLowerCase();

        if (currentFilter === 'lost') {
            // Unresolved Lost Items
            return (postType === 'lost' || postStatus === 'lost') && postStatus !== 'resolved';
        } else if (currentFilter === 'found') {
            // Unresolved Found Items
            return (postType === 'found' || postStatus === 'found') && postStatus !== 'resolved';
        } else if (currentFilter === 'resolved') {
            // Only Resolved Items
            return postStatus === 'resolved';
        }

        return true; // For 'all' items
    });

    renderPosts(filtered);
}

// --- 5. Image Preview Setup ---
const itemImage = document.getElementById('item-image');
const fileNameDisplay = document.getElementById('file-name-display');
const imagePreview = document.getElementById('image-preview');

if (itemImage) {
    itemImage.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const file = this.files[0];

            if (fileNameDisplay) {
                fileNameDisplay.textContent = file.name;
                fileNameDisplay.classList.remove('text-secondary');
                fileNameDisplay.classList.add('text-info', 'fw-semibold');
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                if (imagePreview) {
                    imagePreview.src = e.target.result;
                    imagePreview.classList.remove('d-none');
                }
            }
            reader.readAsDataURL(file);
        } else {
            resetUploadZone();
        }
    });
}

function resetUploadZone() {
    if (fileNameDisplay) {
        fileNameDisplay.textContent = "No photo attached";
        fileNameDisplay.classList.remove('text-info', 'fw-semibold');
        fileNameDisplay.classList.add('text-secondary');
    }
    if (imagePreview) {
        imagePreview.src = '';
        imagePreview.classList.add('d-none');
    }
}

// --- 6. Post Submission Handling ---
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-post-btn') || postForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : "Broadcast Report";

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Processing...`;
        }

        const itemName = document.getElementById('item-name').value;
        const itemDesc = document.getElementById('item-desc').value;
        const imageFile = document.getElementById('item-image').files[0];

        const checkedStatusInput = document.querySelector('input[name="item-status-toggle"]:checked');
        const itemStatus = checkedStatusInput ? checkedStatusInput.value : 'Lost';

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication identity not found. Please log in again.");

            let publicUrl = '';

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('item-images')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('item-images')
                    .getPublicUrl(fileName);

                publicUrl = data.publicUrl;
            }

            const fullName = user.user_metadata?.full_name || user.email.split('@')[0] || "Anonymous";

            const insertPayload = {
                user_id: user.id,
                user_name: fullName,
                item_name: itemName,
                status: itemStatus,                   // Initial status ('Lost' or 'Found')
                item_type: itemStatus.toLowerCase(), // Store type ('lost' or 'found')
                description: itemDesc,
                'image-url': publicUrl                 // Fixed key name to match database column 'image_url'
            };

            const { error: dbError } = await supabase
                .from('lostor found table')
                .insert([insertPayload]);

            if (dbError) throw dbError;

            Swal.fire({
                title: 'Success!',
                text: 'Item report synchronized successfully.',
                icon: 'success',
                confirmButtonColor: '#0dcaf0'
            });

            postForm.reset();
            resetUploadZone();

            fetchPosts();

        } catch (err) {
            console.error("Submit error:", err);
            Swal.fire('Reporting Error', err.message, 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    });
}

// --- 7. Logout Functionality ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Swal.fire('Logout Failed', error.message, 'error');
        } else {
            Swal.fire({
                title: 'Logged Out',
                text: 'Redirecting to access gateway...',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    });
}

window.fetchPosts = fetchPosts;