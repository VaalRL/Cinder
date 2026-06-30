import { runWebRtcScenario } from "./webrtc.js";

const out = document.getElementById("out");
const store = window as unknown as { __webrtcResult?: unknown };

runWebRtcScenario()
  .then((result) => {
    store.__webrtcResult = result;
    if (out) out.textContent = JSON.stringify(result, null, 2);
  })
  .catch((err: unknown) => {
    store.__webrtcResult = { error: String(err) };
    if (out) out.textContent = `ERROR: ${String(err)}`;
  });
