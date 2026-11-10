const defaultProducts = [
    { id: 1, name: "Buku Tulis", price: 5000, stock: 15 },
    { id: 2, name: "Pulpen Hitam", price: 3000, stock: 8 },
    { id: 3, name: "Pensil 2B", price: 2500, stock: 3 },
    { id: 4, name: "Penghapus", price: 1500, stock: 0 },
    { id: 5, name: "Penggaris 30cm", price: 4000, stock: 10 }
];

let products = JSON.parse(localStorage.getItem('pos_products')) || defaultProducts;
let cart = JSON.parse(localStorage.getItem('pos_cart')) || [];
let transactions = JSON.parse(localStorage.getItem('pos_transactions')) || [];

const save = () => {
    localStorage.setItem('pos_products', JSON.stringify(products));
    localStorage.setItem('pos_cart', JSON.stringify(cart));
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
};

const fmt = n => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

function render() {
    const pList = document.getElementById('product-list');
    pList.innerHTML = '';
    let totalStock = 0;

    products.forEach(p => {
        totalStock += p.stock;
        let badge = p.stock === 0 ? '<span class="badge bg-danger">Habis</span>' : p.stock < 5 ? `<span class="badge bg-warning text-dark">${p.stock} Menipis</span>` : `<span class="badge bg-success">${p.stock} Aman</span>`;
        
        pList.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>${fmt(p.price)}</td>
                <td>${badge}</td>
                <td><button class="btn btn-sm btn-primary ${p.stock === 0 ? 'disabled' : ''}" onclick="addCart(${p.id})">Beli</button></td>
            </tr>`;
    });
    document.getElementById('metric-stok').innerText = totalStock;

    const cList = document.getElementById('cart-list');
    cList.innerHTML = '';
    let total = 0;

    cart.forEach((item, idx) => {
        let sub = item.price * item.qty;
        total += sub;
        cList.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${fmt(sub)}</td>
                <td><button class="btn btn-sm btn-danger py-0 px-1" onclick="delCart(${idx})">x</button></td>
            </tr>`;
    });
    document.getElementById('cart-total').innerText = fmt(total);

    document.getElementById('metric-omzet').innerText = fmt(transactions.reduce((s, t) => s + t.total, 0));
    document.getElementById('metric-transaksi').innerText = transactions.length;

    calcChange(total);
}

function addCart(id) {
    let p = products.find(x => x.id === id);
    if (!p || p.stock <= 0) return;
    let c = cart.find(x => x.id === id);
    if (c) {
        if (c.qty < p.stock) c.qty++;
        else return alert('Stok tidak cukup!');
    } else {
        cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    }
    save(); render();
}

function delCart(idx) {
    cart.splice(idx, 1);
    save(); render();
}

document.getElementById('reset-cart-btn').onclick = () => { cart = []; save(); render(); };

document.getElementById('add-product-form').onsubmit = e => {
    e.preventDefault();
    products.push({
        id: products.length ? products[products.length - 1].id + 1 : 1,
        name: document.getElementById('new-product-name').value,
        price: parseFloat(document.getElementById('new-product-price').value),
        stock: parseInt(document.getElementById('new-product-stock').value)
    });
    save(); render();
    e.target.reset();
};

function calcChange(total) {
    let method = document.getElementById('payment-method').value;
    document.getElementById('cash-input-container').style.display = method === 'Tunai' ? 'block' : 'none';
    
    if (method === 'Tunai') {
        let cash = parseFloat(document.getElementById('cash-given').value) || 0;
        let change = cash - total;
        document.getElementById('change-amount').innerText = change >= 0 ? fmt(change) : 'Uang Kurang';
    } else {
        document.getElementById('change-amount').innerText = 'Rp 0 (Non-Tunai)';
    }
}

document.getElementById('cash-given').oninput = () => render();
document.getElementById('payment-method').onchange = () => render();

document.getElementById('checkout-btn').onclick = () => {
    if (!cart.length) return alert('Keranjang kosong!');
    let total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    let method = document.getElementById('payment-method').value;
    let cash = parseFloat(document.getElementById('cash-given').value) || 0;

    if (method === 'Tunai' && cash < total) return alert('Uang kurang!');

    cart.forEach(item => {
        let p = products.find(x => x.id === item.id);
        if (p) p.stock -= item.qty;
    });

    transactions.push({ date: new Date().toLocaleString(), items: [...cart], total, method });
    save();

    let w = window.open('', '', 'height=500,width=400');
    w.document.write(`<html><head><title>Nota</title><style>body{font-family:monospace;font-size:12px;}</style></head><body>`);
    w.document.write('<h3>STRUK KASIR</h3><hr>');
    cart.forEach(i => w.document.write(`${i.name} x${i.qty} = ${fmt(i.price * i.qty)}<br>`));
    w.document.write(`<hr><strong>Total: ${fmt(total)}</strong><br>Metode: ${method}<br>`);
    if (method === 'Tunai') w.document.write(`Tunai: ${fmt(cash)}<br>Kembalian: ${fmt(cash - total)}<br>`);
    w.document.write('<hr><p style="text-align:center">Terima Kasih</p></body></html>');
    w.document.close();
    w.print();

    cart = [];
    save(); render();
    document.getElementById('cash-given').value = '';
};

render();