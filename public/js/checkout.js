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

function hasCoupon() {
  return localStorage.getItem(COUPON_KEY) === "BETA25";
}

function getSubtotal(cart) {
  return cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

function getDiscount(subtotal) {
  return hasCoupon() ? Math.round(subtotal * 0.25) : 0;
}

function renderCheckout() {
  const cart = getCart();

  const checkoutItems = document.getElementById("checkoutItems");
  const checkoutSubtotal = document.getElementById("checkoutSubtotal");
  const checkoutDiscount = document.getElementById("checkoutDiscount");
  const checkoutTotal = document.getElementById("checkoutTotal");

  if (cart.length === 0) {
    checkoutItems.innerHTML = `
      <div class="checkout-empty">
        <h3>Carrinho vazio</h3>
        <p>Volte para a loja e adicione produtos antes de finalizar.</p>
        <a href="/loja" class="btn-secondary">Voltar para loja</a>
      </div>
    `;

    checkoutSubtotal.textContent = formatPrice(0);
    checkoutDiscount.textContent = `- ${formatPrice(0)}`;
    checkoutTotal.textContent = formatPrice(0);
    return;
  }

  const subtotal = getSubtotal(cart);
  const discount = getDiscount(subtotal);
  const total = subtotal - discount;

  checkoutItems.innerHTML = cart.map((item) => {
    return `
      <div class="checkout-item">
        <div>
          <strong>${item.name}</strong>
          <span>${item.quantity}x ${formatPrice(item.price)}</span>
        </div>

        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>
    `;
  }).join("");

  checkoutSubtotal.textContent = formatPrice(subtotal);
  checkoutDiscount.textContent = `- ${formatPrice(discount)}`;
  checkoutTotal.textContent = formatPrice(total);
}

document.addEventListener("DOMContentLoaded", () => {
  renderCheckout();

  document.getElementById("sendOrderButton").addEventListener("click", async () => {
  const cart = getCart();

  if (cart.length === 0) {
    alert("Seu carrinho está vazio.");
    return;
  }

  const name = document.getElementById("name").value.trim();
  const discord = document.getElementById("discord").value.trim();
  const email = document.getElementById("email").value.trim();
  const sampNick = document.getElementById("sampNick").value.trim();
  const notes = document.getElementById("notes").value.trim();
  const terms = document.getElementById("terms");

  if (!name || !discord || !email || !sampNick) {
    alert("Preencha nome, Discord, e-mail e nick no servidor.");
    return;
  }

  if (!terms.checked) {
    alert("Você precisa confirmar que entendeu as condições do Beta.");
    return;
  }

  const sub = getSubtotal(cart);
  const disc = getDiscount(sub);
  const total = sub - disc;

  const orderData = {
    customer: {
      name,
      discord,
      email,
      sampNick,
      notes
    },

    items: cart.map((item) => {
      return {
        id: item.id,
        name: item.name,
        priceCents: item.price,
        quantity: item.quantity,
        totalCents: item.price * item.quantity
      };
    }),

    subtotal: sub,
    discount: disc,
    total,
    coupon: hasCoupon() ? "BETA25" : null
  };

  try {
    const response = await fetch("/loja/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Erro ao criar pedido.");
      return;
    }

    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(COUPON_KEY);

    alert(`Pedido criado com sucesso! Código: ${result.order.code}`);

    window.location.href = `/loja/sucesso?pedido=${result.order.code}`;

  } catch (error) {
    console.log("Erro ao enviar pedido:", error);
    alert("Erro ao enviar pedido. Tente novamente.");
  }
});
});