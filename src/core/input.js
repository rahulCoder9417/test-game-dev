export const input = {
  keys: {},
  mouseClicked: false,
};

export let mouseDelta = { x: 0, y: 0 };

export function initInput() {
  window.addEventListener("keydown", e => input.keys[e.code] = true);
  window.addEventListener("keyup", e => input.keys[e.code] = false);

  window.addEventListener("mousemove", (e) => {
    mouseDelta.x = e.movementX;
    mouseDelta.y = e.movementY;
  });
  window.addEventListener("mousedown", () => {
    input.mouseClicked = true;
  });
  document.body.addEventListener("click", () => {
    document.body.requestPointerLock();
  });
}
