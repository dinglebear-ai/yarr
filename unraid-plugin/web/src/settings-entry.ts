import { defineCustomElement } from "vue";
import YarrSettings from "./YarrSettings.ce.vue";
import "./style.css";

const YarrSettingsElement = defineCustomElement(YarrSettings, { shadowRoot: false });

if (!customElements.get("yarr-settings-app")) {
  customElements.define("yarr-settings-app", YarrSettingsElement);
}
