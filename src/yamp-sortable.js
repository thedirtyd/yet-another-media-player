import { LitElement, html, css } from "https://unpkg.com/lit-element@3.3.3/lit-element.js?module";
// import { LitElement, html, css, nothing } from "lit";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/+esm";
// import Sortable from "sortablejs";

class YampSortable extends LitElement {
  static get properties() {
    return {
      disabled: { type: Boolean },
      handleSelector: { type: String },
      draggableSelector: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      
      .sortable-fallback {
        display: none !important;
      }

      .sortable-ghost {
        box-shadow: 0 0 0 2px var(--primary-color);
        background: rgba(var(--rgb-primary-color), 0.25);
        border-radius: 4px;
        opacity: 0.4;
      }

      .sortable-drag {
        border-radius: 4px;
        opacity: 1;
        background: var(--card-background-color);
        box-shadow: 0px 4px 8px 3px #00000026;
        cursor: grabbing;
      }
    `;
  }

  constructor() {
    super();
    this.disabled = false;
    this.handleSelector = ".handle";
    this.draggableSelector = ".sortable-item";
    this._sortable = null;
  }

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <slot></slot>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.disabled) {
      this._createSortable();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._destroySortable();
  }

  updated(changedProperties) {
    if (changedProperties.has("disabled")) {
      if (this.disabled) {
        this._destroySortable();
      } else {
        this._createSortable();
      }
    }
  }

  _createSortable() {
    if (this._sortable) return;
    
    const container = this.children[0];
    if (!container) return;

    const options = {
      scroll: true,
      forceAutoScrollFallback: true,
      scrollSpeed: 20,
      animation: 150,
      draggable: this.draggableSelector,
      handle: this.handleSelector,
      filter: ".handle-disabled",
      onChoose: this._handleChoose.bind(this),
      onStart: this._handleStart.bind(this),
      onEnd: this._handleEnd.bind(this),
      onUpdate: this._handleUpdate.bind(this),
      onMove: this._handleMove.bind(this),
    };

    this._sortable = new Sortable(container, options);
  }

  _handleUpdate(evt) {
    this.dispatchEvent(new CustomEvent("item-moved", {
      detail: {
        oldIndex: evt.oldIndex,
        newIndex: evt.newIndex,
      },
      bubbles: true,
      composed: true,
    }));
  }

  _handleEnd(evt) {
    // Put back in original location if needed
    if (evt.item.placeholder) {
      evt.item.placeholder.replaceWith(evt.item);
      delete evt.item.placeholder;
    }
  }

  _handleStart() {
    // Optional: emit drag start event
  }

  _handleChoose(evt) {
    // Create placeholder to maintain layout
    evt.item.placeholder = document.createComment("sort-placeholder");
    evt.item.after(evt.item.placeholder);
  }

  _handleMove(evt) {
    // Prevent dropping in the last position (the "new entity" row)
    const items = this.querySelectorAll(this.draggableSelector);
    const lastIndex = items.length - 1;
    
    if (evt.related === items[lastIndex] || evt.willInsertAfter && evt.newIndex === lastIndex) {
      return false; // Prevent the move
    }
    
    return true; // Allow the move
  }

  _destroySortable() {
    if (!this._sortable) return;
    this._sortable.destroy();
    this._sortable = null;
  }
}

customElements.define("yamp-sortable", YampSortable);
