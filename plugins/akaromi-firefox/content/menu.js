/**
 * Akaromi for Firefox — Floating Dropdown & In-Page Autofill Menu
 */
;(function (global) {
  "use strict"

  if (window !== window.top) return

  const ext = typeof browser !== "undefined" ? browser : (typeof chrome !== "undefined" ? chrome : global.AkaromiExt || global.browser || global.chrome)

  const domParser = new DOMParser()
  function safeSetTemplate(element, htmlString) {
    element.replaceChildren()
    const doc = domParser.parseFromString(htmlString, "text/html")
    while (doc.body.firstChild) {
      element.appendChild(doc.body.firstChild)
    }
  }

  function getOrCreatePortal() {
    if (global.AkaromiPortal?.getRoot) {
      return global.AkaromiPortal.getRoot()
    }
    throw new Error("AkaromiPortal unavailable")
  }

  let activeDropdown = null
  let currentTargetInput = null

  function removeDropdown(clearSearchAuth = true) {
    global.AkaromiEventShield?.setInputHandler?.(null)
    if (activeDropdown) {
      activeDropdown.remove()
      activeDropdown = null
      currentTargetInput = null
      global.AkaromiBadge?.setActiveDropdownTarget(null)
      if (clearSearchAuth) {
        ext.runtime?.sendMessage?.({ action: "CLEAR_INLINE_SEARCH_AUTH" }).catch(() => {})
      }
    }
  }

  // Filter ciphers supporting multi-term AND, * wildcards, and prefix syntax (user:, domain:, email:, title:, note:)
  function matchesSearchPattern(haystack, pattern) {
    if (!pattern) return true
    if (!pattern.includes("*")) return haystack.includes(pattern)
    const parts = pattern.split("*")
    let pos = 0
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part) continue
      const idx = haystack.indexOf(part, pos)
      if (idx === -1) return false
      pos = idx + part.length
    }
    return true
  }

  function filterCiphersByQuery(ciphers, rawQuery) {
    if (!rawQuery || !rawQuery.trim()) return ciphers
    const tokens = (rawQuery.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [])
      .map((t) => t.replace(/^"(.*)"$/, "$1").toLowerCase())
      .filter(Boolean)
    if (tokens.length === 0) return ciphers

    return ciphers.filter((c) => {
      const title = (c.title || "").toLowerCase()
      const username = (c.data?.username || "").toLowerCase()
      const email = (c.data?.email || "").toLowerCase()
      const urisList = (c.data?.uris || []).map((u) => (typeof u === "string" ? u : u?.uri || "").toLowerCase()).filter(Boolean)
      if (c.data?.passkey?.rpId) urisList.push(String(c.data.passkey.rpId).toLowerCase())
      const notes = (c.data?.notes || c.data?.noteBody || "").toLowerCase()

      return tokens.every((tok) => {
        if (tok.startsWith("user:") || tok.startsWith("username:")) {
          const val = tok.replace(/^user(name)?:/, "")
          return matchesSearchPattern(username, val)
        }
        if (tok.startsWith("email:")) {
          const val = tok.replace(/^email:/, "")
          return matchesSearchPattern(email, val) || matchesSearchPattern(username, val)
        }
        if (tok.startsWith("domain:") || tok.startsWith("url:") || tok.startsWith("host:")) {
          const val = tok.replace(/^(domain|url|host):/, "")
          return !val || urisList.some((u) => matchesSearchPattern(u, val))
        }
        if (tok.startsWith("title:")) {
          const val = tok.replace(/^title:/, "")
          return matchesSearchPattern(title, val)
        }
        if (tok.startsWith("note:") || tok.startsWith("notes:")) {
          const val = tok.replace(/^notes?:/, "")
          return matchesSearchPattern(notes, val)
        }
        return (
          matchesSearchPattern(title, tok) ||
          matchesSearchPattern(username, tok) ||
          matchesSearchPattern(email, tok) ||
          urisList.some((u) => matchesSearchPattern(u, tok)) ||
          matchesSearchPattern(notes, tok)
        )
      })
    })
  }

    // Step 2: Floating Dropdown Lifecycle & Viewport Clamping
  // Step 2.1: Dropdown Container Construction & Boundary Clamping
  async function showFieldDropdown(targetInput) {
    if (!targetInput) return
    if (activeDropdown && currentTargetInput === targetInput) return

    removeDropdown()
    currentTargetInput = targetInput
    global.AkaromiBadge?.setActiveDropdownTarget(targetInput)

    const rect = targetInput.getBoundingClientRect()
    const dropdown = document.createElement("div")
    dropdown.className = "akaromi-dropdown"
    dropdown.setAttribute("data-akaromi-ignore", "true")

    // Position directly beneath or above input using viewport coordinates
    const dropdownWidth = 280
    const estimatedHeight = 320
    let top = rect.bottom + 6
    let left = rect.left

    if (top + estimatedHeight > window.innerHeight && rect.top > estimatedHeight) {
      top = Math.max(10, rect.top - estimatedHeight - 6)
    } else {
      top = Math.min(top, Math.max(10, window.innerHeight - 80))
    }

    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 12)
    } else if (left < 12) {
      left = 12
    }

    dropdown.style.position = "fixed"
    dropdown.style.top = `${Math.round(top)}px`
    dropdown.style.left = `${Math.round(left)}px`

    // Loading State
    safeSetTemplate(
      dropdown,
      `<div class="akaromi-dropdown-loading">
        <span>Loading credentials...</span>
      </div>`
    )

    getOrCreatePortal().appendChild(dropdown)
    activeDropdown = dropdown

    try {
      const response = await ext.runtime.sendMessage({
        action: "GET_MATCHING_LOGINS",
        payload: { url: window.location.href },
      })

      if (!dropdown.parentElement) return // dismissed while waiting

      // LOCKED STATE
      if (!response?.isUnlocked) {
        safeSetTemplate(
          dropdown,
          `<div class="akaromi-dropdown-header">
            <div class="akaromi-dropdown-brand">
              <span class="akaromi-dropdown-title">Akaromi is Locked</span>
            </div>
          </div>
          <div class="akaromi-dropdown-empty">
            <span>Unlock Akaromi to autofill credentials on this site.</span>
            <button type="button" class="akaromi-btn-unlock" id="btn-portal-unlock">
              Unlock Vault
            </button>
          </div>`
        )
        dropdown.querySelector("#btn-portal-unlock")?.addEventListener("click", (e) => {
          if (!e.isTrusted) return
          removeDropdown()
          ext.runtime.sendMessage({ action: "OPEN_UNLOCK_WINDOW" }).catch(() => {})
        })
        return
      }

      const isTotpTarget = Boolean(global.AkaromiDetection?.isTotpInput?.(targetInput))
      const siteMatches = response.matches || []
      const siteMatchTierById = new Map(siteMatches.map((m) => [m.id, m._matchTier || "exact"]))
      let searchedVaultLogins = null
      let lastSearchedKey = null
      let searchSeq = 0
      let currentQuery = ""

      async function queryVaultLogins(query) {
        const key = query
        const seq = ++searchSeq
        try {
          const res = await ext.runtime.sendMessage({
            action: "SEARCH_LOGINS_FOR_INLINE_FILL",
            payload: { query },
          })
          if (seq !== searchSeq || !dropdown.parentElement) return null
          const raw = res?.ciphers || []
          lastSearchedKey = key
          searchedVaultLogins = raw.map((c) => ({
            ...c,
            _matchTier: siteMatchTierById.get(c.id) || "all",
          }))
          return searchedVaultLogins
        } catch {
          return null
        }
      }

      dropdown.replaceChildren()

      // 1. Search Container
      const searchBox = document.createElement("div")
      searchBox.className = "akaromi-search-container"
      safeSetTemplate(
        searchBox,
        `<div class="akaromi-search-input-wrap">
          <svg class="akaromi-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            class="akaromi-search-field"
            id="akaromi-search-input"
            placeholder="${isTotpTarget ? "Search 2FA accounts (e.g. user:, domain:)..." : "Search logins (e.g. user:, domain:)..."}"
            autocomplete="off"
            spellcheck="false"
          />
        </div>`
      )
      dropdown.appendChild(searchBox)

      const searchInput = searchBox.querySelector("#akaromi-search-input")

      // List container
      const list = document.createElement("div")
      list.className = "akaromi-dropdown-list"
      dropdown.appendChild(list)

      // Render Items Function
      function renderList() {
        list.replaceChildren()

        const hasQuery = Boolean(currentQuery && currentQuery.trim())
        const showAllPool = hasQuery
        const desiredKey = currentQuery

        if (showAllPool && lastSearchedKey !== desiredKey) {
          queryVaultLogins(currentQuery).then((loaded) => {
            if (loaded && dropdown.parentElement) renderList()
          })
        }

        let filtered = showAllPool
          ? (lastSearchedKey === desiredKey && searchedVaultLogins ? searchedVaultLogins : filterCiphersByQuery(siteMatches, currentQuery))
          : filterCiphersByQuery(siteMatches, currentQuery)

        if (isTotpTarget) {
          const totpOnly = filtered.filter((m) => m.hasTotp)
          if (totpOnly.length > 0 || !showAllPool) {
            filtered = totpOnly
          }
        }

        if (filtered.length === 0) {
          safeSetTemplate(
            list,
            `<div class="akaromi-dropdown-empty">
              <span>${currentQuery ? "No matching logins found" : "No saved logins for this website"}</span>
            </div>`
          )
          return
        }

        // Group into Exact Domain, Base Domain, and Other/All
        const exact = []
        const base = []
        const other = []

        for (const item of filtered) {
          if (item._matchTier === "exact") {
            exact.push(item)
          } else if (item._matchTier === "base") {
            base.push(item)
          } else {
            other.push(item)
          }
        }

        function createSectionHeader(title, count) {
          const sec = document.createElement("div")
          sec.className = "akaromi-section-header"
          const titleSpan = document.createElement("span")
          titleSpan.textContent = title
          const countSpan = document.createElement("span")
          countSpan.className = "sec-count"
          countSpan.textContent = String(count)
          sec.appendChild(titleSpan)
          sec.appendChild(countSpan)
          return sec
        }

        function appendGroup(items, title) {
          if (items.length === 0) return
          if (title) {
            list.appendChild(createSectionHeader(title, items.length))
          }
          items.forEach((m) => {
            list.appendChild(createItemElement(m))
          })
        }

        if (showAllPool) {
          appendGroup(exact, "Exact Domain Matches")
          appendGroup(base, "Base Domain Matches")
          appendGroup(other, "Other Vault Logins")
        } else {
          appendGroup(exact, "Exact Domain Matches")
          appendGroup(base, "Base Domain Matches")
        }
      }

      function createItemElement(m) {
        const item = document.createElement("div")
        item.className = "akaromi-dropdown-item"

        const title = m.title || "Account"
        const username = m.data?.username || m.data?.email || "No username"
        const domainHint = m._matchTier === "all" && m.data?.domainHint ? m.data.domainHint : ""
        const subtitle = domainHint ? `${username} · ${domainHint}` : username
        const additional = m.data?.additionalPasswords || []

        const iconHtml = (typeof IrisIcons !== "undefined")
          ? IrisIcons.get("key", "tabler-icon", 'style="width:16px;height:16px;"')
          : ""

        const chevronHtml = additional.length > 0
          ? `<button type="button" class="akaromi-sub-toggle-btn" title="Additional Passwords (${additional.length})" aria-label="Toggle additional passwords" aria-expanded="false" style="all: unset !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 24px !important; height: 24px !important; min-width: 24px !important; min-height: 24px !important; max-width: 24px !important; max-height: 24px !important; border-radius: 6px !important; cursor: pointer !important; color: #71717a !important; margin-inline-start: auto !important; flex-shrink: 0 !important; transition: all 0.15s ease !important; box-sizing: border-box !important;">
              <svg class="tabler-icon akaromi-sub-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px !important; height: 14px !important; min-width: 14px !important; max-width: 14px !important; flex-shrink: 0 !important; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.12s ease !important; display: block !important;">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>`
          : ""

        safeSetTemplate(
          item,
          `<div class="akaromi-item-main">
            <div class="akaromi-item-icon">${iconHtml}</div>
            <div class="akaromi-item-meta">
              <div class="akaromi-item-title">${escapeHtml(title)}</div>
              <div class="akaromi-item-user">${escapeHtml(subtitle)}</div>
            </div>
            ${chevronHtml}
          </div>`
        )

        const handleCredentialSelect = async (subPasswordId = null) => {
          const targetEl = targetInput
          removeDropdown(false)
          try {
            const res = await ext.runtime.sendMessage({
              action: "GET_CREDENTIAL_FOR_AUTOFILL",
              payload: {
                cipherId: m.id,
                subPasswordId,
                url: window.location.href,
                userSelected: true,
              },
            })
            if (!res || !res.success) return
            const password = res.password || ""
            const generatedCode = res.totpCode || ""

            global.AkaromiFill?.fillCredential(
              {
                id: res.cipherId || m.id,
                title: m.title,
                hasTotp: Boolean(res.hasTotp || generatedCode),
                data: {
                  username: res.username || m.data?.username || "",
                  password,
                },
              },
              password,
              generatedCode,
              targetEl
            )
          } catch (err) {
            console.warn("[Akaromi] Failed to autofill credential:", err)
          }
        }

        const mainItem = item.querySelector(".akaromi-item-main")
        mainItem.addEventListener("mousedown", (e) => {
          if (e.target.closest(".akaromi-sub-toggle-btn")) return
          e.preventDefault()
        })
        mainItem.addEventListener("click", (e) => {
          if (!e.isTrusted) return
          if (e.target.closest(".akaromi-sub-toggle-btn")) return
          e.preventDefault()
          e.stopPropagation()
          handleCredentialSelect(null)
        })

        if (additional.length > 0) {
          const toggleBtn = mainItem.querySelector(".akaromi-sub-toggle-btn")
          const subWrapper = document.createElement("div")
          subWrapper.className = "akaromi-sub-passwords-wrapper"
          subWrapper.style.cssText = "display: none !important; padding: 4px 10px 8px 36px !important; flex-direction: column !important; gap: 4px !important; box-sizing: border-box !important; width: 100% !important;"

          let isOpen = false

          if (toggleBtn) {
            toggleBtn.addEventListener("mousedown", (e) => {
              e.preventDefault()
              e.stopPropagation()
            })
            toggleBtn.addEventListener("click", (e) => {
              if (!e.isTrusted) return
              e.preventDefault()
              e.stopPropagation()
              isOpen = !isOpen
              item.classList.toggle("open", isOpen)
              toggleBtn.setAttribute("aria-expanded", String(isOpen))
              subWrapper.style.display = isOpen ? "flex" : "none"
              const chevron = toggleBtn.querySelector(".akaromi-sub-chevron")
              if (chevron) {
                chevron.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)"
                chevron.style.color = isOpen ? "#fafafa" : "#71717a"
                chevron.style.stroke = isOpen ? "#fafafa" : "#71717a"
              }
            })
          }

          additional.forEach((ap, idx) => {
            const subItem = document.createElement("button")
            subItem.type = "button"
            subItem.className = "akaromi-sub-btn"
            subItem.style.cssText = "all: unset !important; display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 5px 8px !important; border-radius: 6px !important; background: #18181b !important; border: 1px solid #27272a !important; color: #fafafa !important; font-size: 11px !important; cursor: pointer !important; transition: all 0.12s ease !important; width: 100% !important; box-sizing: border-box !important; margin: 0 !important;"
            safeSetTemplate(
              subItem,
              `<span class="sub-label" style="font-weight: 500 !important; color: #e4e4e7 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">${escapeHtml(ap.name || "Code")}</span>
              <span class="sub-masked" style="font-family: ui-monospace, monospace !important; color: #71717a !important; letter-spacing: 0.1em !important;">••••••••</span>`
            )
            subItem.addEventListener("mousedown", (e) => e.preventDefault())
            subItem.addEventListener("click", (e) => {
              if (!e.isTrusted) return
              e.preventDefault()
              e.stopPropagation()
              handleCredentialSelect(ap.id || String(idx))
            })
            subWrapper.appendChild(subItem)
          })

          item.appendChild(subWrapper)
        }

        return item
      }

      // Event Listeners for Search
      const syncSearchQuery = () => {
        if (!searchInput) return
        if (currentQuery !== searchInput.value) {
          currentQuery = searchInput.value
          renderList()
        }
      }

      global.AkaromiEventShield?.setInputHandler?.(syncSearchQuery)

      searchInput?.addEventListener("input", (e) => {
        if (!e.isTrusted) return
        syncSearchQuery()
      })

      renderList()
    } catch (err) {
      console.warn("[Akaromi] Failed to load matches for dropdown:", err)
      removeDropdown()
    }
  }

  function escapeHtml(str) {
    if (!str) return ""
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  // Dismiss dropdown when clicking outside
  document.addEventListener("mousedown", (e) => {
    if (activeDropdown && !activeDropdown.contains(e.target)) {
      const activeTarget = global.AkaromiBadge?.getActiveDropdownTarget()
      const icon = activeTarget ? global.AkaromiBadge?.getIconForInput(activeTarget) : null
      if (icon && icon.contains(e.target)) return
      removeDropdown()
    }
  })

  function refreshOnUnlock() {
    if (currentTargetInput && currentTargetInput.isConnected) {
      const target = currentTargetInput
      currentTargetInput = null
      showFieldDropdown(target)
    }
  }

  function updateDropdownPosition() {
    if (!activeDropdown || !currentTargetInput) return
    const rect = currentTargetInput.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0 || !document.body.contains(currentTargetInput)) {
      removeDropdown()
      return
    }
    const dropdownWidth = 280
    const dropdownHeight = activeDropdown.offsetHeight || 320
    let top = rect.bottom + 6
    let left = rect.left

    if (top + dropdownHeight > window.innerHeight && rect.top > dropdownHeight) {
      top = Math.max(10, rect.top - dropdownHeight - 6)
    }

    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 12)
    } else if (left < 12) {
      left = 12
    }

    activeDropdown.style.top = `${Math.round(top)}px`
    activeDropdown.style.left = `${Math.round(left)}px`
  }

  window.addEventListener("scroll", updateDropdownPosition, { passive: true })
  window.addEventListener("resize", updateDropdownPosition, { passive: true })

  global.AkaromiMenu = {
    showFieldDropdown,
    removeDropdown,
    refreshOnUnlock,
  }
})(typeof window !== "undefined" ? window : globalThis)
