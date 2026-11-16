/**
 * Akaromi for Firefox — Early Capture-Phase Event Shield
 * Runs at document_start before host-page scripts to prevent capture-phase keylogging
 * when focus is inside Akaromi's isolated portal shadow host.
 */
;(function (global) {
  "use strict"

  if (window !== window.top) return

  let ownedHost = null
  let activeInputHandler = null
  let activeEnterHandler = null

  global.AkaromiEventShield = {
    setPortalHost(host) {
      ownedHost = host || null
    },
    setInputHandler(fn) {
      activeInputHandler = typeof fn === "function" ? fn : null
    },
    setEnterHandler(fn) {
      activeEnterHandler = typeof fn === "function" ? fn : null
    },
  }

  const SHIELDED_EVENTS = [
    "keydown",
    "keyup",
    "keypress",
    "beforeinput",
    "input",
    "paste",
    "compositionstart",
    "compositionupdate",
    "compositionend",
  ]

  for (const evtName of SHIELDED_EVENTS) {
    window.addEventListener(
      evtName,
      (e) => {
        if (!ownedHost) return
        if (document.activeElement === ownedHost || e.target === ownedHost) {
          e.stopImmediatePropagation()
          if (e.isTrusted) {
            if (evtName === "input" && activeInputHandler) {
              activeInputHandler()
            } else if (evtName === "keydown" && e.key === "Enter" && activeEnterHandler) {
              activeEnterHandler()
            }
          }
        }
      },
      true
    )
  }
})(typeof window !== "undefined" ? window : globalThis)
