import { supabase } from './supabase.js';

const postsContainer = document.getElementById('posts-container');
const postForm = document.getElementById('post-form');
const logoutBtn = document.getElementById('logout-btn');

async function displayUserProfile() {
    const userAvatar = document.getElementById('user-avatar');
    const menuAvatar = document.getElementById('menu-avatar');
    const menuUserName = document.getElementById('menu-user-name');
    const menuUserEmail = document.getElementById('menu-user-email');

    if (!userAvatar) return;

    // Supabase se current logged-in user ki details lein
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        console.error("User not logged in:", error);
        window.location.href = "index.html"; // Agar logged in nahi hai toh wapas bhej dein
        return;
    }

    // Extraction logic
    const fullName = user.user_metadata?.full_name || "User Connected";
    const email = user.email || "No Email Provided";
    const firstLetter = fullName.charAt(0).toUpperCase();

    // Small Navbar Circle & Large Menu Circle text setting
    userAvatar.textContent = firstLetter;
    if (menuAvatar) menuAvatar.textContent = firstLetter;

    // Text Content management for Card
    if (menuUserName) menuUserName.textContent = fullName;
    if (menuUserEmail) menuUserEmail.textContent = email;
    
    // Navbar ke avatar circle ko properly show karein
    userAvatar.style.setProperty('display', 'flex', 'important');
}

// Page load listener link
document.addEventListener('DOMContentLoaded', displayUserProfile);

// 1. Fetch and Display All Posts
async function fetchPosts() {
    if (!postsContainer) return;
    postsContainer.innerHTML = `
        <div class="d-flex justify-content-center w-100 my-5">
            <div class="spinner-border text-info" role="status"></div>
        </div>`;
    
    // Fetching from 'lostor found table'
    const { data: posts, error } = await supabase
        .from('lostor found table')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch Error:", error.message);
        postsContainer.innerHTML = `<h5 class="text-danger text-center w-100">Error loading items: ${error.message}</h5>`;
        return;
    }

    postsContainer.innerHTML = '';
    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = `<h5 class="text-muted text-center w-100 my-5">No items reported yet.</h5>`;
        return;
    }

    postsContainer.innerHTML = posts.map(post => {
        // FIX: Match column name with 'image_url'
        const itemImg = post['image_url'] || post['image-url'] || 'https://placehold.co/600x400/1e293b/f8fafc?text=No+Image';
        
        // Status checks for styles
        const isLost = post.status && post.status.toLowerCase() === 'lost';
        const badgeClass = isLost ? 'bg-danger' : 'bg-success';

        return `
            <div class="col">
                <!-- Added 'card-custom' class here for hover styling backup if needed -->
                <div class="card card-custom h-100 text-white" style="background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;">
                    <div style="height: 220px; overflow: hidden; background-color: #0f172a;">
                        <img src="${itemImg}" class="w-100 h-100 card-img-top" alt="${post.item_name || 'Item'}" style="object-fit: cover;">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge ${badgeClass} px-3 py-2" style="border-radius: 20px; font-weight: 600;">${post.status}</span>
                            <small class="text-muted">
                                <i class="fa-regular fa-user me-1"></i> User Connected
                            </small>
                        </div>
                        <h5 class="card-title text-info fw-bold mb-2">${post.item_name || 'Untitled Item'}</h5>
                        <p class="card-text text-secondary small flex-grow-1">${post.description || 'No description provided.'}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 2. Premium Image Upload & Dynamic Preview Bar Logic
const itemImage = document.getElementById('item-image');
const fileNameDisplay = document.getElementById('file-name-display');
const imagePreview = document.getElementById('image-preview');

if (itemImage) {
    itemImage.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            
            // 1. File ka naam custom bar mein set karein
            if (fileNameDisplay) {
                fileNameDisplay.textContent = file.name;
                fileNameDisplay.classList.remove('text-secondary');
                fileNameDisplay.classList.add('text-info', 'fw-semibold');
            }
            
            // 2. Preview image load karein
            const reader = new FileReader();
            reader.onload = function(e) {
                if (imagePreview) {
                    imagePreview.src = e.target.result;
                    imagePreview.classList.remove('d-none'); // Image show kar dein
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

// Ensure preview is hidden initially
if (imagePreview) imagePreview.classList.add('d-none');

if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-post-btn');
        if (!submitBtn) return;
        
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Processing...`;

        const itemName = document.getElementById('item-name').value;
        const itemDesc = document.getElementById('item-desc').value;
        const imageFile = document.getElementById('item-image').files[0];

        // 🔥 FIX 1: Radio buttons se current checked value read karna (Lost/Found)
        const checkedStatusInput = document.querySelector('input[name="item-status-toggle"]:checked');
        const itemStatus = checkedStatusInput ? checkedStatusInput.value : 'Lost';

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication identity not found. Please log in again.");

            let publicUrl = '';

            if (imageFile) {
                // Image file name unique banayein aur extension alag karein
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = fileName; 

                // Image upload to Supabase Bucket
                const { error: uploadError } = await supabase.storage
                    .from('item-images')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                // Image ka public url get karein
                const { data } = supabase.storage
                    .from('item-images')
                    .getPublicUrl(filePath);
                
                publicUrl = data.publicUrl;
            }

            // Data key mapping with database structure
            // 🔥 FIX 2: mapping to exact 'image_url' column name on Supabase
            const insertPayload = {
                user_id: user.id,
                item_name: itemName,
                status: itemStatus,
                description: itemDesc,
                image_url: publicUrl 
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
            resetUploadZone(); // Reset dynamic file bar labels too
            
            // Safe Bootstrap Modal Hide Method
            const modalEl = document.getElementById('postModal');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                if (modalInstance) modalInstance.hide();
            }
            
            fetchPosts();

        } catch (err) {
            Swal.fire('Reporting Error', err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText || "Submit Post";
        }
    });
}

// 3. Logout Functionality integration
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

// Load feed automatically on load
if (postsContainer) fetchPosts();

// Global Window assignment
window.fetchPosts = fetchPosts;