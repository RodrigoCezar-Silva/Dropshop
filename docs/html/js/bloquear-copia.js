function alvoEditavel(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  );
}


document.addEventListener("dragstart", (event) => {
  const target = event.target;
  if (target instanceof HTMLImageElement || target instanceof HTMLAnchorElement) {
    event.preventDefault();
  }
});

document.addEventListener("selectstart", (event) => {
  if (!alvoEditavel(event.target)) {
    event.preventDefault();
  }
});

document.addEventListener("copy", (event) => {
  if (!alvoEditavel(event.target)) {
    event.preventDefault();
  }
});

document.addEventListener("cut", (event) => {
  if (!alvoEditavel(event.target)) {
    event.preventDefault();
  }
});

document.addEventListener("keydown", (event) => {
  const tecla = typeof event.key === 'string' ? event.key.toLowerCase() : '';
  const atalhoComCtrl = event.ctrlKey || event.metaKey;
  const alvoPodeEditar = alvoEditavel(event.target);

  if (event.key === "F12") {
    event.preventDefault();
    return;
  }

  if (atalhoComCtrl && event.shiftKey && ["i", "j", "c"].includes(tecla)) {
    event.preventDefault();
    return;
  }

  if (!atalhoComCtrl || alvoPodeEditar) {
    return;
  }

  if (["a", "c", "p", "s", "u", "x"].includes(tecla)) {
    event.preventDefault();
  }
});