const tierListEl = document.getElementById("tier-list");
const itemPoolEl = document.getElementById("item-pool");
const colorPickerEl = document.getElementById("color-picker");

const modal = document.getElementById("item-modal");
const newItemBtn = document.getElementById("new-item-btn");
const cancelItemBtn = document.getElementById("cancel-item");
const createItemBtn = document.getElementById("create-item");
const itemTypeRadios = document.getElementsByName("item-type");
const textInputArea = document.getElementById("text-input-area");
const imageInputArea = document.getElementById("image-input-area");
const textInput = document.getElementById("item-text");
const imageUpload = document.getElementById("image-upload");

const saveJsonBtn = document.getElementById("save-json");
const loadJsonBtn = document.getElementById("load-json-btn");
const loadJsonFile = document.getElementById("load-json-file");

let draggedItem = null;
let draggedTier = null;
let activeLabel = null;
let draggedTierIndex = -1;

const presetColors = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#a855f7", "#ec4899", "#14b8a6", "#f59e0b", "#6b7280",
  "#4b5563", "#0ea5e9", "#1d4ed8", "#7c3aed", "#be185d",
  "#15803d", "#0f766e", "#78350f", "#3f3f46", "#000000"
];

// --- Color Picker ---

function createColorPicker() {
  colorPickerEl.innerHTML = ""; // Clear previous
  presetColors.forEach(color => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.style.backgroundColor = color;
    swatch.title = color;
    swatch.tabIndex = 0;
    swatch.setAttribute('role', 'option');
    swatch.addEventListener("click", () => {
      if (activeLabel) activeLabel.style.backgroundColor = color;
      hideColorPicker();
    });
    swatch.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        swatch.click();
      }
    });
    colorPickerEl.appendChild(swatch);
  });
}

function showColorPicker(x, y, label) {
  activeLabel = label;
  colorPickerEl.style.left = x + "px";
  colorPickerEl.style.top = y + "px";
  colorPickerEl.classList.remove("hidden");
  colorPickerEl.focus();
}

function hideColorPicker() {
  colorPickerEl.classList.add("hidden");
  activeLabel = null;
}

document.addEventListener("click", (e) => {
  if (!colorPickerEl.contains(e.target) && (!activeLabel || !activeLabel.contains(e.target))) {
    hideColorPicker();
  }
});

// --- Drag & Drop items ---

function enableDragAndDrop(el) {
  el.setAttribute("draggable", true);

  el.addEventListener("dragstart", () => {
    draggedItem = el;
    setTimeout(() => el.style.visibility = "hidden", 0);
  });
  el.addEventListener("dragend", () => {
    draggedItem = null;
    el.style.visibility = "visible";
  });

  // Touch fallback
  el.addEventListener("touchstart", e => {
    draggedItem = el;
  });
}

function setupDropZone(dropZone) {
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
  });

  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    if (draggedItem) dropZone.appendChild(draggedItem);
  });

  // Touch support: drop by tapping on a drop zone when dragging an item
  dropZone.addEventListener("touchend", e => {
    if (draggedItem) {
      dropZone.appendChild(draggedItem);
      draggedItem = null;
    }
  });
}

// --- Drag & Drop tiers (reorder) ---

function enableTierDrag(tier) {
  tier.setAttribute("draggable", true);

  tier.addEventListener("dragstart", (e) => {
    draggedTier = tier;
    draggedTierIndex = Array.from(tierListEl.children).indexOf(tier);
    setTimeout(() => tier.style.visibility = "hidden", 0);
    e.dataTransfer.effectAllowed = "move";
  });

  tier.addEventListener("dragend", () => {
    draggedTier = null;
    draggedTierIndex = -1;
    tier.style.visibility = "visible";
  });

  tier.addEventListener("dragover", e => {
    e.preventDefault();
    if (!draggedTier) return;
    const currentIndex = Array.from(tierListEl.children).indexOf(tier);
    if (draggedTierIndex === currentIndex) return;

    if (currentIndex < draggedTierIndex) {
      tierListEl.insertBefore(draggedTier, tier);
      draggedTierIndex = currentIndex;
    } else {
      tierListEl.insertBefore(draggedTier, tier.nextSibling);
      draggedTierIndex = currentIndex;
    }
  });

  // Touch support: reorder on tap & hold not easily done without a library,
  // but can be improved if you want.
}

// --- Item creation ---

function createItem(srcOrText, isImage = true) {
  if (isImage) {
    const img = document.createElement("img");
    img.src = srcOrText;
    img.className = "item";
    enableDragAndDrop(img);
    addDeleteItemButton(img);
    return img;
  } else {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = srcOrText;
    div.style.backgroundColor = "#374151";
    div.style.color = "white";
    div.style.fontWeight = "bold";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    enableDragAndDrop(div);
    addDeleteItemButton(div);
    return div;
  }
}

// Delete button for items
function addDeleteItemButton(itemEl) {
  const btn = document.createElement("button");
  btn.className = "delete-item-btn";
  btn.setAttribute("aria-label", "Delete item");
  btn.textContent = "×";
  btn.addEventListener("click", e => {
    e.stopPropagation();
    itemEl.remove();
  });
  itemEl.appendChild(btn);
}

// --- Tier creation ---

function createTier(name = "Tier", color = "#374151") {
  const tier = document.createElement("div");
  tier.className = "tier";
  enableTierDrag(tier);

  // Label container
  const label = document.createElement("div");
  label.className = "tier-label";
  label.style.backgroundColor = color;

  // Editable input for tier name
  const input = document.createElement("input");
  input.type = "text";
  input.value = name;
  input.addEventListener("click", e => e.stopPropagation()); // Prevent triggering color picker
  label.appendChild(input);

  // Show color picker on label click (except input)
  label.addEventListener("click", e => {
    if (e.target === input) return;
    const rect = label.getBoundingClientRect();
    showColorPicker(rect.left, rect.bottom + window.scrollY, label);
  });

  // Drop zone for items
  const dropZone = document.createElement("div");
  dropZone.className = "tier-items";
  setupDropZone(dropZone);

  // Delete tier button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => tier.remove());

  tier.appendChild(label);
  tier.appendChild(dropZone);
  tier.appendChild(deleteBtn);
  tierListEl.appendChild(tier);
}

// --- Modal Logic ---

function resetModal() {
  textInput.value = "";
  imageUpload.value = "";
  itemTypeRadios[0].checked = true;
  textInputArea.classList.remove("hidden");
  imageInputArea.classList.add("hidden");
}

newItemBtn.addEventListener("click", () => {
  resetModal();
  modal.classList.remove("hidden");
  textInput.focus();
});

cancelItemBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

itemTypeRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "text" && radio.checked) {
      textInputArea.classList.remove("hidden");
      imageInputArea.classList.add("hidden");
    } else if (radio.value === "image" && radio.checked) {
      textInputArea.classList.add("hidden");
      imageInputArea.classList.remove("hidden");
    }
  });
});

createItemBtn.addEventListener("click", () => {
  const type = [...itemTypeRadios].find(r => r.checked).value;

  if (type === "text") {
    const val = textInput.value.trim();
    if (!val) {
      alert("Please enter text for the item.");
      return;
    }
    const newItem = createItem(val, false);
    itemPoolEl.appendChild(newItem);
    modal.classList.add("hidden");
  } else if (type === "image") {
    const file = imageUpload.files[0];
    if (!file) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        const aspect = img.width / img.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (aspect > 1) {
          sx = (img.width - img.height) / 2;
          sw = sh = img.height;
        } else {
          sy = (img.height - img.width) / 2;
          sh = sw = img.width;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        const finalImg = createItem(canvas.toDataURL(), true);
        itemPoolEl.appendChild(finalImg);
        modal.classList.add("hidden");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

// Add Tier Button
document.getElementById("add-tier").addEventListener("click", () => {
  createTier();
});

// Export Button
document.getElementById("export").addEventListener("click", () => {
  hideColorPicker();
  modal.classList.add("hidden");
  // Use html2canvas to export tier list container
  html2canvas(tierListEl).then(canvas => {
    const link = document.createElement("a");
    link.download = "tier-list.png";
    link.href = canvas.toDataURL();
    link.click();
  });
});

// Save JSON Button
saveJsonBtn.addEventListener("click", () => {
  hideColorPicker();
  modal.classList.add("hidden");

  const data = serializeTierList();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tier-list.json";
  a.click();

  URL.revokeObjectURL(url);
});

// Load JSON Button
loadJsonBtn.addEventListener("click", () => {
  loadJsonFile.click();
});

loadJsonFile.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      deserializeTierList(data);
    } catch {
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
  loadJsonFile.value = ""; // reset input
});

// Serialize the tier list to JSON
function serializeTierList() {
  // Collect tiers data
  const tiers = [];
  for (const tier of tierListEl.children) {
    const label = tier.querySelector(".tier-label input");
    const color = tier.querySelector(".tier-label").style.backgroundColor;
    const items = [];
    for (const item of tier.querySelector(".tier-items").children) {
      if (item.tagName === "IMG") {
        items.push({ type: "image", src: item.src });
      } else {
        items.push({ type: "text", text: item.textContent });
      }
    }
    tiers.push({ name: label.value, color, items });
  }

  // Item pool
  const poolItems = [];
  for (const item of itemPoolEl.children) {
    if (item.tagName === "IMG") {
      poolItems.push({ type: "image", src: item.src });
    } else {
      poolItems.push({ type: "text", text: item.textContent });
    }
  }

  return { tiers, poolItems };
}

// Deserialize JSON to tier list UI
function deserializeTierList(data) {
  tierListEl.innerHTML = "";
  itemPoolEl.innerHTML = "";

  if (data.tiers) {
    data.tiers.forEach(t => {
      createTier(t.name, t.color);
      const tier = tierListEl.lastChild;
      const dropZone = tier.querySelector(".tier-items");
      t.items.forEach(it => {
        let el;
        if (it.type === "image") {
          el = createItem(it.src, true);
        } else {
          el = createItem(it.text, false);
        }
        dropZone.appendChild(el);
      });
    });
  }
  if (data.poolItems) {
    data.poolItems.forEach(it => {
      let el;
      if (it.type === "image") {
        el = createItem(it.src, true);
      } else {
        el = createItem(it.text, false);
      }
      itemPoolEl.appendChild(el);
    });
  }
}

// Initialize color picker and default tiers
createColorPicker();

["S", "A", "B", "C", "D"].forEach((name, i) => {
  createTier(name, presetColors[i]);
});
