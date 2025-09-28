// DOM elementlerini seç
const shoppingList = document.querySelector(".shopping-list");
const shoppingForm = document.querySelector(".shopping-form");
const filterButtons = document.querySelectorAll(".filter-buttons button");
const clearBtn = document.querySelector(".clear");

// Sayfa yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", function () {
  loadItems(); // Kayıtlı öğeleri yükle
  updateState(); // UI durumunu güncelle
  
  // Event listener'ları ekle
  shoppingForm.addEventListener("submit", handleFormSubmit);
  clearBtn.addEventListener("click", clearAll);
  
  // Filter butonları için event listener ekle
  filterButtons.forEach(button => {
    button.addEventListener("click", handleFilterSelection);
  });
});

/**
 * Tüm listeyi ve local storage'ı temizler
 */
function clearAll() {
  shoppingList.innerHTML = "";
  localStorage.clear();
  updateState();
}

/**
 * Liste durumuna göre UI elementlerini göster/gizle
 */
function updateState() {
  const isEmpty = shoppingList.querySelectorAll("li").length === 0;
  const filterButtonsContainer = document.querySelector(".filter-buttons");
  const alert = document.querySelector(".alert");
  
  // Liste boşsa alert göster, filter butonları ve clear butonunu gizle
  alert.classList.toggle("d-none", !isEmpty);
  filterButtonsContainer.classList.toggle("d-none", isEmpty);
  clearBtn.classList.toggle("d-none", isEmpty);
}

/**
 * Mevcut listeyi local storage'a kaydet
 */
function saveToLocalStorage() {
  const listItems = shoppingList.querySelectorAll("li");
  const items = [];

  listItems.forEach(li => {
    const id = li.getAttribute("item-id");
    const name = li.querySelector(".item-name").textContent;
    const completed = li.hasAttribute("item-completed");
    
    items.push({ id, name, completed });
  });
  
  localStorage.setItem("shoppingItems", JSON.stringify(items));
}

/**
 * Local storage'dan öğeleri yükle
 */
function loadItems() {
  const items = JSON.parse(localStorage.getItem("shoppingItems")) || [];
  shoppingList.innerHTML = "";

  items.forEach(item => {
    const li = createListItem(item);
    shoppingList.appendChild(li);
  });
}

/**
 * Yeni liste öğesi oluştur
 * @param {Object} item - Öğe bilgileri (id, name, completed)
 * @returns {HTMLElement} Liste öğesi
 */
function createListItem(item) {
  // Checkbox oluştur
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("form-check-input");
  checkbox.checked = item.completed;
  checkbox.addEventListener("change", toggleCompleted);

  // Öğe adı div'i oluştur
  const nameDiv = document.createElement("div");
  nameDiv.textContent = item.name;
  nameDiv.classList.add("item-name");
  nameDiv.addEventListener("click", openEditMode);
  nameDiv.addEventListener("blur", closeEditMode);
  nameDiv.addEventListener("keydown", handleEnterKey);

  // Silme ikonu oluştur
  const deleteIcon = document.createElement("i");
  deleteIcon.className = "fs-3 bi bi-x text-danger delete-icon";
  deleteIcon.addEventListener("click", removeItem);

  // Liste öğesi oluştur
  const li = document.createElement("li");
  li.setAttribute("item-id", item.id);
  li.className = "border rounded p-2 mb-1 d-flex align-items-center";
  li.toggleAttribute("item-completed", item.completed);
  
  // Elementleri li'ye ekle
  li.appendChild(checkbox);
  li.appendChild(nameDiv);
  li.appendChild(deleteIcon);
  
  return li;
}

/**
 * Yeni öğe ekle
 * @param {HTMLInputElement} input - Input elementi
 */
function addItem(input) {
  const newItem = createListItem({
    id: generateId(),
    name: input.value.trim(),
    completed: false,
  });

  shoppingList.appendChild(newItem);
  input.value = "";
  
  updateFilterItems();
  saveToLocalStorage();
  updateState();
}

/**
 * Benzersiz ID oluştur
 * @returns {string} Timestamp tabanlı ID
 */
function generateId() {
  return Date.now().toString();
}

/**
 * Form submit işlemini handle et
 * @param {Event} e - Submit event
 */
function handleFormSubmit(e) {
  e.preventDefault();
  
  const input = document.getElementById("item_name");
  const trimmedValue = input.value.trim();
  
  // Boş input kontrolü
  if (trimmedValue.length === 0) {
    alert("Lütfen bir öğe adı giriniz!");
    return;
  }
  
  addItem(input);
}

/**
 * Öğenin tamamlanma durumunu değiştir
 * @param {Event} e - Change event
 */
function toggleCompleted(e) {
  const li = e.target.parentElement;
  li.toggleAttribute("item-completed", e.target.checked);

  updateFilterItems();
  saveToLocalStorage();
  updateState();
}

/**
 * Öğeyi listeden kaldır
 * @param {Event} e - Click event
 */
function removeItem(e) {
  const li = e.target.parentElement;
  shoppingList.removeChild(li);
  
  saveToLocalStorage();
  updateState();
  updateFilterItems();
}

/**
 * Düzenleme modunu aç (sadece tamamlanmamış öğeler için)
 * @param {Event} e - Click event
 */
function openEditMode(e) {
  const li = e.target.parentElement;
  
  // Sadece tamamlanmamış öğeler düzenlenebilir
  if (!li.hasAttribute("item-completed")) {
    e.target.contentEditable = true;
    e.target.focus();
  }
}

/**
 * Düzenleme modunu kapat ve değişiklikleri kaydet
 * @param {Event} e - Blur event
 */
function closeEditMode(e) {
  e.target.contentEditable = false;
  saveToLocalStorage();
}

/**
 * Enter tuşuna basıldığında düzenleme modunu kapat
 * @param {Event} e - Keydown event
 */
function handleEnterKey(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    e.target.blur(); // Blur event'ini tetikle
  }
}

/**
 * Filter buton seçimini handle et
 * @param {Event} e - Click event
 */
function handleFilterSelection(e) {
  const filterBtn = e.target;
  
  // Tüm butonları secondary yap
  filterButtons.forEach(button => {
    button.classList.remove("btn-primary");
    button.classList.add("btn-secondary");
  });
  
  // Seçili butonu primary yap
  filterBtn.classList.add("btn-primary");
  filterBtn.classList.remove("btn-secondary");

  // Filtreleme uygula
  filterItems(filterBtn.getAttribute("item-filter"));
}

/**
 * Öğeleri verilen filtreye göre göster/gizle
 * @param {string} filterType - Filter tipi: 'all', 'completed', 'incompleted'
 */
function filterItems(filterType) {
  const listItems = shoppingList.querySelectorAll("li");

  listItems.forEach(li => {
    // Önce tüm display classlarını temizle
    li.classList.remove("d-flex", "d-none");
    
    const isCompleted = li.hasAttribute("item-completed");

    switch(filterType) {
      case "completed":
        // Sadece tamamlanmış öğeleri göster
        li.classList.add(isCompleted ? "d-flex" : "d-none");
        break;
      case "incompleted":
        // Sadece tamamlanmamış öğeleri göster
        li.classList.add(isCompleted ? "d-none" : "d-flex");
        break;
      default:
        // Tüm öğeleri göster
        li.classList.add("d-flex");
        break;
    }
  });
}

/**
 * Aktif filtreyi tekrar uygula
 */
function updateFilterItems() {
  const activeFilter = document.querySelector(".btn-primary[item-filter]");
  if (activeFilter) {
    filterItems(activeFilter.getAttribute("item-filter"));
  }
}