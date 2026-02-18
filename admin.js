// Admin JavaScript - Manage products and upload to S3

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

/**
 * Initialize admin page
 */
function initializeAdmin() {
    const form = document.getElementById('product-form');
    const imageInput = document.getElementById('product-image');
    
    // Handle form submission
    form.addEventListener('submit', handleFormSubmit);
    
    // Handle image preview
    imageInput.addEventListener('change', handleImagePreview);
    
    // Load existing products
    loadAdminProducts();
}

/**
 * Handle image preview
 */
function handleImagePreview(event) {
    const file = event.target.files[0];
    const previewDiv = document.getElementById('image-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewDiv.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        previewDiv.innerHTML = '';
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const messageDiv = document.getElementById('form-message');
    const form = event.target;
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding Product...';
    
    try {
        // Get form data
        const name = document.getElementById('product-name').value.trim();
        const description = document.getElementById('product-description').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const quantity = parseInt(document.getElementById('product-quantity').value);
        const imageFile = document.getElementById('product-image').files[0];
        
        // Validate
        if (!name || !description || !imageFile) {
            throw new Error('Please fill in all required fields');
        }
        
        // Upload image to S3
        const imageUrl = await uploadImageToS3(imageFile);
        
        // Create product object
        const product = {
            id: Date.now().toString(), // Simple ID generation
            name: name,
            description: description,
            price: price,
            quantity: quantity,
            imageUrl: imageUrl,
            createdAt: new Date().toISOString()
        };
        
        // Add product to S3
        await addProductToS3(product);
        
        // Show success message
        messageDiv.className = 'form-message success';
        messageDiv.textContent = 'Product added successfully!';
        
        // Reset form
        form.reset();
        document.getElementById('image-preview').innerHTML = '';
        
        // Reload products list
        setTimeout(() => {
            loadAdminProducts();
            messageDiv.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        console.error('Error adding product:', error);
        messageDiv.className = 'form-message error';
        messageDiv.textContent = 'Error adding product: ' + error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Product';
    }
}

/**
 * Upload image to S3
 */
async function uploadImageToS3(file) {
    return new Promise((resolve, reject) => {
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${config.imagesFolderName}${timestamp}_${file.name}`;
        
        const params = {
            Bucket: config.bucketName,
            Key: filename,
            Body: file,
            ContentType: file.type,
            ACL: 'public-read' // Make image publicly accessible
        };
        
        s3.upload(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                // Return the public URL
                resolve(data.Location);
            }
        });
    });
}

/**
 * Add product to S3 products.json
 */
async function addProductToS3(newProduct) {
    // Get existing products
    let products = [];
    try {
        products = await getProductsFromS3();
    } catch (error) {
        if (error.code !== 'NoSuchKey') {
            throw error;
        }
        // If file doesn't exist, start with empty array
    }
    
    // Add new product
    products.push(newProduct);
    
    // Save back to S3
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: config.bucketName,
            Key: config.productsFileName,
            Body: JSON.stringify(products, null, 2),
            ContentType: 'application/json',
            ACL: 'public-read'
        };
        
        s3.putObject(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Get products from S3
 */
async function getProductsFromS3() {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: config.bucketName,
            Key: config.productsFileName
        };
        
        s3.getObject(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                try {
                    const products = JSON.parse(data.Body.toString('utf-8'));
                    resolve(products);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

/**
 * Load and display products in admin panel
 */
async function loadAdminProducts() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const listEl = document.getElementById('products-list');
    const noProductsEl = document.getElementById('no-products');
    
    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        listEl.innerHTML = '';
        noProductsEl.style.display = 'none';
        
        const products = await getProductsFromS3();
        
        loadingEl.style.display = 'none';
        
        if (!products || products.length === 0) {
            noProductsEl.style.display = 'block';
            return;
        }
        
        // Display each product
        products.forEach(product => {
            const productItem = createAdminProductItem(product);
            listEl.appendChild(productItem);
        });
        
    } catch (error) {
        console.error('Error loading products:', error);
        loadingEl.style.display = 'none';
        
        if (error.code === 'NoSuchKey') {
            noProductsEl.style.display = 'block';
        } else {
            errorEl.textContent = 'Error loading products: ' + error.message;
            errorEl.style.display = 'block';
        }
    }
}

/**
 * Create admin product item element
 */
function createAdminProductItem(product) {
    const item = document.createElement('div');
    item.className = 'admin-product-item';
    
    item.innerHTML = `
        <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" class="admin-product-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
        <div class="admin-product-info">
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description)}</p>
            <div class="admin-product-meta">
                <span>Price: $${parseFloat(product.price).toFixed(2)}</span>
                <span>Quantity: ${product.quantity}</span>
                <span>ID: ${escapeHtml(product.id)}</span>
            </div>
        </div>
        <div class="admin-product-actions">
            <button class="btn btn-danger delete-btn">Delete</button>
        </div>
    `;
    
    // Add event listener for delete button (safer than inline onclick)
    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        deleteProduct(product.id, product.name);
    });
    
    return item;
}

/**
 * Delete a product
 */
async function deleteProduct(productId, productName) {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
        return;
    }
    
    try {
        // Get existing products
        const products = await getProductsFromS3();
        
        // Filter out the product to delete
        const updatedProducts = products.filter(p => p.id !== productId);
        
        // Save back to S3
        await new Promise((resolve, reject) => {
            const params = {
                Bucket: config.bucketName,
                Key: config.productsFileName,
                Body: JSON.stringify(updatedProducts, null, 2),
                ContentType: 'application/json',
                ACL: 'public-read'
            };
            
            s3.putObject(params, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        
        // Reload products list
        loadAdminProducts();
        
        // Show success message
        const messageDiv = document.getElementById('form-message');
        messageDiv.className = 'form-message success';
        messageDiv.textContent = 'Product deleted successfully!';
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
