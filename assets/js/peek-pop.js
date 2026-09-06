export class PeekPopManager {
  constructor() {
    this.activeTrigger = null;
    this.activeMenu = null;
    this.hoveredItem = null;
    this.isPeeking = false;

    this.init();
  }

  init() {
    document.addEventListener("pointerdown", this.handlePointerDown.bind(this));
    document.addEventListener("pointermove", this.handlePointerMove.bind(this));
    document.addEventListener("pointerup", this.handlePointerUp.bind(this));
  }

  handlePointerDown(e) {
    const trigger = e.target.closest(".peek-target");

    if (!trigger) {
      const item = e.target.closest(".ios-bubble-item");
      if (item) {
        this.executeItemSelection(item);
      } else if (this.activeMenu && !e.target.closest(".ios-bubble-menu")) {
        this.closeMenu();
      }
      return;
    }

    const menuId = trigger.dataset.targetMenu;
    const menu = document.getElementById(menuId);
    if (!menu) return;

    if (
      trigger.classList.contains("opacity-50") ||
      trigger.classList.contains("pointer-events-none")
    ) {
      return;
    }

    if (this.activeMenu === menu && menu.classList.contains("open")) {
      this.closeMenu();
      return;
    }

    this.closeMenu();

    this.activeTrigger = trigger;
    this.activeMenu = menu;
    this.isPeeking = true;

    this.activeMenu.classList.add("open");
  }

  handlePointerMove(e) {
    if (!this.isPeeking || !this.activeMenu) return;
    this.updateHoveredItem(e.clientX, e.clientY);
  }

  handlePointerUp() {
    if (!this.isPeeking) return;

    if (this.hoveredItem) {
      this.executeItemSelection(this.hoveredItem);
    }

    this.isPeeking = false;
  }

  updateHoveredItem(x, y) {
    const elementsUnderPointer = document.elementsFromPoint(x, y);

    let currentHovered = null;
    for (const el of elementsUnderPointer) {
      if (el.classList && el.classList.contains("ios-bubble-item")) {
        currentHovered = el;
        break;
      }
    }

    if (this.hoveredItem !== currentHovered) {
      if (this.hoveredItem) {
        this.hoveredItem.classList.remove("active-hover");
      }

      this.hoveredItem = currentHovered;

      if (this.hoveredItem) {
        this.hoveredItem.classList.add("active-hover");
      }
    }
  }

  executeItemSelection(item) {
    const selectedValue = item.dataset.value;
    const selectedLabel = item.dataset.label || item.innerText.trim();

    if (!this.activeTrigger) {
      const menu = item.closest(".ios-bubble-menu");
      if (menu) {
        this.activeTrigger = document.querySelector(
          `[data-target-menu="${menu.id}"]`
        );
      }
    }

    if (this.activeTrigger) {
      const labelSpan = this.activeTrigger.querySelector("span");
      if (labelSpan) {
        labelSpan.innerText = selectedLabel;
      }

      const targetMenuId = this.activeTrigger.dataset.targetMenu;
      let nativeSelectId = "";

      if (targetMenuId === "menuFamilies") nativeSelectId = "cmbFamilies";
      if (targetMenuId === "menuMembers") nativeSelectId = "cmbMembers";

      const nativeSelect = document.getElementById(nativeSelectId);
      if (nativeSelect) {
        nativeSelect.value = selectedValue;
        nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    this.closeMenu();
  }

  closeMenu() {
    if (this.activeMenu) {
      this.activeMenu.classList.remove("open");
    }
    if (this.hoveredItem) {
      this.hoveredItem.classList.remove("active-hover");
    }

    this.activeTrigger = null;
    this.activeMenu = null;
    this.hoveredItem = null;
    this.isPeeking = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.peekPopEngine = new PeekPopManager();
});