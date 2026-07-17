import { supabase } from './app.js';

const postsContainer = document.getElementById('posts-container');
const postForm = document.getElementById('post-form');

// 1. Fetch and Display All Posts
async function fetchPosts() {
    postsContainer.innerHTML = `<div class="spinner-border text-info mx-auto" role="status"></div>`;
    
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`*, profiles(full_name, email)`)
        .order('created_at', { ascending: false });

    if (error) return console.log(error.message);

    postsContainer.innerHTML = '';
    if (posts.length === 0) {
        postsContainer.innerHTML = `<h5 class="text-muted text-center w-100">No items reported yet.</h5>`;
        return;
    }

    postsContainer.innerHTML = posts.map(post => `
        <div class="col">
            <div class="card h-100">
                <img src="${post.image_url}" class="card-img-top item-img" alt="${post.item_name}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge ${post.status === 'Lost' ? 'bg-danger' : 'bg-success'}">${post.status}</span>
                        <small class="text-muted"><i class="fa-regular fa-user me-1"></i>${post.profiles?.full_name || 'Anonymous'}</small>
                    </div>
                    <h5 class="card-title text-info">${post.item_name}</h5>
                    <p class="card-text text-light">${post.description}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// 2. Submit Post with Image Upload
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-post-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing...";

        const itemName = document.getElementById('item-name').value;
        const itemStatus = document.getElementById('item-status').value;
        const itemDesc = document.getElementById('item-desc').value;
        const imageFile = document.getElementById('item-image').files[0];

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // Image file name unique banayein
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `items/${fileName}`;

            // Image upload to Supabase Bucket
            const { error: uploadError } = await supabase.storage
                .from('item-images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            // Image ka public url get karein
            const { data: { publicUrl } } = supabase.storage
                .from('item-images')
                .getPublicUrl(filePath);

            // Database mein row insert karein
            const { error: dbError } = await supabase
                .from('posts')
                .insert([{
                    user_id: user.id,
                    item_name: itemName,
                    status: itemStatus,
                    description: itemDesc,
                    image_url: publicUrl
                }]);

            if (dbError) throw dbError;

            Swal.fire('Success!', 'Item reported successfully!', 'success');
            postForm.reset();
            bootstrap.Modal.getInstance(document.getElementById('postModal')).hide();
            fetchPosts();

        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Post";
        }
    });
}

// Load feed automatically on load
if (postsContainer) fetchPosts();