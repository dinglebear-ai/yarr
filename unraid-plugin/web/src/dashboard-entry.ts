import { defineCustomElement } from "vue";
import YarrDashboard from "./YarrDashboard.ce.vue";
import "./dashboard.css";

const YarrDashboardElement = defineCustomElement(YarrDashboard, { shadowRoot: false });

if (!customElements.get("yarr-dashboard")) {
  customElements.define("yarr-dashboard", YarrDashboardElement);
}
