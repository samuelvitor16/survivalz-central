const CART_KEY = "survivalz_cart";
const COUPON_KEY = "survivalz_coupon";
const DONATION_TERMS_VERSION = "donation-beta-2026-06";
const DONATION_TERMS_TEXT = "Declaro que estou realizando uma doacao voluntaria de apoio ao projeto SurvivalZ, podendo receber recompensas digitais simbolicas vinculadas ao Beta. Estou ciente de que, apos a confirmacao e/ou liberacao dos beneficios, nao havera reembolso, exceto em casos de pagamento duplicado, falha tecnica, nao entrega do beneficio ou obrigacao legal aplicavel.";

function formatPrice(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function hasCoupon() {
  return localStorage.getItem(COUPON_KEY) === "BETA25";
}

function getSubtotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
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

  if (!checkoutItems || !checkoutSubtotal || !checkoutDiscount || !checkoutTotal) return;

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

  checkoutItems.innerHTML = cart.map((item) => `
    <div class="checkout-item">
      <div>
        <strong>${item.name}</strong>
        <span>${item.quantity}x ${formatPrice(item.price)}</span>
      </div>
      <strong>${formatPrice(item.price * item.quantity)}</strong>
    </div>
  `).join("");

  checkoutSubtotal.textContent = formatPrice(subtotal);
  checkoutDiscount.textContent = `- ${formatPrice(discount)}`;
  checkoutTotal.textContent = formatPrice(total);
}

document.addEventListener("DOMContentLoaded", () => {
  renderCheckout();

  const sendButton = document.getElementById("sendOrderButton");
  if (!sendButton) return;

  const resetButton = () => {
    sendButton.disabled = false;
    sendButton.textContent = "Enviar pedido e gerar Pix";
    sendButton.classList.remove("loading");
  };

  sendButton.addEventListener("click", async () => {
    sendButton.disabled = true;
    sendButton.textContent = "Gerando pedido...";
    sendButton.classList.add("loading");

    const cart = getCart();
    if (cart.length === 0) {
      alert("Seu carrinho esta vazio.");
      resetButton();
      return;
    }

    const discord = document.getElementById("discord").value.trim();
    const email = document.getElementById("email").value.trim();
    const sampNick = document.getElementById("sampNick").value.trim();
    const notes = document.getElementById("notes").value.trim();
    const terms = document.getElementById("terms");

    if (!discord || !email || !sampNick) {
      alert("Preencha Discord, e-mail e nick no servidor.");
      resetButton();
      return;
    }

    if (!terms || !terms.checked) {
      alert("Voce precisa aceitar o termo de doacao/apoio para finalizar.");
      resetButton();
      return;
    }

    const subtotal = getSubtotal(cart);
    const discount = getDiscount(subtotal);
    const total = subtotal - discount;

    const orderData = {
      customer: {
        name: sampNick,
        discord,
        email,
        sampNick,
        notes
      },
      donationTermsAccepted: true,
      donationTermsVersion: DONATION_TERMS_VERSION,
      donationTermsText: DONATION_TERMS_TEXT,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        priceCents: item.price,
        quantity: item.quantity,
        totalCents: item.price * item.quantity
      })),
      subtotal,
      discount,
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
        resetButton();
        return;
      }

      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(COUPON_KEY);
      window.location.href = `/loja/sucesso?pedido=${result.order.code}`;
    } catch (error) {
      console.log("Erro ao enviar pedido:", error);
      alert("Erro ao enviar pedido. Tente novamente.");
      resetButton();
    }
  });
});
