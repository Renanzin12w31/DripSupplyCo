const products = [
    { id:1, name:"Nike Air Max Plus TN", category:"tenis", price:"R$ 150", img:"Img/airmaxplus.jpg", desc:"O clássico que domina o streetwear.", checkout:"https://seguro.dripsupplyco.store/r/A772UWY2AJ", sizes:[38,39,40,41,42,43,44,45,46] },
    { id:2, name:"Nike Air Force 1 TN", category:"tenis", price:"R$ 130", img:"Img/airforce1.png", desc:"Design agressivo e estiloso.", checkout:"https://seguro.dripsupplyco.store/r/DFR722LH9R", sizes:[38,39,40,41,42,43,44,45,46] },
    { id:3, name:"Conjunto Tech Fleece", category:"tenis", price:"R$ 349", img:"Img/Tech.jpg", desc:"Conforto premium.", checkout:"https://seguro.dripsupplyco.store/r/164S4FBCHK", sizes:["M","L","XL","2XL"] },
    { id:4, name:"Conjunto Denim Tears", category:"tenis", price:"R$ 299", img:"Img/denim.png", desc:"Estilo absoluto.", checkout:"https://seguro.dripsupplyco.store/r/CUZ7MKYCJX", sizes:["S","M","L","XL"] }
];

let cart = [];

const productSection = document.getElementById("productSection");
const detailSection = document.getElementById("detailSection");
const cartSection = document.getElementById("cartSection");
const homeSection = document.getElementById("homeSection");
const sobreNosSection = document.getElementById("sobreNosSection");
const cartCount = document.getElementById("cartCount");
const alertBox = document.getElementById("alertBox");

function renderProducts(filter=""){
    hideAllSections();
    productSection.style.display="grid";
    homeSection.style.display="block";
    productSection.innerHTML="";
    products.filter(p=>!filter||p.category===filter).forEach(p=>{
        const card = document.createElement("div");
        card.className="product-card";
        card.innerHTML=`
            <img data-src="${p.img}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${p.price}</p>
            <button class="btn-buy" onclick="showDetail(${p.id})">Ver Detalhes</button>
        `;
        productSection.appendChild(card);
    });
    lazyLoadImages();
}

function showDetail(id){
    const p = products.find(x=>x.id===id);
    hideAllSections();
    detailSection.style.display="flex";
    let options = p.sizes.map(s=>`<option value="${s}">${s}</option>`).join("");
    detailSection.innerHTML = `
        <h2>${p.name}</h2>
        <img data-src="${p.img}" alt="${p.name}">
        <p>${p.desc}</p>
        <p class="modal-price">${p.price}</p>
        <label for="sizeSelect">Selecione o tamanho:</label>
        <select id="sizeSelect">${options}</select>
        <button class="btn-buy" onclick="addToCart(${p.id})">Adicionar ao Carrinho</button>
        <button class="btn-secondary" onclick="renderProducts()">Voltar</button>
    `;
    lazyLoadImages();
}

function addToCart(id){
    const p = products.find(x=>x.id===id);
    const size = document.getElementById("sizeSelect") ? document.getElementById("sizeSelect").value : "";
    cart.push({...p, selectedSize:size});
    cartCount.textContent = cart.length;
    showAlert("Produto adicionado ao carrinho!");
}

function showAlert(msg){
    alertBox.textContent = msg;
    alertBox.style.display = "block";
    setTimeout(()=>alertBox.style.display="none",2000);
}

document.getElementById("cartBtn").addEventListener("click", ()=>{
    hideAllSections();
    cartSection.style.display="flex";
    cartSection.innerHTML = `<h2>Seu Carrinho</h2>`;
    if(cart.length === 0){
        cartSection.innerHTML += `<p>Seu carrinho está vazio.</p>`;
        return;
    }
    cart.forEach(item=>{
        const div = document.createElement("div");
        div.className = "detail-page";
        div.innerHTML = `
            <h3>${item.name}</h3>
            <img data-src="${item.img}" alt="${item.name}">
            <p>${item.desc}</p>
            <p>Tamanho/Opção: ${item.selectedSize}</p>
            <p class="modal-price">${item.price}</p>
            <button class="btn-buy" onclick="window.location.href='${item.checkout}'">Finalizar Compra</button>
        `;
        cartSection.appendChild(div);
    });
    lazyLoadImages();
});

function showHome(){
    hideAllSections();
    homeSection.style.display="block";
    productSection.style.display="grid";
}

function showContato(){
    hideAllSections();
    document.getElementById("contactSection").style.display="flex";
}

function showSobreNos(){
    hideAllSections();
    sobreNosSection.style.display="flex";
    lazyLoadImages();
}

function searchProducts(){
    const text = document.getElementById("searchInput").value.toLowerCase();
    renderProducts();
    document.querySelectorAll(".product-card").forEach(card=>{
        const name = card.querySelector("h3").textContent.toLowerCase();
        card.style.display = name.includes(text) ? "block" : "none";
    });
}

function hideAllSections(){
    productSection.style.display="none";
    detailSection.style.display="none";
    cartSection.style.display="none";
    homeSection.style.display="none";
    document.getElementById("contactSection").style.display="none";
    sobreNosSection.style.display="none";
}

// Lazy load
function lazyLoadImages(){
    const images = document.querySelectorAll('img[data-src]');
    const windowBottom = window.innerHeight + window.scrollY;
    images.forEach(img=>{
        if(img.offsetTop < windowBottom){
            img.src = img.dataset.src;
            img.classList.add("fade-in");
            delete img.dataset.src;
        }
    });
}
window.addEventListener('scroll', lazyLoadImages);
window.addEventListener('load', lazyLoadImages);

renderProducts();
