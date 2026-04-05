import { PANEL_TRANSITION_MS } from "./config.js";

export function createModalController(app, renderer) {
  const { elements } = app;

  const modals = {
    info: {
      button: elements.infoButton,
      close: elements.infoClose,
      overlay: elements.infoOverlay,
      panel: elements.infoPanel
    },
    about: {
      button: elements.aboutButton,
      close: elements.aboutClose,
      overlay: elements.aboutOverlay,
      panel: elements.aboutPanel
    },
    sources: {
      button: elements.sourcesButton,
      close: elements.sourcesClose,
      overlay: elements.sourcesOverlay,
      panel: elements.sourcesPanel,
      onOpen: renderer.renderSourcesContent
    }
  };

  function bindModalEvents() {
    Object.values(modals).forEach(modal => {
      modal.button.addEventListener("click", () => setModalVisibility(modal, true));
      modal.close.addEventListener("click", () => setModalVisibility(modal, false));
      modal.overlay.addEventListener("click", () => setModalVisibility(modal, false));
    });
  }

  function closeAllModals(exceptKey = "") {
    Object.entries(modals).forEach(([key, modal]) => {
      if (key !== exceptKey) setModalVisibility(modal, false);
    });
  }

  function setModalVisibility(modal, show) {
    const isOpen = Boolean(show);
    window.clearTimeout(modal.closeTimer);

    if (isOpen) {
      closeAllModals(getModalKey(modal));
      modal.onOpen?.();
      modal.overlay.hidden = false;
      modal.panel.hidden = false;
      requestAnimationFrame(() => {
        modal.overlay.classList.add("is-visible");
        modal.panel.classList.add("is-visible");
      });
      modal.panel.setAttribute("aria-hidden", "false");
      modal.button.setAttribute("aria-expanded", "true");
      document.body.classList.add("info-open");
      return;
    }

    modal.overlay.classList.remove("is-visible");
    modal.panel.classList.remove("is-visible");
    modal.panel.setAttribute("aria-hidden", "true");
    modal.button.setAttribute("aria-expanded", "false");

    modal.closeTimer = window.setTimeout(() => {
      modal.overlay.hidden = true;
      modal.panel.hidden = true;
      updateBodyModalState();
    }, PANEL_TRANSITION_MS);
  }

  function getModalKey(targetModal) {
    return Object.entries(modals).find(([, modal]) => modal === targetModal)?.[0] || "";
  }

  function updateBodyModalState() {
    const hasVisibleModal = Object.values(modals).some(modal => !modal.panel.hidden);
    document.body.classList.toggle("info-open", hasVisibleModal);
  }

  return {
    bindModalEvents,
    closeAllModals,
    modals
  };
}
