const ADMIN_PASS_VALID = "Kernaden";
const CLOUD_SYNC_ENDPOINT = "https://kvdb.io/A9xK7mP2qL8vR4nW6tY1zB";

function generateStoreSlug(name) {
  return (name || "umkm-store")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "umkm-store";
}

let savedIdentity = JSON.parse(localStorage.getItem("umkm_store_identity")) || {};
let storeIdentity = {
  storeId: savedIdentity.storeId || generateStoreSlug(savedIdentity.name) || "caffe-santai-hihihi",
  name: savedIdentity.name || "Caffe Santai HIHIHI",
  logo: savedIdentity.logo || "cs",
  wa: savedIdentity.wa || "6287877611218",
  qrisText: savedIdentity.qrisText || "OLAN MAULANA Bank Mandiri 1630011235432",
  clientUrl: savedIdentity.clientUrl || "https://aplikasi-umkm-five.vercel.app/"
};

let menuCustom = JSON.parse(localStorage.getItem("umkm_menu_custom")) || [];
let kataKunciCari = "";
let editMenuIndex = null;

const DAFTAR_KATEGORI = [
  { id: "semua", nama: "Semua Menu" },
  { id: "kopi", nama: "Kopi" },
  { id: "non-kopi", nama: "Non-Kopi" },
  { id: "makanan-berat", nama: "Makanan Berat" },
  { id: "camilan", nama: "Camilan" },
  { id: "bakaran", nama: "Bakaran" },
  { id: "kue-dessert", nama: "Kue & Dessert" },
  { id: "menu-paket", nama: "Menu Paket" },
  { id: "tambahan", nama: "Tambahan / Topping" }
];

function applyStoreIdentity() {
  const isAdminLogged = localStorage.getItem("umkm_admin_logged") === "true";
  if (!isAdminLogged || !storeIdentity.name) {
    document.title = "Login - Panel Admin";
    return;
  }
  document.title = `Admin - ${storeIdentity.name}`;
  document.querySelectorAll("#navBrandTitle").forEach(el => el.textContent = storeIdentity.name);
  document.querySelectorAll("#navBrandLogo").forEach(el => el.textContent = storeIdentity.logo);
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

function sinkronKeCloud() {
  localStorage.setItem("umkm_menu_custom", JSON.stringify(menuCustom));
  localStorage.setItem("umkm_store_identity", JSON.stringify(storeIdentity));

  const payload = {
    s: {
      n: storeIdentity.name,
      l: storeIdentity.logo,
      w: storeIdentity.wa,
      q: storeIdentity.qrisText
    },
    m: menuCustom.map((item, index) => ({
      i: item.id || (1720000000 + index),
      n: item.nama,
      k: item.kategori,
      lk: item.labelKategori || "Menu",
      h: item.harga,
      d: item.deskripsi || "",
      g: item.gambar || ""
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
      tampilkanToast("✓ Tersimpan & tersinkron ke Cloud!");
    }
  })
  .catch(err => {
    console.warn("Gagal sync cloud:", err);
  });
}

function renderAdminMenu() {
  const container = document.getElementById("adminMenuContainer");
  if (!container) return;
  container.innerHTML = "";

  let filtered = menuCustom;
  if (kataKunciCari !== "") {
    const kw = kataKunciCari.toLowerCase();
    filtered = filtered.filter(m => m.nama.toLowerCase().includes(kw) || (m.deskripsi && m.deskripsi.toLowerCase().includes(kw)));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">Belum ada menu tersimpan.</div>`;
    return;
  }

  filtered.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <div class="card-img-box">
        <img src="${item.gambar}" alt="${item.nama}" onerror="this.src='https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(item.nama)}'">
        <span class="card-cat-label">${item.labelKategori || "Menu"}</span>
      </div>
      <div class="card-content">
        <h4>${item.nama}</h4>
        <p class="card-desc">${item.deskripsi || ""}</p>
        <div class="card-footer">
          <span class="price-text">${formatRupiah(item.harga)}</span>
          <div class="card-action-btns">
            <button type="button" class="btn-edit" onclick="bukaModalEditMenu(${index})">Edit</button>
            <button type="button" class="btn-del-item" onclick="hapusMenu(${index})">Hapus</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function bukaModalTambahMenu() {
  editMenuIndex = null;
  document.getElementById("modalMenuTitle").textContent = "Tambah Menu Baru";
  document.getElementById("inputNamaMenu").value = "";
  document.getElementById("inputHargaMenu").value = "";
  document.getElementById("inputDescMenu").value = "";
  document.getElementById("inputGambarMenu").value = "";
  document.getElementById("selectKategoriMenu").value = "kopi";
  document.getElementById("menuFormModal").classList.add("active");
}

function bukaModalEditMenu(index) {
  editMenuIndex = index;
  const item = menuCustom[index];
  if (!item) return;

  document.getElementById("modalMenuTitle").textContent = "Edit Menu";
  document.getElementById("inputNamaMenu").value = item.nama;
  document.getElementById("inputHargaMenu").value = item.harga;
  document.getElementById("inputDescMenu").value = item.deskripsi || "";
  document.getElementById("inputGambarMenu").value = item.gambar || "";
  document.getElementById("selectKategoriMenu").value = item.kategori || "kopi";
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
  const katObj = DAFTAR_KATEGORI.find(k => k.id === kategori);
  const labelKategori = katObj ? katObj.nama : "Menu";
  const deskripsi = document.getElementById("inputDescMenu").value.trim();
  const gambar = document.getElementById("inputGambarMenu").value.trim() || `https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(nama)}`;

  if (!nama || !harga) {
    alert("Nama menu dan harga wajib diisi!");
    return;
  }

  if (editMenuIndex !== null) {
    menuCustom[editMenuIndex] = {
      id: menuCustom[editMenuIndex].id || Date.now(),
      nama, kategori, labelKategori, harga, deskripsi, gambar
    };
  } else {
    menuCustom.push({
      id: Date.now(),
      nama, kategori, labelKategori, harga, deskripsi, gambar
    });
  }

  sinkronKeCloud();
  tutupModalMenu();
  renderAdminMenu();
}

function hapusMenu(index) {
  if (confirm("Yakin ingin menghapus menu ini?")) {
    menuCustom.splice(index, 1);
    sinkronKeCloud();
    renderAdminMenu();
    tampilkanToast("Menu berhasil dihapus.");
  }
}

// QR Code Permanen (Hanya ID Toko, tidak berubah saat menu bertambah)
function generateQrCodeCard() {
  const storeId = storeIdentity.storeId || "caffe-santai-hihihi";
  const clientBaseUrl = storeIdentity.clientUrl || "https://aplikasi-umkm-five.vercel.app/";
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
  if (totalMenuBadge) totalMenuBadge.textContent = `Siap (${menuCustom.length} Menu tersimpan)`;
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
  document.getElementById("inputStoreId").value = storeIdentity.storeId || "";
  document.getElementById("inputStoreLogo").value = storeIdentity.logo;
  document.getElementById("inputStoreWa").value = storeIdentity.wa;
  document.getElementById("inputStoreQris").value = storeIdentity.qrisText || "";
  document.getElementById("inputClientUrl").value = storeIdentity.clientUrl || "";
  document.getElementById("storeModal").classList.add("active");
}

function tutupModalPengaturanToko() {
  document.getElementById("storeModal").classList.remove("active");
}

function simpanPengaturanToko(e) {
  e.preventDefault();
  storeIdentity.name = document.getElementById("inputStoreName").value.trim() || storeIdentity.name;
  const customId = document.getElementById("inputStoreId").value.trim();
  storeIdentity.storeId = customId ? generateStoreSlug(customId) : generateStoreSlug(storeIdentity.name);
  storeIdentity.logo = document.getElementById("inputStoreLogo").value.trim() || "cs";
  storeIdentity.wa = document.getElementById("inputStoreWa").value.trim() || "6287877611218";
  storeIdentity.qrisText = document.getElementById("inputStoreQris").value.trim() || "";
  storeIdentity.clientUrl = document.getElementById("inputClientUrl").value.trim() || "https://aplikasi-umkm-five.vercel.app/";

  sinkronKeCloud();
  applyStoreIdentity();
  tutupModalPengaturanToko();
  tampilkanToast("✓ Pengaturan toko berhasil disimpan!");
}

document.addEventListener("DOMContentLoaded", () => {
  const isAdminLogged = localStorage.getItem("umkm_admin_logged") === "true";
  const loginSection = document.getElementById("loginSection");
  const mainPanel = document.getElementById("mainPanel");
  const loginForm = document.getElementById("loginForm");

  if (isAdminLogged) {
    if (loginSection) loginSection.style.display = "none";
    if (mainPanel) mainPanel.style.display = "block";
    applyStoreIdentity();
    renderAdminMenu();
    sinkronKeCloud();
  } else {
    if (loginSection) loginSection.style.display = "flex";
    if (mainPanel) mainPanel.style.display = "none";
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const passInput = document.getElementById("adminPassword").value;
      if (passInput === ADMIN_PASS_VALID) {
        localStorage.setItem("umkm_admin_logged", "true");
        if (loginSection) loginSection.style.display = "none";
        if (mainPanel) mainPanel.style.display = "block";
        applyStoreIdentity();
        renderAdminMenu();
        sinkronKeCloud();
        tampilkanToast("✓ Berhasil masuk ke Panel Admin!");
      } else {
        alert("Sandi salah! Gunakan: Kernaden");
      }
    });
  }

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
      kataKunciCari = e.target.value.trim();
      renderAdminMenu();
    });
  }
});
