console.log("cart.js carregou na loja");

const CART_KEY = "survivalz_cart";
const COUPON_KEY = "survivalz_coupon";

function formatPrice(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function hasCoupon() {
  return localStorage.getItem(COUPON_KEY) === "BETA25";
}

function subtotal(cart) {
  return cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

function discount(value) {
  return hasCoupon() ? Math.round(value * 0.25) : 0;
}

function isRestrictedCategory(category) {
  return category === "beta";
}

function getCategoryLabel(category) {
  if (category === "beta") return "pacote Beta";
  return "produto";
}

function cartHasCategory(cart, category) {
  return cart.some((item) => item.category === category);
}

function createCartHTML() {
  const html = `
    <button class="cart-float" id="openCart">
      🛒 Carrinho <span id="cartCount">0</span>
    </button>

    <div class="cart-overlay" id="cartOverlay"></div>

    <aside class="cart-box" id="cartBox">
      <div class="cart-top">
        <div>
          <span class="section-tag">Loja Beta</span>
          <h2>Seu carrinho</h2>
        </div>

        <button id="closeCart" class="cart-close">×</button>
      </div>

      <div id="cartItems" class="cart-items"></div>

      <div class="cart-coupon">
        <label>Cupom</label>

        <div class="cart-coupon-row">
          <input type="text" id="couponInput" placeholder="BETA25">
          <button id="applyCoupon">Aplicar</button>
        </div>

        <p id="couponText">Use BETA25 para 25% na primeira compra.</p>
      </div>

      <div class="cart-total">
        <div>
          <span>Subtotal</span>
          <strong id="cartSubtotal">R$ 0,00</strong>
        </div>

        <div>
          <span>Desconto</span>
          <strong id="cartDiscount">R$ 0,00</strong>
        </div>

        <div class="cart-final">
          <span>Total</span>
          <strong id="cartTotal">R$ 0,00</strong>
        </div>
      </div>

      <button class="btn-primary cart-finish" id="finishOrder">
        Finalizar pedido
      </button>

      <button class="cart-clear" id="clearCart">
        Limpar carrinho
      </button>
    </aside>
  `;

  document.body.insertAdjacentHTML("beforeend", html);
}

function openCart() {
  document.getElementById("cartBox").classList.add("active");
  document.getElementById("cartOverlay").classList.add("active");
}

function closeCart() {
  document.getElementById("cartBox").classList.remove("active");
  document.getElementById("cartOverlay").classList.remove("active");
}

function addToCart(product) {
  const cart = getCart();
  const item = cart.find((cartItem) => cartItem.id === product.id);

  if (isRestrictedCategory(product.category)) {
    const categoryLabel = getCategoryLabel(product.category);

    if (item || cartHasCategory(cart, product.category)) {
      alert(`Você só pode adicionar 1 ${categoryLabel} ao carrinho.`);
      openCart();
      return;
    }
  }

  if (item) {
    item.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: 1
    });
  }

  saveCart(cart);
  renderCart();
  openCart();
}

function changeQuantity(id, amount) {
  const cart = getCart();

  const item = cart.find((cartItem) => cartItem.id === id);
  if (!item) return;

  if (amount > 0 && isRestrictedCategory(item.category)) {
    const categoryLabel = getCategoryLabel(item.category);
    alert(`Você só pode comprar 1 ${categoryLabel}.`);
    return;
  }

  item.quantity += amount;

  const updatedCart = cart.filter((cartItem) => cartItem.quantity > 0);

  if (updatedCart.length === 0) {
    localStorage.removeItem(COUPON_KEY);
  }

  saveCart(updatedCart);
  renderCart();
}

function removeItem(id) {
  const cart = getCart().filter((item) => item.id !== id);

  if (cart.length === 0) {
    localStorage.removeItem(COUPON_KEY);
  }

  saveCart(cart);
  renderCart();
}

function renderCart() {
  const cart = getCart();

  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const sub = subtotal(cart);
  const disc = discount(sub);
  const total = sub - disc;

  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartSubtotal").textContent = formatPrice(sub);
  document.getElementById("cartDiscount").textContent = `- ${formatPrice(disc)}`;
  document.getElementById("cartTotal").textContent = formatPrice(total);

  const couponText = document.getElementById("couponText");

  if (hasCoupon()) {
    couponText.textContent = "Cupom BETA25 aplicado com sucesso.";
    couponText.classList.add("success");
  } else {
    couponText.textContent = "Use BETA25 para 25% na primeira compra.";
    couponText.classList.remove("success");
  }

  const cartItems = document.getElementById("cartItems");

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <h3>Carrinho vazio</h3>
        <p>Adicione algum produto da loja para montar seu pedido.</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <span>${formatPrice(item.price)} cada</span>
      </div>

      <div class="cart-actions">
        <button data-minus="${item.id}">−</button>
        <span>${item.quantity}</span>
        <button data-plus="${item.id}">+</button>
      </div>

      <button class="cart-remove" data-remove="${item.id}">
        Remover
      </button>
    </div>
  `).join("");
}

function setupCart() {
  createCartHTML();

  document.querySelectorAll(".add-cart-btn").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart({
        id: button.dataset.id,
        name: button.dataset.name,
        price: Number(button.dataset.price),
        category: button.dataset.category
      });
    });
  });

  document.getElementById("openCart").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);

  document.getElementById("cartItems").addEventListener("click", (event) => {
    const plus = event.target.dataset.plus;
    const minus = event.target.dataset.minus;
    const remove = event.target.dataset.remove;

    if (plus) changeQuantity(plus, 1);
    if (minus) changeQuantity(minus, -1);
    if (remove) removeItem(remove);
  });

  document.getElementById("applyCoupon").addEventListener("click", () => {
    const coupon = document.getElementById("couponInput").value.trim().toUpperCase();

    if (getCart().length === 0) {
      alert("Adicione algum produto antes de aplicar o cupom.");
      return;
    }

    if (coupon !== "BETA25") {
      alert("Cupom inválido.");
      return;
    }

    localStorage.setItem(COUPON_KEY, "BETA25");
    document.getElementById("couponInput").value = "";
    renderCart();
  });

  document.getElementById("clearCart").addEventListener("click", () => {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(COUPON_KEY);
    renderCart();
  });

  document.getElementById("finishOrder").addEventListener("click", () => {
    if (getCart().length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    window.location.href = "/loja/checkout";
  });

  renderCart();
}

document.addEventListener("DOMContentLoaded", setupCart);