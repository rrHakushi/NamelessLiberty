/**
 * Akaromi for Firefox — Form Autofill & Input Event Dispatcher
 */
;(function (global) {
  "use strict"

  if (window !== window.top) return

  const ext = typeof browser !== "undefined" ? browser : (typeof chrome !== "undefined" ? chrome : global.AkaromiExt)

  function isElementVisible(el) {
    if (!el || !el.isConnected || el.disabled || el.readOnly) return false
    const rects = el.getClientRects()
    if (rects.length === 0) return false
    const rect = el.getBoundingClientRect()
    if (rect.width < 8 || rect.height < 8 || rect.bottom <= 0 || rect.right <= 0) {
      return false
    }
    try {
      const style = window.getComputedStyle(el)
      if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) <= 0.05) {
        return false
      }
    } catch {}
    return true
  }

    // Step 2: Synthetic Event Dispatching
  // Step 2.1: Full Bubbling Event Chain Dispatch (focus -> input -> change -> blur)
  function dispatchInputEvents(element) {
    if (!element) return
    try {
      element.dispatchEvent(new Event("focus", { bubbles: true }))
      element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }))
      element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }))
      element.dispatchEvent(new Event("blur", { bubbles: true }))
    } catch {}
  }

    // Step 1: Prototype Value Setter Invocation
  // Step 1.1: Native Prototype Setter Execution
  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set
    const prototype = Object.getPrototypeOf(element)
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value)
    } else if (valueSetter) {
      valueSetter.call(element, value)
    } else {
      element.value = value
    }
  }

  function findTotpInput(container = document) {
    if (!container || typeof container.querySelectorAll !== "function") return null
    const inputs = Array.from(container.querySelectorAll("input"))
    return inputs.find((el) => global.AkaromiDetection?.isTotpInput?.(el) && isElementVisible(el)) || null
  }

    // Step 3: Multi-Field Credential Injection
  // Step 3.1: Username, Password & 2FA OTP Automatic Discovery
  function fillCredential(cipher, specificPassword = null, initialCode = "", targetInput = null) {
    if (!cipher) return
    const data = cipher.data || {}
    const username = data.username || data.email || ""
    const password = specificPassword !== null ? specificPassword : (data.password || "")

    const activeEl = (targetInput && targetInput.isConnected) ? targetInput : document.activeElement
    const targetIsTotp = Boolean(activeEl && global.AkaromiDetection?.isTotpInput?.(activeEl))
    const form =
      (activeEl && activeEl.form) ||
      (activeEl && activeEl.closest('form, [role="form"], [class*="auth" i], [class*="login" i], [class*="signin" i], main')) ||
      document

    if (targetIsTotp) {
      if (initialCode) {
        setNativeValue(activeEl, initialCode)
        dispatchInputEvents(activeEl)
      }
      ext.runtime.sendMessage({ action: "PING_ACTIVITY" }).catch(() => {})
      return
    }

    // Fill Username
    if (username) {
      let userInput = null
      if (activeEl && activeEl.tagName === "INPUT" && activeEl.type !== "password") {
        userInput = activeEl
      } else {
        const textInputs = Array.from(
          form.querySelectorAll('input[type="text"], input[type="email"], input:not([type])')
        ).filter((el) => isElementVisible(el) && !global.AkaromiDetection?.isSearchInput(el) && !global.AkaromiDetection?.isTotpInput?.(el))

        userInput =
          textInputs.find((el) => /user|login|email/i.test(el.name + " " + el.id + " " + el.placeholder)) ||
          textInputs[0]
      }

      if (userInput) {
        setNativeValue(userInput, username)
        dispatchInputEvents(userInput)
      }
    }

    // Fill Password
    if (password) {
      let passInput = null
      if (activeEl && activeEl.tagName === "INPUT" && activeEl.type === "password") {
        passInput = activeEl
      } else {
        const passInputs = Array.from(form.querySelectorAll('input[type="password"]')).filter(isElementVisible)
        passInput = passInputs[0] || null
      }

      if (passInput) {
        setNativeValue(passInput, password)
        dispatchInputEvents(passInput)
      }
    }

    // Fill TOTP field automatically if one is already present on the page
    let totpFilledInline = false
    if (initialCode) {
      const otpInput = findTotpInput(form) || (form !== document ? findTotpInput(document) : null)
      if (otpInput) {
        setNativeValue(otpInput, initialCode)
        dispatchInputEvents(otpInput)
        totpFilledInline = true
      }
    }

    // Ping background activity
    ext.runtime.sendMessage({ action: "PING_ACTIVITY" }).catch(() => {})

    // Launch live TOTP widget only when 2FA is configured and wasn't already filled inline
    const hasTotp = Boolean(cipher.hasTotp || initialCode)
    const cipherId = cipher.id || ""

    if (hasTotp && cipherId && !totpFilledInline) {
      const accountLabel = cipher.title || username || "2FA"
      let launched = false
      const invokeWidget = () => {
        if (launched) return
        const fn = global.AkaromiTotp?.showFloatingTotpWidget || globalThis.AkaromiTotp?.showFloatingTotpWidget
        if (typeof fn === "function") {
          launched = true
          fn(cipherId, accountLabel, initialCode || "")
        }
      }

      invokeWidget()
      if (!launched) {
        setTimeout(invokeWidget, 100)
      }
    }
  }

  global.AkaromiFill = {
    fillCredential,
    setNativeValue,
    dispatchInputEvents,
  }
})(typeof window !== "undefined" ? window : globalThis)
