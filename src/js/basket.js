/**
 * Fennec FC Basket System
 * Standalone version for easy integration into any project
 * Handles all functionality related to the shopping basket:
 * - Managing items in localStorage
 * - Adding items to basket
 * - Rendering basket items 
 * - Handling item removal
 * - Updating totals
 * - Checkout process
 * - Toast notifications
 */

// Constants
const STORAGE_KEY = 'fennecBasket';

// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the basket display
    if (document.getElementById('basket-items-container')) {
        // We're on the basket page
        initializeBasketPage();
    } else if (document.getElementById('basket')) {
        // We're on the merchandise page with mini-basket
        renderMiniBasket();
    }

    // Add event listener to checkout button if it exists
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout);
    }
});

/**
 * Initialize the full basket page
 */
function initializeBasketPage() {
    // Get basket items from localStorage
    const basketItems = getBasketFromStorage();
    
    // Render the basket items
    renderBasketItems(basketItems);
    
    // Update the total amount
    updateTotalAmount(basketItems);
}

/**
 * Render the mini basket on merchandise page
 */
function renderMiniBasket() {
    const basketItems = getBasketFromStorage();
    const basketDiv = document.getElementById('basket');
    
    if (basketItems.length === 0) {
        basketDiv.innerHTML = '<p>Your basket is empty.</p>';
        return;
    }

    let basketHTML = '<ul class="basket-list">';
    let total = 0;

    basketItems.forEach((item) => {
        basketHTML += `<li class="basket-item">${item.product} - $${item.price.toFixed(2)}</li>`;
        total += item.price;
    });

    basketHTML += `</ul><p class="basket-total"><strong>Total:</strong> $${total.toFixed(2)}</p>`;
    basketDiv.innerHTML = basketHTML;
}

/**
 * Get basket items from localStorage
 * @returns {Array} Array of basket items
 */
function getBasketFromStorage() {
    const basketData = localStorage.getItem(STORAGE_KEY);
    return basketData ? JSON.parse(basketData) : [];
}

/**
 * Save basket items to localStorage
 * @param {Array} basket - Array of basket items
 */
function saveBasketToStorage(basket) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
}

/**
 * Add a product to the basket
 * @param {String} product - Product name
 * @param {Number} price - Product price
 * @param {String} image - Product image URL
 */
function addToBasket(product, price, image) {
    // Determine the correct image path based on product name
    let imagePath = '../../data/images/fennec-shirt.jpg';
    if (product.toLowerCase().includes('scarf')) {
        imagePath = '../../data/images/fennec-scarf.jpg';
    } else if (product.toLowerCase().includes('cap')) {
        imagePath = '../../data/images/fennec-cap.jpg';
    }
    
    // Get current basket
    const basket = getBasketFromStorage();
    
    // Add item to basket array with local image path
    basket.push({ 
        product, 
        price, 
        image: imagePath 
    });
    
    // Save to localStorage
    saveBasketToStorage(basket);
    
    // Update mini-basket if on merchandise page
    if (document.getElementById('basket')) {
        renderMiniBasket();
    }
    
    // Show notification
    showToast(`${product} has been added to your basket!`, 'success');
}

/**
 * Render basket items on the basket page
 * @param {Array} items - Array of basket items
 */
function renderBasketItems(items) {
    const container = document.getElementById('basket-items-container');
    
    if (!container) return;
    
    // Clear current content
    container.innerHTML = '';
    
    // If basket is empty, show message
    if (items.length === 0) {
        container.innerHTML = '<p class="empty-basket-message">Your basket is empty.</p>';
        return;
    }
    
    // Create and append each item
    items.forEach((item, index) => {
        const itemElement = createBasketItemElement(item, index);
        container.appendChild(itemElement);
    });
}

/**
 * Create HTML element for a basket item
 * @param {Object} item - Basket item object
 * @param {Number} index - Index of the item in the basket array
 * @returns {HTMLElement} The basket item element
 */
function createBasketItemElement(item, index) {
    // Create main container
    const itemElement = document.createElement('div');
    itemElement.className = 'basket-item';
    itemElement.dataset.index = index;
    
    // Create item details container
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'item-details';
    
    // Create image element
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.product;
    image.className = 'item-image';
    detailsContainer.appendChild(image);
    
    // Create info container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'item-info';
    
    // Create product name element
    const nameElement = document.createElement('h3');
    nameElement.className = 'item-name';
    nameElement.textContent = item.product;
    infoContainer.appendChild(nameElement);
    
    // Create price element
    const priceElement = document.createElement('p');
    priceElement.className = 'item-price';
    priceElement.textContent = `$${item.price.toFixed(2)}`;
    infoContainer.appendChild(priceElement);
    
    // Add info container to details container
    detailsContainer.appendChild(infoContainer);
    
    // Add details container to main item element
    itemElement.appendChild(detailsContainer);
    
    // Create remove button
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-btn';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => removeBasketItem(index));
    
    // Add remove button to main item element
    itemElement.appendChild(removeButton);
    
    return itemElement;
}

/**
 * Remove an item from the basket
 * @param {Number} index - Index of the item to remove
 */
function removeBasketItem(index) {
    // Get current basket
    const basket = getBasketFromStorage();
    
    // Find the item element in the DOM
    const itemElement = document.querySelector(`.basket-item[data-index="${index}"]`);
    
    // Store the removed item for toast notification
    const removedItem = basket[index].product;
    
    // Add removing class for fade out animation
    itemElement.classList.add('removing');
    
    // Wait for animation to complete
    setTimeout(() => {
        // Remove item from basket array
        basket.splice(index, 1);
        
        // Save updated basket to localStorage
        saveBasketToStorage(basket);
        
        // Re-render basket items
        renderBasketItems(basket);
        
        // Update total amount
        updateTotalAmount(basket);
        
        // Show toast notification
        showToast(`${removedItem} has been removed from your basket.`, 'success');
    }, 300);
}

/**
 * Update the total amount displayed
 * @param {Array} items - Array of basket items
 */
function updateTotalAmount(items) {
    const totalElement = document.getElementById('basket-total-amount');
    if (!totalElement) return;
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price, 0);
    
    // Update total element
    totalElement.textContent = `$${total.toFixed(2)}`;
    
    // Update checkout button based on basket status
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.disabled = items.length === 0;
        checkoutButton.style.opacity = items.length === 0 ? '0.5' : '1';
    }
}

/**
 * Handle checkout button click
 */
function handleCheckout() {
    const basket = getBasketFromStorage();
    
    if (basket.length === 0) {
        showToast('Your basket is empty. Please add items before checking out.', 'error');
        return;
    }
    
    // Here you would normally redirect to a payment page
    // For now, just show a success message and clear the basket
    showToast('Thank you for your purchase! Your order has been processed.', 'success');
    
    // Clear the basket
    localStorage.removeItem(STORAGE_KEY);
    
    // Redirect to merchandise page after a brief delay
    setTimeout(() => {
        window.location.href = 'merchandise.html';
    }, 3000);
}

/**
 * Navigate to basket page
 */
function checkout() {
    const basket = getBasketFromStorage();
    
    if (basket.length === 0) {
        showToast('Your basket is empty!', 'error');
        return;
    }
    
    // Redirect to basket page
    window.location.href = 'basket.html';
}

/**
 * Show a toast notification
 * @param {String} message - Message to display
 * @param {String} type - Type of toast (success, error, info)
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Remove toast after animation completes (3 seconds)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}