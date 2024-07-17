import { Controller as t } from "@hotwired/stimulus";
import e from "sortablejs";
import { patch as a } from "@rails/request.js";
class r extends t {
  initialize() {
    this.onUpdate = this.onUpdate.bind(this);
  }
  connect() {
    this.sortable = new e(this.element, {
      ...this.defaultOptions,
      ...this.options,
    });
  }
  disconnect() {
    this.sortable.destroy(), (this.sortable = void 0);
  }
  async onUpdate({ item: t, newIndex: e }) {
    if (!t.dataset.sortableUpdateUrl) return;
    const i = this.resourceNameValue
        ? `${this.resourceNameValue}[${this.paramNameValue}]`
        : this.paramNameValue,
      s = new FormData();
    return (
      s.append(i, e + 1),
      await a(t.dataset.sortableUpdateUrl, {
        body: s,
        responseKind: this.responseKindValue,
      })
    );
  }
  get options() {
    return {
      animation: this.animationValue || this.defaultOptions.animation || 150,
      handle: this.handleValue || this.defaultOptions.handle || void 0,
      onUpdate: this.onUpdate,
    };
  }
  get defaultOptions() {
    return {};
  }
}
r.values = {
  resourceName: String,
  paramName: { type: String, default: "position" },
  responseKind: { type: String, default: "html" },
  animation: Number,
  handle: String,
};
export { r as default };
