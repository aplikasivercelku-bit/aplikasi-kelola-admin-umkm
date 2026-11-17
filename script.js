const ADMIN_PASS_VALID = "Kernaden";

let storeIdentity = JSON.parse(localStorage.getItem("umkm_store_identity")) || {
  name: "",
  logo: ""
};

let menuCustom = JSON.parse(localStorage.getItem("umkm_menu_custom")) || [];
let DATA_MENU = [...menuCustom];
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
    document.querySelectorAll("#loginLogoText").forEach(el => {
      el.textContent = "ADM";
      el.style.background = "var(--bg-elevated)";
      el.style.color = "var(--text-muted)";
    });
    document.querySelectorAll("#loginTitleText").forEach(el => el.textContent = "Panel Admin");
    return;
  }

  document.title = `Admin - ${storeIdentity.name}`;
  document.querySelectorAll("#navBrandTitle").forEach(el => el.textContent = storeIdentity.name);
  document.querySelectorAll("#navBrandLogo").forEach(el => {
    el.textContent = storeIdentity.logo;
    el.style.background = "";
    el.style.color = "";
  });
  document.querySelectorAll("#loginLogoText").forEach(el => {
    el.textContent = storeIdentity.logo;
    el.style.background = "";
    el.style.color = "";
  });
  document.querySelectorAll("#loginTitleText").forEach(el => el.textContent = `Admin - ${storeIdentity.name}`);
}

function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

function simpanStateLocal() {
  localStorage.setItem("umkm_menu_custom", JSON.stringify(menuCustom));
  localStorage.setItem("umkm_store_identity", JSON.stringify(storeIdentity));
}

function tampilkanToast(pesan) {
  const toast = document.getElementById("toastNotif");
  if (!toast) return;
  toast.textContent = pesan;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, 2400);
}

function renderMenu() {
  const container = document.getElementById("menuContainer");
  const counterEl = document.getElementById("menuCounter");
  if (!container) return;

  let menuTersaring = [...DATA_MENU];

  if (kataKunciCari !== "") {
    const keyword = kataKunciCari.toLowerCase();
    menuTersaring = menuTersaring.filter((item) =>
      item.nama.toLowerCase().includes(keyword) ||
      item.deskripsi.toLowerCase().includes(keyword)
    );
  }

  counterEl.textContent = `${menuTersaring.length} Menu`;
  container.innerHTML = "";

  if (menuTersaring.length === 0) {
    container.innerHTML = `<div class="empty-search-state"><p>Belum ada menu kustom. Klik ikon roda gigi di pojok kanan atas untuk menambahkan menu.</p></div>`;
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
        <div class="card-footer">
          <span class="price-text">${formatRupiah(item.harga)}</span>
        </div>
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
    filteredList = menuCustom.filter(item => 
      item.nama.toLowerCase().includes(kw) || 
      item.labelKategori.toLowerCase().includes(kw) ||
      item.deskripsi.toLowerCase().includes(kw)
    );
  }

  let htmlContent = `
    <div style="margin-bottom: 12px;">
      <input type="text" id="searchAdminModalInput" placeholder="🔍 Cari menu di daftar kustom..." value="${kataKunciCariAdminModal}" style="width: 100%; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-main); padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; outline: none;">
    </div>
  `;

  if (menuCustom.length === 0) {
    htmlContent += `<small style="color:var(--text-muted); display:block; text-align:center; padding: 10px;">Belum ada menu tambahan kustom.</small>`;
    container.innerHTML = htmlContent;
    setupAdminSearchListener();
    return;
  }

  if (filteredList.length === 0) {
    htmlContent += `<small style="color:var(--text-muted); display:block; text-align:center; padding: 10px;">Menu "${kataKunciCariAdminModal}" tidak ditemukan.</small>`;
    container.innerHTML = htmlContent;
    setupAdminSearchListener();
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
          <button onclick="mulaiEditMenuCustom(${realIndex})" style="padding: 6px 12px; font-size: 0.8rem; background: rgba(245, 158, 11, 0.15); border: 1px solid var(--accent); color: var(--accent); border-radius: 8px; cursor: pointer; font-weight: 600;">Edit</button>
          <button onclick="hapusMenuCustom(${realIndex})" style="padding: 6px 12px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.15); border: 1px solid var(--danger); color: var(--danger); border-radius: 8px; cursor: pointer; font-weight: 600;">Hapus</button>
        </div>
      </div>
    `;
  });
  itemsHtml += '</div>';

  container.innerHTML = htmlContent + itemsHtml;
  setupAdminSearchListener();
}

function setupAdminSearchListener() {
  const searchInput = document.getElementById("searchAdminModalInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      kataKunciCariAdminModal = e.target.value.trim();
      renderAdminCustomMenuList();
      const updatedInput = document.getElementById("searchAdminModalInput");
      if (updatedInput) {
        updatedInput.focus();
        updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length);
      }
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
  
  const imgInputUrl = document.getElementById("addMenuImageUrl");
  if (imgInputUrl) {
    imgInputUrl.value = item.gambar.startsWith("http") ? item.gambar : "";
  }

  document.getElementById("addMenuDesc").value = item.deskripsi;

  const formHeader = document.getElementById("formMenuHeaderTitle");
  if (formHeader) formHeader.textContent = `✏️ Edit Menu: ${item.nama}`;

  const btnSave = document.getElementById("btnSaveNewMenu");
  btnSave.textContent = "💾 Simpan Perubahan Menu";

  let btnCancel = document.getElementById("btnCancelEditMenu");
  if (!btnCancel) {
    btnCancel = document.createElement("button");
    btnCancel.id = "btnCancelEditMenu";
    btnCancel.type = "button";
    btnCancel.textContent = "Batal Edit";
    btnCancel.style.cssText = "width: 100%; margin-top: 8px; padding: 11px; border-radius: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-muted); font-weight: 700; cursor: pointer;";
    btnCancel.addEventListener("click", batalEditMenu);
    btnSave.parentNode.appendChild(btnCancel);
  }
  btnCancel.style.display = "block";

  document.getElementById("formMenuHeaderTitle").scrollIntoView({ behavior: "smooth", block: "center" });
  tampilkanToast(`Mode Edit: ${item.nama}`);
}

function batalEditMenu() {
  editMenuIndex = null;
  document.getElementById("addMenuName").value = "";
  document.getElementById("addMenuPrice").value = "";
  const imgInputUrl = document.getElementById("addMenuImageUrl");
  if (imgInputUrl) imgInputUrl.value = "";
  document.getElementById("addMenuDesc").value = "";

  const formHeader = document.getElementById("formMenuHeaderTitle");
  if (formHeader) formHeader.textContent = "Tambah Menu Baru & Link Gambar";

  const btnSave = document.getElementById("btnSaveNewMenu");
  if (btnSave) btnSave.textContent = "Simpan & Perbarui Data";

  const btnCancel = document.getElementById("btnCancelEditMenu");
  if (btnCancel) btnCancel.style.display = "none";
}

function hapusMenuCustom(index) {
  if (confirm("Yakin ingin menghapus menu ini?")) {
    if (editMenuIndex === index) {
      batalEditMenu();
    } else if (editMenuIndex !== null && editMenuIndex > index) {
      editMenuIndex--;
    }

    menuCustom.splice(index, 1);
    DATA_MENU = [...menuCustom];
    simpanStateLocal();
    renderMenu();
    renderAdminCustomMenuList();
    tampilkanToast("✓ Menu berhasil dihapus!");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyStoreIdentity();

  const loginScreen = document.getElementById("loginScreen");
  const mainAppContent = document.getElementById("mainAppContent");
  const isAdminLogged = localStorage.getItem("umkm_admin_logged");

  if (isAdminLogged === "true") {
    loginScreen.style.display = "none";
    mainAppContent.style.display = "block";
    inisisasiAplikasiUtama();
  } else {
    loginScreen.style.display = "flex";
    mainAppContent.style.display = "none";
  }

  const btnTogglePass = document.getElementById("btnTogglePassword");
  const inputPass = document.getElementById("inputAdminPassword");
  if (btnTogglePass && inputPass) {
    btnTogglePass.addEventListener("click", () => {
      inputPass.type = inputPass.type === "password" ? "text" : "password";
      btnTogglePass.textContent = inputPass.type === "password" ? "Lihat" : "Tutup";
    });
  }

  document.getElementById("btnLoginAdmin").addEventListener("click", () => {
    if (inputPass.value.trim() === ADMIN_PASS_VALID) {
      if (!storeIdentity.name) {
        storeIdentity.name = "Kedai Nusantara";
        storeIdentity.logo = "KN";
        simpanStateLocal();
      }
      localStorage.setItem("umkm_admin_logged", "true");
      loginScreen.style.display = "none";
      mainAppContent.style.display = "block";
      inisisasiAplikasiUtama();
      renderAdminCustomMenuList();
      document.getElementById("settingsModal").classList.add("active");
      tampilkanToast("✓ Login Admin Berhasil!");
    } else {
      alert("Sandi Admin salah! Gunakan: Kernaden");
    }
  });

  document.getElementById("btnLogoutApp").addEventListener("click", () => {
    if (confirm("Yakin ingin keluar dari sesi admin?")) {
      localStorage.removeItem("umkm_admin_logged");
      location.reload();
    }
  });
});

function inisisasiAplikasiUtama() {
  applyStoreIdentity();

  document.getElementById("settingStoreName").value = storeIdentity.name;
  document.getElementById("settingStoreLogo").value = storeIdentity.logo;

  // Pastikan form input foto file lama dihapus dan sepenuhnya menggunakan Link URL + tombol converter
  const formMenuBox = document.getElementById("tabContentMenu");
  if (formMenuBox) {
    const oldFileInputContainer = document.getElementById("addMenuImageFile")?.parentElement;
    if (oldFileInputContainer) {
      oldFileInputContainer.innerHTML = `
        <label style="font-size:0.82rem; color:var(--text-muted); display:block; margin-bottom:4px;">Link Gambar (URL Eksternal)</label>
        <input type="url" id="addMenuImageUrl" placeholder="https://..." style="width: 100%; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-main); padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; outline: none; margin-bottom: 6px;">
        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">
          Butuh link gambar? Gunakan konverter: <a href="https://sigmawire.net/image-to-url-converter" target="_blank" style="color: var(--accent); text-decoration: underline;">sigmawire.net/image-to-url-converter</a>
        </small>
      `;
    }
  }

  const tabBarcodeBox = document.getElementById("tabContentBarcode");
  if (tabBarcodeBox && !document.getElementById("importAdminJsonInput")) {
    const importDiv = document.createElement("div");
    importDiv.style.cssText = "margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);";
    importDiv.innerHTML = `
      <h4 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--text-main);">📥 Import Data Barcode / JSON</h4>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">Unggah file gambar Barcode (.png/.jpg) atau file JSON untuk memulihkan data toko dan menu.</p>
      <input type="file" id="importAdminJsonInput" accept=".png,.jpg,.jpeg,.json" style="width: 100%; margin-bottom: 10px; font-size: 0.85rem; color: var(--text-main);">
      <button id="btnProcessImportAdmin" type="button" style="width: 100%; padding: 11px; border-radius: 12px; background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-main); font-weight: 700; cursor: pointer;">Proses Import Data</button>
    `;
    tabBarcodeBox.appendChild(importDiv);

    document.getElementById("btnProcessImportAdmin").addEventListener("click", async () => {
      const fileInput = document.getElementById("importAdminJsonInput");
      if (fileInput.files.length === 0) {
        alert("Pilih file gambar Barcode (.png/.jpg) atau JSON terlebih dahulu!");
        return;
      }

      const file = fileInput.files[0];
      tampilkanToast("Memproses file import...");

      const terapkanDataImpor = (parsedData) => {
        let listMenuParsed = [];
        if (parsedData && typeof parsedData === "object" && !Array.isArray(parsedData)) {
          if (parsedData.store) {
            storeIdentity = {
              name: parsedData.store.name || storeIdentity.name,
              logo: parsedData.store.logo || storeIdentity.logo
            };
            document.getElementById("settingStoreName").value = storeIdentity.name;
            document.getElementById("settingStoreLogo").value = storeIdentity.logo;
          }
          if (Array.isArray(parsedData.menus)) {
            listMenuParsed = parsedData.menus;
          }
        } else if (Array.isArray(parsedData)) {
          listMenuParsed = parsedData;
        }

        if (listMenuParsed.length > 0) {
          menuCustom = listMenuParsed.map(m => ({
            id: m.id || Date.now() + Math.random(),
            nama: m.n || m.nama || "Menu",
            kategori: m.k || m.kategori || "kopi",
            labelKategori: m.lk || m.labelKategori || "Menu",
            harga: m.h || m.harga || 0,
            deskripsi: m.d || m.deskripsi || "",
            gambar: m.g || m.gambar || m.img || `https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(m.n || m.nama || "Menu")}`
          }));

          DATA_MENU = [...menuCustom];
          simpanStateLocal();
          applyStoreIdentity();
          renderMenu();
          renderAdminCustomMenuList();
          tampilkanToast("✓ Berhasil Import Data Toko & Menu!");
          return true;
        }
        return false;
      };

      // Jika file berupa JSON
      if (file.name.endsWith(".json") || file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = function(ev) {
          try {
            const parsed = JSON.parse(ev.target.result);
            if (!terapkanDataImpor(parsed)) {
              alert("Format data JSON tidak valid atau kosong.");
            }
          } catch (err) {
            alert("Gagal membaca file JSON.");
          }
        };
        reader.readAsText(file);
        return;
      }

      // Jika file berupa Gambar (PNG/JPG), coba scan QR code via Html5Qrcode, atau baca metadata ekor file
      try {
        const html5QrCode = new Html5Qrcode("hiddenQrRender");
        const decodedText = await html5QrCode.scanFile(file, true);
        html5QrCode.clear();
        
        const parsedData = JSON.parse(decodedText);
        if (terapkanDataImpor(parsedData)) return;
      } catch (err) {
        // Fallback membaca metadata biner ekor file PNG
        const reader = new FileReader();
        reader.onload = function(ev) {
          const rawContent = ev.target.result;
          const marker = "\n---UMKM_DATA_START---\n";
          if (rawContent.includes(marker)) {
            try {
              const jsonPart = rawContent.split(marker)[1];
              const parsedData = JSON.parse(jsonPart);
              if (terapkanDataImpor(parsedData)) return;
            } catch (e) {}
          }
          alert("Gagal memindai barcode dari file gambar ini. Pastikan mengunggah file Barcode resmi dari Admin.");
        };
        reader.readAsText(file);
      }
    });
  }

  DATA_MENU = [...menuCustom];
  renderMenu();

  const searchInput = document.getElementById("searchMenuInput");
  const btnClearSearch = document.getElementById("btnClearSearch");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      kataKunciCari = e.target.value.trim();
      btnClearSearch.style.display = kataKunciCari !== "" ? "flex" : "none";
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

  const tabButtons = document.querySelectorAll(".admin-tab-btn");
  const tabContents = {
    store: document.getElementById("tabContentStore"),
    menu: document.getElementById("tabContentMenu"),
    barcode: document.getElementById("tabContentBarcode")
  };

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      Object.values(tabContents).forEach(tc => tc.style.display = "none");

      btn.classList.add("active");
      const targetTab = btn.getAttribute("data-tab");
      if (tabContents[targetTab]) {
        tabContents[targetTab].style.display = "block";
      }
    });
  });

  const settingsModal = document.getElementById("settingsModal");
  document.getElementById("btnOpenSettings").addEventListener("click", () => {
    kataKunciCariAdminModal = "";
    renderAdminCustomMenuList();
    settingsModal.classList.add("active");
  });
  document.getElementById("btnCloseSettingsModal").addEventListener("click", () => {
    batalEditMenu();
    settingsModal.classList.remove("active");
  });
  settingsModal.addEventListener("click", (e) => {
    if (e.target.id === "settingsModal") {
      batalEditMenu();
      settingsModal.classList.remove("active");
    }
  });

  document.getElementById("btnSaveStoreSettings").addEventListener("click", () => {
    const name = document.getElementById("settingStoreName").value.trim();
    const logo = document.getElementById("settingStoreLogo").value.trim();

    if (!name) { alert("Nama toko tidak boleh kosong!"); return; }

    storeIdentity = { name, logo: logo || name.substring(0, 2).toUpperCase() };
    simpanStateLocal();
    applyStoreIdentity();
    tampilkanToast("✓ Identitas toko diperbarui!");
  });

  document.getElementById("btnDownloadBarcodeQr").addEventListener("click", () => {
    if (menuCustom.length === 0) {
      alert("Belum ada menu kustom yang ditambahkan. Silakan tambahkan minimal 1 menu terlebih dahulu.");
      return;
    }

    if (typeof QRCode === "undefined") {
      alert("Library QRCode belum termuat. Periksa koneksi internet.");
      return;
    }

    const qrLitePayload = {
      store: { name: storeIdentity.name, logo: storeIdentity.logo },
      menus: menuCustom.map(item => ({
        id: item.id,
        n: item.nama,
        k: item.kategori,
        lk: item.labelKategori,
        h: item.harga,
        d: item.deskripsi,
        g: item.gambar
      }))
    };

    const fullEmbedPayload = {
      store: { name: storeIdentity.name, logo: storeIdentity.logo },
      menus: menuCustom
    };

    const hiddenContainer = document.getElementById("hiddenQrRender");
    hiddenContainer.innerHTML = "";

    new QRCode(hiddenContainer, {
      text: JSON.stringify(qrLitePayload),
      width: 280,
      height: 280,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });

    setTimeout(() => {
      const qrCanvas = hiddenContainer.querySelector("canvas");
      const qrImg = hiddenContainer.querySelector("img");

      const buatDanUnduhPng = (sourceDrawable) => {
        const padding = 32;
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = 280 + padding * 2;
        finalCanvas.height = 280 + padding * 2;
        const ctx = finalCanvas.getContext("2d");

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        ctx.drawImage(sourceDrawable, padding, padding, 280, 280);

        finalCanvas.toBlob((pngBlob) => {
          const marker = "\n---UMKM_DATA_START---\n";
          const combinedBlob = new Blob([pngBlob, marker, JSON.stringify(fullEmbedPayload)], { type: "image/png" });

          const url = URL.createObjectURL(combinedBlob);
          const link = document.createElement("a");
          link.href = url;
          const safeStoreName = storeIdentity.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
          link.download = `barcode_menu_${safeStoreName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          tampilkanToast("✓ Gambar Barcode QR + Link Foto berhasil diunduh!");
        }, "image/png");
      };

      if (qrCanvas) {
        buatDanUnduhPng(qrCanvas);
      } else if (qrImg && qrImg.complete) {
        buatDanUnduhPng(qrImg);
      } else if (qrImg) {
        qrImg.onload = () => buatDanUnduhPng(qrImg);
      }
    }, 250);
  });

  document.getElementById("btnSaveNewMenu").addEventListener("click", () => {
    const name = document.getElementById("addMenuName").value.trim();
    const kategori = document.getElementById("addMenuCategory").value;
    const harga = parseInt(document.getElementById("addMenuPrice").value);
    const urlInput = document.getElementById("addMenuImageUrl");
    const desc = document.getElementById("addMenuDesc").value.trim();

    if (!name || isNaN(harga)) {
      alert("Mohon lengkapi Nama Menu dan Harga!");
      return;
    }

    const katObj = DAFTAR_KATEGORI.find(k => k.id === kategori);
    const labelKategori = katObj ? katObj.nama : "Lainnya";
    
    const gambarSrc = urlInput && urlInput.value.trim() !== "" ? urlInput.value.trim() : `https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(name)}`;

    if (editMenuIndex !== null && menuCustom[editMenuIndex]) {
      menuCustom[editMenuIndex] = {
        ...menuCustom[editMenuIndex],
        nama: name,
        kategori: kategori,
        labelKategori: labelKategori,
        harga: harga,
        deskripsi: desc || "Menu pilihan kedai.",
        gambar: gambarSrc
      };
      tampilkanToast("✓ Perubahan menu berhasil disimpan!");
    } else {
      const newMenuItem = {
        id: Date.now(),
        nama: name,
        kategori: kategori,
        labelKategori: labelKategori,
        harga: harga,
        deskripsi: desc || "Menu pilihan kedai.",
        gambar: gambarSrc
      };
      menuCustom.push(newMenuItem);
      tampilkanToast("✓ Menu berhasil ditambahkan!");
    }

    DATA_MENU = [...menuCustom];
    simpanStateLocal();

    renderMenu();
    renderAdminCustomMenuList();
    batalEditMenu();
  });
}
