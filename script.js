const ADMIN_PASS_VALID = "Kernaden";
// Backend Cloud Sync gratis & instan (KVDB / JSONBlob fallback) agar 1 Barcode bisa dipakai selamanya tanpa download ulang
const CLOUD_SYNC_ENDPOINT = "https://kvdb.io/A9xK7mP2qL8vR4nW6tY1zB";

function generateStoreSlug(name) {
  return (name || "umkm-store")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "umkm-store";
}

let savedIdentity = JSON.parse(localStorage.getItem("umkm_store_identity")) || {};
let storeIdentity = {
  storeId: savedIdentity.storeId || generateStoreSlug(savedIdentity.name || "Caffe Santai HIHIHI"),
  name: savedIdentity.name || "Caffe Santai HIHIHI",
  logo: savedIdentity.logo || "CS",
  wa: savedIdentity.wa || "6287877611218",
  qrisText: savedIdentity.qrisText || "OLAN MAULANA Bank Mandiri 1630011235432",
  clientUrl: savedIdentity.clientUrl || "https://aplikasi-umkm-five.vercel.app/"
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
  return "Rp " + Number(angka).toLocaleString("id-ID");
}

function tampilkanToast(pesan) {
  const toast = document.getElementById("toastNotif");
  if (!toast) return;
  toast.textContent = pesan;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, 2600);
}

async function pushDataToCloudSync() {
  const indicator = document.getElementById("syncStatusIndicator");
  if (indicator) {
    indicator.style.color = "#fbbf24";
    indicator.textContent = "⏳ Menyinkronkan menu ke Cloud...";
  }
  const payload = {
    updatedAt: Date.now(),
    storeId: storeIdentity.storeId,
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
      h: Number(item.harga),
      d: item.deskripsi || "",
      g: item.gambar || ""
    }))
  };
  try {
    const res = await fetch(`${CLOUD_SYNC_ENDPOINT}/store_${encodeURIComponent(storeIdentity.storeId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      if (indicator) {
        indicator.style.color = "#4ade80";
        indicator.textContent = `☁️ Tersinkron ke Cloud (${menuCustom.length} Menu) • 1 Barcode Aktif`;
      }
      return true;
    }
  } catch (e) {
    console.warn("Cloud sync offline, menggunakan fallback URL:", e);
  }
  if (indicator) {
    indicator.style.color = "#4ade80";
    indicator.textContent = `☁️ Siap (${menuCustom.length} Menu tersimpan)`;
  }
  return false;
}

function simpanStateLocal() {
  localStorage.setItem("umkm_menu_custom", JSON.stringify(menuCustom));
  localStorage.setItem("umkm_store_identity", JSON.stringify(storeIdentity));
  renderQrPreview();
  pushDataToCloudSync();
}

// PERBAIKAN ADMIN 1: QR PERMANEN - Hanya ?store=, TANPA ?data=
function buildSyncedClientUrl() {
  const latestStore = JSON.parse(localStorage.getItem("umkm_store_identity")) || storeIdentity;
  const baseUrlInput = document.getElementById("settingClientUrl");
  let baseUrl = (baseUrlInput && baseUrlInput.value.trim()) ? baseUrlInput.value.trim() : (latestStore.clientUrl || "https://aplikasi-umkm-five.vercel.app/");
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = "https://" + baseUrl;
  }
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}store=${encodeURIComponent(latestStore.storeId)}`;
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
    correctLevel: QRCode.CorrectLevel.M
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
  document.getElementById("btnSaveNewMenu").textContent = "💾 Simpan & Sinkronkan Perubahan";
  tampilkanToast(`Mode Edit: ${item.nama}`);
}

function hapusMenuCustom(index) {
  if (confirm("Yakin ingin menghapus menu ini?")) {
    menuCustom.splice(index, 1);
    simpanStateLocal();
    renderMenu();
    renderAdminCustomMenuList();
    tampilkanToast("✓ Menu dihapus & disinkronkan!");
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function downloadStyledBarcodeCard() {
  if (typeof QRCode === "undefined") return alert("Library QRCode belum termuat.");
  await pushDataToCloudSync();
  const fullClientUrl = buildSyncedClientUrl();
  const tempContainer = document.createElement("div");
  new QRCode(tempContainer, {
    text: fullClientUrl,
    width: 420,
    height: 420,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  setTimeout(() => {
    const qrCanvas = tempContainer.querySelector("canvas");
    if (!qrCanvas) return alert("Gagal merender QR Code.");
    const W = 640;
    const H = 920;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = W;
    finalCanvas.height = H;
    const ctx = finalCanvas.getContext("2d");
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#60a5fa");
    bgGrad.addColorStop(0.5, "#3b82f6");
    bgGrad.addColorStop(1, "#2563eb");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    const cardX = 36;
    const cardY = 36;
    const cardW = W - 72;
    const cardH = H - 72;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.clip();
    ctx.strokeStyle = "rgba(203, 213, 225, 0.45)";
    ctx.lineWidth = 2;
    for (let gx = cardX; gx < cardX + cardW; gx += 40) {
      for (let gy = 480; gy < cardY + cardH; gy += 40) {
        ctx.strokeRect(gx + 6, gy + 6, 28, 28);
        ctx.beginPath();
        ctx.moveTo(gx + 20, gy);
        ctx.lineTo(gx + 20, gy + 40);
        ctx.moveTo(gx, gy + 20);
        ctx.lineTo(gx + 40, gy + 20);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(cardX, 230);
    ctx.lineTo(cardX + 75, 320);
    ctx.lineTo(cardX, 410);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cardX + cardW, cardY + cardH - 170);
    ctx.lineTo(cardX + cardW, cardY + cardH);
    ctx.lineTo(cardX + cardW - 170, cardY + cardH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(cardX + cardW, cardY + cardH - 195);
    ctx.lineTo(cardX + cardW, cardY + cardH - 170);
    ctx.lineTo(cardX + cardW - 170, cardY + cardH);
    ctx.lineTo(cardX + cardW - 195, cardY + cardH);
    ctx.closePath();
    ctx.fill();
    const logoText = (storeIdentity.logo || "CS").toUpperCase();
    const logoBoxX = cardX + 36;
    const logoBoxY = cardY + 34;
    const logoGrad = ctx.createLinearGradient(logoBoxX, logoBoxY, logoBoxX + 64, logoBoxY + 64);
    logoGrad.addColorStop(0, "#f59e0b");
    logoGrad.addColorStop(1, "#b45309");
    ctx.fillStyle = logoGrad;
    roundRect(ctx, logoBoxX, logoBoxY, 64, 64, 16);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(logoText, logoBoxX + 32, logoBoxY + 33);
    ctx.textAlign = "left";
    ctx.fillStyle = "#0f172a";
    ctx.font = "900 22px 'Segoe UI', sans-serif";
    ctx.fillText("MENU DIGITAL", logoBoxX + 78, logoBoxY + 22);
    ctx.fillStyle = "#475569";
    ctx.font = "600 13px 'Segoe UI', sans-serif";
    ctx.fillText("Pesan Cepat Tanpa Antre", logoBoxX + 78, logoBoxY + 46);
    const badgeRightX = cardX + cardW - 110;
    const badgeRightY = cardY + 38;
    ctx.fillStyle = "#fef2f2";
    roundRect(ctx, badgeRightX, badgeRightY, 74, 54, 12);
    ctx.fill();
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 1.5;
    roundRect(ctx, badgeRightX, badgeRightY, 74, 54, 12);
    ctx.stroke();
    ctx.fillStyle = "#dc2626";
    ctx.font = "900 15px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCAN", badgeRightX + 37, badgeRightY + 21);
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "800 12px 'Segoe UI', sans-serif";
    ctx.fillText("ORDER", badgeRightX + 37, badgeRightY + 39);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cardX + 36, cardY + 118);
    ctx.lineTo(cardX + cardW - 36, cardY + 118);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#0f172a";
    ctx.font = "900 28px 'Segoe UI', sans-serif";
    ctx.fillText(storeIdentity.name.toUpperCase(), W / 2, cardY + 162);
    const qrisInfo = storeIdentity.qrisText || "OLAN MAULANA Bank Mandiri 1630011235432";
    ctx.fillStyle = "#475569";
    ctx.font = "600 14px 'Segoe UI', sans-serif";
    if (qrisInfo.length > 48) {
      ctx.fillText(qrisInfo.substring(0, 48), W / 2, cardY + 194);
      ctx.fillText(qrisInfo.substring(48), W / 2, cardY + 214);
    } else {
      ctx.fillText(qrisInfo, W / 2, cardY + 196);
    }
    const qrBoxSize = 380;
    const qrBoxX = (W - qrBoxSize) / 2;
    const qrBoxY = cardY + 232;
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
    ctx.stroke();
    ctx.restore();
    ctx.drawImage(qrCanvas, qrBoxX + 18, qrBoxY + 18, qrBoxSize - 36, qrBoxSize - 36);
    const centerBadgeSize = 44;
    const centerX = W / 2 - centerBadgeSize / 2;
    const centerY = qrBoxY + qrBoxSize / 2 - centerBadgeSize / 2;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, centerX - 4, centerY - 4, centerBadgeSize + 8, centerBadgeSize + 8, 12);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    roundRect(ctx, centerX, centerY, centerBadgeSize, centerBadgeSize, 9);
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.font = "900 15px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(logoText, W / 2, qrBoxY + qrBoxSize / 2 + 1);
    ctx.fillStyle = "#0f172a";
    ctx.font = "900 18px 'Segoe UI', sans-serif";
    ctx.fillText("SATU BARCODE UNTUK SEMUA MENU", W / 2, qrBoxY + qrBoxSize + 38);
    ctx.fillStyle = "#475569";
    ctx.font = "500 13px 'Segoe UI', sans-serif";
    ctx.fillText("Scan menggunakan Kamera HP / Google Lens untuk memesan", W / 2, qrBoxY + qrBoxSize + 64);
    ctx.textAlign = "left";
    ctx.fillStyle = "#334155";
    ctx.font = "600 12px 'Segoe UI', sans-serif";
    ctx.fillText(`ID Toko: ${storeIdentity.storeId}`, cardX + 36, cardY + cardH - 48);
    ctx.fillStyle = "#64748b";
    ctx.font = "500 12px 'Segoe UI', sans-serif";
    ctx.fillText(`WhatsApp Pesanan: +${storeIdentity.wa || "6287877611218"}`, cardX + 36, cardY + cardH - 28);
    ctx.restore();
    finalCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kartu_barcode_${storeIdentity.storeId}.png`;
      link.click();
      tampilkanToast("✓ Kartu Barcode Permanen Berhasil Diunduh!");
    }, "image/png");
  }, 250);
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
  if (document.getElementById("settingStoreId")) {
    document.getElementById("settingStoreId").value = storeIdentity.storeId;
  }
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
  pushDataToCloudSync();
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
      if (targetTab === "barcode") {
        renderQrPreview();
        pushDataToCloudSync();
      }
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
    const rawId = document.getElementById("settingStoreId") ? document.getElementById("settingStoreId").value.trim() : "";
    const name = document.getElementById("settingStoreName").value.trim();
    const logo = document.getElementById("settingStoreLogo").value.trim();
    const wa = document.getElementById("settingStoreWa") ? document.getElementById("settingStoreWa").value.trim() : "6287877611218";
    if (!name) return alert("Nama toko wajib diisi!");
    // PERBAIKAN ADMIN 2: Kunci storeId - jangan ubah kalau sudah ada
    if (!storeIdentity.storeId) {
      storeIdentity.storeId = generateStoreSlug(rawId || name);
    }
    if (document.getElementById("settingStoreId")) {
      document.getElementById("settingStoreId").value = storeIdentity.storeId;
    }
    storeIdentity.name = name;
    storeIdentity.logo = logo || name.substring(0, 2).toUpperCase();
    storeIdentity.wa = wa || "6287877611218";
    simpanStateLocal();
    applyStoreIdentity();
    tampilkanToast("✓ Identitas toko disimpan & disinkronkan!");
  });
  document.getElementById("btnSaveQrisSettings").addEventListener("click", () => {
    const qrisText = document.getElementById("settingQrisText").value.trim();
    storeIdentity.qrisText = qrisText;
    simpanStateLocal();
    tampilkanToast("✓ Info pembayaran disimpan & disinkronkan!");
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
      tampilkanToast("✓ Menu diperbarui & otomatis masuk ke Client!");
      editMenuIndex = null;
    } else {
      menuCustom.push({
        id: Date.now(),
        nama: name, kategori, labelKategori, harga,
        deskripsi: desc || "Menu pilihan kedai.",
        gambar: gambarSrc
      });
      tampilkanToast("✓ Menu baru ditambahkan & otomatis masuk ke Client!");
    }
    document.getElementById("addMenuName").value = "";
    document.getElementById("addMenuPrice").value = "";
    document.getElementById("addMenuImgUrl").value = "";
    document.getElementById("addMenuDesc").value = "";
    document.getElementById("formMenuHeaderTitle").textContent = "Tambah Menu Baru & Link Foto";
    document.getElementById("btnSaveNewMenu").textContent = "Simpan & Sinkronkan ke Cloud";
    simpanStateLocal();
    renderMenu();
    renderAdminCustomMenuList();
  });
  document.getElementById("btnDownloadBarcodeQr").addEventListener("click", downloadStyledBarcodeCard);
}
