const STORAGE_KEY = "bot.dashboard.demo.v3";
const LIVE_KEY = "bot.dashboard.live.v2";

const HELP = {
  enable_trading:
    "Global master switch for execution. If disabled, the bot can scan and analyze but must not open new positions.",
  rollout_mode:
    "Controls how live trading is staged. shadow = no orders, limited_live = controlled exposure, full_live = full engine limits.",
  active_strategy:
    "Primary entry logic used by the trading loop. desk_htf is currently the main production contour.",
  entry_order_mode:
    "UI-level mode switch for entry intent. Market executes immediately; Limit waits for target price.",
  desk_publish_live_entry_enabled:
    "Allows opening trades directly from published desk setups when conditions are met.",
  desk_trade_published_setups_only:
    "If enabled, the bot ignores scanner-only opportunities and trades only published setup trackers.",
  desk_publish_tp_ladder_enabled:
    "If enabled, position exits are split into two targets (TP1 + TP2) instead of a single full close.",
  symbol_blacklist: "Comma-separated symbols the bot must never trade.",
  rollout_limited_symbols_csv:
    "Whitelist used in limited_live mode. CSV import is recommended for larger universes.",
  max_leverage:
    "Global leverage ceiling. Strategy-level leverage values are clamped to this maximum.",
  adaptive_leverage_min:
    "Lower bound for adaptive leverage selection. Helps avoid under-sizing in stable conditions.",
  adaptive_leverage_max:
    "Upper adaptive leverage bound before final exchange-level constraints.",
  risk_per_trade:
    "Fraction of equity risked per trade. Use conservative increments when changing this value.",
  telegram_desk_setups_enabled:
    "Publishes structured desk setup cards to Telegram according to desk scheduler rules.",
  telegram_desk_setups_interval_sec:
    "How often desk setup posts are generated. Higher values reduce posting frequency.",
  telegram_digest_enabled: "Enables periodic market digest posts.",
  telegram_digest_interval_sec:
    "Time between digest publications. Runtime enforces a minimum safety interval.",
  telegram_news_flash_enabled: "Enables event/news flash feed from configured sources.",
  telegram_news_flash_poll_sec:
    "Polling cadence for RSS/news checks. Lower values increase checks and can create noise.",
  telegram_news_flash_min_spacing_sec:
    "Minimum time gap between published news flashes, even when hourly cap allows more.",
  telegram_news_flash_max_per_hour:
    "Hard limit for total news flashes that can be published within one hour.",
  telegram_post_live_trades: "Posts live trade entry/exit cards to channel when enabled.",
  pairs_import_target:
    "Choose where imported symbols will be applied: Whitelist (limited_live allow-list) or Blacklist (never trade).",
  pairs_apply_mode:
    "Replace overwrites the target list. Append merges imported symbols with the current target list.",
};

const DEMO = {
  status: {
    trading: {
      rollout_mode: "limited_live",
      active_strategy: "desk_htf",
      open_positions_db: 2,
      max_open_positions: 4,
    },
    balances: {
      total_balance_usdt: 2148.76,
      available_balance_usdt: 1732.21,
      margin_in_positions_usdt: 416.55,
      unrealized_pnl_usdt: -32.44,
    },
  },
  settings: {
    enable_trading: false,
    rollout_mode: "limited_live",
    active_strategy: "desk_htf",
    entry_order_mode: "market",
    symbol_blacklist: "RAVE/USDT:USDT",
    rollout_limited_symbols_csv: "BTC/USDT:USDT,ETH/USDT:USDT",
    max_leverage: 10,
    adaptive_leverage_min: 5,
    adaptive_leverage_max: 10,
    risk_per_trade: 0.006,
    entry_min_risk_usd: 5,
    entry_max_risk_usd: 10,
    desk_publish_live_margin_usdt: 20,
    desk_publish_live_leverage: 10,
    desk_publish_live_entry_enabled: true,
    desk_trade_published_setups_only: true,
    desk_publish_tp_ladder_enabled: true,
    desk_publish_tp1_fraction: 0.5,
    telegram_desk_setups_enabled: true,
    telegram_desk_setups_interval_sec: 9360,
    telegram_digest_enabled: true,
    telegram_digest_interval_sec: 14400,
    telegram_news_flash_enabled: true,
    telegram_news_flash_poll_sec: 300,
    telegram_news_flash_min_spacing_sec: 7200,
    telegram_news_flash_max_per_hour: 1,
    telegram_post_live_trades: false,
    telegram_bot_token: "<server-managed>",
    telegram_signals_chat_id: "<server-managed>",
    openai_api_key: "<server-managed>",
  },
  trades: [
    { id: 124, symbol: "BTC/USDT:USDT", side: "long", status: "closed", leverage: 8, pnl: 42.15 },
    { id: 123, symbol: "ETH/USDT:USDT", side: "short", status: "closed", leverage: 6, pnl: -15.62 },
    { id: 122, symbol: "SOL/USDT:USDT", side: "long", status: "open", leverage: 5, pnl: null },
  ],
};

function loadDemo() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(DEMO);
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEMO),
      ...parsed,
      status: {
        ...DEMO.status,
        ...(parsed.status || {}),
        trading: { ...DEMO.status.trading, ...((parsed.status || {}).trading || {}) },
        balances: { ...DEMO.status.balances, ...((parsed.status || {}).balances || {}) },
      },
      settings: { ...DEMO.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return structuredClone(DEMO);
  }
}

function saveDemo(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadLiveCfg() {
  try {
    return JSON.parse(localStorage.getItem(LIVE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLiveCfg(cfg) {
  localStorage.setItem(LIVE_KEY, JSON.stringify(cfg));
}

function setActiveNav() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });
}

function renderHeaderStats(data) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  set("kpiMode", formatEnumLabel(data.status.trading.rollout_mode));
  set("kpiStrategy", formatEnumLabel(data.status.trading.active_strategy));
  set("kpiOpen", String(data.status.trading.open_positions_db));

  const pnl = data.trades.reduce((sum, t) => sum + (typeof t.pnl === "number" ? t.pnl : 0), 0);
  const pnlEl = document.getElementById("kpiPnl");
  if (pnlEl) {
    pnlEl.textContent = `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`;
    pnlEl.classList.toggle("pos", pnl >= 0);
    pnlEl.classList.toggle("neg", pnl < 0);
  }

  set("kpiTotalBalance", `$${Number(data.status.balances.total_balance_usdt).toFixed(2)}`);
  set("kpiAvailableBalance", `$${Number(data.status.balances.available_balance_usdt).toFixed(2)}`);
  set("kpiMarginInUse", `$${Number(data.status.balances.margin_in_positions_usdt).toFixed(2)}`);

  const upnl = Number(data.status.balances.unrealized_pnl_usdt);
  const upnlEl = document.getElementById("kpiUnrealized");
  if (upnlEl) {
    upnlEl.textContent = `${upnl >= 0 ? "+" : ""}$${upnl.toFixed(2)}`;
    upnlEl.classList.toggle("pos", upnl >= 0);
    upnlEl.classList.toggle("neg", upnl < 0);
  }

  renderDataSourceLabel();
}

function formatEnumLabel(value) {
  const raw = String(value || "");
  if (!raw) return "-";
  return raw
    .split("_")
    .map((part) => {
      if (part.toUpperCase() === "HTF") return "HTF";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function renderDataSourceLabel() {
  const el = document.getElementById("overviewDataSource");
  if (!el) return;
  const modeControl = document.getElementById("dataMode");
  if (!modeControl) {
    el.textContent = "Showcase Demo";
    return;
  }
  const mode = modeControl.value || "demo";
  el.textContent = mode === "live" ? "Live (Read-Only)" : "Demo (Local)";
}

function formatConfigValue(key, value) {
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (key === "rollout_mode" || key === "active_strategy" || key === "entry_order_mode") {
    return formatEnumLabel(value);
  }
  return String(value);
}

function renderCurrentConfig(data) {
  const container = document.getElementById("currentConfigList");
  if (!container) return;
  const rows = [
    { key: "enable_trading", label: "Trading Enabled", value: data.settings.enable_trading },
    { key: "rollout_mode", label: "Rollout Mode", value: data.settings.rollout_mode },
    { key: "active_strategy", label: "Strategy", value: data.settings.active_strategy },
    { key: "entry_order_mode", label: "Order Type", value: data.settings.entry_order_mode },
    { key: "max_leverage", label: "Max Leverage", value: String(data.settings.max_leverage) },
    { key: "risk_per_trade", label: "Risk Per Trade", value: Number(data.settings.risk_per_trade).toFixed(4) },
    { key: "desk_publish_tp_ladder_enabled", label: "TP Ladder", value: data.settings.desk_publish_tp_ladder_enabled },
    { key: "telegram_desk_setups_enabled", label: "Telegram Desk", value: data.settings.telegram_desk_setups_enabled },
  ];
  container.innerHTML = rows
    .map(
      (row, idx) =>
        `<div class="config-item"><span class="muted">${row.label}</span><span class="${idx < 4 ? "" : "mono"}">${formatConfigValue(
          row.key,
          row.value
        )}</span></div>`
    )
    .join("");
}

function bindSettingsForm(data) {
  const form = document.querySelector("[data-settings-form]");
  if (!form) return;
  form.querySelectorAll("[name]").forEach((input) => {
    const key = input.name;
    const value = data.settings[key];
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else if (input.type === "radio") {
      input.checked = String(input.value) === String(value);
    } else {
      input.value = value == null ? "" : String(value);
    }

    input.addEventListener("change", () => {
      if (input.dataset.secretPlaceholder === "true") return;
      if (input.type === "checkbox") data.settings[key] = input.checked;
      else if (input.type === "radio") {
        if (input.checked) data.settings[key] = input.value;
      } else if (input.type === "number") data.settings[key] = Number(input.value);
      else data.settings[key] = input.value;
      saveDemo(data);
      renderCurrentConfig(data);
    });
  });
}

function bindSaveReset(data) {
  const save = document.getElementById("saveBtn");
  const reset = document.getElementById("resetBtn");
  const buildPayloadFromForm = () => {
    const form = document.querySelector("[data-settings-form]");
    if (!form) return {};
    const payload = {};
    const grouped = new Map();
    form.querySelectorAll("[name]").forEach((input) => {
      if (input.dataset.secretPlaceholder === "true") return;
      const key = input.name;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(input);
    });
    for (const [key, inputs] of grouped.entries()) {
      const sample = inputs[0];
      if (sample.type === "radio") {
        const checked = inputs.find((x) => x.checked);
        if (checked) payload[key] = checked.value;
      } else if (sample.type === "checkbox") {
        payload[key] = Boolean(sample.checked);
      } else if (sample.type === "number") {
        payload[key] = Number(sample.value);
      } else {
        payload[key] = sample.value;
      }
    }
    return payload;
  };
  if (save) {
    save.addEventListener("click", async () => {
      saveDemo(data);
      const mode = document.getElementById("dataMode")?.value || "demo";
      if (mode === "demo") {
        alert("Saved in demo storage.");
        return;
      }
      const cfg = loadLiveCfg();
      if (!cfg.baseUrl) {
        alert("Set Live API Base URL first.");
        return;
      }
      const payload = buildPayloadFromForm();
      try {
        const headers = { "Content-Type": "application/json" };
        if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
        const resp = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/api/config`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          let detail = `HTTP ${resp.status}`;
          try {
            const err = await resp.json();
            detail = err.detail || detail;
          } catch {
            // Keep HTTP fallback detail.
          }
          throw new Error(detail);
        }
        const body = await resp.json();
        if (body.current && typeof body.current === "object") {
          data.settings = { ...data.settings, ...body.current };
          saveDemo(data);
          const form = document.querySelector("[data-settings-form]");
          if (form) {
            form.querySelectorAll("[name]").forEach((input) => {
              const key = input.name;
              const value = data.settings[key];
              if (input.type === "checkbox") input.checked = Boolean(value);
              else if (input.type === "radio") input.checked = String(input.value) === String(value);
              else input.value = value == null ? "" : String(value);
            });
          }
          renderCurrentConfig(data);
        }
        alert("Saved to server successfully.");
      } catch (e) {
        alert(`Server save failed: ${String(e)}`);
      }
    });
  }
  if (reset) {
    reset.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
  }
}

function renderTrades(data) {
  const tbody = document.getElementById("tradesBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  for (const t of data.trades) {
    const c = t.pnl == null ? "" : t.pnl >= 0 ? "pos" : "neg";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${t.id}</td><td>${t.symbol}</td><td>${t.side}</td><td>${t.status}</td><td>${t.leverage}</td><td class="${c}">${t.pnl == null ? "-" : t.pnl.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  }
}

function parseCsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((c) => c.trim()));
  const flat = [];
  for (const row of rows) {
    for (const cell of row) {
      if (cell) flat.push(cell.toUpperCase());
    }
  }
  return [...new Set(flat)];
}

function parseSymbolsFromSetting(value) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
}

function getCheckedRadioValue(name, fallback) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : fallback;
}

function bindCsvFlow(data) {
  const input = document.getElementById("pairsCsvFile");
  const pickBtn = document.getElementById("pickPairsFileBtn");
  const fileNameEl = document.getElementById("pairsCsvFileName");
  const preview = document.getElementById("pairsPreview");
  const uploadBtn = document.getElementById("uploadPairsBtn");
  const info = document.getElementById("uploadPairsInfo");
  if (!input || !preview || !uploadBtn || !info) return;
  let parsed = [];

  if (pickBtn) {
    pickBtn.addEventListener("click", () => input.click());
  }

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) {
      if (fileNameEl) fileNameEl.textContent = "No file selected";
      return;
    }
    if (fileNameEl) fileNameEl.textContent = file.name;
    parsed = parseCsv(await file.text());
    preview.innerHTML = parsed.map((x) => `<span class="pill">${x}</span>`).join("");
    info.textContent = parsed.length ? `Parsed ${parsed.length} symbols.` : "No valid symbols found.";
  });

  uploadBtn.addEventListener("click", async () => {
    if (!parsed.length) {
      alert("Select a CSV file first.");
      return;
    }
    const target = getCheckedRadioValue("pairs_import_target", "whitelist");
    const applyMode = getCheckedRadioValue("pairs_apply_mode", "replace");
    const targetSettingKey = target === "blacklist" ? "symbol_blacklist" : "rollout_limited_symbols_csv";

    const mode = document.getElementById("dataMode")?.value || "demo";
    if (mode === "demo") {
      const current = parseSymbolsFromSetting(data.settings[targetSettingKey]);
      const finalSymbols =
        applyMode === "append" ? [...new Set([...current, ...parsed])] : [...new Set(parsed)];
      data.settings[targetSettingKey] = finalSymbols.join(",");
      saveDemo(data);
      renderCurrentConfig(data);
      info.textContent = `Demo mode: ${target} updated (${finalSymbols.length} symbols, ${applyMode}).`;

      const form = document.querySelector("[data-settings-form]");
      const targetInput = form?.querySelector(`[name="${targetSettingKey}"]`);
      if (targetInput) targetInput.value = data.settings[targetSettingKey];
      return;
    }
    const cfg = loadLiveCfg();
    if (!cfg.baseUrl) {
      info.textContent = "Set Live API Base URL first.";
      return;
    }
    try {
      const headers = { "Content-Type": "application/json" };
      if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
      const resp = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/api/pairs/import`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          symbols: parsed,
          target,
          mode: applyMode,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      info.textContent = `Uploaded to server: ${target} (${applyMode}).`;
    } catch (err) {
      info.textContent = `Upload failed: ${String(err)}`;
    }
  });
}

function bindLiveConfig() {
  const base = document.getElementById("liveBaseUrl");
  const token = document.getElementById("liveReadToken");
  const mode = document.getElementById("dataMode");
  if (!base || !token || !mode) return;
  const cfg = loadLiveCfg();
  base.value = cfg.baseUrl || "";
  token.value = cfg.token || "";
  mode.value = cfg.mode || "demo";
  renderDataSourceLabel();
  const save = () => {
    saveLiveCfg({ baseUrl: base.value.trim(), token: token.value.trim(), mode: mode.value });
    renderDataSourceLabel();
  };
  base.addEventListener("change", save);
  token.addEventListener("change", save);
  mode.addEventListener("change", save);
}

function bindHelpButtons() {
  document.querySelectorAll(".help-btn[data-help-key]").forEach((btn) => {
    const key = btn.dataset.helpKey;
    const tip = HELP[key] || "No additional details available for this field yet.";
    btn.setAttribute("data-tooltip", tip);
    btn.setAttribute("title", tip);
  });
}

function bootstrap() {
  const data = loadDemo();
  setActiveNav();
  bindLiveConfig();
  renderHeaderStats(data);
  renderCurrentConfig(data);
  bindSettingsForm(data);
  bindSaveReset(data);
  renderTrades(data);
  bindCsvFlow(data);
  bindHelpButtons();
}

bootstrap();
