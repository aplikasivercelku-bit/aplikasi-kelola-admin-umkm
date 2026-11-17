const ADMIN_PASS_VALID = "Kernaden";

let storeIdentity = JSON.parse(localStorage.getItem("umkm_store_identity")) || {
  name: "Kedai Nusantara",
  logo: "KN",
  wa: "6287877611218",
  qrisText: "OLAN MAULANA Bank Mandiri 1630011235432",
  clientUrl: "https://aplikasi-umkm-five.vercel.app/"
};

let menuCustom = JSON.parse(localStorage.getItem("umkm_menu_custom")) || [];
let kataKunciCari = "";
let kataKunciCariAdminModal = "";
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
    document.title = "Panel Admin";
    return;
  }
  document.title = `Admin - ${storeIdentity.name}`;
  document.querySelectorAll("#navBrandTitle").forEach(el => el.textContent = storeIdentity.name);
  document.querySelectorAll("#navBrandLogo").forEach(el => el.textContent = storeIdentity.logo);
}

function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

function simpanStateLocal() {
  localStorage.setItem("umkm_menu_custom", JSON.stringify(menuCustom));
  localStorage.setItem("umkm_store_identity", JSON.stringify(storeIdentity));
  renderQrPreview();
}

function tampilkanToast(pesan) {
  const toast = document.getElementById("toastNotif");
  if (!toast) return;
  toast.textContent = pesan;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, 2400);
}

// Bangun URL lengkap berisi semua pengaturan toko & daftar menu yang terkompresi
function buildSyncedClientUrl() {
  const baseUrlInput = document.getElementById("settingClientUrl");
  let baseUrl = (baseUrlInput && baseUrlInput.value.trim()) ? baseUrlInput.value.trim() : (storeIdentity.clientUrl || "https://aplikasi-umkm-five.vercel.app/");
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = "https://" + baseUrl;
  }

  const payload = {
    s: {
      n: storeIdentity.name,
      l: storeIdentity.logo,
      w: storeIdentity.wa || "6287877611218",
      q: storeIdentity.qrisText || ""
    },
    m: menuCustom.map(item => ({
      i: item.id,
      n: item.nama,
      k: item.kategori,
      lk: item.labelKategori,
      h: item.harga,
      d: item.deskripsi,
      g: item.gambar
    }))
  };

  const jsonStr = JSON.stringify(payload);
  let encoded = "";
  if (typeof LZString !== "undefined") {
    encoded = LZString.compressToEncodedURIComponent(jsonStr);
  } else {
    encoded = btoa(unescape(encodeURIComponent(jsonStr)));
  }

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}data=${encoded}`;
}

function renderQrPreview() {
  const hiddenContainer = document.getElementById("hiddenQrRender");
  if (!hiddenContainer || typeof QRCode === "undefined") return;
  const fullClientUrl = buildSyncedClientUrl();
  hiddenContainer.innerHTML = "";
  new QRCode(hiddenContainer, {
    text: fullClientUrl,
    width: 240,
    height: 240,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L
  });
}

function renderMenu() {
  const container = document.getElementById("menuContainer");
  const counterEl = document.getElementById("menuCounter");
  if (!container) return;

  let menuTersaring = [...menuCustom];
  if (kataKunciCari !== "") {
    const keyword = kataKunciCari.toLowerCase();
    menuTersaring = menuTersaring.filter((item) =>
      item.nama.toLowerCase().includes(keyword) || item.deskripsi.toLowerCase().includes(keyword)
    );
  }

  if (counterEl) counterEl.textContent = `${menuTersaring.length} Menu`;
  container.innerHTML = "";

  if (menuTersaring.length === 0) {
    container.innerHTML = `<div class="empty-search-state" style="text-align:center; padding:30px; color:var(--text-muted);"><p>Belum ada menu kustom. Klik ikon ⚙️ di kanan atas untuk menambah menu.</p></div>`;
    return;
  }

  menuTersaring.forEach((item) => {
    const card = document.createElement("article");
    card.className = "menu-card";
    card.innerHTML = `
      <div class="card-img-box">
        <img src="${item.gambar}" alt="${item.nama}" onerror="this.src='https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(item.nama)}'">
        <span class="card-cat-label">${item.labelKategori}</span>
      </div>
      <div class="card-content">
        <h4>${item.nama}</h4>
        <p class="card-desc">${item.deskripsi}</p>
        <div class="card-footer"><span class="price-text">${formatRupiah(item.harga)}</span></div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderAdminCustomMenuList() {
  const container = document.getElementById("customMenuListAdmin");
  if (!container) return;

  let filteredList = menuCustom;
  if (kataKunciCariAdminModal !== "") {
    const kw = kataKunciCariAdminModal.toLowerCase();
    filteredList = menuCustom.filter(item => item.nama.toLowerCase().includes(kw));
  }

  let htmlContent = `<div style="margin-bottom: 12px;"><input type="text" id="searchAdminModalInput" placeholder="🔍 Cari menu..." value="${kataKunciCariAdminModal}" style="width: 100%; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-main); padding: 10px 14px; border-radius: 10px; outline: none;"></div>`;

  if (menuCustom.length === 0) {
    htmlContent += `<small style="color:var(--text-muted); display:block; text-align:center; padding: 10px;">Belum ada menu kustom.</small>`;
    container.innerHTML = htmlContent;
    return;
  }

  let itemsHtml = '<div style="display: flex; flex-direction: column; gap: 10px; max-height: 240px; overflow-y: auto; padding-right: 4px;">';
  filteredList.forEach((item) => {
    const realIndex = menuCustom.findIndex(m => m.id === item.id);
    itemsHtml += `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-dark); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); gap: 10px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${item.gambar}" style="width:42px; height:42px; object-fit:cover; border-radius:8px;" onerror="this.src='https://placehold.co/42'">
          <div>
            <strong style="font-size: 0.95rem; display:block; color:var(--text-main);">${item.nama}</strong>
            <small style="color: var(--accent);">${item.labelKategori} • ${formatRupiah(item.harga)}</small>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button type="button" onclick="mulaiEditMenuCustom(${realIndex})" style="padding: 6px 12px; font-size: 0.8rem; background: rgba(245, 158, 11, 0.15); border: 1px solid var(--accent); color: var(--accent); border-radius: 8px; cursor: pointer; font-weight: 600;">Edit</button>
          <button type="button" onclick="hapusMenuCustom(${realIndex})" style="padding: 6px 12px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.15); border: 1px solid var(--danger); color: var(--danger); border-radius: 8px; cursor: pointer; font-weight: 600;">Hapus</button>
        </div>
      </div>
    `;
  });
  itemsHtml += '</div>';
  container.innerHTML = htmlContent + itemsHtml;

  const searchInput = document.getElementById("searchAdminModalInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      kataKunciCariAdminModal = e.target.value.trim();
      renderAdminCustomMenuList();
      const updatedInput = document.getElementById("searchAdminModalInput");
      if (updatedInput) { updatedInput.focus(); updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length); }
    });
  }
}

function mulaiEditMenuCustom(index) {
  const item = menuCustom[index];
  if (!item) return;
  editMenuIndex = index;
  document.getElementById("addMenuName").value = item.nama;
  document.getElementById("addMenuCategory").value = item.kategori;
  document.getElementById("addMenuPrice").value = item.harga;
  document.getElementById("addMenuImgUrl").value = item.gambar;
  document.getElementById("addMenuDesc").value = item.deskripsi;
  document.getElementById("formMenuHeaderTitle").textContent = `✏️ Edit Menu: ${item.nama}`;
  document.getElementById("btnSaveNewMenu").textContent = "💾 Simpan Perubahan";
  tampilkanToast(`Mode Edit: ${item.nama}`);
}

function hapusMenuCustom(index) {
  if (confirm("Yakin ingin menghapus menu ini?")) {
    menuCustom.splice(index, 1);
    simpanStateLocal();
    renderMenu();
    renderAdminCustomMenuList();
    tampilkanToast("✓ Menu dihapus!");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyStoreIdentity();
  const loginScreen = document.getElementById("loginScreen");
  const mainAppContent = document.getElementById("mainAppContent");
  if (localStorage.getItem("umkm_admin_logged") === "true") {
    loginScreen.style.display = "none";
    mainAppContent.style.display = "block";
    inisisasiAplikasiUtama();
  }

  document.getElementById("btnTogglePassword").addEventListener("click", () => {
    const inputPass = document.getElementById("inputAdminPassword");
    inputPass.type = inputPass.type === "password" ? "text" : "password";
  });

  document.getElementById("btnLoginAdmin").addEventListener("click", () => {
    if (document.getElementById("inputAdminPassword").value.trim() === ADMIN_PASS_VALID) {
      localStorage.setItem("umkm_admin_logged", "true");
      loginScreen.style.display = "none";
      mainAppContent.style.display = "block";
      inisisasiAplikasiUtama();
      document.getElementById("settingsModal").classList.add("active");
    } else {
      alert("Sandi Salah! Gunakan: Kernaden");
    }
  });

  document.getElementById("btnLogoutApp").addEventListener("click", () => {
    localStorage.removeItem("umkm_admin_logged");
    location.reload();
  });
});

function inisisasiAplikasiUtama() {
  document.getElementById("settingStoreName").value = storeIdentity.name;
  document.getElementById("settingStoreLogo").value = storeIdentity.logo;
  if (document.getElementById("settingStoreWa")) {
    document.getElementById("settingStoreWa").value = storeIdentity.wa || "6287877611218";
  }
  document.getElementById("settingQrisText").value = storeIdentity.qrisText || "";
  if (document.getElementById("settingClientUrl")) {
    document.getElementById("settingClientUrl").value = storeIdentity.clientUrl || "https://aplikasi-umkm-five.vercel.app/";
  }

  renderMenu();
  renderQrPreview();

  const searchInput = document.getElementById("searchMenuInput");
  const btnClearSearch = document.getElementById("btnClearSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      kataKunciCari = e.target.value.trim();
      if (btnClearSearch) btnClearSearch.style.display = kataKunciCari !== "" ? "flex" : "none";
      renderMenu();
    });
  }
  if (btnClearSearch) {
    btnClearSearch.addEventListener("click", () => {
      kataKunciCari = "";
      searchInput.value = "";
      btnClearSearch.style.display = "none";
      renderMenu();
    });
  }

  document.getElementById("btnOpenSettings").addEventListener("click", () => {
    renderAdminCustomMenuList();
    renderQrPreview();
    document.getElementById("settingsModal").classList.add("active");
  });
  document.getElementById("btnCloseSettingsModal").addEventListener("click", () => {
    document.getElementById("settingsModal").classList.remove("active");
  });

  const tabButtons = document.querySelectorAll(".admin-tab-btn");
  const tabContents = {
    store: document.getElementById("tabContentStore"),
    menu: document.getElementById("tabContentMenu"),
    barcode: document.getElementById("tabContentBarcode")
  };

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      Object.values(tabContents).forEach(tc => { if (tc) tc.style.display = "none"; });
      btn.classList.add("active");
      const targetTab = btn.getAttribute("data-tab");
      if (tabContents[targetTab]) tabContents[targetTab].style.display = "block";
      if (targetTab === "barcode") renderQrPreview();
    });
  });

  const clientUrlInput = document.getElementById("settingClientUrl");
  if (clientUrlInput) {
    clientUrlInput.addEventListener("input", (e) => {
      storeIdentity.clientUrl = e.target.value.trim();
      simpanStateLocal();
    });
  }

  document.getElementById("btnSaveStoreSettings").addEventListener("click", () => {
    const name = document.getElementById("settingStoreName").value.trim();
    const logo = document.getElementById("settingStoreLogo").value.trim();
    const wa = document.getElementById("settingStoreWa") ? document.getElementById("settingStoreWa").value.trim() : "6287877611218";
    if (!name) return alert("Nama toko wajib diisi!");
    storeIdentity.name = name;
    storeIdentity.logo = logo || name.substring(0, 2).toUpperCase();
    storeIdentity.wa = wa || "6287877611218";
    simpanStateLocal();
    applyStoreIdentity();
    tampilkanToast("✓ Identitas toko diperbarui & siap di-barcode!");
  });

  document.getElementById("btnSaveQrisSettings").addEventListener("click", () => {
    const qrisText = document.getElementById("settingQrisText").value.trim();
    storeIdentity.qrisText = qrisText;
    simpanStateLocal();
    tampilkanToast("✓ Info pembayaran berhasil disimpan!");
  });

  document.getElementById("btnSaveNewMenu").addEventListener("click", () => {
    const name = document.getElementById("addMenuName").value.trim();
    const kategori = document.getElementById("addMenuCategory").value;
    const harga = parseInt(document.getElementById("addMenuPrice").value);
    const imgUrl = document.getElementById("addMenuImgUrl").value.trim();
    const desc = document.getElementById("addMenuDesc").value.trim();

    if (!name || isNaN(harga)) return alert("Lengkapi Nama dan Harga Menu!");

    const katObj = DAFTAR_KATEGORI.find(k => k.id === kategori);
    const labelKategori = katObj ? katObj.nama : "Lainnya";
    const gambarSrc = imgUrl || `https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(name)}`;

    if (editMenuIndex !== null && menuCustom[editMenuIndex]) {
      menuCustom[editMenuIndex] = {
        ...menuCustom[editMenuIndex],
        nama: name, kategori, labelKategori, harga,
        deskripsi: desc || "Menu pilihan kedai.",
        gambar: gambarSrc
      };
      tampilkanToast("✓ Menu diperbarui!");
      editMenuIndex = null;
    } else {
      menuCustom.push({
        id: Date.now(),
        nama: name, kategori, labelKategori, harga,
        deskripsi: desc || "Menu pilihan kedai.",
        gambar: gambarSrc
      });
      tampilkanToast("✓ Menu ditambahkan!");
    }

    document.getElementById("addMenuName").value = "";
    document.getElementById("addMenuPrice").value = "";
    document.getElementById("addMenuImgUrl").value = "";
    document.getElementById("addMenuDesc").value = "";
    document.getElementById("formMenuHeaderTitle").textContent = "Tambah Menu Baru & Link Foto";
    document.getElementById("btnSaveNewMenu").textContent = "Simpan & Perbarui Data";

    simpanStateLocal();
    renderMenu();
    renderAdminCustomMenuList();
  });

  document.getElementById("btnDownloadBarcodeQr").addEventListener("click", () => {
    if (typeof QRCode === "undefined") return alert("Library QRCode belum termuat.");
    const fullClientUrl = buildSyncedClientUrl();
    const tempContainer = document.createElement("div");
    new QRCode(tempContainer, {
      text: fullClientUrl,
      width: 360,
      height: 360,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L
    });

    setTimeout(() => {
      const qrCanvas = tempContainer.querySelector("canvas");
      if (qrCanvas) {
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = 424; finalCanvas.height = 424;
        const ctx = finalCanvas.getContext("2d");
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 424, 424);
        ctx.drawImage(qrCanvas, 32, 32, 360, 360);
        finalCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `barcode_menu_${storeIdentity.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.png`;
          link.click();
          tampilkanToast("✓ Barcode Tersinkronisasi Berhasil Diunduh!");
        }, "image/png");
      }
    }, 250);
  });
}
