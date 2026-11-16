/**
 * Akaromi for Firefox — Inline Autofill Badge Management
 * Attaches buttons that ONLY show when credential inputs are actively focused.
 */
;(function (global) {
  "use strict"

  if (window !== window.top) return

  const ext = typeof browser !== "undefined" ? browser : (typeof chrome !== "undefined" ? chrome : global.browser || global.chrome)
  global.AkaromiExt = ext

  const inputIconMap = new Map()
  let activeDropdownTarget = null

  let portalHost = null
  let portalShadow = null
  let portalContainer = null

  function getOrCreatePortalRoot() {
    if (portalHost && portalHost.isConnected && portalShadow && portalContainer && portalContainer.isConnected) {
      return portalContainer
    }

    if (!portalHost) {
      portalHost = document.createElement("div")
      portalHost.setAttribute("data-akaromi-portal", "true")
      portalHost.className = "akaromi-portal-root"
      global.AkaromiEventShield?.setPortalHost?.(portalHost)
    }

    const targetParent = document.documentElement || document.body
    if (portalHost.parentElement !== targetParent) {
      targetParent.appendChild(portalHost)
    }

    if (!portalShadow) {
      portalShadow = portalHost.attachShadow({ mode: "closed" })

      const cssFiles = ["content/badge.css", "content/menu.css", "content/passkey.css"]
      for (const cssPath of cssFiles) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = ext?.runtime?.getURL?.(cssPath) || cssPath
        portalShadow.appendChild(link)
      }

      portalContainer = document.createElement("div")
      portalContainer.className = "akaromi-portal-root"
      portalShadow.appendChild(portalContainer)

      // Isolate keyboard, input, paste, and pointer events inside the closed shadow root from host page listeners
      const SHADOW_ISOLATED_EVENTS = [
        "keydown",
        "keyup",
        "keypress",
        "beforeinput",
        "input",
        "paste",
        "pointerdown",
        "mousedown",
        "mouseup",
        "click",
        "touchstart",
        "touchend",
        "focusin",
      ]
      for (const evtName of SHADOW_ISOLATED_EVENTS) {
        portalShadow.addEventListener(evtName, (e) => {
          e.stopPropagation()
        })
      }
    } else if (!portalContainer || !portalContainer.isConnected) {
      portalContainer = document.createElement("div")
      portalContainer.className = "akaromi-portal-root"
      portalShadow.appendChild(portalContainer)
    }

    return portalContainer
  }

  global.AkaromiPortal = {
    getRoot: getOrCreatePortalRoot,
    getShadowRoot: () => portalShadow,
    getHost: () => portalHost,
    isHost: (el) => Boolean(el && portalHost && (el === portalHost || portalHost.contains(el))),
  }

    // Step 2: Trailing Button Collision Avoidance & Absolute Positioning
  // Step 2.1: Native Eye Icon Collision Detection & Viewport Tracking
  function getTrailingButtonOffset(input, icon, rect) {
    let offset = 26
    try {
      const style = window.getComputedStyle(input)
      const paddingRight = parseFloat(style.paddingRight) || parseFloat(style.paddingInlineEnd) || 0
      if (paddingRight >= 28) {
        offset = Math.max(offset, paddingRight + 4)
      }

      const parent = input.parentElement
      if (parent) {
        const candidates = parent.querySelectorAll(
          'button, svg, [role="button"], a, [class*="eye" i], [class*="show" i], [class*="toggle" i], [class*="reveal" i], [class*="icon" i]'
        )
        for (const el of candidates) {
          if (el === icon || el.contains(icon) || (icon && icon.contains(el))) continue
          const elRect = el.getBoundingClientRect()
          if (
            elRect.width > 0 &&
            elRect.height > 0 &&
            elRect.right <= rect.right + 12 &&
            elRect.left >= rect.right - 80 &&
            elRect.bottom > rect.top &&
            elRect.top < rect.bottom
          ) {
            const fromRight = rect.right - elRect.left
            if (fromRight > 10) {
              offset = Math.max(offset, fromRight + 26)
            }
          }
        }
      }
    } catch {}
    return offset
  }

  function updateIconPosition(input, icon) {
    if (!input || !icon) return
    const rect = input.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0 || !document.body.contains(input)) {
      icon.style.display = "none"
      return
    }

    icon.style.display = "flex"
    const offsetFromRight = getTrailingButtonOffset(input, icon, rect)
    const iconWidth = 20
    const iconHeight = 20

    const top = rect.top + (rect.height - iconHeight) / 2
    const left = rect.right - offsetFromRight - iconWidth / 2

    icon.style.position = "fixed"
    icon.style.top = `${Math.round(top)}px`
    icon.style.left = `${Math.round(left)}px`
    icon.style.zIndex = "2147483640"
  }

  function attachBadgeToInput(input, portal) {
    if (input.dataset.akaromiAttached) return
    if (!global.AkaromiDetection?.isCredentialInput(input)) return

    input.dataset.akaromiAttached = "true"

    const icon = document.createElement("button")
    icon.type = "button"
    icon.className = "akaromi-field-icon"
    icon.title = "Akaromi Autofill"
    icon.tabIndex = -1

    const iconUrl = ext?.runtime?.getURL?.("icons/icon-48.png") || ""
    const iconImg = document.createElement("img")
    iconImg.src = iconUrl
    iconImg.alt = "Akaromi"
    iconImg.className = "akaromi-badge-img"
    icon.appendChild(iconImg)

    inputIconMap.set(input, icon)

    let isInputHovered = false
    let isIconHovered = false

    function showIcon() {
      updateIconPosition(input, icon)
      icon.classList.add("visible")
    }

    function hideIcon() {
      if (document.activeElement === input) return
      if (isInputHovered || isIconHovered) return
      if (activeDropdownTarget === input) return
      icon.classList.remove("visible")
    }

    // Show when focused, hide when blurred
    input.addEventListener("focus", showIcon)
    input.addEventListener("blur", () => {
      setTimeout(hideIcon, 150)
    })

    // Show when hovered, hide when mouse leaves (if not focused)
    input.addEventListener("mouseenter", () => {
      isInputHovered = true
      showIcon()
    })
    input.addEventListener("mouseleave", () => {
      isInputHovered = false
      setTimeout(hideIcon, 120)
    })

    icon.addEventListener("mouseenter", () => {
      isIconHovered = true
      showIcon()
    })
    icon.addEventListener("mouseleave", () => {
      isIconHovered = false
      setTimeout(hideIcon, 120)
    })

    icon.addEventListener("mousedown", (e) => {
      // Prevent input blur when clicking badge in Firefox
      e.preventDefault()
      e.stopPropagation()
    })

    icon.addEventListener("click", (e) => {
      if (!e.isTrusted) return
      e.preventDefault()
      e.stopPropagation()
      if (activeDropdownTarget === input) {
        global.AkaromiMenu?.removeDropdown()
      } else {
        global.AkaromiMenu?.showFieldDropdown(input, icon)
      }
    })

    const targetPortal = portal || getOrCreatePortalRoot()

    targetPortal.appendChild(icon)

    // If input is ALREADY the active element on attach, show it
    if (document.activeElement === input) {
      showIcon()
    }
  }

  function removeBadgeForInput(input) {
    const icon = inputIconMap.get(input)
    if (icon) {
      icon.remove()
      inputIconMap.delete(input)
    }
    delete input.dataset.akaromiAttached
  }

  function cleanupRemovedInputs() {
    inputIconMap.forEach((icon, input) => {
      if (!document.body.contains(input)) {
        removeBadgeForInput(input)
      }
    })
  }

  function updateAllVisibleIcons() {
    inputIconMap.forEach((icon, input) => {
      if (icon.classList.contains("visible") || document.activeElement === input) {
        updateIconPosition(input, icon)
      }
    })
  }

  window.addEventListener("scroll", updateAllVisibleIcons, { passive: true })
  window.addEventListener("resize", updateAllVisibleIcons, { passive: true })

  global.AkaromiBadge = {
    attachBadgeToInput,
    removeBadgeForInput,
    cleanupRemovedInputs,
    updateIconPosition,
    updateAllVisibleIcons,
    setActiveDropdownTarget: (target) => { activeDropdownTarget = target },
    getActiveDropdownTarget: () => activeDropdownTarget,
    getIconForInput: (input) => inputIconMap.get(input),
  }
})(typeof window !== "undefined" ? window : globalThis)
