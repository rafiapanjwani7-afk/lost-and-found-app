import { supabase } from './supabase.js';

const feedContainer = document.getElementById('feed-container');
let allPosts = []; // Global array data store karne ke liye

// Fetch Data from Supabase
async function fetchFeedPosts() {
    if (!feedContainer) return;

    const { data: posts, error } = await supabase
        .from('lostor found table')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch Error:", error.message);
        feedContainer.innerHTML = `<h5 class="text-danger text-center w-100">Error loading items: ${error.message}</h5>`;
        return;
    }

    allPosts = posts || []; // Data ko save kiya
    renderCards(allPosts); // Cards screen par dikhaye
}

// Function to Render Cards on Screen
function renderCards(postsToRender) {
    feedContainer.innerHTML = '';
    
    if (postsToRender.length === 0) {
        feedContainer.innerHTML = `<h5 class="text-muted text-center w-100 my-5">No items found matching this criteria.</h5>`;
        return;
    }

    feedContainer.innerHTML = postsToRender.map(post => {
        const itemImg = post['image-url'] || 'https://placehold.co/600x400/1e293b/f8fafc?text=No+Image';
        const isLost = post.status && post.status.toLowerCase() === 'lost';
        const badgeClass = isLost ? 'bg-danger' : 'bg-success';

        return `
            <div class="col">
                <div class="card h-100 text-white" style="background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden;">
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

// Filter Event Listeners Setup
document.addEventListener('DOMContentLoaded', () => {
    fetchFeedPosts();

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Purani active class remove karein aur nayi add karein
            document.querySelector('.active-filter')?.classList.remove('active-filter', 'text-white');
            document.querySelector('[data-status].text-secondary')?.classList.add('text-secondary'); // fallback safely
            
            this.classList.add('active-filter', 'text-white');
            this.classList.remove('text-secondary');

            const selectedStatus = this.getAttribute('data-status');

            if (selectedStatus === 'all') {
                renderCards(allPosts);
            } else {
                // Filter mapping logic
                const filtered = allPosts.filter(post => post.status && post.status.toLowerCase() === selectedStatus);
                renderCards(filtered);
            }
        });
    });
});