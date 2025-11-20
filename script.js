// Versão melhorada do seu script: suporte a quantidade, agrupamento por id+tamanho,
// persistência no localStorage, atualização do contador (soma das quantidades),
// remoção, alteração de quantidade, lazy-load com IntersectionObserver quando disponível.

// Dados dos produtos: preço em número (em reais). Se preferir, use centavos.
const products = [
    { id:1, name:"Nike Air Max Plus TN", price:150.00, img:"Img/airmaxplus.jpg", desc:"O clássico que domina o streetwear.", checkout:"https://dripsupply-co.pay.yampi.com.br/r/A772UWY2AJ", sizes:[38,39,40,41,42,43,44,45,46] },
    { id:2, name:"Nike Air Force 1 TN", price:130.00, img:"Img/airforce1.png", desc:"Design agressivo e estiloso.", checkout:"https://dripsupply-co.pay.yampi.com.br/r/DFR722LH9R", sizes:[38,39,40,41,42,43,44,45,46] },
    { id:3, name:"Conjunto Tech Fleece", price:250.00, img:"Img/Tech.jpg", desc:"Conforto premium.", checkout:"https://dripsupply-co.pay.yampi.com.br/r/164S4FBCHK", sizes:["M","L","XL","2XL"] },
    { id:4, name:"Conjunto Denim Tears", price:250.00, img:"Img/denim.png", desc:"Estilo absoluto.", checkout:"https://dripsupply-co.pay.yampi.com.br/r/CUZ7MKYCJX", sizes:["S","M","L","XL"] }
];

const productSection = document.getElementById("productSection");
const detailSection = document.getElementById("detailSection");
const cartSection = document.getElementById("cartSection");
const homeSection = document.getElementById("homeSection");
const cartCountElem = document.getElementById("cartCount");
const alertBox = document.getElementById("alertBox");
const searchInput = document.getElementById("searchInput");
const cartBtn = document.getElementById("cartBtn");
const homeBtn = document.getElementById("homeBtn");

let cart = {}; // mapa com chave `${id}_${size}` => { id, name, price, img, size, qty, checkout }

// --- UTILITÁRIOS ---
function formatCurrency(value){
    return value.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}
function showAlert(msg){
    alertBox.textContent = msg;
    alertBox.style.display = "block";
    setTimeout(()=> alertBox.style.display = "none", 1800);
}
function saveCart(){
    localStorage.setItem("drip_cart_v1", JSON.stringify(cart));
}
function loadCart(){
    const raw = localStorage.getItem("drip_cart_v1");
    if(raw){
        try { cart = JSON.parse(raw); } catch { cart = {}; }
    }
}
function updateCartCount(){
    const totalQty = Object.values(cart).reduce((s,i)=> s + (i.qty||0), 0);
    cartCountElem.textContent = totalQty;
}

// --- RENDERIZAÇÃO DE PRODUTOS ---
function renderProducts(filterText = ""){
    hideAllSections();
    homeSection.style.display = "block";
    productSection.style.display = "grid";
    productSection.innerHTML = "";

    const filtered = products.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));
    filtered.forEach(p=>{
        const card = document.createElement("article");
        card.className = "product-card";
        card.innerHTML = `
            <img data-src="${p.img}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${formatCurrency(p.price)}</p>
            <div style="width:100%; display:flex; gap:8px;">
                <button class="btn-buy btn-view" data-id="${p.id}" aria-label="Ver detalhes de ${p.name}">Ver Detalhes</button>
                <button class="btn-buy btn-add" data-id="${p.id}" aria-label="Adicionar ${p.name} ao carrinho">+ Carrinho</button>
            </div>
        `;
        productSection.appendChild(card);
    });
    observeImages();
}

// Detalhes do produto
function showDetail(id){
    const p = products.find(x=>x.id===id);
    if(!p) return;
    hideAllSections();
    detailSection.style.display = "flex";
    detailSection.setAttribute("aria-hidden","false");
    const options = p.sizes.map(s=>`<option value="${s}">${s}</option>`).join("");
    detailSection.innerHTML = `
        <h2>${p.name}</h2>
        <img data-src="${p.img}" alt="${p.name}">
        <p>${p.desc}</p>
        <p class="modal-price">${formatCurrency(p.price)}</p>
        <label for="sizeSelect">Selecione o tamanho:</label>
        <select id="sizeSelect">${options}</select>
        <div style="display:flex; gap:8px; margin-top:8px;">
            <input id="qtyInput" type="number" min="1" value="1" style="width:80px; padding:6px; border-radius:6px; background:#0f0f10; border:1px solid #222; color:#fff;">
            <button class="btn-buy" id="addDetailBtn">Adicionar ao Carrinho</button>
            <button class="btn-buy" id="backToList">Voltar</button>
        </div>
    `;
    observeImages();
    document.getElementById("addDetailBtn").addEventListener("click", ()=>{
        const qty = parseInt(document.getElementById("qtyInput").value) || 1;
        addToCart(id, qty);
    });
    document.getElementById("backToList").addEventListener("click", renderProducts);
}

// --- CARRINHO ---
function cartKey(id, size){ return `${id}_${size}`; }

// Adiciona ao carrinho (se já existe, incrementa)
function addToCart(id, qty = 1, size = ""){
    const p = products.find(x=>x.id === id);
    if(!p) return;
    // se não passou o tamanho (ex: botão rapido), pega o primeiro disponível
    if(!size){
        // tentar pegar sizeSelect se existir
        const sel = document.getElementById("sizeSelect");
        size = sel ? sel.value : (p.sizes && p.sizes.length ? p.sizes[0] : "");
    }
    const key = cartKey(id, size);
    if(cart[key]){
        cart[key].qty += qty;
    } else {
        cart[key] = {
            id: p.id,
            name: p.name,
            price: p.price,
            img: p.img,
            size: size,
            qty: qty,
            checkout: p.checkout
        };
    }
    saveCart();
    updateCartCount();
    showAlert(`${p.name} (${size}) adicionado ao carrinho.`);
}

// Remove item do carrinho
function removeFromCart(key){
    if(cart[key]) delete cart[key];
    saveCart();
    renderCart();
    updateCartCount();
}

// Atualiza quantidade (se qty <= 0 remove)
function updateQuantity(key, newQty){
    if(!cart[key]) return;
    const qty = parseInt(newQty) || 0;
    if(qty <= 0){
        removeFromCart(key);
    } else {
        cart[key].qty = qty;
        saveCart();
        renderCart();
        updateCartCount();
    }
}

// Renderiza o carrinho
function renderCart(){
    hideAllSections();
    cartSection.style.display = "flex";
    cartSection.setAttribute("aria-hidden","false");
    cartSection.innerHTML = `<h2>Seu Carrinho</h2>`;

    const items = Object.values(cart);
    if(items.length === 0){
        cartSection.innerHTML += `<p>Seu carrinho está vazio.</p>`;
        cartSection.innerHTML += `<div style="margin-top:12px;"><button class="btn-buy" id="continueShopping">Continuar Comprando</button></div>`;
        document.getElementById("continueShopping").addEventListener("click", renderProducts);
        return;
    }

    const list = document.createElement("div");
    list.className = "cart-list";
    items.forEach(item=>{
        const key = cartKey(item.id, item.size);
        const itemEl = document.createElement("div");
        itemEl.className = "cart-item";
        itemEl.dataset.key = key;
        itemEl.innerHTML = `
            <img data-src="${item.img}" alt="${item.name}">
            <div class="meta">
                <h4>${item.name}</h4>
                <p>Tamanho/Opção: ${item.size}</p>
                <p class="price">${formatCurrency(item.price)} cada</p>
            </div>
            <div>
                <div class="qty-controls">
                    <button class="decrease" data-key="${key}" aria-label="Diminuir quantidade">-</button>
                    <input type="number" class="qty-input" data-key="${key}" value="${item.qty}" min="1" aria-label="Quantidade">
                    <button class="increase" data-key="${key}" aria-label="Aumentar quantidade">+</button>
                </div>
                <div style="margin-top:8px; display:flex; gap:8px; justify-content:flex-end;">
                    <button class="btn-buy checkout-item" data-key="${key}">Finalizar item</button>
                    <button class="btn-buy remove-item" data-key="${key}">Remover</button>
                </div>
            </div>
        `;
        list.appendChild(itemEl);
    });

    cartSection.appendChild(list);

    const subtotal = items.reduce((s,i)=> s + (i.price * i.qty), 0);
    const totalsEl = document.createElement("div");
    totalsEl.className = "cart-totals";
    totalsEl.innerHTML = `
        <div><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</div>
        <div class="cart-actions">
            <button class="btn-buy" id="checkoutAll">Finalizar Compra</button>
            <button class="btn-buy" id="clearCart">Limpar Carrinho</button>
        </div>
    `;
    cartSection.appendChild(totalsEl);

    observeImages();

    // Delegação de eventos
    cartSection.querySelectorAll(".increase").forEach(btn=>{
        btn.addEventListener("click", ()=> {
            const key = btn.dataset.key;
            cart[key].qty += 1;
            saveCart(); renderCart(); updateCartCount();
        });
    });
    cartSection.querySelectorAll(".decrease").forEach(btn=>{
        btn.addEventListener("click", ()=> {
            const key = btn.dataset.key;
            cart[key].qty = Math.max(1, cart[key].qty - 1);
            saveCart(); renderCart(); updateCartCount();
        });
    });
    cartSection.querySelectorAll(".qty-input").forEach(input=>{
        input.addEventListener("change", (e)=>{
            const key = input.dataset.key;
            updateQuantity(key, input.value);
        });
    });
    cartSection.querySelectorAll(".remove-item").forEach(btn=>{
        btn.addEventListener("click", ()=> removeFromCart(btn.dataset.key));
    });
    cartSection.querySelectorAll(".checkout-item").forEach(btn=>{
        btn.addEventListener("click", ()=>{
            const key = btn.dataset.key;
            const item = cart[key];
            // Observação: os links de checkout existentes aparentemente são por produto.
            // Aqui redirecionamos para o link do produto (comprar 1 unidade). Para checkout multi-item é necessário backend/integração com a API do gateway.
            window.open(item.checkout, "_blank");
        });
    });

    document.getElementById("clearCart").addEventListener("click", ()=>{
        if(confirm("Tem certeza que deseja limpar o carrinho?")){
            cart = {};
            saveCart();
            renderCart();
            updateCartCount();
        }
    });

    document.getElementById("checkoutAll").addEventListener("click", ()=>{
        // Se você precisa de checkout multi-item:
        // - Opção correta: criar rota no seu backend que recebe o carrinho e cria uma sessão de pagamento (Stripe Checkout, Yampi, MercadoPago, etc.)
        // Como fallback: abrir o checkout do primeiro item ou instruir o usuário a finalizar item por item.
        const itemsKeys = Object.keys(cart);
        if(itemsKeys.length === 1){
            const item = cart[itemsKeys[0]];
            window.open(item.checkout, "_blank");
            return;
        }
        alert("Para checkout com múltiplos itens, é necessário integrar com uma API de pagamento no backend. Alternativamente, finalize item por item.");
    });

    // voltar a tela anterior ao clicar fora? (não implementado)
}

// --- UTILIDADES DE UI ---
function hideAllSections(){
    productSection.style.display="none";
    detailSection.style.display="none";
    cartSection.style.display="none";
    homeSection.style.display="none";
    detailSection.setAttribute("aria-hidden","true");
    cartSection.setAttribute("aria-hidden","true");
}

// Lazy load com IntersectionObserver ou fallback por scroll
let observer = null;
function observeImages(){
    const images = document.querySelectorAll('img[data-src]');
    if('IntersectionObserver' in window){
        if(!observer){
            observer = new IntersectionObserver((entries, obs)=>{
                entries.forEach(entry=>{
                    if(entry.isIntersecting){
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add("fade-in");
                        img.removeAttribute("data-src");
                        obs.unobserve(img);
                    }
                });
            }, { rootMargin: "100px" });
        }
        images.forEach(img => observer.observe(img));
    } else {
        // Fallback simples
        images.forEach(img=>{
            img.src = img.dataset.src;
            img.classList.add("fade-in");
            img.removeAttribute("data-src");
        });
    }
}

// --- BUSCA E EVENTOS ---
searchInput.addEventListener("input", (e)=>{
    renderProducts(e.target.value);
});

productSection.addEventListener("click", (e)=>{
    const viewBtn = e.target.closest(".btn-view");
    const addBtn = e.target.closest(".btn-add");
    if(viewBtn) showDetail(Number(viewBtn.dataset.id));
    if(addBtn){
        const id = Number(addBtn.dataset.id);
        // adiciona 1 com tamanho padrão
        addToCart(id, 1, "");
        updateCartCount();
    }
});

cartBtn.addEventListener("click", ()=>{
    const isOpen = cartSection.style.display === "flex";
    if(isOpen) {
        renderProducts();
        cartBtn.setAttribute("aria-expanded","false");
    } else {
        renderCart();
        cartBtn.setAttribute("aria-expanded","true");
    }
});

homeBtn.addEventListener("click", renderProducts);

// Inicialização
function init(){
    loadCart();
    updateCartCount();
    renderProducts();
    // abrir carrinho automaticamente se url tiver ?cart=1 (opcional)
    if(location.search.includes("cart=1")) renderCart();
}
window.addEventListener("load", init);