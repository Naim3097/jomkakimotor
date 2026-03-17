/**
 * JOMKAKI WhatsApp Commerce Module
 * Converts standard e-commerce checkout flow into WhatsApp-based purchasing.
 * Each product gets a unique SKU-encoded message for tracking.
 */

(function () {
  'use strict';

  // ========== CONFIGURATION ==========
  const WHATSAPP_NUMBER = '60123456789'; // Malaysia format, no + or dashes
  const BRAND_NAME = document.querySelector('meta[name="brand"]')?.content || 'JOMKAKI';

  // ========== HELPERS ==========
  function generateSKU(productName, price) {
    // Create a short deterministic SKU from product name + price
    var slug = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    var priceTag = price.replace(/[^0-9.]/g, '').split('.')[0];
    return BRAND_NAME.replace(/\s/g, '').substring(0, 3).toUpperCase() + '-' + slug + '-' + priceTag;
  }

  function buildWhatsAppURL(message) {
    var encoded = encodeURIComponent(message);
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encoded;
  }

  function getProductPageURL() {
    return window.location.href;
  }

  // ========== PRODUCT DETAIL PAGE ==========
  function initProductDetailPage() {
    var productTitle = document.querySelector('.product-info h1');
    var productPrice = document.querySelector('.product-price');
    var skuElement = document.querySelector('.meta-row strong');
    var addToCartBtn = document.querySelector('.btn-add-cart');
    var buyNowBtn = document.querySelector('.btn-buy-now');
    var qtyInput = document.querySelector('.qty-input');

    if (!productTitle || !buyNowBtn) return;

    var name = productTitle.textContent.trim();
    var price = productPrice ? productPrice.textContent.trim() : 'N/A';
    var sku = generateSKU(name, price);

    // Update SKU display
    var skuRows = document.querySelectorAll('.meta-row');
    for (var i = 0; i < skuRows.length; i++) {
      if (skuRows[i].textContent.indexOf('SKU') !== -1) {
        skuRows[i].innerHTML = '<strong>SKU:</strong> ' + sku;
      }
    }

    // Get selected variant
    function getSelectedVariant() {
      var activeColor = document.querySelector('.color-opt.active .color-fill');
      return activeColor ? activeColor.textContent.trim() : '';
    }

    function getQuantity() {
      return qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
    }

    // Transform "Buy Now" → WhatsApp direct purchase
    buyNowBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Buy via WhatsApp';
    buyNowBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var qty = getQuantity();
      var variant = getSelectedVariant();
      var msg = '🛒 *JOMKAKI ORDER REQUEST*\n\n';
      msg += '📦 Product: *' + name + '*\n';
      msg += '🔖 SKU: ' + sku + '\n';
      msg += '💰 Price: ' + price + '\n';
      msg += '📊 Quantity: ' + qty + '\n';
      if (variant) msg += '🎨 Variant: ' + variant + '\n';
      msg += '🔗 Link: ' + getProductPageURL() + '\n';
      msg += '\nHi, I would like to purchase this item. Please confirm availability and total.';
      window.open(buildWhatsAppURL(msg), '_blank');
    });

    // Transform "Add to Cart" to store in localStorage cart
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var qty = getQuantity();
        var variant = getSelectedVariant();
        var imgEl = document.querySelector('.gallery-main img');
        var imgSrc = imgEl ? imgEl.getAttribute('src') : '';

        var item = {
          name: name,
          sku: sku,
          price: price,
          priceNum: parseFloat(price.replace(/[^0-9.]/g, '')) || 0,
          quantity: qty,
          variant: variant,
          image: imgSrc,
          url: getProductPageURL()
        };

        addToCart(item);
        updateCartBadge();
        showCartNotification(name);
      });
    }
  }

  // ========== CART MANAGEMENT (localStorage) ==========
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('jomkaki_cart')) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('jomkaki_cart', JSON.stringify(cart));
  }

  function addToCart(item) {
    var cart = getCart();
    // Check if same SKU + variant exists
    var found = false;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].sku === item.sku && cart[i].variant === item.variant) {
        cart[i].quantity += item.quantity;
        found = true;
        break;
      }
    }
    if (!found) cart.push(item);
    saveCart(cart);
  }

  function removeFromCart(index) {
    var cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
  }

  function updateCartItemQty(index, qty) {
    var cart = getCart();
    if (cart[index]) {
      cart[index].quantity = Math.max(1, qty);
      saveCart(cart);
    }
  }

  function clearCart() {
    localStorage.removeItem('jomkaki_cart');
  }

  function getCartTotal() {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      total += cart[i].priceNum * cart[i].quantity;
    }
    return total;
  }

  // ========== CART BADGE ==========
  function updateCartBadge() {
    var cart = getCart();
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
      count += cart[i].quantity;
    }
    var badges = document.querySelectorAll('.shopping-bag ~ span, .fa-shopping-bag');
    // Find the cart count badge
    var bagLinks = document.querySelectorAll('a[href*="cart"]');
    for (var j = 0; j < bagLinks.length; j++) {
      var badge = bagLinks[j].querySelector('span');
      if (badge) {
        badge.textContent = count;
      }
    }
  }

  // ========== NOTIFICATION ==========
  function showCartNotification(productName) {
    var notif = document.createElement('div');
    notif.className = 'wa-cart-notification';
    notif.innerHTML = '<i class="fas fa-check-circle"></i> <strong>' + productName + '</strong> added to cart!';
    document.body.appendChild(notif);
    setTimeout(function () { notif.classList.add('show'); }, 10);
    setTimeout(function () {
      notif.classList.remove('show');
      setTimeout(function () { notif.remove(); }, 300);
    }, 2500);
  }

  // ========== CART PAGE ==========
  function initCartPage() {
    var cartWrapper = document.querySelector('.cart-wrapper');
    if (!cartWrapper) return;

    function renderCart() {
      var cart = getCart();
      var total = 0;

      var html = '<table class="cart-table"><thead><tr>' +
        '<th style="width:100px;">Image</th><th>Product</th>' +
        '<th>SKU</th><th>Price</th><th>Qty</th><th>Total</th><th>Remove</th>' +
        '</tr></thead><tbody>';

      if (cart.length === 0) {
        html += '<tr><td colspan="7" style="text-align:center;padding:40px;">' +
          '<i class="fas fa-shopping-cart" style="font-size:3rem;color:#ddd;display:block;margin-bottom:15px;"></i>' +
          'Your cart is empty. <a href="shop.html" style="color:var(--primary-color);font-weight:600;">Continue Shopping</a></td></tr>';
      }

      for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        var lineTotal = item.priceNum * item.quantity;
        total += lineTotal;

        html += '<tr data-index="' + i + '">';
        html += '<td><div style="width:80px;height:80px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;border-radius:4px;">';
        if (item.image) {
          html += '<img src="' + item.image.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + '" style="max-height:70px;max-width:70px;">';
        } else {
          html += '<i class="fas fa-box" style="font-size:1.5rem;color:#ccc;"></i>';
        }
        html += '</div></td>';
        html += '<td><strong>' + escapeHtml(item.name) + '</strong>';
        if (item.variant) html += '<br><small style="color:#888;">Variant: ' + escapeHtml(item.variant) + '</small>';
        html += '</td>';
        html += '<td><code style="font-size:0.8rem;background:#f0f0f0;padding:2px 6px;border-radius:3px;">' + escapeHtml(item.sku) + '</code></td>';
        html += '<td>' + item.price + '</td>';
        html += '<td><div style="display:flex;border:1px solid #ddd;width:100px;border-radius:4px;">' +
          '<button class="cart-qty-btn" data-action="minus" data-index="' + i + '" style="border:none;background:transparent;padding:5px 10px;cursor:pointer;">-</button>' +
          '<input type="text" value="' + item.quantity + '" class="cart-qty-input" data-index="' + i + '" style="width:40px;text-align:center;border:none;border-left:1px solid #ddd;border-right:1px solid #ddd;">' +
          '<button class="cart-qty-btn" data-action="plus" data-index="' + i + '" style="border:none;background:transparent;padding:5px 10px;cursor:pointer;">+</button>' +
          '</div></td>';
        html += '<td>$' + lineTotal.toFixed(2) + '</td>';
        html += '<td><a href="#" class="cart-remove-btn" data-index="' + i + '" style="color:red;"><i class="fas fa-times"></i></a></td>';
        html += '</tr>';
      }

      html += '</tbody></table>';

      // Bottom section
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:30px;flex-wrap:wrap;gap:20px;">';

      // Left side - continue shopping
      html += '<div style="display:flex;gap:10px;align-items:center;">';
      html += '<a href="shop.html" class="btn btn-primary" style="padding:10px 20px;"><i class="fas fa-arrow-left"></i> Continue Shopping</a>';
      if (cart.length > 0) {
        html += '<button class="btn-clear-cart" style="padding:10px 20px;border:1px solid #ddd;background:transparent;cursor:pointer;border-radius:4px;font-family:Poppins,sans-serif;"><i class="fas fa-trash"></i> Clear Cart</button>';
      }
      html += '</div>';

      // Right side - totals & WhatsApp checkout
      html += '<div style="width:350px;max-width:100%;padding:25px;background:#f9f9f9;border:1px solid #eee;border-radius:8px;">';
      html += '<h4 style="margin-bottom:20px;border-bottom:1px solid #ddd;padding-bottom:10px;">Cart Summary</h4>';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Items</span><span>' + cart.length + '</span></div>';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Subtotal</span><span>$' + total.toFixed(2) + '</span></div>';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:20px;border-top:1px solid #ddd;padding-top:10px;">';
      html += '<span style="font-weight:700;">Total</span><strong style="color:var(--primary-color);font-size:1.3rem;">$' + total.toFixed(2) + '</strong></div>';

      if (cart.length > 0) {
        html += '<button class="btn-whatsapp-checkout" style="width:100%;padding:15px;background:#25D366;color:#fff;border:none;border-radius:6px;font-size:1rem;font-weight:700;cursor:pointer;font-family:Poppins,sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;transition:background 0.3s;">';
        html += '<i class="fab fa-whatsapp" style="font-size:1.3rem;"></i> Checkout via WhatsApp</button>';
        html += '<p style="text-align:center;font-size:0.75rem;color:#888;margin-top:10px;">You\'ll be redirected to WhatsApp with your order details</p>';
      }

      html += '</div></div>';

      cartWrapper.innerHTML = html;
      bindCartEvents();
    }

    function bindCartEvents() {
      // Quantity buttons
      var qtyBtns = cartWrapper.querySelectorAll('.cart-qty-btn');
      for (var i = 0; i < qtyBtns.length; i++) {
        qtyBtns[i].addEventListener('click', function () {
          var idx = parseInt(this.getAttribute('data-index'), 10);
          var cart = getCart();
          if (this.getAttribute('data-action') === 'plus') {
            updateCartItemQty(idx, cart[idx].quantity + 1);
          } else {
            if (cart[idx].quantity > 1) {
              updateCartItemQty(idx, cart[idx].quantity - 1);
            }
          }
          renderCart();
          updateCartBadge();
        });
      }

      // Quantity input direct change
      var qtyInputs = cartWrapper.querySelectorAll('.cart-qty-input');
      for (var j = 0; j < qtyInputs.length; j++) {
        qtyInputs[j].addEventListener('change', function () {
          var idx = parseInt(this.getAttribute('data-index'), 10);
          var val = parseInt(this.value, 10);
          if (val > 0) {
            updateCartItemQty(idx, val);
            renderCart();
            updateCartBadge();
          }
        });
      }

      // Remove buttons
      var removeBtns = cartWrapper.querySelectorAll('.cart-remove-btn');
      for (var k = 0; k < removeBtns.length; k++) {
        removeBtns[k].addEventListener('click', function (e) {
          e.preventDefault();
          var idx = parseInt(this.getAttribute('data-index'), 10);
          removeFromCart(idx);
          renderCart();
          updateCartBadge();
        });
      }

      // Clear cart
      var clearBtn = cartWrapper.querySelector('.btn-clear-cart');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          clearCart();
          renderCart();
          updateCartBadge();
        });
      }

      // WhatsApp checkout
      var waBtn = cartWrapper.querySelector('.btn-whatsapp-checkout');
      if (waBtn) {
        waBtn.addEventListener('click', function () {
          var cart = getCart();
          var total = getCartTotal();
          var msg = '🛒 *JOMKAKI ORDER — ' + BRAND_NAME + '*\n';
          msg += '━━━━━━━━━━━━━━━━━━\n\n';

          for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            msg += '📦 *' + item.name + '*\n';
            msg += '   SKU: ' + item.sku + '\n';
            msg += '   Price: ' + item.price + ' × ' + item.quantity + '\n';
            if (item.variant) msg += '   Variant: ' + item.variant + '\n';
            msg += '   Subtotal: $' + (item.priceNum * item.quantity).toFixed(2) + '\n';
            if (item.url) msg += '   🔗 ' + item.url + '\n';
            msg += '\n';
          }

          msg += '━━━━━━━━━━━━━━━━━━\n';
          msg += '💰 *TOTAL: $' + total.toFixed(2) + '*\n\n';
          msg += 'Hi, I would like to order the above items. Please confirm availability, shipping details, and payment method. Thank you!';

          window.open(buildWhatsAppURL(msg), '_blank');
        });

        // Hover effect
        waBtn.addEventListener('mouseenter', function () { this.style.background = '#1fad54'; });
        waBtn.addEventListener('mouseleave', function () { this.style.background = '#25D366'; });
      }
    }

    renderCart();
  }

  // ========== SHOP / INDEX PAGE — PRODUCT CARDS ==========
  function initProductCards() {
    var productCards = document.querySelectorAll('.product-card');

    for (var i = 0; i < productCards.length; i++) {
      var card = productCards[i];

      // Skip if already processed
      if (card.getAttribute('data-wa-init')) continue;
      card.setAttribute('data-wa-init', '1');

      // Extract info
      var titleEl = card.querySelector('.product-title a') || card.querySelector('.product-title');
      var priceEl = card.querySelector('.new-price') || card.querySelector('.price');
      var categoryEl = card.querySelector('.category');
      var imgEl = card.querySelector('.product-img img');
      var productLink = titleEl && titleEl.tagName === 'A' ? titleEl.getAttribute('href') : '#';

      if (!titleEl) continue;

      var name = titleEl.textContent.trim();
      var price = priceEl ? priceEl.textContent.trim() : '';
      var category = categoryEl ? categoryEl.textContent.trim() : '';
      var sku = generateSKU(name, price);
      var imgSrc = imgEl ? imgEl.getAttribute('src') : '';

      // Create WhatsApp quick-buy button overlay
      var overlay = document.createElement('div');
      overlay.className = 'wa-product-overlay';
      overlay.innerHTML = '<a class="wa-quick-btn" title="Quick Enquiry via WhatsApp">' +
        '<i class="fab fa-whatsapp"></i></a>' +
        '<a class="wa-cart-btn" title="Add to Cart">' +
        '<i class="fas fa-shopping-cart"></i></a>';

      // Store product data on overlay buttons
      var quickBtn = overlay.querySelector('.wa-quick-btn');
      var cartBtn = overlay.querySelector('.wa-cart-btn');

      (function (n, p, s, c, img, link) {
        quickBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var msg = '💬 *JOMKAKI PRODUCT ENQUIRY*\n\n';
          msg += '📦 Product: *' + n + '*\n';
          msg += '🔖 SKU: ' + s + '\n';
          msg += '💰 Price: ' + p + '\n';
          if (c) msg += '📂 Category: ' + c + '\n';
          msg += '\nHi, I\'m interested in this product. Is it available?';
          window.open(buildWhatsAppURL(msg), '_blank');
        });

        cartBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var item = {
            name: n,
            sku: s,
            price: p,
            priceNum: parseFloat(p.replace(/[^0-9.]/g, '')) || 0,
            quantity: 1,
            variant: '',
            image: img,
            url: window.location.origin + '/' + link
          };
          addToCart(item);
          updateCartBadge();
          showCartNotification(n);
        });
      })(name, price, sku, category, imgSrc, productLink);

      // Insert overlay into product image container
      var imgContainer = card.querySelector('.product-img');
      if (imgContainer) {
        imgContainer.style.position = 'relative';
        imgContainer.appendChild(overlay);
      }
    }
  }

  // ========== FLOATING WHATSAPP BUTTON ==========
  function initFloatingWhatsApp() {
    var fab = document.createElement('a');
    fab.className = 'wa-floating-btn';
    fab.href = buildWhatsAppURL('Hi JOMKAKI! I need help with my shopping.');
    fab.target = '_blank';
    fab.rel = 'noopener';
    fab.innerHTML = '<i class="fab fa-whatsapp"></i>';
    fab.title = 'Chat with us on WhatsApp';
    document.body.appendChild(fab);
  }

  // ========== ESCAPE HTML ==========
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ========== INIT ==========
  function init() {
    updateCartBadge();
    initProductDetailPage();
    initCartPage();
    initProductCards();
    initFloatingWhatsApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
