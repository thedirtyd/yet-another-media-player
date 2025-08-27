import { LitElement, html, css } from "https://unpkg.com/lit-element@3.3.3/lit-element.js?module";

class YampSortable extends LitElement {
  static get properties() {
    return {
      handleSelector: { type: String },
      disabled: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.handleSelector = ".handle";
    this.disabled = false;
    this._draggedElement = null;
    this._ghostElement = null;
    this._originalIndex = -1;
    this._currentIndex = -1;
    this._dragStartY = 0;
    this._isDragging = false;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      
      .sortable-item {
        position: relative;
        transition: transform 0.2s ease;
      }
      
      .sortable-item.dragging {
        opacity: 0.5;
        /* transform: scale(0.95); */
        z-index: 1000;
      }
      
      .ghost {
        position: absolute;
        pointer-events: none;
        opacity: 0.8;
        background: var(--card-background-color, #f7f7f7);
        border: 2px dashed var(--primary-color);
        border-radius: 4px;
        z-index: 999;
        transition: none;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      
      .handle {
        cursor: grab;
        user-select: none;
      }
      
      .handle:active {
        cursor: grabbing;
      }
      
      .sortable-item.dragging .handle {
        cursor: grabbing;
      }
    `;
  }

  firstUpdated() {
    this._setupEventListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupEventListeners();
  }

  _setupEventListeners() {
    this.addEventListener("mousedown", this._onMouseDown.bind(this));
    this.addEventListener("touchstart", this._onTouchStart.bind(this));
  }

  _cleanupEventListeners() {
    this.removeEventListener("mousedown", this._onMouseDown.bind(this));
    this.removeEventListener("touchstart", this._onTouchStart.bind(this));
    document.removeEventListener("mousemove", this._onMouseMove.bind(this));
    document.removeEventListener("mouseup", this._onMouseUp.bind(this));
    document.removeEventListener("touchmove", this._onTouchMove.bind(this));
    document.removeEventListener("touchend", this._onTouchEnd.bind(this));
  }

  _onMouseDown(event) {
    if (this.disabled) return;
    
    const handle = event.target.closest(this.handleSelector);
    if (!handle || handle.classList.contains('handle-disabled')) return;
    
    event.preventDefault();
    this._startDrag(event, event.clientY);
  }

  _onTouchStart(event) {
    if (this.disabled) return;
    
    const handle = event.target.closest(this.handleSelector);
    if (!handle || handle.classList.contains('handle-disabled')) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    this._startDrag(event, touch.clientY);
  }

  _startDrag(event, clientY) {
    const item = event.target.closest(".sortable-item");
    if (!item) return;

    this._draggedElement = item;
    this._dragStartY = clientY;
    this._originalIndex = this._getItemIndex(item);
    this._currentIndex = this._originalIndex;
    this._isDragging = true;

    // Add dragging class
    item.classList.add("dragging");

    // Create ghost element
    this._createGhostElement(item);

    // Add document event listeners
    document.addEventListener("mousemove", this._onMouseMove.bind(this));
    document.addEventListener("mouseup", this._onMouseUp.bind(this));
    document.addEventListener("touchmove", this._onTouchMove.bind(this));
    document.addEventListener("touchend", this._onTouchEnd.bind(this));
  }

  _onMouseMove(event) {
    if (!this._isDragging) return;
    event.preventDefault();
    this._updateDrag(event.clientY);
  }

  _onTouchMove(event) {
    if (!this._isDragging) return;
    event.preventDefault();
    const touch = event.touches[0];
    this._updateDrag(touch.clientY);
  }

  _updateDrag(clientY) {
    if (!this._draggedElement || !this._ghostElement) return;

    const deltaY = clientY - this._dragStartY;
    const items = this._getSortableItems();
    const itemHeight = this._draggedElement.offsetHeight;
    
    // Calculate new index
    let newIndex = this._originalIndex;
    if (Math.abs(deltaY) > itemHeight / 2) {
      newIndex = Math.max(0, Math.min(items.length - 1, 
        this._originalIndex + Math.round(deltaY / itemHeight)));
    }

    if (newIndex !== this._currentIndex) {
      this._currentIndex = newIndex;
      this._updateGhostPosition();
    }
  }

  _onMouseUp(event) {
    this._endDrag();
  }

  _onTouchEnd(event) {
    this._endDrag();
  }

  _endDrag() {
    if (!this._isDragging) return;

    this._isDragging = false;

    // Remove dragging class
    if (this._draggedElement) {
      this._draggedElement.classList.remove("dragging");
    }

    // Remove ghost element
    this._removeGhostElement();

    // Dispatch event if position changed
    if (this._originalIndex !== this._currentIndex) {
      this.dispatchEvent(new CustomEvent("item-moved", {
        detail: {
          oldIndex: this._originalIndex,
          newIndex: this._currentIndex,
          element: this._draggedElement
        },
        bubbles: true,
        composed: true
      }));
    }

    // Cleanup
    this._draggedElement = null;
    this._originalIndex = -1;
    this._currentIndex = -1;

    // Remove document event listeners
    document.removeEventListener("mousemove", this._onMouseMove.bind(this));
    document.removeEventListener("mouseup", this._onMouseUp.bind(this));
    document.removeEventListener("touchmove", this._onTouchMove.bind(this));
    document.removeEventListener("touchend", this._onTouchEnd.bind(this));
  }

  _createGhostElement(originalElement) {
    // Create a simple visual ghost instead of cloning Lit components
    this._ghostElement = document.createElement('div');
    this._ghostElement.classList.add("ghost");
    
    // Copy computed styles
    const computedStyle = window.getComputedStyle(originalElement);
    this._ghostElement.style.width = computedStyle.width;
    this._ghostElement.style.height = computedStyle.height;
    this._ghostElement.style.margin = computedStyle.margin;
    this._ghostElement.style.padding = computedStyle.padding;
    this._ghostElement.style.backgroundColor = computedStyle.backgroundColor;
    this._ghostElement.style.border = computedStyle.border;
    this._ghostElement.style.borderRadius = computedStyle.borderRadius;
    this._ghostElement.style.display = computedStyle.display;
    this._ghostElement.style.flexDirection = computedStyle.flexDirection;
    this._ghostElement.style.alignItems = computedStyle.alignItems;
    this._ghostElement.style.gap = computedStyle.gap;
    
    // Create placeholder content to show the structure
    this._ghostElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
        <div style="width: 24px; height: 24px; background: var(--secondary-text-color); opacity: 0.3; border-radius: 4px;"></div>
        <div style="flex: 1; display: flex;">
          <div style="flex: 1; min-width: 0; height: 24px; background: var(--secondary-text-color); opacity: 0.3; border-radius: 4px;"></div>
        </div>
        <div style="width: 48px; height: 24px; background: var(--secondary-text-color); opacity: 0.3; border-radius: 4px;"></div>
      </div>
    `;
    
    // Position ghost
    const rect = originalElement.getBoundingClientRect();
    this._ghostElement.style.position = "fixed";
    this._ghostElement.style.left = rect.left + "px";
    this._ghostElement.style.top = rect.top + "px";
    this._ghostElement.style.zIndex = "9999";
    
    document.body.appendChild(this._ghostElement);
  }

  _updateGhostPosition() {
    if (!this._ghostElement || !this._draggedElement) return;

    const items = this._getSortableItems();
    
    // Hide ghost if over the last unsortable row
    if (this._currentIndex >= items.length - 1) {
      this._ghostElement.style.visibility = "hidden";
      return;
    }
    
    // Show ghost and position it
    this._ghostElement.style.visibility = "visible";
    if (this._currentIndex >= 0 && this._currentIndex < items.length) {
      const targetItem = items[this._currentIndex];
      const rect = targetItem.getBoundingClientRect();
      
      this._ghostElement.style.top = rect.top + "px";
      this._ghostElement.style.left = rect.left + "px";
    }
  }

  _removeGhostElement() {
    if (this._ghostElement) {
      document.body.removeChild(this._ghostElement);
      this._ghostElement = null;
    }
  }

  _getSortableItems() {
    return Array.from(this.querySelectorAll(".sortable-item"));
  }

  _getItemIndex(item) {
    const items = this._getSortableItems();
    return items.indexOf(item);
  }

  render() {
    return html`
      <div class="sortable-container">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("yamp-sortable", YampSortable);
