const CLOUD_SYNC_ENDPOINT = "https://kvdb.io/A9xK7mP2qL8vR4nW6tY1zB";

let storeIdentity = JSON.parse(localStorage.getItem("umkm_store_identity")) || {
  storeId: "caffe-santai-hihihi",
  name: "Caffe Santai HIHIHI",
  logo: "CS",
  wa: "6287877611218",
  qrisText: "OLAN MAULANA Bank Mandiri 1630011235432"
};

const DAFTAR_KATEGORI = [
  { id: "kopi", nama: "Kopi" },
  { id: "non-kopi", nama: "Non-Kopi" },
  { id: "makanan-berat", nama: "Makanan Berat" },
  { id: "camilan", nama: "Camilan" },
  { id: "bakaran", nama: "Bakaran" },
  { id: "kue-dessert", nama: "Kue & Dessert" },
  { id: "menu-paket", nama: "Menu Paket" },
  { id: "tambahan", nama: "Tambahan / Topping" }
];

let defaultMenuList = [
  { 
    id: 1718000001, 
    nama: "Macha", 
    kategori: "kopi", 
    labelKategori: "Kopi", 
    harga: 25000, 
    deskripsi: "Enak & Lezat", 
    gambar: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80" 
  },
  { 
    id: 1718000002, 
    nama: "Pisang Goreng Crispy", 
    kategori: "tambahan", 
    labelKategori: "Tambahan / Topping", 
    harga: 15000, 
    deskripsi: "Gurih & Renyah", 
    gambar: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80" 
  },
  { 
    id: 1718000003, 
    nama: "Nasi Ikan Bakar + Minum", 
    kategori: "menu-paket", 
    labelKategori: "Menu Paket", 
    harga: 35000, 
    deskripsi: "Nikmat & Mengenyangkan", 
    gambar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80" 
  }
];

let savedMenuCustom = JSON.parse(localStorage.getItem("umkm_menu_custom"));
let DATA_MENU = Array.isArray(savedMenuCustom) ? savedMenuCustom : [...defaultMenuList];

let kataKunciCariAdmin = "";
let kategoriAktifAdmin = "semua";

function getLabelKategori(katId) {
  const found = DAFTAR_KATEGORI.find(k => k.id === katId);
  return found ? found.nama : "Menu";
}

function formatRupiah(angka) {
  return "Rp " + Number(angka).toLocaleString("id-ID");
}

function tampilkanToast(pesan) {
  let toast = document.getElementById("toastNotif");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastNotif";
    toast.style.cssText = "position:fixed; bottom:20px; right:20px; background:#10b981; color:#fff; padding:12px 20px; border-radius:8px; z-index:9999; font-weight:600; box-shadow:0 4px 12px rgba(0,0,0,0.3); transition:opacity 0.3s ease;";
    document.body.appendChild(toast);
  }
  toast.textContent = pesan;
  toast.style.opacity = "1";
  setTimeout(() => { toast.style.opacity = "0"; }, 2500);
}

function simpanDanSinkronkanKeCloud() {
  localStorage.setItem("umkm_menu_custom", JSON.stringify(DATA_MENU));
  localStorage.setItem("umkm_store_identity", JSON.stringify(storeIdentity));

  // Sinkronisasi data ke Cloud agar langsung dibaca oleh Client secara real-time
  const payload = {
    s: {
      n: storeIdentity.name,
      l: storeIdentity.logo,
      w: storeIdentity.wa,
      q: storeIdentity.qrisText
    },
    m: DATA_MENU.map(item => ({
      i: item.id,
      n: item.nama,
      k: item.kategori,
      lk: item.labelKategori,
      h: item.harga,
      d: item.deskripsi,
      g: item.gambar
    }))
  };

  const storeId = storeIdentity.storeId || "caffe-santai-hihihi";
  fetch(`${CLOUD_SYNC_ENDPOINT}/store_${encodeURIComponent(storeId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (res.ok) {
      tampilkanToast("✓ Menu berhasil disimpan & disinkronkan ke Cloud!");
    } else {
      console.warn("Gagal sinkronisasi cloud, tersimpan di lokal.");
    }
  })
  .catch(err => {
    console.warn("Network error cloud sync:", err);
  });
}

function renderAdminHeader() {
  document.querySelectorAll("#navBrandTitle").forEach(el => el.textContent = storeIdentity.name);
  document.querySelectorAll("#navBrandLogo").forEach(el => el.textContent = storeIdentity.logo);
}

function renderAdminMenu() {
  const container = document.getElementById("adminMenuContainer");
  if (!container) return;
  container.innerHTML = "";

  let filtered = DATA_MENU;
  if (kategoriAktifAdmin !== "semua") {
    filtered = filtered.filter(m => m.kategori === kategoriAktifAdmin);
  }
  if (kataKunciCariAdmin !== "") {
    const kw = kataKunciCariAdmin.toLowerCase();
    filtered = filtered.filter(m => m.nama.toLowerCase().includes(kw) || m.deskripsi.toLowerCase().includes(kw));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">Belum ada menu yang sesuai.</div>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <div class="card-img-box">
        <img src="${item.gambar}" alt="${item.nama}" onerror="this.src='https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(item.nama)}'">
        <span class="card-cat-label">${item.labelKategori}</span>
      </div>
      <div class="card-content">
        <h4>${item.nama}</h4>
        <p class="card-desc">${item.deskripsi}</p>
        <div class="card-footer">
          <span class="price-text">${formatRupiah(item.harga)}</span>
          <div class="card-action-btns">
            <button type="button" class="btn-edit" onclick="bukaModalEditMenu(${item.id})">Edit</button>
            <button type="button" class="btn-del-item" onclick="hapusMenu(${item.id})">Hapus</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

let editingMenuId = null;

function bukaModalTambahMenu() {
  editingMenuId = null;
  document.getElementById("modalMenuTitle").textContent = "Tambah Menu Baru";
  document.getElementById("inputNamaMenu").value = "";
  document.getElementById("inputHargaMenu").value = "";
  document.getElementById("inputDescMenu").value = "";
  document.getElementById("inputGambarMenu").value = "";
  document.getElementById("selectKategoriMenu").value = "kopi";
  document.getElementById("menuFormModal").classList.add("active");
}

function bukaModalEditMenu(id) {
  editingMenuId = id;
  const item = DATA_MENU.find(m => m.id === id);
  if (!item) return;

  document.getElementById("modalMenuTitle").textContent = "Edit Menu";
  document.getElementById("inputNamaMenu").value = item.nama;
  document.getElementById("inputHargaMenu").value = item.harga;
  document.getElementById("inputDescMenu").value = item.deskripsi;
  document.getElementById("inputGambarMenu").value = item.gambar;
  document.getElementById("selectKategoriMenu").value = item.kategori;
  document.getElementById("menuFormModal").classList.add("active");
}

function tutupModalMenu() {
  document.getElementById("menuFormModal").classList.remove("active");
}

function simpanMenuForm(e) {
  e.preventDefault();
  const nama = document.getElementById("inputNamaMenu").value.trim();
  const harga = Number(document.getElementById("inputHargaMenu").value);
  const kategori = document.getElementById("selectKategoriMenu").value;
  const labelKategori = getLabelKategori(kategori);
  const deskripsi = document.getElementById("inputDescMenu").value.trim();
  const gambar = document.getElementById("inputGambarMenu").value.trim() || `https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(nama)}`;

  if (!nama || !harga) {
    alert("Nama menu dan harga wajib diisi!");
    return;
  }

  if (editingMenuId !== null) {
    const idx = DATA_MENU.findIndex(m => m.id === editingMenuId);
    if (idx !== -1) {
      DATA_MENU[idx] = { id: editingMenuId, nama, kategori, labelKategori, harga, deskripsi, gambar };
    }
  } else {
    const newItem = { id: Date.now(), nama, kategori, labelKategori, harga, deskripsi, gambar };
    DATA_MENU.push(newItem);
  }

  simpanDanSinkronkanKeCloud();
  tutupModalMenu();
  renderAdminMenu();
}

function hapusMenu(id) {
  if (confirm("Yakin ingin menghapus menu ini?")) {
    DATA_MENU = DATA_MENU.filter(m => m.id !== id);
    simpanDanSinkronkanKeCloud();
    renderAdminMenu();
    tampilkanToast("Menu berhasil dihapus.");
  }
}

// ---------------------------------------------------------------------------
// QR CODE GENERATOR PERMANEN (Murni Berbasis ID Toko ?store=...)
// Barcode tidak akan pernah berubah meskipun menu bertambah/berkurang!
// ---------------------------------------------------------------------------
function generateQrCodeCard() {
  const storeId = storeIdentity.storeId || "caffe-santai-hihihi";
  const clientBaseUrl = "https://aplikasi-umkm-five.vercel.app/";
  const permanentUrl = `${clientBaseUrl}?store=${encodeURIComponent(storeId)}`;

  const qrcodeContainer = document.getElementById("qrcode");
  if (!qrcodeContainer) return;
  
  qrcodeContainer.innerHTML = "";
  if (typeof QRCode !== "undefined") {
    new QRCode(qrcodeContainer, {
      text: permanentUrl,
      width: 220,
      height: 220,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  const urlDisplay = document.getElementById("clientUrlDisplay");
  if (urlDisplay) urlDisplay.value = permanentUrl;

  const totalMenuBadge = document.getElementById("totalMenuCountBadge");
  if (totalMenuBadge) totalMenuBadge.textContent = `Siap (${DATA_MENU.length} Menu tersimpan)`;
}

function bukaModalQr() {
  generateQrCodeCard();
  document.getElementById("qrModal").classList.add("active");
}

function tutupModalQr() {
  document.getElementById("qrModal").classList.remove("active");
}

function bukaModalPengaturanToko() {
  document.getElementById("inputStoreName").value = storeIdentity.name;
  document.getElementById("inputStoreId").value = storeIdentity.storeId || "caffe-santai-hihihi";
  document.getElementById("inputStoreLogo").value = storeIdentity.logo;
  document.getElementById("inputStoreWa").value = storeIdentity.wa;
  document.getElementById("inputStoreQris").value = storeIdentity.qrisText;
  document.getElementById("storeModal").classList.add("active");
}

function tutupModalPengaturanToko() {
  document.getElementById("storeModal").classList.remove("active");
}

function simpanPengaturanToko(e) {
  e.preventDefault();
  storeIdentity.name = document.getElementById("inputStoreName").value.trim() || "Caffe Santai";
  storeIdentity.storeId = document.getElementById("inputStoreId").value.trim().toLowerCase().replace(/\s+/g, "-") || "caffe-santai";
  storeIdentity.logo = document.getElementById("inputStoreLogo").value.trim() || "CS";
  storeIdentity.wa = document.getElementById("inputStoreWa").value.trim() || "6287877611218";
  storeIdentity.qrisText = document.getElementById("inputStoreQris").value.trim() || "";

  simpanDanSinkronkanKeCloud();
  renderAdminHeader();
  tutupModalPengaturanToko();
  tampilkanToast("✓ Pengaturan toko berhasil diperbarui!");
}

document.addEventListener("DOMContentLoaded", () => {
  renderAdminHeader();
  renderAdminMenu();
  simpanDanSinkronkanKeCloud();

  const btnAddMenu = document.getElementById("btnAddMenu");
  if (btnAddMenu) btnAddMenu.addEventListener("click", bukaModalTambahMenu);

  const menuForm = document.getElementById("menuForm");
  if (menuForm) menuForm.addEventListener("submit", simpanMenuForm);

  const btnCloseMenuModal = document.getElementById("btnCloseMenuModal");
  if (btnCloseMenuModal) btnCloseMenuModal.addEventListener("click", tutupModalMenu);

  const btnOpenQrModal = document.getElementById("btnOpenQrModal");
  if (btnOpenQrModal) btnOpenQrModal.addEventListener("click", bukaModalQr);

  const btnCloseQrModal = document.getElementById("btnCloseQrModal");
  if (btnCloseQrModal) btnCloseQrModal.addEventListener("click", tutupModalQr);

  const btnOpenStoreModal = document.getElementById("btnOpenStoreModal");
  if (btnOpenStoreModal) btnOpenStoreModal.addEventListener("click", bukaModalPengaturanToko);

  const storeForm = document.getElementById("storeForm");
  if (storeForm) storeForm.addEventListener("submit", simpanPengaturanToko);

  const btnCloseStoreModal = document.getElementById("btnCloseStoreModal");
  if (btnCloseStoreModal) btnCloseStoreModal.addEventListener("click", tutupModalPengaturanToko);

  const searchInput = document.getElementById("searchAdminInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      kataKunciCariAdmin = e.target.value.trim();
      renderAdminMenu();
    });
  }
});
