console.log('=== CART DRAWER DEBUG ===');
console.log('Cart type setting:', '{{ settings.cart_type }}');
console.log('Cart drawer element exists:', !!document.querySelector('cart-drawer'));
console.log('Cart notification element exists:', !!document.querySelector('cart-notification'));
console.log('Product forms found:', document.querySelectorAll('product-form').length);

// Log when cart drawer is initialized
if (customElements.get('cart-drawer')) {
  console.log(' CartDrawer custom element is defined');
} else {
  console.log(' CartDrawer custom element NOT defined');
}

// Check after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const cartDrawer = document.querySelector('cart-drawer');
  console.log('After DOM load - cart-drawer:', cartDrawer);
  if (cartDrawer) {
    console.log(' Cart drawer found in DOM');
    console.log('Cart drawer classes:', cartDrawer.className);
  } else {
    console.log(' Cart drawer NOT in DOM');
  }
});
