// Storefront JavaScript - Display products from S3

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
});

/**
 * Load products from S3 and display them
 */
async function loadProducts() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const containerEl = document.getElementById('products-container');
    const noProductsEl = document.getElementById('no-products');
    
    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        containerEl.innerHTML = '';
        noProductsEl.style.display = 'none';
        
        // Fetch products data from S3
        const products = await getProductsFromS3();
        
        loadingEl.style.display = 'none';
        
        if (!products || products.length === 0) {
            noProductsEl.style.display = 'block';
            return;
        }
        
        // Display each product
        products.forEach(product => {
            const productCard = createProductCard(product);
            containerEl.appendChild(productCard);
        });
        
    } catch (error) {
        console.error('Error loading products:', error);
        loadingEl.style.display = 'none';
        
        if (error.code === 'NoSuchKey') {
            // No products file exists yet
            noProductsEl.style.display = 'block';
        } else {
            errorEl.textContent = 'Error loading products: ' + error.message;
            errorEl.style.display = 'block';
        }
    }
}

/**
 * Fetch products from S3
 */
async function getProductsFromS3() {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: config.bucketName,
            Key: config.productsFileName
        };
        
        s3.getObject(params, function(err, data) {
            if (err) {
                if (err.code === 'NoSuchKey') {
                    // File doesn't exist yet, return empty array
                    resolve([]);
                } else {
                    reject(err);
                }
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
 * Create a product card element
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Determine stock status
    let quantityClass = '';
    let quantityText = `In Stock: ${product.quantity}`;
    
    if (product.quantity === 0) {
        quantityClass = 'out-of-stock';
        quantityText = 'Out of Stock';
    } else if (product.quantity < 10) {
        quantityClass = 'low-stock';
        quantityText = `Only ${product.quantity} left!`;
    }
    
    card.innerHTML = `
        <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" class="product-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
        <div class="product-info">
            <h3 class="product-name">${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(product.description)}</p>
            <div class="product-details">
                <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
                <span class="product-quantity ${quantityClass}">${quantityText}</span>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
