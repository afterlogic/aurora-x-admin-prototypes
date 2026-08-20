(function (global) {
  "use strict";

  function mount(options = {}) {
  const root = options.root;
  const config = options.config;

  if (!root || !config) {
    throw new Error("Средству отрисовки администрирования Aurora нужны явный корневой элемент и описание экранов");
  }

  const groups = Array.isArray(config.groups) ? config.groups : [];
  const routes = groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })));
  const routeMap = new Map(routes.map((route) => [route.id, route]));
  const requestedRoute = String(options.requestedRoute || "").trim();
  const initialHistoryState = global.history?.state || {};
  const historyWorkspaceKey = `${config.surface || "admin"}:${config.scope?.value || ""}`;
  const startRoute = routeMap.has(config.startRoute) ? config.startRoute : routes[0]?.id;
  const requestedRouteConfig = routeMap.get(requestedRoute);
  const requestedRouteHasContext = initialHistoryState.workspaceKey === historyWorkspaceKey
    && Boolean(initialHistoryState.detailContextByRoute?.[requestedRoute]);
  const initialRoute = requestedRouteConfig?.requiresContext && requestedRouteConfig.sourceRouteId && !requestedRouteHasContext
    ? requestedRouteConfig.sourceRouteId
    : requestedRoute && routeMap.has(requestedRoute) ? requestedRoute : startRoute;
  const state = {
    routeId: initialRoute,
    deniedRouteId: requestedRoute && !routeMap.has(requestedRoute) ? requestedRoute : "",
    showServiceMessages: Boolean(options.showServiceMessages),
    directoryServicesEnabled: Boolean(options.directoryServicesEnabled),
    filter: "",
    selectedByRoute: {},
    detailContextByRoute: {},
    returnRouteByRoute: {},
    checkedByRoute: {},
    activeTabByRoute: {},
    workflowStepByRoute: {},
    runtimeByRoute: {},
    supportScenarioByRoute: {},
    supportOverridesByRoute: {},
    activityPeriodByRoute: {},
    activityResultByRoute: {},
    databaseScenarioByRoute: {},
    databaseValuesByRoute: {},
    loggingEnabledByRoute: {},
    logDetailByRoute: {},
    logLevelByRoute: {},
    logCategoryByRoute: {},
    logQueryByRoute: {},
    clearedLogsByRoute: {},
    tableChoiceByRoute: {},
    createdRowsByRoute: {},
    rowOverridesByRoute: {},
    alternativeRowOverridesByRoute: {},
    alternativeByRoute: {},
    pendingCreateByRoute: {},
    pendingResellerByRoute: {},
    pendingTariffByRoute: {},
    tariffCorrectionPreviewByRoute: {},
    pendingTariffDefinitionByRoute: {},
    pendingMailBackendByRoute: {},
    pendingMailProfileByRoute: {},
    pendingIntegrationRegistrationByRoute: {},
    systemSettingsByRoute: {},
    detailSettingsByRoute: {},
    impersonationSession: null,
    impersonationAuditEvents: [],
    licenseKeyByRoute: {},
    verifiedLicenseKeyByRoute: {},
    editorValuesByRoute: {},
    savedEditorValuesByRoute: {},
    draftVersionByRoute: {},
    publishedVersionByRoute: {},
    dirtyByRoute: {},
    modal: null,
    notifications: [],
    scope: config.scope?.value || "",
  };

  if (initialHistoryState.auroraAdmin === true && initialHistoryState.workspaceKey === historyWorkspaceKey) {
    state.selectedByRoute = { ...(initialHistoryState.selectedByRoute || {}) };
    state.detailContextByRoute = { ...(initialHistoryState.detailContextByRoute || {}) };
    state.returnRouteByRoute = { ...(initialHistoryState.returnRouteByRoute || {}) };
  }

  let notificationSequence = 0;
  let lastTrigger = null;
  let renderedRouteId = null;
  let navigationScrollTop = 0;
  let mainScrollTop = 0;
  const lifecycle = new AbortController();
  const listenerOptions = { signal: lifecycle.signal };
  const operationTimers = new Set();
  const notificationTimers = new Map();

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeBrandColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value ?? "")) ? String(value) : "#315fca";
  }

  function alternativeActive(routeId) {
    return Boolean(state.alternativeByRoute[routeId]);
  }

  function rowOverrideStore(routeId) {
    return alternativeActive(routeId) ? state.alternativeRowOverridesByRoute : state.rowOverridesByRoute;
  }

  function setRowOverride(routeId, recordId, values) {
    const store = rowOverrideStore(routeId);
    store[routeId] = { ...(store[routeId] || {}), [recordId]: { ...(store[routeId]?.[recordId] || {}), ...values } };
  }

  function notificationDuration(toneValue) {
    return ["warning", "danger"].includes(toneValue) ? 8000 : 5000;
  }

  function dismissNotification(id, shouldRender = true) {
    const notificationId = String(id || "");
    const timerState = notificationTimers.get(notificationId);
    if (timerState?.timer) global.clearTimeout(timerState.timer);
    notificationTimers.delete(notificationId);
    state.notifications = state.notifications.filter((notification) => notification.id !== notificationId);
    if (shouldRender) render();
  }

  function scheduleNotification(notification, remaining) {
    const delay = Math.max(250, Number(remaining) || notificationDuration(notification.tone));
    const timer = global.setTimeout(() => dismissNotification(notification.id), delay);
    notificationTimers.set(notification.id, { timer, deadline: Date.now() + delay, remaining: delay });
  }

  function enqueueNotification(message, shouldRender = true) {
    const notification = {
      id: "notice-" + (++notificationSequence),
      title: String(message?.title || ""),
      text: String(message?.text || message || ""),
      tone: String(message?.tone || "info"),
    };
    while (state.notifications.length >= 3) dismissNotification(state.notifications[0].id, false);
    state.notifications = [...state.notifications, notification];
    scheduleNotification(notification);
    if (shouldRender) render();
    return notification.id;
  }

  function pauseNotification(id) {
    const timerState = notificationTimers.get(String(id || ""));
    if (!timerState?.timer) return;
    global.clearTimeout(timerState.timer);
    timerState.timer = 0;
    timerState.remaining = Math.max(250, timerState.deadline - Date.now());
  }

  function resumeNotification(id) {
    const notificationId = String(id || "");
    const timerState = notificationTimers.get(notificationId);
    const notification = state.notifications.find((item) => item.id === notificationId);
    if (!timerState || timerState.timer || !notification) return;
    scheduleNotification(notification, timerState.remaining);
  }

  function editorDefaults(route) {
    return Object.fromEntries((route.fields || []).map((field, index) => [field.key || `поле-${index}`, field.value ?? ""]));
  }

  function editorValues(route) {
    return { ...editorDefaults(route), ...(state.editorValuesByRoute[route.id] || {}) };
  }

  function savedEditorValues(route) {
    return { ...editorDefaults(route), ...(state.savedEditorValuesByRoute[route.id] || {}) };
  }

  function editorIsDirty(route) {
    return JSON.stringify(editorValues(route)) !== JSON.stringify(savedEditorValues(route));
  }

  function editorValidationMessage(route) {
    const values = editorValues(route);
    if (!String(values.name ?? "").trim()) return "Укажите название брендирования.";
    return !/^#[0-9a-f]{6}$/i.test(String(values.color ?? ""))
      ? "Укажите основной цвет в формате #RRGGBB."
      : "";
  }

  function slug(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "");
  }

  function tone(value) {
    const normalized = String(value || "").toLowerCase();
    if (/ok|active|verified|success|healthy|compliant|published|enabled|готов|норма|успеш/.test(normalized)) return "success";
    if (/fail|error|blocked|expired|critical|disabled|risk|ошиб|сбой|заблок|просроч/.test(normalized)) return "danger";
    if (/pending|unknown|degraded|warning|stale|attention|partial|ожида|неизвест|вниман|частич/.test(normalized)) return "warning";
    return "info";
  }

  function chip(label, explicitTone) {
    return `<span class="aa-chip" data-tone="${esc(explicitTone || tone(label))}">${esc(label)}</span>`;
  }

  function button(action, label, variant = "", extra = "") {
    const variantClass = variant ? ` aa-btn-${variant}` : "";
    return `<button type="button" class="aa-btn${variantClass}" data-command="${esc(action)}" ${extra}>${esc(label)}</button>`;
  }

  function actionButton(action, row) {
    const attributes = [
      action.disabled ? "disabled" : "",
      action.targetRouteId ? `data-target-route-id="${esc(action.targetRouteId)}"` : "",
      row?.id ? `data-source-row-id="${esc(row.id)}"` : "",
    ].filter(Boolean).join(" ");
    return button(action.command, action.label, action.variant || "", attributes);
  }

  function routeFor(id = state.routeId) {
    return id ? routeMap.get(id) || null : null;
  }

  function currentScopeLabel() {
    if (config.surface !== "provider") return config.scope.value;
    const option = (config.scope.options || []).find((item) => item.value === state.scope);
    return option?.name || option?.label || state.scope;
  }

  function currentRows(route) {
    const useAlternative = alternativeActive(route.id) && Array.isArray(route.alternativeRows);
    const overrides = (useAlternative ? state.alternativeRowOverridesByRoute : state.rowOverridesByRoute)[route.id] || {};
    const sourceRows = useAlternative ? route.alternativeRows : route.rows;
    const createdRows = useAlternative ? [] : state.createdRowsByRoute[route.id] || [];
    const rows = [...(Array.isArray(sourceRows) ? sourceRows : []), ...createdRows]
      .map((row) => ({ ...row, ...(overrides[row.id] || {}) }));
    const choice = state.tableChoiceByRoute[route.id] || route.choiceFilter?.defaultValue || "";
    const choiceRows = route.choiceFilter && choice && choice !== route.choiceFilter.allValue
      ? rows.filter((row) => String(row[route.choiceFilter.key]) === String(choice))
      : rows;
    if (!state.filter) return choiceRows;
    const query = state.filter.toLocaleLowerCase(config.locale || "ru");
    return choiceRows.filter((row) => Object.values(row).some((value) => String(value).toLocaleLowerCase(config.locale || "ru").includes(query)));
  }

  function currentActivityEvents(route) {
    const period = state.activityPeriodByRoute[route.id] || "Последние 24 часа";
    const maximumAgeHours = { "Последние 24 часа": 24, "7 дней": 24 * 7, "30 дней": 24 * 30 }[period] || 24;
    const outcome = state.activityResultByRoute[route.id] || "Все";
    const query = state.filter.toLocaleLowerCase(config.locale || "ru");
    const runtimeEvents = route.id === "ADM-AUDIT-001" ? state.impersonationAuditEvents : [];
    return [...runtimeEvents, ...(route.events || [])].filter((event) => {
      if (Number(event.ageHours ?? 0) > maximumAgeHours) return false;
      if (outcome !== "Все" && event.outcome !== outcome) return false;
      return !query || Object.entries(event).some(([key, value]) => key !== "ageHours" && String(value).toLocaleLowerCase(config.locale || "ru").includes(query));
    });
  }

  function currentLogEntries(route) {
    if (state.clearedLogsByRoute[route.id]) return [];
    const level = state.logLevelByRoute[route.id] || "Все уровни";
    const category = state.logCategoryByRoute[route.id] || "Все подсистемы";
    const query = String(state.logQueryByRoute[route.id] || "").toLocaleLowerCase(config.locale || "ru");
    return (route.entries || []).filter((entry) => {
      if (level !== "Все уровни" && entry.level !== level) return false;
      if (category !== "Все подсистемы" && entry.category !== category) return false;
      return !query || Object.values(entry).some((value) => String(value).toLocaleLowerCase(config.locale || "ru").includes(query));
    });
  }

  function selectedRow(route) {
    const rows = currentRows(route);
    const selectedId = state.selectedByRoute[route.id] || "";
    return rows.find((row) => String(row.id) === String(selectedId)) || null;
  }

  function contextualRecord(route) {
    const sourceRoute = route.sourceRouteId ? routeMap.get(route.sourceRouteId) : null;
    const selectedId = state.detailContextByRoute[route.id];
    const rows = sourceRoute ? currentRows(sourceRoute) : [];
    return rows.find((row) => String(row.id) === String(selectedId)) || null;
  }

  function historySnapshot() {
    return {
      ...(global.history?.state || {}),
      auroraAdmin: true,
      workspaceKey: historyWorkspaceKey,
      routeId: state.routeId,
      selectedByRoute: { ...state.selectedByRoute },
      detailContextByRoute: { ...state.detailContextByRoute },
      returnRouteByRoute: { ...state.returnRouteByRoute },
    };
  }

  function historyUrl(routeId = state.routeId) {
    const url = new URL(global.location.href);
    url.hash = routeId || startRoute || "";
    return url;
  }

  function writeHistory(mode = "replace") {
    if (!global.history || !state.routeId) return;
    const method = mode === "push" ? "pushState" : "replaceState";
    global.history[method](historySnapshot(), "", historyUrl());
  }

  function navigateTo(id, navigation = {}) {
    const targetRoute = routeMap.get(id);
    if (!targetRoute) {
      state.deniedRouteId = String(id || "");
      render();
      return false;
    }
    const sourceRowId = String(navigation.sourceRowId || "");
    if (sourceRowId) state.detailContextByRoute[id] = sourceRowId;
    if (targetRoute.requiresContext && targetRoute.sourceRouteId && !contextualRecord(targetRoute)) {
      const sourceRoute = routeMap.get(targetRoute.sourceRouteId);
      const selectedSource = sourceRoute ? selectedRow(sourceRoute) : null;
      if (selectedSource) state.detailContextByRoute[id] = selectedSource.id;
      else return navigateTo(targetRoute.sourceRouteId, { historyMode: navigation.historyMode });
    }
    if (navigation.rememberReturn && state.routeId && state.routeId !== id) {
      state.returnRouteByRoute[id] = state.routeId;
    }
    if (state.routeId && state.routeId !== id && routeMap.get(state.routeId)?.clearSelectionOnLeave) {
      delete state.selectedByRoute[state.routeId];
    }
    state.routeId = id;
    state.deniedRouteId = "";
    state.filter = "";
    state.modal = null;
    if (navigation.historyMode !== "none") writeHistory(navigation.historyMode || "push");
    render();
    return true;
  }

  function renderTopbar() {
    const isProvider = config.surface === "provider";
    const providerPlaceholder = config.workspaceKind === "установка" ? "Найти настройку установки" : config.workspaceKind === "провайдер" ? "Найти в разделе провайдера" : config.workspaceKind === "реселлер" ? "Найти организацию реселлера" : "Найти в выбранной организации";
    return `
      <header class="aa-topbar">
        <div class="aa-brand">
          <span class="aa-logo" aria-hidden="true">A</span>
          <div class="aa-brand-copy">
            <div class="aa-brand-name">${esc(config.brand || "Aurora")}</div>
            <div class="aa-brand-surface">${esc(config.surfaceLabel)}</div>
          </div>
        </div>
        <div class="aa-topbar-center">
          <label class="aa-search">
            <span class="aa-sr-only">Поиск по текущему разделу</span>
            <input type="search" data-global-filter value="${esc(state.filter)}" placeholder="${isProvider ? providerPlaceholder : "Найти пользователя, группу или настройку"}">
          </label>
        </div>
        <div class="aa-topbar-actions">
          ${config.actor.userId ? `<button type="button" class="aa-user aa-user-button" data-command="open-self" aria-label="Открыть свою карточку">` : `<div class="aa-user" aria-label="Текущий административный контекст">`}
            <span class="aa-avatar" aria-hidden="true">${esc(config.actor.initials)}</span>
            <div class="aa-user-copy">
              <div class="aa-user-name" title="${esc(config.actor.name)}">${esc(config.actor.name)}</div>
              <div class="aa-user-role" title="${esc(config.actor.role)}">${esc(config.actor.role)}</div>
            </div>
          ${config.actor.userId ? "</button>" : "</div>"}
        </div>
      </header>`;
  }

  function renderScopeCard() {
    const scope = config.scope || {};
    if (config.surface !== "provider") {
      const snapshot = config.capabilitySnapshot;
      return `
        <div class="aa-scope-card">
          <div class="aa-scope-label">Организация</div>
          <div class="aa-scope-value" title="${esc(scope.value)}">${esc(scope.value)}</div>
          ${state.showServiceMessages ? `<div class="aa-scope-meta" data-service-message>Область организации · права проверяются сервером</div>${snapshot ? `<div class="aa-scope-meta" data-service-message>${esc(snapshot.label)} · ${esc(snapshot.revision)} · ${routes.length} разделов</div>` : ""}` : ""}
        </div>`;
    }

    const current = (scope.options || []).find((option) => option.value === state.scope);
    const options = (scope.options || []).map((option) => `<option value="${esc(option.value)}" ${option.value === state.scope ? "selected" : ""}>${esc(option.label)}</option>`).join("");
    const breadcrumb = (current?.breadcrumb || [scope.contextLabel || scope.provider]).map((part) => `<span>${esc(part)}</span>`).join('<span aria-hidden="true">›</span>');
    return `
      <div class="aa-scope-card">
        <div class="aa-scope-label">Рабочая область</div>
        <div class="aa-scope-value aa-breadcrumb">${breadcrumb}</div>
        <label class="aa-field aa-small">
          <span class="aa-field-label">Перейти в другую область</span>
          <select class="aa-scope-select" data-scope-select>${options}</select>
        </label>
        ${state.showServiceMessages ? `<div class="aa-scope-meta" data-service-message>Тип области: ${esc(config.workspaceKind)} · смена перематериализует маршруты и очищает состояние</div>` : ""}
      </div>`;
  }

  function renderNavigation() {
    const groupMarkup = groups.map((group) => `
      <section class="aa-nav-group">
        <div class="aa-nav-heading">${esc(group.title)}</div>
        <div class="aa-nav-list">
          ${group.items.filter((item) => !item.hiddenInNavigation).map((item, index) => `
            <button type="button" class="aa-nav-button ${item.id === state.routeId ? "is-current" : ""}" data-route-id="${esc(item.id)}" aria-current="${item.id === state.routeId ? "page" : "false"}">
              <span class="aa-nav-mark" aria-hidden="true">${esc(item.mark || String(index + 1).padStart(2, "0"))}</span>
              <span class="aa-nav-label" title="${esc(item.title)}">${esc(item.title)}</span>
              ${item.alert ? `<span class="aa-nav-alert">${esc(item.alert)}</span>` : ""}
            </button>`).join("")}
        </div>
      </section>`).join("");
    return `<aside class="aa-sidebar" aria-label="Административная навигация">${renderScopeCard()}${groupMarkup}</aside>`;
  }

  function renderMobileNavigation() {
    return `
      <div class="aa-mobile-nav">
        <label class="aa-field">
          <span class="aa-field-label">Раздел</span>
          <select data-mobile-route>
            ${groups.map((group) => `<optgroup label="${esc(group.title)}">${group.items.filter((route) => !route.hiddenInNavigation).map((route) => `<option value="${esc(route.id)}" ${route.id === state.routeId ? "selected" : ""}>${esc(route.title)}</option>`).join("")}</optgroup>`).join("")}
          </select>
        </label>
      </div>`;
  }

  function renderPageHead(route) {
    const record = contextualRecord(route);
    const returnRouteId = state.returnRouteByRoute[route.id] || (route.requiresContext ? route.sourceRouteId : "");
    const backAction = returnRouteId ? button("go-back", "Назад", "ghost", `data-fallback-route-id="${esc(returnRouteId)}"`) : "";
    const actions = (route.actions || []).map((action) => actionButton(action, record)).join("");
    return `
      <div class="aa-breadcrumb"><span>${esc(config.surface === "provider" ? "Консоль администрирования" : "Настройки")}</span><span>›</span><span>${esc(route.group)}</span><span>›</span><strong>${esc(route.title)}</strong></div>
      ${renderMobileNavigation()}
      <header class="aa-page-head">
        <div>
          <h1 class="aa-page-title">${esc(route.title)}</h1>
          ${state.showServiceMessages ? `<div class="aa-service-message" data-service-message><p class="aa-page-purpose">${esc(route.purpose)}</p><div class="aa-meta-row">
            ${chip(route.id, "info")}
            ${route.operation ? chip(route.operation) : ""}
            ${route.scope ? chip(route.scope) : ""}
            ${route.revision ? chip(`Внутренняя версия: ${route.revision}`) : ""}
          </div></div>` : ""}
        </div>
        <div class="aa-page-actions">${backAction}${actions}</div>
      </header>`;
  }

  function renderServiceToolbar(route) {
    const hasAlternative = Array.isArray(route?.alternativeRows);
    const supportScenarios = route?.kind === "support" ? `
      <label class="aa-service-field" data-service-message>
        <span>Состояние примера</span>
        <select data-support-scenario>
          <option value="список" ${(state.supportScenarioByRoute[route.id] || "список") === "список" ? "selected" : ""}>Список запросов</option>
          <option value="нет" ${state.supportScenarioByRoute[route.id] === "нет" ? "selected" : ""}>Запросов нет</option>
          <option value="ожидает" ${state.supportScenarioByRoute[route.id] === "ожидает" ? "selected" : ""}>Ожидает решения</option>
          <option value="одобрен" ${state.supportScenarioByRoute[route.id] === "одобрен" ? "selected" : ""}>Одобрен, ещё не начат</option>
          <option value="активен" ${state.supportScenarioByRoute[route.id] === "активен" ? "selected" : ""}>Доступ активен</option>
          <option value="завершён" ${state.supportScenarioByRoute[route.id] === "завершён" ? "selected" : ""}>Завершён</option>
        </select>
      </label>` : "";
    const databaseScenarios = route?.kind === "database" ? `
      <label class="aa-service-field" data-service-message>
        <span>Состояние базы данных</span>
        <select data-database-scenario>
          <option value="disconnected" ${(state.databaseScenarioByRoute[route.id] || route.exampleState) === "disconnected" ? "selected" : ""}>Нет подключения</option>
          <option value="empty" ${(state.databaseScenarioByRoute[route.id] || route.exampleState) === "empty" ? "selected" : ""}>Таблицы не созданы</option>
          <option value="outdated" ${(state.databaseScenarioByRoute[route.id] || route.exampleState) === "outdated" ? "selected" : ""}>Требуется обновление</option>
          <option value="current" ${(state.databaseScenarioByRoute[route.id] || route.exampleState) === "current" ? "selected" : ""}>Структура актуальна</option>
        </select>
      </label>` : "";
    const directoryServicesToggle = config.surface === "tenant"
      ? `<label><input type="checkbox" data-directory-services-toggle ${state.directoryServicesEnabled ? "checked" : ""}> Показывать службы каталогов</label>`
      : "";
    return `<div class="aa-service-toolbar" aria-label="Служебные настройки прототипа">
      <strong>Прототип · служебные настройки</strong>
      <label><input type="checkbox" data-service-toggle ${state.showServiceMessages ? "checked" : ""}> Показывать служебные сообщения</label>
      <label title="${hasAlternative ? "Показать детерминированный вариант текущего экрана" : "Для этого экрана альтернативный сценарий не задан"}"><input type="checkbox" data-alternative-state-toggle ${state.alternativeByRoute[route?.id] ? "checked" : ""} ${hasAlternative ? "" : "disabled"}> Показать элемент в альтернативном состоянии</label>
      ${directoryServicesToggle}
      ${state.showServiceMessages ? supportScenarios + databaseScenarios : ""}
    </div>`;
  }

  function renderRuntime(route) {
    const runtime = state.runtimeByRoute[route.id];
    if (runtime) {
      state.runtimeByRoute[route.id] = null;
      enqueueNotification(runtime, false);
    }
    return "";
  }

  function renderImpersonationBanner() {
    const session = state.impersonationSession;
    if (!session) return "";
    return `<div class="aa-impersonation-banner" role="status"><div><strong>Защищённый сеанс · ${esc(session.userName)}</strong><div>Обращение ${esc(session.ticket)} · все действия записываются</div></div>${button("end-impersonation", "Завершить сеанс")}</div>`;
  }

  function renderNotice(route) {
    if (!route.notice) return "";
    const notice = typeof route.notice === "string" ? { text: route.notice, tone: "info" } : route.notice;
    return `<div class="aa-notice" data-tone="${esc(notice.tone || "info")}"><span class="aa-notice-symbol" aria-hidden="true">${notice.tone === "warning" ? "!" : "i"}</span><div>${esc(notice.text)}</div></div>`;
  }

  function renderServiceNotice(route) {
    if (!state.showServiceMessages || !route.serviceNotice) return "";
    const notice = typeof route.serviceNotice === "string" ? { text: route.serviceNotice, tone: "info" } : route.serviceNotice;
    return `<div class="aa-notice" data-tone="${esc(notice.tone || "info")}" data-service-message><span class="aa-notice-symbol" aria-hidden="true">${notice.tone === "warning" ? "!" : "i"}</span><div>${esc(notice.text)}</div></div>`;
  }

  function renderMetrics(metrics = []) {
    if (!metrics.length) return "";
    return `<div class="aa-grid aa-grid-${Math.min(4, Math.max(2, metrics.length))}">${metrics.map((metric) => `
      <article class="aa-card aa-card-pad">
        <div class="aa-stat-label">${esc(metric.label)}</div>
        <div class="aa-stat-value">${esc(metric.value)}</div>
        <div class="aa-stat-meta">${esc(metric.meta || "")}</div>
        ${metric.action ? `<div class="aa-inline" style="margin-top:12px">${actionButton(metric.action)}</div>` : ""}
      </article>`).join("")}</div>`;
  }

  function renderLabeledRows(rows = [], rowClass = "aa-attention-row") {
    return rows.map((row) => `
      <div class="${rowClass}">
        <span class="aa-dot" data-tone="${esc(row.tone || tone(row.status))}" aria-hidden="true"></span>
        <div><div class="aa-row-title">${esc(row.title)}</div><div class="aa-row-meta">${esc(row.meta || "")}</div></div>
        ${row.status || row.action ? `<div class="aa-inline">${row.status ? chip(row.status, row.tone) : ""}${row.action ? actionButton(row.action) : ""}</div>` : ""}
      </div>`).join("");
  }

  function renderOverview(route) {
    const sections = [];
    if ((route.attention || []).length) {
      sections.push(`<section class="aa-card">
        <div class="aa-card-head"><div><div class="aa-card-title">${esc(route.attentionTitle || "Требует внимания")}</div></div>${route.hideFreshness ? "" : chip(route.freshness || "обновлено 3 мин назад")}</div>
        <div class="aa-attention-list">${renderLabeledRows(route.attention)}</div>
      </section>`);
    }
    if ((route.activity || []).length) {
      sections.push(`<section class="aa-card">
        <div class="aa-card-head"><div><div class="aa-card-title">${esc(route.activityTitle || "Недавние изменения")}</div></div>${route.activityAction === false ? "" : button("open-audit", route.activityActionLabel || "Вся активность", "ghost")}</div>
        <div class="aa-activity-list">${renderLabeledRows(route.activity, "aa-activity-row")}</div>
      </section>`);
    }
    return `
      ${renderMetrics(route.metrics || [])}
      ${sections.length ? `<div class="aa-grid ${sections.length > 1 ? "aa-grid-2" : "aa-grid-1"}" style="margin-top: var(--aa-space)">${sections.join("")}</div>` : ""}`;
  }

  function renderTable(route) {
    const rows = currentRows(route);
    const createdCount = (state.createdRowsByRoute[route.id] || []).length;
    const columns = route.columns || [];
    const hasToggleColumn = columns.some((column) => column.toggle);
    const toggleRows = hasToggleColumn ? rows.filter((row) => row.toggleKind) : [];
    const enabledCount = toggleRows.filter((row) => row.enabled).length;
    const checkboxChoiceActive = route.choiceFilter?.type === "checkbox";
    const checkboxShowsAll = checkboxChoiceActive && String(state.tableChoiceByRoute[route.id] || route.choiceFilter.defaultValue || "") === String(route.choiceFilter.allValue);
    const totalLabel = checkboxChoiceActive
      ? `${rows.length} ${checkboxShowsAll ? (route.choiceFilter.allTotalNoun || "записей с владельцами") : (route.choiceFilter.defaultTotalNoun || "записей")}${createdCount ? ` · добавлено в этом сеансе: ${createdCount}` : ""}`
      : hasToggleColumn
      ? `${route.toggleSummaryNoun || "Профилей"}: ${rows.length} · ${enabledCount ? `разрешено: ${enabledCount}` : "ни один управляемый здесь не разрешён"}${createdCount ? ` · добавлено в этом сеансе: ${createdCount}` : ""}`
      : createdCount ? `Показано: ${rows.length} · добавлено в этом сеансе: ${createdCount}` : (route.total || `${rows.length} записей`);
    const rowsOpenDetails = route.details !== false;
    const checked = new Set((state.checkedByRoute[route.id] || []).map(String));
    const selected = selectedRow(route);
    const detailActions = selected?.detailActions ?? route.detailActions ?? [];
    const columnKeys = new Set(columns.map((column) => column.key));
    const selectedSupplementalFields = (route.selectedSupplementalFields || []).filter((field) => !columnKeys.has(field.key));
    const selectedSupplemental = selected && selectedSupplementalFields.length ? `<dl class="aa-selection-supplement">${selectedSupplementalFields.map((field) => {
      const value = selected[field.key] ?? "—";
      return `<div class="aa-selection-supplement-field"><dt>${esc(field.label)}</dt><dd${field.dir ? ` dir="${esc(field.dir)}"` : ""} title="${esc(value)}">${esc(value)}</dd></div>`;
    }).join("")}</dl>` : "";
    const toolbarActions = (route.tableActions || []).map((action) => actionButton({ ...action, disabled: action.requiresSelection && checked.size === 0 })).join("");
    const table = rows.length ? `
      <div class="aa-table-wrap">
        <table class="aa-table">
          <thead><tr>${route.selectable ? `<th><span class="aa-sr-only">Выбор</span></th>` : ""}${columns.map((column) => `<th>${esc(column.label)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `
            <tr class="${selected && String(selected.id) === String(row.id) ? "is-selected" : ""}"${rowsOpenDetails ? ` data-row-id="${esc(row.id)}" tabindex="0" aria-selected="${selected && String(selected.id) === String(row.id) ? "true" : "false"}" aria-label="Выбрать: ${esc(row[columns[0]?.key] || row.id)}"` : ""}>
              ${route.selectable ? `<td><input class="aa-checkbox" type="checkbox" data-check-row="${esc(row.id)}" aria-label="Выбрать ${esc(row[columns[0]?.key] || row.id)}" ${checked.has(String(row.id)) ? "checked" : ""}></td>` : ""}
              ${columns.map((column, index) => {
                const value = row[column.key] ?? "—";
                if (index === 0) return `<td><span class="aa-cell-main" title="${esc(value)}">${esc(value)}</span>${row.isCurrentActor ? chip("Это вы", "info") : row.sourceBadge ? chip(row.sourceBadge, "info") : row.badge ? chip(row.badge, "info") : ""}${row.subtitle ? `<div class="aa-cell-sub">${esc(row.subtitle)}</div>` : ""}</td>`;
                if (column.toggle && row.toggleKind) return `<td><label class="aa-inline"><input type="checkbox" data-policy-toggle data-record-id="${esc(row.id)}" data-toggle-kind="${esc(row.toggleKind)}" ${row.enabled ? "checked" : ""}> <span>${row.enabled ? "Разрешён" : "Запрещён"}</span></label></td>`;
                if (column.toggle) return `<td><span title="${esc(value)}">${esc(value)}</span></td>`;
                if (column.status) return `<td>${chip(value)}</td>`;
                return `<td><span title="${esc(value)}">${esc(value)}</span></td>`;
              }).join("")}
            </tr>`).join("")}</tbody>
        </table>
      </div>` : `<div class="aa-empty"><div><span class="aa-empty-symbol" aria-hidden="true">0</span><h3>Ничего не найдено</h3><p>Измените запрос или сбросьте фильтр.</p></div></div>`;

    const detailsLabel = route.detailAriaLabel || "Доступные действия выбранного объекта";
    const details = selected ? `
      <aside class="aa-detail" aria-label="${esc(detailsLabel)}">
        <h2 class="aa-detail-title">${esc(selected[columns[0]?.key] || selected.id)}</h2>
        ${selected.detailHint ? `<p class="aa-small">${esc(selected.detailHint)}</p>` : ""}
        ${selectedSupplemental}
        ${detailActions.length ? `<div class="aa-inline" style="margin-top:16px">${detailActions.map((action) => actionButton(action, selected)).join("")}</div>` : selectedSupplementalFields.length ? "" : `<p class="aa-small">Для этой записи нет доступных действий.</p>`}
      </aside>` : `
      <aside class="aa-detail" aria-label="${esc(detailsLabel)}">
        <h2 class="aa-detail-title">${esc(route.detailEmptyTitle || "Доступные действия")}</h2>
        <p class="aa-small">${esc(route.detailEmptyText || "Выберите запись, чтобы увидеть доступные действия.")}</p>
      </aside>`;

    const summary = (route.summaryRows || []).length ? `<section class="aa-card" style="margin-bottom:var(--aa-space)"><div class="aa-card-head"><div class="aa-card-title">${esc(route.summaryTitle || "Основная почта")}</div></div><div class="aa-check-list">${renderLabeledRows(route.summaryRows, "aa-check-row")}</div></section>` : "";

    return `
      ${summary}
      <section class="aa-card">
        ${route.tableGroupTitle ? `<div class="aa-table-group-head"><div><strong>${esc(route.tableGroupTitle)}</strong>${route.tableGroupMeta ? `<span>${esc(route.tableGroupMeta)}</span>` : ""}</div></div>` : ""}
        <div class="aa-toolbar">
          <label class="aa-field"><span class="aa-sr-only">Фильтр таблицы</span><input class="aa-input aa-input-inline" data-table-filter value="${esc(state.filter)}" placeholder="${esc(route.filterPlaceholder || "Фильтр по полной коллекции")}"></label>
          ${button("apply-filter", "Применить")}
          ${route.choiceFilter?.type === "checkbox" ? `<label class="aa-inline"><input type="checkbox" data-table-choice-toggle ${String(state.tableChoiceByRoute[route.id] || route.choiceFilter.defaultValue || "") === String(route.choiceFilter.allValue) ? "checked" : ""}> <span>${esc(route.choiceFilter.label)}</span></label>` : route.choiceFilter ? `<label class="aa-field"><span class="aa-field-label">${esc(route.choiceFilter.label)}</span><select class="aa-select" data-table-choice>${(route.choiceFilter.options || []).map((option) => `<option value="${esc(option.value)}" ${String(option.value) === String(state.tableChoiceByRoute[route.id] || route.choiceFilter.defaultValue || "") ? "selected" : ""}>${esc(option.label)}</option>`).join("")}</select></label>` : ""}
          <span class="aa-toolbar-spacer"></span>
          ${checked.size ? chip(`Выбрано: ${checked.size}`, "info") : ""}
          ${toolbarActions}
        </div>
        <div class="${route.details === false ? "" : "aa-split"}">
          <div>${table}<div class="aa-pagination"><span>${esc(totalLabel)}</span>${state.showServiceMessages ? `<span data-service-message>Страница 1 · пример серверных данных</span>` : ""}</div></div>
          ${route.details === false ? "" : details}
        </div>
      </section>`;
  }

  function renderDetail(route) {
    const tabs = route.tabs || ["Профиль", "Доступ", "Безопасность"];
    const activeTab = state.activeTabByRoute[route.id] || tabs[0];
    const record = contextualRecord(route);
    const fields = route.fields || [];
    const visibleFields = fields.filter((field) => (field.tab || tabs[0]) === activeTab);
    const tabRows = activeTab === "Безопасность" ? route.securityRows || [] : activeTab === "Устройства" ? route.deviceRows || [] : activeTab === "Доступ" ? route.accessRows || [] : [];
    const tabActions = route.tabActions?.[activeTab] || [];
    const detailSettings = state.detailSettingsByRoute[route.id] || {};
    const fieldValue = (field) => route.editableSettings && field.key
      ? detailSettings[field.key] ?? field.value ?? ""
      : record && field.key ? record[field.key] ?? field.value ?? "" : field.value ?? "";
    const management = record?.management || route.management;
    const managementNotice = management && management !== "В Aurora" ? `<div class="aa-notice"><span class="aa-notice-symbol">i</span><div><strong>Где управляется пользователь: ${esc(management)}</strong><div class="aa-small">Данные из внешней системы доступны здесь для просмотра. Изменять их нужно в этой системе.</div></div></div>` : "";
    return `
      <section class="aa-card">
        ${tabs.length > 1 ? `<div class="aa-tabs">${tabs.map((tab) => `<button type="button" class="aa-tab ${tab === activeTab ? "is-current" : ""}" data-tab="${esc(tab)}">${esc(tab)}</button>`).join("")}</div>` : ""}
        <form class="aa-form" data-demo-form>
          ${record ? `<div class="aa-detail-identity"><strong>${esc(record.name || record.title || record.id)}</strong>${record.isCurrentActor ? chip("Это вы", "info") : ""}<span>${esc(record.subtitle || "")}</span></div>` : ""}
          ${activeTab === tabs[0] ? managementNotice : ""}
          <div class="aa-form-grid">${visibleFields.map((field) => `
            <label class="aa-field">
              <span class="aa-field-label">${esc(field.label)}</span>
              ${field.type === "select" ? `<select class="aa-select" ${route.editableSettings && field.key ? `data-detail-setting-key="${esc(field.key)}"` : ""} ${field.readonly ? "disabled" : ""}>${(field.options || [fieldValue(field)]).map((option) => `<option ${String(option) === String(fieldValue(field)) ? "selected" : ""}>${esc(option)}</option>`).join("")}</select>` : `<input class="aa-input" type="${field.secret ? "password" : "text"}" value="${esc(fieldValue(field))}" ${route.editableSettings && field.key ? `data-detail-setting-key="${esc(field.key)}"` : ""} ${field.readonly ? "readonly" : ""} ${field.dir ? `dir="${esc(field.dir)}"` : ""}>`}
              ${field.help ? `<span class="aa-help">${esc(field.help)}</span>` : ""}
            </label>`).join("")}</div>
          ${record?.id && activeTab === tabs[0] ? `<details class="aa-technical-details"><summary>Технические сведения</summary><div>Идентификатор пользователя: <code>${esc(record.id)}</code></div></details>` : ""}
          ${tabRows.length ? `<div class="aa-form-section"><h3 class="aa-form-section-title">${esc(route.tabSectionTitles?.[activeTab] || activeTab)}</h3><div class="aa-check-list">${renderLabeledRows(tabRows, "aa-check-row")}</div></div>` : ""}
          ${tabActions.length ? `<div class="aa-form-actions">${tabActions.map((action) => actionButton(action, record)).join("")}</div>` : ""}
        </form>
      </section>`;
  }

  function renderWorkflow(route) {
    const steps = route.steps || [];
    const current = state.workflowStepByRoute[route.id] || 0;
    const record = contextualRecord(route);
    const impacts = record?.workflowImpacts || route.impacts || [];
    return `
      <section class="aa-card aa-stepper">
        <div class="aa-steps">${steps.map((step, index) => `<div class="aa-step ${index === current ? "is-current" : ""}"><span class="aa-step-number">${index < current ? "✓" : index + 1}</span><span>${esc(step)}</span></div>`).join("")}</div>
        <div class="aa-step-content">
          <h2 style="margin-top:0">${esc(route.stepTitles?.[current] || steps[current] || route.title)}</h2>
          <p class="aa-muted">${esc(route.stepDescriptions?.[current] || route.purpose)}</p>
          ${renderLabeledRows(impacts, "aa-impact-row")}
          ${route.workflowFields ? `<div class="aa-form-grid" style="margin-top:18px">${route.workflowFields.map((field) => `<label class="aa-field"><span class="aa-field-label">${esc(field.label)}</span><select class="aa-select">${(field.options || []).map((option) => `<option>${esc(option)}</option>`).join("")}</select><span class="aa-help">${esc(field.help || "")}</span></label>`).join("")}</div>` : ""}
          <div class="aa-form-actions">${current > 0 ? button("workflow-back", "Назад") : ""}${current < steps.length - 1 ? button("workflow-next", "Продолжить", "primary") : button(route.finalCommand || "confirm-destructive", route.finalLabel || "Запустить операцию", "danger")}</div>
        </div>
      </section>`;
  }

  function renderPolicy(route) {
    const rows = route.policyRows || [];
    return `
      <section class="aa-card">
        <div class="aa-card-head"><div><div class="aa-card-title">Итоговая политика</div><div class="aa-card-subtitle">Глобальная политика провайдера → тариф и набор возможностей → политика организации; нижний уровень может только сужать разрешения</div></div>${chip(`Версия изменений: ${route.revision || "42"}`)}</div>
        <div class="aa-policy-list">${rows.map((row) => `
          <div class="aa-policy-row">
            <div><div class="aa-policy-name">${esc(row.name)}</div><div class="aa-policy-origin">Источник: ${esc(row.origin)}${row.locked ? " · задаётся провайдером" : ""}</div>${row.explanation ? `<div class="aa-row-meta">${esc(row.explanation)}</div>` : ""}</div>
            <div><span class="aa-muted aa-small">Действует</span><div class="aa-effective">${esc(row.effective)}</div></div>
            <label class="aa-field"><span class="aa-field-label">Переопределение текущего уровня</span>${row.options ? `<select class="aa-select" ${row.locked ? "disabled" : ""}>${row.options.map((option) => `<option ${option === row.draft ? "selected" : ""}>${esc(option)}</option>`).join("")}</select>` : `<input class="aa-input" value="${esc(row.draft || row.effective)}" ${row.locked ? "readonly" : ""}>`}</label>
            ${row.locked ? chip("Унаследовано", "warning") : chip("Можно изменить", "success")}
          </div>`).join("")}</div>
        <div class="aa-form-actions" style="padding:0 16px 18px">${button("reset-inherited", "Сбросить к унаследованному", "ghost")}${button("preview", "Проверить последствия")}${button("publish", "Опубликовать", "primary")}</div>
      </section>`;
  }

  function renderMobile(route) {
    const policy = renderPolicy(route);
    if (!route.managedDevices) return policy;
    const managedRoute = {
      ...route,
      ...route.managedDevices,
      id: `${route.id}-managed-devices`,
      kind: "table",
      purpose: route.purpose,
    };
    return `${policy}
      <div class="aa-section-heading" style="margin-top:var(--aa-space)">
        <div><h2>${esc(route.managedDevices.title)}</h2>${state.showServiceMessages ? `<p data-service-message>Подключаемая возможность · данные и действия переданы сервером в итоговом снимке возможностей</p>` : ""}</div>
        ${state.showServiceMessages ? chip("Подключаемая возможность", "info") : ""}
      </div>
      ${renderTable(managedRoute)}`;
  }

  function renderChecks(route) {
    const checks = route.checks || [];
    const checkList = (items) => `<div class="aa-check-list">${items.map((check) => `
          <div class="aa-check-row">
            <span class="aa-dot" data-tone="${esc(check.tone || tone(check.status))}"></span>
            <div><div class="aa-row-title">${esc(check.title)}</div><div class="aa-row-meta">${esc(check.meta)}</div></div>
            <div class="aa-inline">${chip(check.status, check.tone)}${check.action ? actionButton(check.action) : ""}${check.correlation && !check.action && (check.tone === "warning" || check.tone === "danger" || tone(check.status) !== "success") ? button("copy", "Копировать код для службы поддержки", "ghost", `data-copy-value="${esc(check.correlation)}"`) : ""}</div>
          </div>`).join("")}</div>`;
    return `
      ${renderMetrics(route.metrics || [])}
      <section class="aa-card" style="margin-top:var(--aa-space)">
        <div class="aa-card-head"><div><div class="aa-card-title">${esc(route.checkTitle || "Проверки")}</div><div class="aa-card-subtitle">Результат проверки и рекомендуемое следующее действие</div></div>${button("test", route.testLabel || "Запустить разрешённую проверку", "primary")}</div>
        ${checkList(checks)}
      </section>
      ${(route.secondaryChecks || []).length ? `<section class="aa-card" style="margin-top:var(--aa-space)"><div class="aa-card-head"><div><div class="aa-card-title">${esc(route.secondaryChecksTitle || "Дополнительные состояния")}</div></div></div>${checkList(route.secondaryChecks)}</section>` : ""}`;
  }

  function renderActivity(route) {
    const events = currentActivityEvents(route);
    const selectedPeriod = state.activityPeriodByRoute[route.id] || "Последние 24 часа";
    const selectedResult = state.activityResultByRoute[route.id] || "Все";
    return `
      <section class="aa-card">
        <div class="aa-toolbar">
          <label class="aa-field"><span class="aa-field-label">Период</span><select class="aa-select" data-activity-period>${["Последние 24 часа", "7 дней", "30 дней"].map((value) => `<option${value === selectedPeriod ? " selected" : ""}>${value}</option>`).join("")}</select></label>
          <label class="aa-field"><span class="aa-field-label">Итог</span><select class="aa-select" data-activity-result>${["Все", "Успешно", "Отказ", "Ошибка"].map((value) => `<option${value === selectedResult ? " selected" : ""}>${value}</option>`).join("")}</select></label>
          <span class="aa-toolbar-spacer"></span>${button("download-view", route.downloadLabel || "Скачать текущую выборку")}
        </div>
        <div class="aa-activity-list">${events.map((event) => `
          <div class="aa-activity-row">
            <span class="aa-dot" data-tone="${esc(tone(event.outcome))}"></span>
            <div><div class="aa-row-title">${esc(event.action)}</div><div class="aa-row-meta">${esc(event.time)} · ${esc(event.actor)} · ${esc(event.target)}</div>${state.showServiceMessages && event.correlation ? `<div class="aa-row-meta" data-service-message>Код события: ${esc(event.correlation)}</div>` : ""}</div>
            ${chip(event.outcome)}
          </div>`).join("")}</div>
        <div class="aa-pagination"><span>${esc(route.total || "4 из 12 480 событий")}</span><span>Скачивается текущая разрешённая выборка</span></div>
      </section>`;
  }

  function renderMatrix(route) {
    const columns = route.matrixColumns || [];
    const tenantCapabilities = (route.tenantCapabilities || []).length ? `
      <section class="aa-card aa-card-pad" style="margin-bottom:var(--aa-space)">
        <div class="aa-card-title">Возможности организации</div>
        <div class="aa-card-subtitle">Эти возможности действуют для организации целиком и назначаются провайдером</div>
        <div class="aa-impact-list">${route.tenantCapabilities.map((capability) => `
          <div class="aa-impact-row">
            <div><strong>${esc(capability.name)}</strong><div class="aa-row-meta">${esc(capability.description || "")}</div></div>
            <div class="aa-inline">${chip(capability.status, capability.tone)}${capability.action ? actionButton(capability.action) : ""}</div>
          </div>`).join("")}</div>
      </section>` : "";
    return `
      ${tenantCapabilities}
      <section class="aa-card">
        <div class="aa-table-wrap"><table class="aa-table"><thead><tr><th>${esc(route.matrixLabel || "Функция")}</th>${columns.map((column) => `<th>${esc(column)}</th>`).join("")}</tr></thead><tbody>${(route.matrixRows || []).map((row) => `<tr><td class="aa-cell-main">${esc(row.name)}<div class="aa-cell-sub">${esc(row.meta || "")}</div></td>${columns.map((column) => `<td>${chip(row.values?.[column] || "—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <div class="aa-form-actions" style="padding:0 16px 18px">${button("preview", "Предварительный просмотр итогового снимка")}${button("publish", "Применить назначение", "primary")}</div>
      </section>`;
  }

  function renderEditor(route) {
    const values = editorValues(route);
    const dirty = editorIsDirty(route);
    const validationMessage = editorValidationMessage(route);
    state.dirtyByRoute[route.id] = dirty;
    const version = state.draftVersionByRoute[route.id] ?? route.draftVersion ?? 1;
    const publishedVersion = state.publishedVersionByRoute[route.id] ?? route.publishedVersion ?? Math.max(0, version - 1);
    const surface = values.surface || "Вход";
    const theme = values.theme || "Светлая";
    const language = values.language || "Русский";
    const previewName = values.name || route.previewName || "Northwind Collaboration";
    const primaryColor = safeBrandColor(values.color);
    const background = theme === "Тёмная" ? "#172033" : theme === "Системная" ? "#eef3fa" : route.previewColor || "#e8efff";
    const foreground = theme === "Тёмная" ? "#f4f7ff" : "#172033";
    return `
      <div class="aa-grid aa-grid-2">
        <section class="aa-card">
          <div class="aa-card-head"><div><div class="aa-card-title">${esc(route.editorTitle || "Черновик")}</div><div class="aa-card-subtitle">Версия черновика: ${esc(version)} · опубликованная версия: ${esc(publishedVersion)}</div></div><span data-brand-status>${validationMessage ? chip(validationMessage, "danger") : chip(dirty ? "Есть несохранённые изменения" : "Черновик сохранён", dirty ? "warning" : "success")}</span></div>
          <div class="aa-form"><div class="aa-form-grid">${(route.fields || []).map((field, index) => { const key = field.key || `поле-${index}`; const value = values[key]; return `<label class="aa-field"><span class="aa-field-label">${esc(field.label)}</span>${field.type === "select" ? `<select class="aa-select" data-editor-key="${esc(key)}">${(field.options || [value]).map((option) => `<option ${String(option) === String(value) ? "selected" : ""}>${esc(option)}</option>`).join("")}</select>` : `<input class="aa-input" data-editor-key="${esc(key)}" value="${esc(value)}" ${field.dir ? `dir="${esc(field.dir)}"` : ""}>`}<span class="aa-help">${esc(field.help || "")}</span></label>`; }).join("")}</div><div class="aa-form-actions">${button("discard", "Отменить изменения", "ghost")}${button("save", "Сохранить черновик")}${button("publish", "Опубликовать", "primary", dirty || validationMessage ? "disabled" : "")}</div></div>
        </section>
        <section class="aa-card aa-card-pad">
          <div class="aa-card-title">${esc(route.previewTitle || "Предварительный просмотр брендирования")}</div>
          <div class="aa-card-subtitle">Изменения сразу отражаются в примере; публикация выполняется отдельно</div>
          <div style="margin-top:18px;padding:24px;border-radius:14px;background:${esc(background)};color:${esc(foreground)};min-height:230px">
            <div class="aa-brand"><span class="aa-logo" data-brand-preview-logo style="background:${esc(primaryColor)}">${esc(previewName.slice(0, 1).toLocaleUpperCase(config.locale || "ru"))}</span><div><div class="aa-brand-name" data-brand-preview-name>${esc(previewName)}</div><div class="aa-brand-surface">${esc(`${surface} · ${theme.toLocaleLowerCase(config.locale || "ru")} тема · ${language.toLocaleLowerCase(config.locale || "ru")}`)}</div></div></div>
            <div class="aa-card" style="margin-top:24px;padding:18px"><strong>${esc(route.previewHeading || "Добро пожаловать")}</strong><p class="aa-muted">${esc(route.previewText || "Обязательные элементы безопасности остаются видимыми.")}</p><button type="button" class="aa-btn aa-btn-primary" disabled>Продолжить</button></div>
          </div>
        </section>
      </div>`;
  }

  function renderSupport(route) {
    const scenario = state.supportScenarioByRoute[route.id] || "список";
    const overrides = state.supportOverridesByRoute[route.id] || {};
    let records = (route.supportRecords || []).map((record) => ({ ...record, ...(overrides[record.id] || {}) }));
    if (scenario === "нет") records = [];
    if (scenario !== "список" && scenario !== "нет") records = records.filter((record) => record.scenario === scenario).slice(0, 1);
    const selectedId = state.selectedByRoute[route.id] || records[0]?.id;
    const selected = records.find((record) => record.id === selectedId) || records[0];
    if (!records.length) return `<section class="aa-card aa-empty"><div><span class="aa-empty-symbol" aria-hidden="true">0</span><h2>Запросов на доступ нет</h2><p>${esc(route.emptyText || "Когда служба поддержки запросит временный доступ, запрос появится здесь.")}</p></div></section>`;
    return `<section class="aa-card aa-support-layout">
      <div class="aa-support-list" aria-label="Запросы и сеансы поддержки">${records.map((record) => `<button type="button" class="aa-support-item ${record.id === selected?.id ? "is-current" : ""}" data-row-id="${esc(record.id)}"><strong>${esc(record.requester)}</strong><span>${esc(record.reason)}</span>${chip(record.status, record.tone)}</button>`).join("")}</div>
      <article class="aa-support-detail">
        <div class="aa-card-head"><div><div class="aa-card-title">${esc(selected.requester)}</div><div class="aa-card-subtitle">${esc(selected.status)}</div></div>${chip(selected.status, selected.tone)}</div>
        <dl class="aa-detail-fields"><div class="aa-detail-field"><dt>Кто запросил</dt><dd>${esc(selected.requester)}</dd></div><div class="aa-detail-field"><dt>Причина</dt><dd>${esc(selected.reason)}</dd></div><div class="aa-detail-field"><dt>Доступ</dt><dd>${esc(selected.scope)}</dd></div><div class="aa-detail-field"><dt>Срок</dt><dd>${esc(selected.period)}</dd></div></dl>
        ${selected.explanation ? `<div class="aa-notice" data-tone="${esc(selected.tone || "info")}"><span class="aa-notice-symbol">i</span><div>${esc(selected.explanation)}</div></div>` : ""}
        <div class="aa-form-actions">${(selected.actions || []).map((action) => actionButton(action, selected)).join("")}</div>
        ${state.showServiceMessages && selected.operationCode ? `<div class="aa-service-message" data-service-message>Код операции: ${esc(selected.operationCode)}</div>` : ""}
      </article>
    </section>`;
  }

  function renderDatabase(route) {
    const scenario = state.databaseScenarioByRoute[route.id] || route.exampleState || "outdated";
    const values = { ...route.values, ...(state.databaseValuesByRoute[route.id] || {}) };
    const statusByScenario = {
      disconnected: { connection: "Нет подключения", schema: "Не определена", tone: "danger", meta: "Проверьте адрес и учётные данные" },
      empty: { connection: "Подключение установлено", schema: "Таблицы не созданы", tone: "warning", meta: "Можно создать начальную структуру" },
      outdated: { connection: "Подключение установлено", schema: "Требуется обновление", tone: "warning", meta: "Текущая версия 9 · требуется версия 10" },
      current: { connection: "Подключение установлено", schema: "Структура актуальна", tone: "success", meta: "Версия структуры 10" },
    }[scenario];
    const schemaAction = scenario === "empty"
      ? button("create-database-schema", "Создать таблицы", "primary")
      : scenario === "outdated"
        ? button("upgrade-database-schema", "Обновить структуру БД", "primary")
        : "";
    return `
      <div class="aa-grid aa-grid-2">
        <article class="aa-card aa-card-pad"><div class="aa-stat-label">Подключение</div><div class="aa-stat-value aa-system-status">${esc(statusByScenario.connection)}</div><div class="aa-stat-meta">${esc(values.host)} · ${esc(values.name)}</div></article>
        <article class="aa-card aa-card-pad"><div class="aa-stat-label">Структура БД</div><div class="aa-stat-value aa-system-status">${esc(statusByScenario.schema)}</div><div class="aa-stat-meta">${esc(statusByScenario.meta)}</div></article>
      </div>
      <section class="aa-card" style="margin-top:var(--aa-space)">
        <div class="aa-card-head"><div><div class="aa-card-title">Параметры подключения</div><div class="aa-card-subtitle">Пароль можно заменить, но нельзя прочитать из Aurora</div></div>${chip(statusByScenario.connection, statusByScenario.tone)}</div>
        <div class="aa-form">
          <div class="aa-form-grid">
            <label class="aa-field"><span class="aa-field-label">Сервер</span><input class="aa-input" data-database-key="host" value="${esc(values.host)}"></label>
            <label class="aa-field"><span class="aa-field-label">Имя базы данных</span><input class="aa-input" data-database-key="name" value="${esc(values.name)}"></label>
            <label class="aa-field"><span class="aa-field-label">Логин</span><input class="aa-input" data-database-key="login" value="${esc(values.login)}"></label>
            <label class="aa-field"><span class="aa-field-label">Новый пароль</span><input class="aa-input" data-database-key="password" type="password" value="" autocomplete="new-password" placeholder="Оставьте пустым, чтобы не менять"><span class="aa-help">Сохранённый пароль не возвращается в интерфейс.</span></label>
          </div>
          <div class="aa-form-actions">${button("test-database", "Проверить подключение")}${button("save-database", "Сохранить настройки")}${schemaAction}</div>
        </div>
      </section>`;
  }

  function renderLogs(route) {
    const enabled = state.loggingEnabledByRoute[route.id] ?? route.enabled ?? true;
    const selectedLevel = state.logLevelByRoute[route.id] || "Все уровни";
    const selectedCategory = state.logCategoryByRoute[route.id] || "Все подсистемы";
    const entries = currentLogEntries(route);
    return `
      <section class="aa-card">
        <div class="aa-card-head"><div><div class="aa-card-title">Запись журналов</div><div class="aa-card-subtitle">Встроенный просмотр работает без внешней системы мониторинга</div></div>${chip(enabled ? "Включена" : "Выключена", enabled ? "success" : "warning")}</div>
        <div class="aa-form">
          <div class="aa-form-grid">
            <label class="aa-field"><span class="aa-field-label">Состояние</span><select class="aa-select" data-logging-enabled><option value="on" ${enabled ? "selected" : ""}>Включена</option><option value="off" ${enabled ? "" : "selected"}>Выключена</option></select></label>
            <label class="aa-field"><span class="aa-field-label">Подробность записи</span><select class="aa-select" data-logging-detail>${["Только ошибки", "Предупреждения и ошибки", "Подробная"].map((value) => `<option ${value === (state.logDetailByRoute[route.id] || route.detail || "Предупреждения и ошибки") ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></label>
          </div>
          <div class="aa-form-actions">${button("save-logging", "Сохранить настройки", "primary")}</div>
        </div>
      </section>
      <section class="aa-card" style="margin-top:var(--aa-space)">
        <div class="aa-toolbar">
          <label class="aa-field"><span class="aa-field-label">Уровень</span><select class="aa-select" data-log-level>${["Все уровни", "Ошибка", "Предупреждение", "Сведения"].map((value) => `<option ${value === selectedLevel ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></label>
          <label class="aa-field"><span class="aa-field-label">Подсистема</span><select class="aa-select" data-log-category>${["Все подсистемы", ...(route.categories || [])].map((value) => `<option ${value === selectedCategory ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></label>
          <label class="aa-field"><span class="aa-field-label">Поиск</span><input class="aa-input aa-input-inline" data-log-query value="${esc(state.logQueryByRoute[route.id] || "")}" placeholder="Сообщение или код"></label>${button("apply-log-filter", "Применить")}
          <span class="aa-toolbar-spacer"></span>${button("download-logs", "Скачать текущую выборку")}${button("clear-logs", "Очистить журналы", "danger")}
        </div>
        ${entries.length ? `<div class="aa-table-wrap"><table class="aa-table"><thead><tr><th>Время</th><th>Уровень</th><th>Подсистема</th><th>Сообщение</th></tr></thead><tbody>${entries.map((entry) => `<tr><td>${esc(entry.time)}</td><td>${chip(entry.level)}</td><td>${esc(entry.category)}</td><td><span title="${esc(entry.message)}">${esc(entry.message)}</span>${entry.code ? `<div class="aa-cell-sub">Код: ${esc(entry.code)}</div>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<div class="aa-empty"><div><span class="aa-empty-symbol" aria-hidden="true">0</span><h3>Записей нет</h3><p>Измените фильтры или дождитесь новых событий.</p></div></div>`}
        <div class="aa-pagination"><span>${esc(entries.length)} записей в текущей выборке</span><span>Секреты и содержимое пользователей не записываются</span></div>
      </section>`;
  }

  function renderLicense(route) {
    const keyValue = state.licenseKeyByRoute[route.id] || "";
    const keyIsVerified = Boolean(keyValue) && state.verifiedLicenseKeyByRoute[route.id] === keyValue.trim();
    return `
      ${renderMetrics(route.metrics || [])}
      <section class="aa-card" style="margin-top:var(--aa-space)">
        <div class="aa-card-head"><div><div class="aa-card-title">Лицензионный ключ</div><div class="aa-card-subtitle">Текущий ключ нельзя прочитать из Aurora; новый ключ передаётся только при проверке или сохранении</div></div>${chip(route.licenseStatus || "Действует", "success")}</div>
        <div class="aa-form"><div class="aa-form-grid">
          <label class="aa-field"><span class="aa-field-label">Текущий ключ</span><input class="aa-input" value="•••• •••• •••• 7F3A" readonly></label>
          <label class="aa-field"><span class="aa-field-label">Новый ключ</span><input class="aa-input" type="password" autocomplete="new-password" data-license-key value="${esc(keyValue)}" placeholder="Введите новый лицензионный ключ"><span class="aa-help">Проверка не изменяет действующую лицензию.</span></label>
        </div><div class="aa-form-actions">${button("verify-license", "Проверить ключ")}${button("save-license", "Сохранить новый ключ", "primary", keyIsVerified ? "" : "disabled")}</div></div>
      </section>`;
  }

  function renderDeprovision(route) {
    const record = contextualRecord(route);
    if (!record) return `<div class="aa-empty"><div><h3>Пользователь не выбран</h3><p>Вернитесь к списку пользователей и откройте нужную запись.</p></div></div>`;
    if (record.status === "Удалён") {
      return `<section class="aa-card aa-card-pad"><div class="aa-card-head"><div><div class="aa-card-title">${esc(record.name)}</div><div class="aa-card-subtitle">${esc(record.subtitle || "Запись удалена")}</div></div>${chip("Удалён", "danger")}</div><div class="aa-notice" data-tone="info"><span class="aa-notice-symbol" aria-hidden="true">i</span><div><strong>Жизненный цикл завершён</strong><div class="aa-small">Вход и защищённый сеанс недоступны. Дальнейшая обработка данных определяется политикой хранения и результатами подключённых обработчиков.</div></div></div></section>`;
    }
    const inactive = ["Деактивирован", "Приостановлен"].includes(record.status);
    return `
      <section class="aa-card aa-card-pad">
        <div class="aa-card-head"><div><div class="aa-card-title">${esc(record.name)}</div><div class="aa-card-subtitle">${esc(record.email || record.subtitle)} · ${esc(record.status)}</div></div>${chip(record.status)}</div>
        <div class="aa-grid aa-grid-2">
          <article class="aa-card aa-card-pad"><h2>${inactive ? "Активировать пользователя" : "Деактивировать пользователя"}</h2><p>Обратимо ${inactive ? "разрешает" : "запрещает"} вход. Профиль, данные, адреса, группы и владение сохраняются; почтовый сервер не изменяется.</p><div class="aa-form-actions">${actionButton({ command: inactive ? "activate-user" : "deactivate-user", label: inactive ? "Активировать" : "Деактивировать", variant: inactive ? "primary" : "" }, record)}</div></article>
          <article class="aa-card aa-card-pad"><h2>Удалить пользователя</h2><p>Отдельное необратимое или ограниченно восстанавливаемое действие. Сначала система покажет последствия для данных продукта и доступные обработчики подключённых систем.</p><div class="aa-form-actions">${actionButton({ command: "delete-user", label: "Проверить последствия удаления", variant: "danger" }, record)}</div></article>
        </div>
        ${route.allowImpersonation ? `<section class="aa-card aa-card-pad" style="margin-top:var(--aa-space)"><h2>Открыть защищённый сеанс от имени пользователя</h2><p>Требуются отдельное разрешение, причина, номер обращения и усиленная проверка личности. Пароль и токены пользователя недоступны; все действия записываются.</p><div class="aa-form-actions">${actionButton({ command: "impersonate-user", label: "Запросить защищённый сеанс" }, record)}</div></section>` : ""}
      </section>`;
  }

  function renderSystemSettings(route) {
    const currentValues = { ...Object.fromEntries((route.fields || []).map((field) => [field.key, field.value])), ...(state.systemSettingsByRoute[route.id] || {}) };
    return `<section class="aa-card"><div class="aa-card-head"><div><div class="aa-card-title">Системная идентичность и значения по умолчанию</div><div class="aa-card-subtitle">Эти значения принадлежат провайдеру и не являются брендированием выбранной организации</div></div>${chip("Провайдер")}</div><div class="aa-form"><div class="aa-form-grid">${(route.fields || []).map((field) => `<label class="aa-field"><span class="aa-field-label">${esc(field.label)}</span><input class="aa-input" data-system-setting-key="${esc(field.key)}" value="${esc(currentValues[field.key])}">${field.help ? `<span class="aa-help">${esc(field.help)}</span>` : ""}</label>`).join("")}</div><div class="aa-notice" data-tone="info"><span class="aa-notice-symbol">i</span><div>Название мобильного приложения здесь меняет тексты интерфейса и сообщений. Название и значок в магазине приложений требуют отдельной подписанной сборки провайдера.</div></div><div class="aa-form-actions">${button("save-system-settings", "Сохранить системные настройки", "primary")}</div></div></section>`;
  }

  function renderRoute(route) {
    const kind = route.kind || "table";
    if (kind === "overview") return renderOverview(route);
    if (kind === "detail") return renderDetail(route);
    if (kind === "workflow") return renderWorkflow(route);
    if (kind === "deprovision") return renderDeprovision(route);
    if (kind === "policy") return renderPolicy(route);
    if (kind === "mobile") return renderMobile(route);
    if (kind === "checks") return renderChecks(route);
    if (kind === "activity") return renderActivity(route);
    if (kind === "matrix") return renderMatrix(route);
    if (kind === "editor") return renderEditor(route);
    if (kind === "support") return renderSupport(route);
    if (kind === "database") return renderDatabase(route);
    if (kind === "logs") return renderLogs(route);
    if (kind === "license") return renderLicense(route);
    if (kind === "system-settings") return renderSystemSettings(route);
    return renderTable(route);
  }

  function renderModal() {
    if (!state.modal) return `<div class="aa-modal-backdrop" hidden></div>`;
    const modal = state.modal;
    return `
      <div class="aa-modal-backdrop" data-modal-backdrop>
        <section class="aa-modal${modal.wide ? " aa-modal-wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="aa-modal-title">
          <header class="aa-modal-head"><div><h2 class="aa-modal-title" id="aa-modal-title">${esc(modal.title)}</h2>${modal.subtitle ? `<div class="aa-card-subtitle">${esc(modal.subtitle)}</div>` : ""}</div><button type="button" class="aa-close" data-command="close-modal" aria-label="Закрыть">×</button></header>
          <div class="aa-modal-body">${modal.error ? `<div class="aa-notice" data-tone="danger" role="alert" data-modal-error><span class="aa-notice-symbol" aria-hidden="true">!</span><div>${esc(modal.error)}</div></div>` : ""}${modal.body}</div>
          <footer class="aa-modal-actions">${button("close-modal", modal.cancelLabel || "Отмена", "ghost")}${modal.confirmLabel ? button("confirm-modal", modal.confirmLabel, modal.danger ? "danger" : "primary") : ""}</footer>
        </section>
      </div>`;
  }

  function renderNotifications() {
    if (!state.notifications.length) return `<div class="aa-notification-stack" aria-live="polite"></div>`;
    return `<div class="aa-notification-stack" aria-label="Уведомления">
      ${state.notifications.map((notification) => `<article class="aa-notification" data-tone="${esc(notification.tone)}" data-notification-id="${esc(notification.id)}" role="${notification.tone === "danger" ? "alert" : "status"}">
        <span class="aa-notification-symbol" aria-hidden="true">${notification.tone === "success" ? "✓" : notification.tone === "danger" || notification.tone === "warning" ? "!" : "i"}</span>
        <div class="aa-notification-copy">${notification.title ? `<strong>${esc(notification.title)}</strong>` : ""}<div>${esc(notification.text)}</div></div>
        <button type="button" class="aa-notification-close" data-command="dismiss-notification" data-notification-id="${esc(notification.id)}" aria-label="Закрыть уведомление">×</button>
      </article>`).join("")}
    </div>`;
  }

  function renderDeniedRoute() {
    return `
      ${renderMobileNavigation()}
      <header class="aa-page-head">
        <div>
          <h1 class="aa-page-title">Раздел недоступен</h1>
          <p class="aa-page-purpose">Запрошенный маршрут отсутствует в текущем снимке доступности. Это не раскрывает тариф, политику провайдера или существование объекта за пределами разрешённой области.</p>
          <div class="aa-meta-row">${chip("Безопасный отказ", "warning")}${state.showServiceMessages ? chip("Код операции: cap-route-7f3a", "info") : ""}</div>
        </div>
        <div class="aa-page-actions">${button("return-start", "Вернуться к обзору", "primary")}</div>
      </header>
      <div class="aa-notice" data-tone="warning"><span class="aa-notice-symbol" aria-hidden="true">!</span><div><strong>Маршрут не передан в интерфейс</strong><div class="aa-small">Обновите страницу или вернитесь к доступному разделу. Отсутствие пункта в навигации не заменяет серверную проверку полномочий.</div></div></div>`;
  }

  function render() {
    const route = routeFor();
    const denied = Boolean(state.deniedRouteId);
    if (!route && !denied) return;
    const previousSidebar = root.querySelector(".aa-sidebar");
    const previousMain = root.querySelector(".aa-main");
    if (previousSidebar) navigationScrollTop = previousSidebar.scrollTop;
    if (previousMain) mainScrollTop = previousMain.scrollTop;
    const nextRenderedRouteId = denied ? "__denied__" : route.id;
    const routeChanged = renderedRouteId !== null && renderedRouteId !== nextRenderedRouteId;
    root.className = "aa-app";
    root.innerHTML = `
      ${renderServiceToolbar(route)}
      <div class="aa-shell">
        ${renderTopbar()}
        <div class="aa-workspace">
          ${renderNavigation()}
          <main class="aa-main" id="aa-main">
            ${renderImpersonationBanner()}
            ${denied ? renderDeniedRoute() : `${renderPageHead(route)}${renderRuntime(route)}${renderNotice(route)}${renderServiceNotice(route)}${renderRoute(route)}`}
          </main>
        </div>
      </div>
      ${renderModal()}
      ${renderNotifications()}`;

    renderedRouteId = nextRenderedRouteId;
    const renderedModal = state.modal;
    if (renderedModal) {
      const focusTimer = window.setTimeout(() => {
        operationTimers.delete(focusTimer);
        if (state.modal !== renderedModal) return;
        const preferred = renderedModal.focusSelector ? root.querySelector(renderedModal.focusSelector) : null;
        (preferred || root.querySelector("[data-command='close-modal']"))?.focus();
      }, 0);
      operationTimers.add(focusTimer);
    }
    window.requestAnimationFrame(() => {
      const sidebar = root.querySelector(".aa-sidebar");
      const main = root.querySelector(".aa-main");
      if (sidebar) sidebar.scrollTop = navigationScrollTop;
      if (main) main.scrollTop = routeChanged ? 0 : mainScrollTop;
    });
  }

  function showToast(message) {
    enqueueNotification({ text: message, tone: "info" });
  }

  function csvCell(value) {
    let text = String(value ?? "");
    if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }

  function downloadCurrentView(route) {
    const rows = route.kind === "activity" ? currentActivityEvents(route) : route.kind === "logs" ? currentLogEntries(route) : currentRows(route);
    const columns = route.downloadColumns || route.columns || [];
    const csv = [
      columns.map((column) => csvCell(column.label)).join(","),
      ...rows.map((row) => columns.map((column) => csvCell(row[column.key])).join(",")),
    ].join("\r\n");
    const file = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = route.downloadFilename || "aurora-data.csv";
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 0);
    showToast(`Скачивание началось. В текущей разрешённой выборке: ${rows.length}.`);
  }

  function modalBodyFor(command, route, recordId = "") {
    const supportRecord = route.kind === "support"
      ? (route.supportRecords || []).map((record) => ({ ...record, ...(state.supportOverridesByRoute[route.id]?.[record.id] || {}) })).find((record) => record.id === recordId)
      : null;
    const supportImpacts = supportRecord ? [
      { title: "Запрос", meta: `${supportRecord.requester} · ${supportRecord.reason} · ${supportRecord.period}`, status: supportRecord.status },
      { title: "Доступ", meta: supportRecord.scope, status: "Ограничен" },
      { title: "Всегда запрещено", meta: "Пароли и способы входа, повышение роли, массовый экспорт и изменение истории", status: "Заблокировано" },
    ] : null;
    const impacts = supportImpacts || route.impacts || [
      { title: "Текущая область", meta: currentScopeLabel(), status: "Проверена" },
      { title: "Версия изменений", meta: route.versionLabel || route.revision || "42", status: "Актуальна" },
      { title: "Аудит", meta: "Исполнитель, область, действие и результат будут записаны", status: "Включён" },
    ];
    const impactMarkup = `<div class="aa-impact-list">${renderLabeledRows(impacts, "aa-impact-row")}</div>`;

    if (command === "open-organization-card") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      if (!record) return `<p>Организация недоступна в текущей области.</p>`;
      const actions = [
        ...(route.allowTariffRequest ? [{ command: "request-tariff-assignment", label: "Запросить смену тарифа" }] : []),
        ...(route.allowTariffCorrection ? [{ command: "correct-tariff-assignment", label: "Исправить назначение" }] : []),
        ...(record.isDefault ? [] : [{ command: "reassign-reseller", label: "Изменить обслуживание" }]),
        { command: "open-managed-scope", label: "Открыть администрирование организации", variant: "primary" },
      ];
      return `<dl class="aa-detail-fields"><div class="aa-detail-field"><dt>Организация</dt><dd>${esc(record.tenant)}</dd></div><div class="aa-detail-field"><dt>Основной домен</dt><dd>${esc(record.subtitle)}</dd></div><div class="aa-detail-field"><dt>Обслуживание</dt><dd>${esc(record.reseller)}</dd></div><div class="aa-detail-field"><dt>Пользователи</dt><dd>${esc(record.users)}</dd></div><div class="aa-detail-field"><dt>Состояние</dt><dd>${chip(record.status)}</dd></div><div class="aa-detail-field"><dt>Действующий тариф Aurora</dt><dd>${esc(record.plan)}</dd></div><div class="aa-detail-field"><dt>Ожидающее назначение</dt><dd>${esc(record.pendingPlan || "Нет")}</dd></div><div class="aa-detail-field"><dt>Источник назначения</dt><dd>${esc(record.assignmentSource || "Биллинг")}</dd></div><div class="aa-detail-field"><dt>Сверка с биллингом</dt><dd>${chip(record.reconciliation || "Согласовано")}</dd></div></dl><div class="aa-form-actions">${actions.map((action) => actionButton(action, record)).join("")}</div>`;
    }
    if (command === "open-tariff-card") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      if (!record) return `<p>Тариф недоступен.</p>`;
      return `<dl class="aa-detail-fields"><div class="aa-detail-field"><dt>Тариф Aurora</dt><dd>${esc(record.tariff)}</dd></div><div class="aa-detail-field"><dt>Активная версия</dt><dd>${esc(record.version)}</dd></div><div class="aa-detail-field"><dt>Черновик новой версии</dt><dd>${esc(record.draftVersion || "Нет")}</dd></div><div class="aa-detail-field"><dt>Возможности</dt><dd>${esc(record.features)}</dd></div><div class="aa-detail-field"><dt>Ограничения</dt><dd>${esc(record.limits)}</dd></div><div class="aa-detail-field"><dt>Организации</dt><dd>${esc(record.organizations)}</dd></div></dl><div class="aa-notice" data-tone="info"><span class="aa-notice-symbol">i</span><div>В тарифе Aurora нет цен и платежей. Активная версия неизменяема; правки создают новую версию.</div></div><div class="aa-form-actions">${actionButton({ command: "create-tariff-version", label: "Создать новую версию", variant: "primary" }, record)}</div>`;
    }
    if (command === "request-tariff-assignment" || command === "correct-tariff-assignment") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      const values = state.pendingTariffByRoute[route.id] || { target: route.tariffOptions?.[0]?.value || "", reason: "", ticket: "" };
      const targetSelect = `<label class="aa-field"><span class="aa-field-label">Целевой тариф Aurora</span><select class="aa-select" data-tariff-key="target">${(route.tariffOptions || []).map((option) => `<option value="${esc(option.value)}" ${option.value === values.target ? "selected" : ""}>${esc(option.label)}</option>`).join("")}</select></label>`;
      if (command === "request-tariff-assignment") return `<p>Действующий тариф <strong>${esc(record?.plan || "")}</strong> не изменится, пока биллинговая система не подтвердит запрос.</p><div class="aa-form-grid">${targetSelect}<label class="aa-field"><span class="aa-field-label">Комментарий для биллинга</span><input class="aa-input" data-tariff-key="reason" value="${esc(values.reason)}"></label></div><div class="aa-notice" data-tone="info"><span class="aa-notice-symbol">i</span><div>Aurora передаст запрос и покажет ожидающее назначение. Цены и расчёты здесь не меняются.</div></div>`;
      return `<p>Используйте ручное исправление только для восстановления после сбоя обмена с биллингом.</p><div class="aa-form-grid">${targetSelect}<label class="aa-field"><span class="aa-field-label">Причина исправления</span><input class="aa-input" data-tariff-key="reason" value="${esc(values.reason)}"></label><label class="aa-field"><span class="aa-field-label">Номер обращения</span><input class="aa-input" data-tariff-key="ticket" value="${esc(values.ticket)}" placeholder="CS-0000"></label></div><div class="aa-notice" data-tone="warning"><span class="aa-notice-symbol">!</span><div>Перед применением система повторно подтвердит личность. Изменение попадёт в аудит и останется в состоянии «Требуется сверка с биллингом».</div></div>`;
    }
    if (command === "confirm-tariff-correction") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      const preview = state.tariffCorrectionPreviewByRoute[route.id];
      if (!record || !preview || String(preview.recordId) !== String(recordId)) return `<p>Предварительная оценка устарела. Вернитесь в карточку организации и повторите проверку.</p>`;
      return `<p>Проверьте итог перед ручным исправлением назначения.</p><div class="aa-impact-list"><div class="aa-impact-row"><div><strong>Организация</strong><span>${esc(record.tenant)}</span></div>${chip("Проверена")}</div><div class="aa-impact-row"><div><strong>Действующий тариф</strong><span>${esc(record.plan)}</span></div>${chip("Не изменён")}</div><div class="aa-impact-row"><div><strong>Целевой тариф</strong><span>${esc(preview.targetLabel)}</span></div>${chip("Будет назначен")}</div><div class="aa-impact-row"><div><strong>Основание</strong><span>${esc(preview.reason)} · ${esc(preview.ticket)}</span></div>${chip("Будет записано")}</div><div class="aa-impact-row"><div><strong>Сверка с биллингом</strong><span>После исправления потребуется отдельное подтверждение биллинговой системы.</span></div>${chip("Обязательна")}</div><div class="aa-impact-row"><div><strong>Аудит</strong><span>Исполнитель, прежняя и новая версии, причина и обращение будут записаны.</span></div>${chip("Включён")}</div></div><div class="aa-notice" data-tone="warning"><span class="aa-notice-symbol">!</span><div>Следующий шаг применит изменение после усиленной проверки личности. Денежные данные и состояние внешнего биллинга не меняются.</div></div>`;
    }
    if (command === "create-tariff" || command === "create-tariff-version") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      const values = state.pendingTariffDefinitionByRoute[route.id] || { name: record?.tariff || "", features: record?.features || "", limits: record?.limits || "" };
      return `<p>${command === "create-tariff" ? "Создайте черновик тарифа Aurora." : `Активная версия ${esc(record?.version || "")} останется неизменной; будет создан отдельный черновик.`}</p><div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Название тарифа</span><input class="aa-input" data-tariff-definition-key="name" value="${esc(values.name)}" ${command === "create-tariff-version" ? "readonly" : ""}></label><label class="aa-field"><span class="aa-field-label">Возможности Aurora</span><input class="aa-input" data-tariff-definition-key="features" value="${esc(values.features)}" placeholder="Почта, календарь, файлы"></label><label class="aa-field"><span class="aa-field-label">Ограничения Aurora</span><input class="aa-input" data-tariff-definition-key="limits" value="${esc(values.limits)}" placeholder="До 500 пользователей"></label></div><div class="aa-notice" data-tone="info"><span class="aa-notice-symbol">i</span><div>Цена, валюта, скидки, счета и платежи задаются во внешнем биллинге и отсутствуют в тарифе Aurora.</div></div>`;
    }

    if (command === "enable-directory-services") {
      return `<p>Организация получит возможность настроить коннектор службы каталогов. До настройки пользователи и группы продолжают управляться в Aurora.</p>${impactMarkup}`;
    }
    if (command === "disable-directory-services") {
      return `<p>Новые запуски синхронизации будут запрещены. Существующие пользователи не удаляются и не меняют источник управления автоматически; активный коннектор сначала нужно приостановить и сверить.</p>${impactMarkup}`;
    }
    if (command === "clear-logs") {
      return `<p>Все текущие файлы встроенных журналов Aurora будут удалены. Уже переданные во внешние системы записи и журнал административных действий не изменятся. Перед выполнением система повторно подтвердит личность суперадминистратора.</p>${impactMarkup}`;
    }
    if (command === "upgrade-database-schema") {
      return `<p>Будут применены только предусмотренные текущей версией изменения структуры БД. Перед обновлением должна существовать проверенная резервная копия, а система повторно подтвердит личность суперадминистратора.</p>${impactMarkup}`;
    }
    if (command === "save-license") {
      return `<p>Проверенный новый ключ заменит действующую лицензию Aurora. Перед сохранением система повторно подтвердит личность суперадминистратора.</p>${impactMarkup}`;
    }

    if (command === "create" && route.kind === "support") {
      return `<div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Организация</span><input class="aa-input" value="${esc(currentScopeLabel() || "Выбранная организация")}" readonly></label><label class="aa-field"><span class="aa-field-label">Номер обращения</span><input class="aa-input" value="CS-"></label><label class="aa-field"><span class="aa-field-label">Причина запроса</span><input class="aa-input" value=""></label><label class="aa-field"><span class="aa-field-label">Необходимый доступ</span><select class="aa-select"><option>Только диагностика</option><option>Диагностика и чтение безопасных полей пользователя</option></select></label><label class="aa-field"><span class="aa-field-label">Срок</span><select class="aa-select"><option>30 минут</option><option>45 минут</option><option>2 часа</option></select></label></div><div class="aa-notice" style="margin-top:16px"><span class="aa-notice-symbol">i</span><div>Доступ появится только после решения администратора организации.</div></div>`;
    }
    if (command === "create" && route.creationType === "organization") {
      const values = state.pendingCreateByRoute[route.id] || { name: "", domain: "", reseller: "прямое" };
      return `<div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Название организации</span><input class="aa-input" data-create-key="name" value="${esc(values.name)}"></label><label class="aa-field"><span class="aa-field-label">Основной домен</span><input class="aa-input" data-create-key="domain" value="${esc(values.domain)}" placeholder="example.org"></label><label class="aa-field"><span class="aa-field-label">Обслуживание</span><select class="aa-select" data-create-key="reseller">${(route.resellerOptions || []).map((option) => `<option value="${esc(option.value)}" ${option.value === values.reseller ? "selected" : ""}>${esc(option.label)}</option>`).join("")}</select></label></div>`;
    }
    if (command === "create" && route.creationType === "reseller") {
      const values = state.pendingCreateByRoute[route.id] || { name: "", contact: "" };
      return `<div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Название реселлера</span><input class="aa-input" data-create-key="name" value="${esc(values.name)}"></label><label class="aa-field"><span class="aa-field-label">Контакт администратора</span><input class="aa-input" data-create-key="contact" value="${esc(values.contact)}" placeholder="admin@example.org"></label></div>`;
    }
    if (command === "create" && route.creationType === "user") {
      const values = state.pendingCreateByRoute[route.id] || { username: "", domain: route.mailDomains?.[0] || "", displayName: "", role: "Пользователь", quotaProfile: "Стандартный 10 ГБ", firstSignIn: "Временная ссылка для первого входа" };
      const address = values.username ? `${values.username}@${values.domain}` : `имя@${values.domain}`;
      return `<div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Имя пользователя</span><input class="aa-input" data-create-key="username" value="${esc(values.username)}" placeholder="ivan"></label><label class="aa-field"><span class="aa-field-label">Почтовый домен</span><select class="aa-select" data-create-key="domain">${(route.mailDomains || []).map((domain) => `<option value="${esc(domain)}" ${domain === values.domain ? "selected" : ""}>${esc(domain)}</option>`).join("")}</select></label><label class="aa-field"><span class="aa-field-label">Итоговый адрес</span><input class="aa-input" data-user-address-preview value="${esc(address)}" readonly></label><label class="aa-field"><span class="aa-field-label">Отображаемое имя</span><input class="aa-input" data-create-key="displayName" value="${esc(values.displayName)}" placeholder="Иван Петров"></label><label class="aa-field"><span class="aa-field-label">Роль</span><select class="aa-select" data-create-key="role">${["Пользователь", "Администратор организации"].map((value) => `<option ${value === values.role ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></label><label class="aa-field"><span class="aa-field-label">Профиль квоты</span><select class="aa-select" data-create-key="quotaProfile">${["Стандартный 10 ГБ", "Расширенный 25 ГБ"].map((value) => `<option ${value === values.quotaProfile ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></label><label class="aa-field"><span class="aa-field-label">Первый вход</span><select class="aa-select" data-create-key="firstSignIn">${["Временная ссылка для первого входа", "Временный пароль", "Приглашение через администратора"].map((value) => `<option ${value === values.firstSignIn ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></label></div><div class="aa-notice" data-tone="info"><span class="aa-notice-symbol">i</span><div>Пользователь будет создан сразу в ${esc(currentScopeLabel())}. Если почтовый адаптер потребует времени, состояние подготовки ящика появится отдельно в строке пользователя.</div></div>`;
    }
    if (command === "deactivate-user" || command === "activate-user") {
      const record = contextualRecord(route);
      return `<p>${command === "deactivate-user" ? "Пользователь потеряет возможность входа, а его активные сеансы и токены будут отозваны." : "Пользователь снова сможет войти согласно действующей политике."}</p><div class="aa-impact-list">${renderLabeledRows([{ title: record?.name || "Пользователь", meta: record?.email || record?.subtitle || "", status: "Проверен" }, { title: "Профиль и данные", meta: "Адреса, группы, файлы и владение сохраняются", status: "Не изменяются" }, { title: "Почтовый сервер", meta: "Команда не меняет внешний почтовый ящик", status: "Не изменяется" }], "aa-impact-row")}</div>`;
    }
    if (command === "delete-user") {
      const record = contextualRecord(route);
      const values = state.pendingCreateByRoute[route.id] || {};
      const mailHook = route.mailServerHook ? `<label class="aa-field" style="margin-top:16px"><span class="aa-checkbox"><input type="checkbox" data-create-key="deleteMailAccount" ${values.deleteMailAccount ? "checked" : ""}> ${esc(route.mailServerHook.label)}</span><span class="aa-help">${esc(route.mailServerHook.help)}</span></label>` : "";
      return `<p>Удаление отделено от деактивации. Проверьте последствия для <strong>${esc(record?.name || "пользователя")}</strong>.</p><div class="aa-impact-list">${renderLabeledRows(route.deleteImpacts || [], "aa-impact-row")}</div>${mailHook}<label class="aa-field" style="margin-top:16px"><span class="aa-field-label">Подтверждение</span><input class="aa-input" data-create-key="deleteConfirmation" placeholder="Введите УДАЛИТЬ"></label>`;
    }
    if (command === "impersonate-user") {
      const record = contextualRecord(route);
      const values = state.pendingCreateByRoute[route.id] || {};
      return `<p>Будет создан отдельный защищённый сеанс от имени ${esc(record?.name || "пользователя")}. Пароль и токены пользователя не раскрываются.</p><div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Причина</span><input class="aa-input" data-create-key="impersonationReason" value="${esc(values.impersonationReason || "")}"></label><label class="aa-field"><span class="aa-field-label">Номер обращения</span><input class="aa-input" data-create-key="impersonationTicket" value="${esc(values.impersonationTicket || "")}" placeholder="CS-0000"></label></div><div class="aa-notice" data-tone="warning"><span class="aa-notice-symbol">!</span><div>После усиленной проверки личности появится заметная полоса защищённого сеанса. Все действия будут записаны в аудит.</div></div>`;
    }
    if (command === "confirm-impersonation") {
      const record = contextualRecord(route);
      const values = state.pendingCreateByRoute[route.id] || {};
      return `<p>Подтвердите начало защищённого сеанса для <strong>${esc(record?.name || "пользователя")}</strong> ключом доступа или другим настроенным способом усиленной проверки личности.</p><div class="aa-impact-list">${renderLabeledRows([{ title: "Причина", meta: values.impersonationReason || "—", status: "Указана" }, { title: "Обращение", meta: values.impersonationTicket || "—", status: "Указано" }], "aa-impact-row")}</div><div class="aa-notice" data-tone="warning"><span class="aa-notice-symbol">!</span><div>Сеанс и запись аудита появятся только после успешного подтверждения личности.</div></div>`;
    }
    if (command === "reassign-reseller") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      const selectedValue = state.pendingResellerByRoute[route.id] || record?.resellerId || "прямое";
      return `<p>Выберите, кто будет обслуживать организацию <strong>${esc(record?.tenant || "")}</strong>.</p><label class="aa-field"><span class="aa-field-label">Обслуживание</span><select class="aa-select" data-reassign-reseller>${(route.resellerOptions || []).map((option) => `<option value="${esc(option.value)}" ${option.value === selectedValue ? "selected" : ""}>${esc(option.label)}</option>`).join("")}</select></label>`;
    }
    if (command === "create" || command === "create-secret") {
      const secretNotice = command === "create-secret" ? `<div class="aa-notice" style="margin-top:16px"><span class="aa-notice-symbol">i</span><div>Учётные данные будут показаны один раз. Сохраните их в безопасном месте.</div></div>` : "";
      return `<div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Название</span><input class="aa-input" value="${esc(route.createName || "Новый объект")}"></label><label class="aa-field"><span class="aa-field-label">Область</span><input class="aa-input" value="${esc(currentScopeLabel())}" readonly></label></div>${secretNotice}`;
    }
    if (command === "create-mail-backend" || command === "edit-mail-backend") {
      const values = state.pendingMailBackendByRoute[route.id] || {};
      const securityOptions = (selected) => ["Без шифрования (защищённая сеть)", "STARTTLS", "TLS"].map((value) => `<option ${value === selected ? "selected" : ""}>${esc(value)}</option>`).join("");
      return `<div class="aa-form-section"><h3 class="aa-form-section-title">Подключение</h3><div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Уникальное имя подключения</span><input class="aa-input" data-mail-backend-key="name" value="${esc(values.name || "")}" data-validation-field="name"></label><label class="aa-field"><span class="aa-field-label">Возможности</span><input class="aa-input" data-mail-backend-key="capabilities" value="${esc(values.capabilities || "IMAP · SMTP")}" placeholder="IMAP · SMTP · квоты"></label></div></div><div class="aa-form-section"><h3 class="aa-form-section-title">Внутренние адреса Aurora</h3><div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">IMAP-сервер</span><input class="aa-input" data-mail-backend-key="internalImapHost" value="${esc(values.internalImapHost || "")}" data-validation-field="internalImapHost" dir="ltr"></label><label class="aa-field"><span class="aa-field-label">IMAP-порт</span><input class="aa-input" data-mail-backend-key="internalImapPort" value="${esc(values.internalImapPort || "143")}" data-validation-field="internalImapPort" inputmode="numeric"></label><label class="aa-field"><span class="aa-field-label">Защита IMAP</span><select class="aa-select" data-mail-backend-key="internalImapSecurity">${securityOptions(values.internalImapSecurity)}</select></label><label class="aa-field"><span class="aa-field-label">SMTP-сервер</span><input class="aa-input" data-mail-backend-key="internalSmtpHost" value="${esc(values.internalSmtpHost || "")}" data-validation-field="internalSmtpHost" dir="ltr"></label><label class="aa-field"><span class="aa-field-label">SMTP-порт</span><input class="aa-input" data-mail-backend-key="internalSmtpPort" value="${esc(values.internalSmtpPort || "25")}" data-validation-field="internalSmtpPort" inputmode="numeric"></label><label class="aa-field"><span class="aa-field-label">Защита SMTP</span><select class="aa-select" data-mail-backend-key="internalSmtpSecurity">${securityOptions(values.internalSmtpSecurity)}</select></label></div></div><div class="aa-form-section"><h3 class="aa-form-section-title">Публичные настройки почтовых клиентов</h3><div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">IMAP-сервер</span><input class="aa-input" data-mail-backend-key="publicImapHost" value="${esc(values.publicImapHost || "")}" data-validation-field="publicImapHost" dir="ltr"></label><label class="aa-field"><span class="aa-field-label">IMAP-порт</span><input class="aa-input" data-mail-backend-key="publicImapPort" value="${esc(values.publicImapPort || "993")}" data-validation-field="publicImapPort" inputmode="numeric"></label><label class="aa-field"><span class="aa-field-label">Защита IMAP</span><select class="aa-select" data-mail-backend-key="publicImapSecurity">${securityOptions(values.publicImapSecurity || "TLS")}</select></label><label class="aa-field"><span class="aa-field-label">SMTP-сервер</span><input class="aa-input" data-mail-backend-key="publicSmtpHost" value="${esc(values.publicSmtpHost || "")}" data-validation-field="publicSmtpHost" dir="ltr"></label><label class="aa-field"><span class="aa-field-label">SMTP-порт</span><input class="aa-input" data-mail-backend-key="publicSmtpPort" value="${esc(values.publicSmtpPort || "587")}" data-validation-field="publicSmtpPort" inputmode="numeric"></label><label class="aa-field"><span class="aa-field-label">Защита SMTP</span><select class="aa-select" data-mail-backend-key="publicSmtpSecurity">${securityOptions(values.publicSmtpSecurity || "STARTTLS")}</select></label><label class="aa-field"><span class="aa-field-label">Формат имени пользователя</span><select class="aa-select" data-mail-backend-key="usernameFormat">${["Полный адрес", "Имя до @"].map((value) => `<option ${value === (values.usernameFormat || "Полный адрес") ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></label></div></div><div class="aa-form-section"><h3 class="aa-form-section-title">Маршрутизация без организаций</h3><label class="aa-field"><span class="aa-field-label">Домены с явной маршрутизацией</span><textarea class="aa-textarea" rows="5" data-mail-backend-key="domains" placeholder="example.com&#10;special.example">${esc(values.domains || "")}</textarea><span class="aa-help">По одному точному домену в строке. Разные домены обычной организации в мультитенантном режиме здесь не распределяются.</span></label><label class="aa-inline"><input type="checkbox" data-mail-backend-default ${values.defaultForUnmatched ? "checked" : ""}> <span>Использовать для остальных доменов</span></label></div>`;
    }
    if (command === "create-mail-profile" || command === "edit-mail-profile") {
      const values = state.pendingMailProfileByRoute[route.id] || {};
      const authenticationField = `<label class="aa-field"><span class="aa-field-label">Способ входа</span><input class="aa-input" value="Пароль или пароль приложения" readonly><span class="aa-help">OAuth-роли настраиваются отдельно в разделе «Интеграции».</span></label>`;
      const availabilityField = route.id === "PROV-MAIL-PROFILES-001" ? `<label class="aa-field"><span class="aa-field-label">Доступность после сохранения</span><select class="aa-select" data-mail-profile-key="availability"><option ${values.availability !== "Доступен организациям" ? "selected" : ""}>Выключен</option><option ${values.availability === "Доступен организациям" ? "selected" : ""}>Доступен организациям</option></select></label>` : "";
      return `<div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Уникальное имя профиля</span><input class="aa-input" data-mail-profile-key="name" value="${esc(values.name || "")}" placeholder="Например, Резервная почта" data-validation-field="name"></label><label class="aa-field"><span class="aa-field-label">IMAP-сервер</span><input class="aa-input" data-mail-profile-key="imapHost" value="${esc(values.imapHost || "")}" placeholder="imap.example.com" data-validation-field="imapHost" dir="ltr"></label><label class="aa-field"><span class="aa-field-label">SMTP-сервер</span><input class="aa-input" data-mail-profile-key="smtpHost" value="${esc(values.smtpHost || "")}" placeholder="smtp.example.com" data-validation-field="smtpHost" dir="ltr"></label>${authenticationField}${availabilityField}</div><div class="aa-notice" data-tone="info"><span class="aa-notice-symbol">i</span><div>Совпадающее имя будет отклонено. Совпадающий IMAP-сервер разрешён только после отдельного подтверждения.</div></div>`;
    }
    if (command === "confirm-mail-profile-endpoint-duplicate") {
      const values = state.pendingMailProfileByRoute[route.id] || {};
      const matches = currentRows(route).filter((row) => String(row.id) !== String(recordId) && String(row.imapHost || "").trim().toLowerCase() === String(values.imapHost || "").trim().toLowerCase());
      return `<p>IMAP-сервер <strong>${esc(values.imapHost || "")}</strong> уже используется профилями: ${esc(matches.map((row) => row.name).join(", "))}. Всё равно сохранить отдельный профиль <strong>${esc(values.name || "")}</strong>?</p><div class="aa-notice" data-tone="warning"><span class="aa-notice-symbol">!</span><div>Конфигурация останется отдельной. Проверка выполнена только в текущей допустимой области.</div></div>`;
    }
    if (command === "configure-integration-role") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      const values = state.pendingIntegrationRegistrationByRoute[route.id] || {};
      const callbackUri = ["https://aurora.contoso.example/oauth/google", record?.callbackPath, "callback"].filter(Boolean).join("/");
      const scopes = record?.oauthScopes || [];
      const scopeValues = scopes.map((scope) => scope.value).join("\n");
      return `<p>Регистрация принадлежит только роли <strong>${esc(record?.role || "Google")}</strong>. Её токены не используются другими ролями.</p><dl class="aa-detail-fields"><div class="aa-detail-field"><dt>Назначение</dt><dd>${esc(record?.purpose || "Внешняя интеграция")}</dd></div></dl><div class="aa-form-grid"><label class="aa-field"><span class="aa-field-label">Идентификатор OAuth-клиента</span><input class="aa-input" data-integration-registration-key="clientId" value="${esc(values.clientId || "")}" autocomplete="off" dir="ltr"></label><label class="aa-field"><span class="aa-field-label">Новый клиентский секрет</span><input class="aa-input" data-integration-registration-key="secret" type="password" value="${esc(values.secret || "")}" placeholder="Оставьте пустым, чтобы сохранить действующий" autocomplete="new-password"><span class="aa-help">Секрет доступен только для записи и после сохранения не возвращается.</span></label></div><div class="aa-readonly-section"><div class="aa-readonly-head"><div><div class="aa-field-label">URI возврата</div><div class="aa-help">Вычисляется установкой. Добавьте этот точный URI в OAuth-приложение Google.</div></div>${button("copy", "Копировать URI", "ghost", `data-copy-value="${esc(callbackUri)}" data-copy-toast="URI возврата скопирован."`)}</div><code class="aa-code-value" dir="ltr">${esc(callbackUri)}</code></div><div class="aa-readonly-section"><div class="aa-readonly-head"><div><div class="aa-field-label">Разрешённые области OAuth</div><div class="aa-help">Определены установленным модулем роли и не редактируются администратором.</div></div>${button("copy", "Копировать все", "ghost", `data-copy-value="${esc(scopeValues)}" data-copy-toast="Области OAuth скопированы."`)}</div><div class="aa-scope-list">${scopes.map((scope) => `<div class="aa-scope-item"><code dir="ltr">${esc(scope.value)}</code><span>${esc(scope.description)}</span></div>`).join("")}</div></div><div class="aa-notice" data-tone="info"><span class="aa-notice-symbol">i</span><div>Пользовательское согласие выдаётся отдельно. Изменение этой регистрации не расширяет области других ролей Google.</div></div>`;
    }
    if (command === "enable-provider-integration") return `<p>Роль станет доступна для назначения организациям. Их собственные политики не включатся автоматически.</p>${impactMarkup}`;
    if (command === "disable-provider-integration") return `<p>Роль перестанет быть доступна всем организациям для новых подключений. Настройка регистрации останется доступной провайдеру, а существующие пользовательские разрешения не удалятся автоматически.</p>${impactMarkup}`;
    if (command === "allow-organization-integration") return `<p>Выбранная организация сможет самостоятельно разрешить роль своим пользователям. Её текущая политика не включится автоматически.</p>${impactMarkup}`;
    if (command === "deny-organization-integration") return `<p>Организация больше не сможет разрешать новые подключения этой роли. Существующие пользовательские разрешения не удаляются автоматически.</p>${impactMarkup}`;
    if (["preview", "publish", "confirm-destructive", "wipe", "restore", "revoke", "suspend", "support-consent", "support-deny", "support-revoke", "enable-directory-services", "disable-directory-services", "clear-logs", "upgrade-database-schema"].includes(command)) {
      return `<p>${esc(route.confirmText || "Проверьте область и последствия до подтверждения.")}</p>${impactMarkup}`;
    }
    return impactMarkup;
  }

  function openModal(command, route, trigger) {
    const triggerElement = trigger || document.activeElement;
    const triggerCommand = triggerElement?.dataset?.command || "";
    const matchingTriggers = triggerCommand ? [...root.querySelectorAll(`[data-command="${triggerCommand}"]`)] : [];
    lastTrigger = { command: triggerCommand, index: matchingTriggers.indexOf(triggerElement) };
    const dangerous = ["confirm-destructive", "wipe", "restore", "revoke", "suspend", "support-revoke", "disable-directory-services", "clear-logs", "upgrade-database-schema", "save-license", "confirm-tariff-correction", "deactivate-user", "delete-user", "impersonate-user", "confirm-impersonation", "configure-integration-role", "disable-provider-integration", "deny-organization-integration"].includes(command);
    const titles = {
      create: `Создать · ${route.title}`,
      "create-secret": "Создать сервисного клиента",
      preview: `Предпросмотр последствий · ${route.title}`,
      publish: `Опубликовать изменения · ${route.title}`,
      "confirm-destructive": `Подтвердить · ${route.title}`,
      wipe: "Выборочное стирание",
      restore: "Запросить операцию восстановления",
      revoke: "Отозвать доступ",
      suspend: "Приостановить организацию",
      "reassign-reseller": "Изменить обслуживание организации",
      "support-consent": "Подтвердить временный доступ поддержки",
      "support-deny": "Отклонить запрос поддержки",
      "support-revoke": "Отозвать активный сеанс поддержки",
      "enable-directory-services": "Разрешить коннектор службы каталогов",
      "disable-directory-services": "Запретить коннектор службы каталогов",
      "clear-logs": "Очистить встроенные журналы",
      "upgrade-database-schema": "Обновить структуру БД",
      "save-license": "Заменить лицензию Aurora",
      "open-organization-card": "Карточка организации",
      "open-tariff-card": "Карточка тарифа Aurora",
      "request-tariff-assignment": "Запросить смену тарифа",
      "correct-tariff-assignment": "Исправить назначение тарифа",
      "confirm-tariff-correction": "Подтвердить ручное исправление",
      "create-tariff": "Создать тариф Aurora",
      "create-tariff-version": "Создать новую версию тарифа",
      "deactivate-user": "Деактивировать пользователя",
      "activate-user": "Активировать пользователя",
      "delete-user": "Удалить пользователя",
      "impersonate-user": "Защищённый сеанс от имени пользователя",
      "confirm-impersonation": "Усиленная проверка личности",
      "create-mail-backend": "Добавить основное почтовое подключение",
      "edit-mail-backend": "Изменить основное почтовое подключение",
      "create-mail-profile": "Добавить профиль почтового сервера",
      "edit-mail-profile": "Изменить профиль почтового сервера",
      "configure-integration-role": "Настроить OAuth-регистрацию роли",
      "enable-provider-integration": "Сделать роль доступной организациям",
      "disable-provider-integration": "Выключить роль для организаций",
      "allow-organization-integration": "Разрешить роль организации",
      "deny-organization-integration": "Запретить роль организации",
    };
    const recordId = triggerElement?.dataset?.sourceRowId || "";
    if (command === "create" && route.creationType === "organization") state.pendingCreateByRoute[route.id] = { name: "", domain: "", reseller: "прямое" };
    if (command === "create" && route.creationType === "reseller") state.pendingCreateByRoute[route.id] = { name: "", contact: "" };
    if (command === "create" && route.creationType === "user") state.pendingCreateByRoute[route.id] = { username: "", domain: route.mailDomains?.[0] || "", displayName: "", role: "Пользователь", quotaProfile: "Стандартный 10 ГБ", firstSignIn: "Временная ссылка для первого входа" };
    if (command === "delete-user" || command === "impersonate-user") state.pendingCreateByRoute[route.id] = {};
    if (command === "reassign-reseller") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      state.pendingResellerByRoute[route.id] = record?.resellerId || "прямое";
    }
    if (command === "request-tariff-assignment" || command === "correct-tariff-assignment") state.pendingTariffByRoute[route.id] = { target: route.tariffOptions?.[0]?.value || "", reason: "", ticket: "" };
    if (command === "create-tariff" || command === "create-tariff-version") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      state.pendingTariffDefinitionByRoute[route.id] = { name: record?.tariff || "", features: record?.features || "", limits: record?.limits || "" };
    }
    if (command === "create-mail-backend" || command === "edit-mail-backend") {
      const record = command === "edit-mail-backend" ? currentRows(route).find((row) => String(row.id) === String(recordId)) : null;
      state.pendingMailBackendByRoute[route.id] = record ? { ...record } : { name: "", capabilities: "IMAP · SMTP", internalImapHost: "", internalImapPort: "143", internalImapSecurity: "Без шифрования (защищённая сеть)", internalSmtpHost: "", internalSmtpPort: "25", internalSmtpSecurity: "Без шифрования (защищённая сеть)", publicImapHost: "", publicImapPort: "993", publicImapSecurity: "TLS", publicSmtpHost: "", publicSmtpPort: "587", publicSmtpSecurity: "STARTTLS", usernameFormat: "Полный адрес", domains: "", defaultForUnmatched: false };
    }
    if (command === "create-mail-profile" || command === "edit-mail-profile") {
      const record = command === "edit-mail-profile" ? currentRows(route).find((row) => String(row.id) === String(recordId)) : null;
      state.pendingMailProfileByRoute[route.id] = record ? { ...record } : { name: "", imapHost: "", smtpHost: "", authentication: "Пароль или пароль приложения", availability: "Выключен" };
    }
    if (command === "configure-integration-role") {
      const record = currentRows(route).find((row) => String(row.id) === String(recordId));
      state.pendingIntegrationRegistrationByRoute[route.id] = { recordId, clientId: record?.oauthClientId || "", secret: "" };
    }
    const commandOperation = (command === "create" && route.creationType === "organization")
      ? "provisioning.tenants.create"
      : (command === "create" && route.creationType === "reseller")
        ? "provisioning.resellers.create"
        : ({
      "clear-logs": "provider.logs.clear",
      "upgrade-database-schema": "provider.database.schema.upgrade",
      "reassign-reseller": "provisioning.tenants.update",
      "save-license": "admin.license.update",
      "request-tariff-assignment": "admin.tariffs.assignment.request",
      "correct-tariff-assignment": "admin.featuresets.assignment.preview",
      "confirm-tariff-correction": "admin.tariffs.assignment.correct",
      "create-tariff": "admin.featuresets.create",
      "create-tariff-version": "admin.featuresets.create",
      "open-organization-card": "admin.tariffs.get",
      "open-tariff-card": "admin.featuresets.get",
      "deactivate-user": "admin.users.disable",
      "activate-user": "admin.users.enable",
      "delete-user": "admin.users.deprovision.create",
      "impersonate-user": "admin.users.impersonation.start",
      "confirm-impersonation": "admin.users.impersonation.start",
      "create-mail-backend": "provider.mail_infrastructure.create",
      "edit-mail-backend": "provider.mail_infrastructure.update",
      "create-mail-profile": route.id === "PROV-MAIL-PROFILES-001" ? "provider.mail_profiles.create" : "admin.mail_profiles.create",
      "edit-mail-profile": route.id === "PROV-MAIL-PROFILES-001" ? "provider.mail_profiles.update" : "admin.mail_profiles.update",
      "configure-integration-role": "provider.integration_registrations.update",
      "enable-provider-integration": "provider.integration_roles.enable",
      "disable-provider-integration": "provider.integration_roles.disable",
      "allow-organization-integration": "provider.integration_roles.organization_policy.update",
      "deny-organization-integration": "provider.integration_roles.organization_policy.update",
    }[command] || route.operation);
    state.modal = {
      command,
      recordId,
      title: command === "open-organization-card" ? `${titles[command]} · ${currentRows(route).find((row) => String(row.id) === String(recordId))?.tenant || ""}` : command === "open-tariff-card" ? `${titles[command]} · ${currentRows(route).find((row) => String(row.id) === String(recordId))?.tariff || ""}` : titles[command] || route.title,
      subtitle: state.showServiceMessages ? `${route.id} · ${commandOperation || "локальный сценарий проверки клиента"}` : "",
      body: modalBodyFor(command, route, recordId),
      confirmLabel: ["open-organization-card", "open-tariff-card"].includes(command) ? "" : command === "request-tariff-assignment" ? "Отправить запрос" : command === "correct-tariff-assignment" ? "Проверить последствия" : command === "confirm-tariff-correction" ? "Исправить после проверки личности" : command === "create-tariff" ? "Создать черновик" : command === "create-tariff-version" ? "Создать черновик версии" : command === "create-mail-backend" ? "Добавить подключение" : command === "edit-mail-backend" || command === "edit-mail-profile" ? "Сохранить" : command === "create-mail-profile" ? "Проверить и создать" : command === "configure-integration-role" ? "Сохранить после проверки личности" : command === "create" && route.creationType === "user" ? "Создать пользователя" : command === "deactivate-user" ? "Деактивировать и отозвать сеансы" : command === "activate-user" ? "Активировать" : command === "delete-user" ? "Удалить после проверки личности" : command === "impersonate-user" ? "Продолжить к проверке личности" : command === "confirm-impersonation" ? "Подтвердить ключом доступа и начать" : command === "enable-directory-services" ? "Разрешить" : command === "disable-directory-services" ? "Запретить после проверки" : command === "clear-logs" ? "Очистить после проверки личности" : command === "upgrade-database-schema" ? "Обновить после проверки личности" : command === "save-license" ? "Сохранить после проверки личности" : dangerous ? "Подтвердить после усиленной проверки личности" : command === "preview" ? "Продолжить к подтверждению" : "Подтвердить",
      danger: dangerous,
      wide: ["open-organization-card", "open-tariff-card", "create-mail-backend", "edit-mail-backend"].includes(command),
    };
    render();
  }

  function closeModal() {
    state.modal = null;
    render();
    restoreLastTriggerFocus();
  }

  function keepModalOpenWithError(route, message, focusSelector) {
    if (!state.modal) return;
    state.modal = {
      ...state.modal,
      error: message,
      focusSelector,
      body: modalBodyFor(state.modal.command, route, state.modal.recordId),
    };
    render();
  }

  function restoreLastTriggerFocus() {
    window.requestAnimationFrame(() => {
      const candidates = lastTrigger?.command ? [...root.querySelectorAll(`[data-command="${lastTrigger.command}"]`)] : [];
      const restoredTrigger = candidates[lastTrigger?.index] || candidates[0];
      if (restoredTrigger && !restoredTrigger.disabled) {
        restoredTrigger.focus();
        return;
      }
      const fallback = root.querySelector("[data-check-row]") || root.querySelector("[data-table-filter]") || root.querySelector("[data-global-filter]");
      fallback?.focus();
    });
  }

  function runCheck(route) {
    state.runtimeByRoute[route.id] = { title: "Проверка запущена", text: "Запрос принят; окончательный результат ещё неизвестен. Если понадобится помощь, код операции можно скопировать из результата проверки.", tone: "warning" };
    render();
    const operationTimer = window.setTimeout(() => {
      operationTimers.delete(operationTimer);
      if (lifecycle.signal.aborted) return;
      state.runtimeByRoute[route.id] = { title: "Проверка завершена", text: "Безопасные этапы выполнены. Один необязательный источник остался в неопределённом состоянии и доступен для повторной сверки.", tone: "success" };
      render();
    }, 700);
    operationTimers.add(operationTimer);
  }

  function handleCommand(command, target) {
    if (command === "dismiss-notification") {
      dismissNotification(target.dataset.notificationId);
      return;
    }
    if (command === "return-start") {
      navigateTo(startRoute);
      return;
    }
    if (command === "go-back") {
      const fallbackRouteId = target.dataset.fallbackRouteId;
      if (state.returnRouteByRoute[state.routeId]) global.history.back();
      else if (fallbackRouteId) navigateTo(fallbackRouteId, { historyMode: "replace" });
      return;
    }
    const route = routeFor();
    if (!route) return;
    if (command === "end-impersonation") {
      const session = state.impersonationSession;
      if (session) state.impersonationAuditEvents.unshift({ time: "Только что", ageHours: 0, actor: config.actor?.name || config.actor?.role || "Администратор", action: "Завершение защищённого сеанса", target: `${session.userName} · ${session.ticket} · ${session.reason}`, outcome: "Успешно", operation: "admin.users.impersonation.end", correlation: `imp-end-${Date.now()}` });
      state.impersonationSession = null;
      showToast("Защищённый сеанс завершён.");
      return;
    }
    if (command === "download-view") {
      downloadCurrentView(route);
      return;
    }
    if (["create", "create-secret", "preview", "publish", "confirm-destructive", "wipe", "restore", "revoke", "suspend", "reassign-reseller", "support-consent", "support-deny", "support-revoke", "enable-directory-services", "disable-directory-services", "clear-logs", "upgrade-database-schema", "open-organization-card", "open-tariff-card", "request-tariff-assignment", "correct-tariff-assignment", "create-tariff", "create-tariff-version", "deactivate-user", "activate-user", "delete-user", "impersonate-user", "confirm-impersonation", "create-mail-backend", "edit-mail-backend", "create-mail-profile", "edit-mail-profile", "configure-integration-role", "enable-provider-integration", "disable-provider-integration", "allow-organization-integration", "deny-organization-integration"].includes(command)) {
      openModal(command, route, target);
      return;
    }
    if (command === "save-system-settings") {
      const values = { ...Object.fromEntries((route.fields || []).map((field) => [field.key, field.value])), ...(state.systemSettingsByRoute[route.id] || {}) };
      if ((route.fields || []).some((field) => !String(values[field.key] || "").trim())) {
        state.runtimeByRoute[route.id] = { title: "Настройки не сохранены", text: "Заполните все системные значения.", tone: "danger" };
        render(); return;
      }
      if (!/^#[0-9a-f]{6}$/i.test(String(values.primaryColor))) {
        state.runtimeByRoute[route.id] = { title: "Настройки не сохранены", text: "Укажите основной цвет шестью шестнадцатеричными цифрами, например #315FCA.", tone: "danger" };
        render(); return;
      }
      options.onSystemIdentityChange?.(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value).trim()])));
      return;
    }
    if (command === "test-database") {
      const values = { ...route.values, ...(state.databaseValuesByRoute[route.id] || {}) };
      if (!String(values.host || "").trim() || !String(values.name || "").trim() || !String(values.login || "").trim()) {
        state.runtimeByRoute[route.id] = { title: "Подключение не проверено", text: "Укажите сервер, имя базы данных и логин.", tone: "danger" };
      } else {
        const scenario = state.databaseScenarioByRoute[route.id] || route.exampleState;
        if (scenario === "disconnected") state.databaseScenarioByRoute[route.id] = "empty";
        state.runtimeByRoute[route.id] = { title: "Подключение установлено", text: "Aurora подключилась к указанной базе данных. Пароль и строка подключения не показаны в результате.", tone: "success" };
      }
      render();
      return;
    }
    if (command === "verify-license" || command === "save-license") {
      const keyValue = String(state.licenseKeyByRoute[route.id] || "").trim();
      if (!keyValue) {
        state.runtimeByRoute[route.id] = { title: "Ключ не проверен", text: "Введите новый лицензионный ключ.", tone: "danger" };
      } else if (command === "verify-license") {
        state.verifiedLicenseKeyByRoute[route.id] = keyValue;
        state.runtimeByRoute[route.id] = { title: "Ключ действителен", text: "Лимит и срок лицензии проверены; действующая лицензия не изменена.", tone: "success" };
      } else if (state.verifiedLicenseKeyByRoute[route.id] !== keyValue) {
        state.runtimeByRoute[route.id] = { title: "Ключ не проверен", text: "Проверьте именно этот ключ перед сохранением.", tone: "danger" };
      } else {
        openModal("save-license", route, target);
        return;
      }
      render();
      return;
    }
    if (command === "save-database") {
      const values = { ...route.values, ...(state.databaseValuesByRoute[route.id] || {}) };
      const passwordWasProvided = Boolean(String(values.password || "").trim());
      const safeValues = { host: values.host, name: values.name, login: values.login };
      state.databaseValuesByRoute[route.id] = safeValues;
      state.runtimeByRoute[route.id] = {
        title: "Настройки сохранены",
        text: passwordWasProvided
          ? "Параметры подключения и новый пароль сохранены. Пароль больше не возвращается в интерфейс."
          : "Параметры подключения сохранены. Текущий пароль не изменён.",
        tone: "success"
      };
      render();
      return;
    }
    if (command === "create-database-schema") {
      state.databaseScenarioByRoute[route.id] = "current";
      state.runtimeByRoute[route.id] = { title: "Таблицы созданы", text: "Начальная структура БД создана и соответствует текущей версии Aurora.", tone: "success" };
      render();
      return;
    }
    if (command === "save-logging") {
      state.runtimeByRoute[route.id] = { title: "Настройки журналов сохранены", text: "Новые записи создаются с выбранной подробностью; чувствительные поля исключаются до записи.", tone: "success" };
      render();
      return;
    }
    if (command === "apply-log-filter") {
      state.logQueryByRoute[route.id] = root.querySelector("[data-log-query]")?.value.trim() || "";
      render();
      return;
    }
    if (command === "download-logs") {
      downloadCurrentView(route);
      return;
    }
    if (command === "close-modal") { closeModal(); return; }
    if (command === "confirm-modal") {
      const modalCommand = state.modal?.command;
      const modalRecordId = state.modal?.recordId;
      const retainedModal = state.modal;
      const keepsInputOnValidation = ["create-mail-backend", "edit-mail-backend", "create-mail-profile", "edit-mail-profile", "confirm-mail-profile-endpoint-duplicate"].includes(modalCommand);
      if (!keepsInputOnValidation) state.modal = null;
      if (["enable-provider-integration", "disable-provider-integration", "allow-organization-integration", "deny-organization-integration"].includes(modalCommand)) {
        const record = currentRows(route).find((row) => String(row.id) === String(modalRecordId));
        const globalCommand = modalCommand === "enable-provider-integration" || modalCommand === "disable-provider-integration";
        const nextAllowed = modalCommand === "enable-provider-integration" || modalCommand === "allow-organization-integration";
        if (globalCommand) {
          const actions = (record?.detailActions || []).filter((action) => !["enable-provider-integration", "disable-provider-integration"].includes(action.command));
          actions.push(nextAllowed
            ? { command: "disable-provider-integration", label: "Выключить для организаций", variant: "danger" }
            : { command: "enable-provider-integration", label: "Сделать доступной организациям" });
          setRowOverride(route.id, modalRecordId, { globalAvailable: nextAllowed, state: nextAllowed ? "Доступна организациям" : "Выключена", detailActions: actions });
          if (!alternativeActive(route.id)) options.onProviderIntegrationAvailabilityChange?.(modalRecordId, nextAllowed);
          enqueueNotification({ title: nextAllowed ? "Роль доступна организациям" : "Роль выключена", text: nextAllowed ? "Организации могут получить роль в пределах своей верхней политики." : "Новые подключения роли запрещены; её регистрация остаётся доступной для настройки.", tone: nextAllowed ? "success" : "warning" });
        } else {
          const tenantEnabled = nextAllowed && Boolean(record?.tenantEnabled);
          setRowOverride(route.id, modalRecordId, {
            providerAllowed: nextAllowed,
            tenantEnabled,
            enabled: tenantEnabled,
            availability: nextAllowed ? tenantEnabled ? "Разрешено" : "Разрешено провайдером · запрещено организацией" : "Запрещено провайдером",
            detailHint: nextAllowed ? `Провайдер разрешил роль. Политика организации: ${tenantEnabled ? "разрешена" : "запрещена"}.` : "Роль запрещена верхней политикой провайдера для этой организации.",
            detailActions: [nextAllowed
              ? { command: "deny-organization-integration", label: "Запретить организации", variant: "danger" }
              : { command: "allow-organization-integration", label: "Разрешить организации" }],
          });
          if (!alternativeActive(route.id)) options.onOrganizationIntegrationAvailabilityChange?.(modalRecordId, nextAllowed);
          enqueueNotification({ title: nextAllowed ? "Роль разрешена организации" : "Роль запрещена организации", text: nextAllowed ? "Организация снова может самостоятельно разрешить роль своим пользователям." : "Новые подключения роли для организации запрещены; существующие разрешения не удалены автоматически.", tone: nextAllowed ? "success" : "warning" });
        }
        restoreLastTriggerFocus();
        return;
      }
      if (modalCommand === "enable-directory-services" || modalCommand === "disable-directory-services") {
        options.onDirectoryServicesToggle?.(modalCommand === "enable-directory-services", "provider-action");
        return;
      }
      if (modalCommand === "create-mail-backend" || modalCommand === "edit-mail-backend") {
        const values = state.pendingMailBackendByRoute[route.id] || {};
        const requiredKeys = ["name", "internalImapHost", "internalImapPort", "internalSmtpHost", "internalSmtpPort", "publicImapHost", "publicImapPort", "publicSmtpHost", "publicSmtpPort"];
        const missingKey = requiredKeys.find((key) => !String(values[key] || "").trim());
        if (missingKey) {
          keepModalOpenWithError(route, "Заполните имя, внутренние и публичные адреса и порты.", `[data-validation-field="${missingKey}"]`);
          return;
        }
        const portKey = ["internalImapPort", "internalSmtpPort", "publicImapPort", "publicSmtpPort"].find((key) => !/^\d+$/.test(String(values[key])) || Number(values[key]) < 1 || Number(values[key]) > 65535);
        if (portKey) {
          keepModalOpenWithError(route, "Порт должен быть целым числом от 1 до 65535.", `[data-validation-field="${portKey}"]`);
          return;
        }
        const domains = String(values.domains || "").split(/\r?\n/).map((value) => value.trim().toLowerCase()).filter(Boolean);
        const invalidDomain = domains.find((domain) => domain === "*" || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(domain));
        if (invalidDomain) {
          keepModalOpenWithError(route, "Укажите точные домены по одному в строке. Для остальных доменов используйте отдельный переключатель.", "[data-mail-backend-key='domains']");
          return;
        }
        if (new Set(domains).size !== domains.length) {
          keepModalOpenWithError(route, "Один и тот же домен указан в списке несколько раз.", "[data-mail-backend-key='domains']");
          return;
        }
        const otherBackends = currentRows(route).filter((row) => String(row.id) !== String(modalRecordId));
        const normalizedName = String(values.name).trim().replace(/\s+/g, " ").toLocaleLowerCase(config.locale || "ru");
        if (otherBackends.some((row) => String(row.name || "").trim().replace(/\s+/g, " ").toLocaleLowerCase(config.locale || "ru") === normalizedName)) {
          keepModalOpenWithError(route, "Подключение с таким именем уже существует.", "[data-validation-field='name']");
          return;
        }
        const domainConflict = domains.find((domain) => otherBackends.some((row) => String(row.domains || "").split(/\r?\n/).map((value) => value.trim().toLowerCase()).includes(domain)));
        if (domainConflict) {
          keepModalOpenWithError(route, `Домен ${domainConflict} уже направлен на другое основное подключение.`, "[data-mail-backend-key='domains']");
          return;
        }
        if (values.defaultForUnmatched && otherBackends.some((row) => row.defaultForUnmatched)) {
          keepModalOpenWithError(route, "Подключение для остальных доменов уже задано. Сначала отключите прежнее резервное подключение.", "[data-mail-backend-default]");
          return;
        }
        const id = modalCommand === "edit-mail-backend" ? modalRecordId : `mail-backend-created-${(state.createdRowsByRoute[route.id] || []).length + 1}`;
        const normalized = { ...values, id, name: String(values.name).trim().replace(/\s+/g, " "), domains: domains.join("\n"), routing: [domains.length ? domains.join(" · ") : "", values.defaultForUnmatched ? "остальные домены" : ""].filter(Boolean).join(" · ") || "Нет правил", assignments: values.assignments || "0", capabilities: String(values.capabilities || "IMAP · SMTP").trim(), detailActions: [{ command: "edit-mail-backend", label: "Изменить подключение", variant: "primary" }] };
        if (modalCommand === "edit-mail-backend") setRowOverride(route.id, id, normalized);
        else state.createdRowsByRoute[route.id] = [...(state.createdRowsByRoute[route.id] || []), normalized];
        state.selectedByRoute[route.id] = id;
        state.pendingMailBackendByRoute[route.id] = {};
        state.modal = null;
        enqueueNotification({ title: modalCommand === "edit-mail-backend" ? "Подключение сохранено" : "Подключение добавлено", text: values.defaultForUnmatched ? "Оно используется для доменов без точного правила." : domains.length ? `Точные домены: ${domains.join(", ")}.` : "Подключение сохранено без активных правил маршрутизации.", tone: "success" });
        restoreLastTriggerFocus();
        return;
      }
      if (["create-mail-profile", "edit-mail-profile", "confirm-mail-profile-endpoint-duplicate"].includes(modalCommand)) {
        const values = state.pendingMailProfileByRoute[route.id] || {};
        const name = String(values.name || "").trim().replace(/\s+/g, " ");
        const imapHost = String(values.imapHost || "").trim().toLowerCase();
        const smtpHost = String(values.smtpHost || "").trim().toLowerCase();
        const normalizedName = name.toLocaleLowerCase(config.locale || "ru");
        const providerGlobalScope = route.id === "PROV-MAIL-PROFILES-001";
        const rows = providerGlobalScope ? currentRows(route).filter((row) => row.scopeType === "provider_global") : currentRows(route);
        const nameConflict = rows.some((row) => String(row.id) !== String(modalRecordId) && String(row.name || "").trim().replace(/\s+/g, " ").toLocaleLowerCase(config.locale || "ru") === normalizedName);
        const endpointMatches = rows.filter((row) => String(row.id) !== String(modalRecordId) && String(row.imapHost || "").trim().toLowerCase() === imapHost);
        if (!name || !imapHost || !smtpHost) {
          keepModalOpenWithError(route, "Укажите уникальное имя, IMAP-сервер и SMTP-сервер.", !name ? "[data-validation-field='name']" : !imapHost ? "[data-validation-field='imapHost']" : "[data-validation-field='smtpHost']");
          return;
        }
        if (nameConflict) {
          keepModalOpenWithError(route, `Профиль «${name}» уже существует в текущем списке. Укажите другое уникальное имя.`, "[data-validation-field='name']");
          return;
        }
        if (modalCommand !== "confirm-mail-profile-endpoint-duplicate" && endpointMatches.length) {
          state.modal = { command: "confirm-mail-profile-endpoint-duplicate", recordId: modalRecordId, saveMode: modalCommand, title: "Подтвердить совпадение IMAP-сервера", subtitle: state.showServiceMessages ? `${route.id} · ${route.id === "PROV-MAIL-PROFILES-001" ? "provider.mail_profiles.update" : "admin.mail_profiles.update"}` : "", body: modalBodyFor("confirm-mail-profile-endpoint-duplicate", route, modalRecordId), confirmLabel: "Всё равно сохранить", danger: false, wide: false };
          render(); return;
        }
        const saveMode = modalCommand === "confirm-mail-profile-endpoint-duplicate" ? retainedModal?.saveMode || "create-mail-profile" : modalCommand;
        const providerGlobal = providerGlobalScope;
        const authentication = "Пароль или пароль приложения";
        const id = saveMode === "edit-mail-profile" ? modalRecordId : `mail-profile-created-${(state.createdRowsByRoute[route.id] || []).length + 1}`;
        const row = providerGlobal
          ? { id, name, subtitle: `${imapHost} · ${smtpHost}`, owner: "Провайдер", authentication, availability: values.availability === "Доступен организациям" ? "Доступен организациям" : "Выключен", visibility: "Провайдер", imapHost, smtpHost, scopeType: "provider_global", detailActions: [{ command: "edit-mail-profile", label: "Изменить профиль", variant: "primary" }] }
          : { id, name, subtitle: `${imapHost} · ${smtpHost}`, origin: "Эта организация", authentication, access: values.access || "Запрещён", enabled: Boolean(values.enabled), toggleKind: "mail-profile", scopeType: "tenant_private", imapHost, smtpHost, driver: "generic-imap-smtp", detailActions: [{ command: "edit-mail-profile", label: "Изменить профиль", variant: "primary" }] };
        if (saveMode === "edit-mail-profile") setRowOverride(route.id, id, row);
        else state.createdRowsByRoute[route.id] = [...(state.createdRowsByRoute[route.id] || []), row];
        state.selectedByRoute[route.id] = id;
        state.pendingMailProfileByRoute[route.id] = {};
        state.modal = null;
        enqueueNotification({ title: saveMode === "edit-mail-profile" ? "Профиль сохранён" : "Профиль создан", text: endpointMatches.length ? `Профиль «${name}» сохранён как отдельная конфигурация после подтверждения совпадающего IMAP-сервера.` : `Профиль «${name}» сохранён в текущей области.`, tone: "success" });
        restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "configure-integration-role") {
        const values = state.pendingIntegrationRegistrationByRoute[route.id] || {};
        if (!String(values.clientId || "").trim()) {
          state.runtimeByRoute[route.id] = { title: "Регистрация роли не сохранена", text: "Укажите идентификатор OAuth-клиента.", tone: "danger" };
          render(); restoreLastTriggerFocus(); return;
        }
        state.runtimeByRoute[route.id] = { title: "Регистрация роли сохранена", text: "Идентификатор клиента и, если он был указан, новый секрет сохранены только для этой роли. Секрет больше не возвращается в интерфейс.", tone: "success" };
        state.pendingIntegrationRegistrationByRoute[route.id] = {};
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "create" && route.creationType === "user") {
        const values = state.pendingCreateByRoute[route.id] || {};
        if (!/^[a-z0-9._-]+$/i.test(String(values.username || "").trim()) || !String(values.domain || "").trim() || !String(values.displayName || "").trim()) {
          state.runtimeByRoute[route.id] = { title: "Пользователь не создан", text: "Укажите допустимое имя пользователя, почтовый домен и отображаемое имя.", tone: "danger" };
        } else {
          const id = `u-created-${(state.createdRowsByRoute[route.id] || []).length + 1}`;
          const email = `${String(values.username).trim()}@${String(values.domain).trim()}`;
          const quotaProfile = values.quotaProfile || "Стандартный 10 ГБ";
          const quotaLimit = quotaProfile.includes("25 ГБ") ? "25 ГБ" : "10 ГБ";
          const row = { id, name: String(values.displayName).trim(), subtitle: email, email, role: values.role || "Пользователь", quotaProfile, quota: `0 / ${quotaLimit}`, status: "Активен", management: "В Aurora", workflowImpacts: [{ title: String(values.displayName).trim(), meta: "Пользователь создан в Aurora", status: "Готов" }, { title: "Первый вход", meta: values.firstSignIn || "Временная ссылка", status: "Ожидает пользователя" }] };
          state.createdRowsByRoute[route.id] = [...(state.createdRowsByRoute[route.id] || []), row];
          state.selectedByRoute[route.id] = id;
          state.runtimeByRoute[route.id] = { title: "Пользователь создан", text: `${row.name} (${email}) сразу добавлен в организацию.`, tone: "success" };
        }
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "deactivate-user" || modalCommand === "activate-user") {
        const sourceRouteId = route.sourceRouteId;
        const nextStatus = modalCommand === "deactivate-user" ? "Деактивирован" : "Активен";
        state.rowOverridesByRoute[sourceRouteId] = { ...(state.rowOverridesByRoute[sourceRouteId] || {}), [modalRecordId]: { status: nextStatus } };
        state.runtimeByRoute[route.id] = { title: modalCommand === "deactivate-user" ? "Пользователь деактивирован" : "Пользователь активирован", text: modalCommand === "deactivate-user" ? "Вход запрещён, сеансы и токены отозваны. Данные и внешний почтовый ящик не изменены." : "Вход снова разрешён действующей политикой.", tone: "success" };
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "delete-user") {
        const values = state.pendingCreateByRoute[route.id] || {};
        if (String(values.deleteConfirmation || "").trim().toLocaleUpperCase("ru") !== "УДАЛИТЬ") {
          state.runtimeByRoute[route.id] = { title: "Пользователь не удалён", text: "Введите УДАЛИТЬ для подтверждения.", tone: "danger" };
        } else {
          state.rowOverridesByRoute[route.sourceRouteId] = { ...(state.rowOverridesByRoute[route.sourceRouteId] || {}), [modalRecordId]: { status: "Удалён", subtitle: "Запись удалена · доступ закрыт" } };
          const mailHookRequested = Boolean(route.mailServerHook && values.deleteMailAccount);
          state.runtimeByRoute[route.id] = { title: "Пользователь удалён", text: mailHookRequested ? "Доступ закрыт, данные Aurora обработаны по политике. Команда удаления учётной записи передана подключённому почтовому адаптеру; её итог будет записан отдельно." : "Доступ закрыт, данные Aurora обработаны по политике. Почтовый сервер не изменялся.", tone: "success" };
        }
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "impersonate-user") {
        const values = state.pendingCreateByRoute[route.id] || {};
        if (!String(values.impersonationReason || "").trim() || !String(values.impersonationTicket || "").trim()) {
          state.runtimeByRoute[route.id] = { title: "Сеанс не создан", text: "Укажите причину и номер обращения.", tone: "danger" };
        } else {
          state.modal = { command: "confirm-impersonation", recordId: modalRecordId, title: "Усиленная проверка личности", subtitle: state.showServiceMessages ? `${route.id} · admin.users.impersonation.start` : "", body: modalBodyFor("confirm-impersonation", route, modalRecordId), confirmLabel: "Подтвердить ключом доступа и начать", danger: true, wide: false };
          render(); return;
        }
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "confirm-impersonation") {
        const values = state.pendingCreateByRoute[route.id] || {};
        const sourceRoute = route.sourceRouteId ? routeMap.get(route.sourceRouteId) : null;
        const sessionRecord = sourceRoute ? currentRows(sourceRoute).find((row) => String(row.id) === String(modalRecordId)) : null;
        const reason = String(values.impersonationReason).trim();
        const ticket = String(values.impersonationTicket).trim();
        state.impersonationSession = { userId: modalRecordId, userName: sessionRecord?.name || "Пользователь", ticket, reason };
        state.impersonationAuditEvents.unshift({ time: "Только что", ageHours: 0, actor: config.actor?.name || config.actor?.role || "Администратор", action: "Начало защищённого сеанса", target: `${sessionRecord?.name || "Пользователь"} · ${ticket} · ${reason}`, outcome: "Успешно", operation: "admin.users.impersonation.start", correlation: `imp-start-${Date.now()}` });
        state.runtimeByRoute[route.id] = { title: "Защищённый сеанс начат", text: `Вы работаете от имени пользователя по обращению ${ticket}. Все действия записываются; пароль и токены недоступны.`, tone: "warning", impersonation: true };
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "create" && route.creationType === "organization") {
        const values = state.pendingCreateByRoute[route.id] || {};
        if (!String(values.name || "").trim() || !String(values.domain || "").trim() || !String(values.reseller || "").trim()) {
          state.modal = null;
          state.runtimeByRoute[route.id] = { title: "Организация не создана", text: "Укажите название, основной домен и обслуживание.", tone: "danger" };
        } else {
          const reseller = (route.resellerOptions || []).find((option) => option.value === values.reseller)?.label || "Прямое обслуживание";
          const id = `t-created-${(state.createdRowsByRoute[route.id] || []).length + 1}`;
          const row = { id, tenant: values.name.trim(), subtitle: values.domain.trim(), reseller, resellerId: values.reseller, plan: "Без тарифа", pendingPlan: "Нет", assignmentSource: "Не назначен", reconciliation: "Не требуется", users: "0", status: "Подготовка", detailActions: route.detailActions };
          state.createdRowsByRoute[route.id] = [...(state.createdRowsByRoute[route.id] || []), row];
          state.selectedByRoute[route.id] = id;
          state.runtimeByRoute[route.id] = { title: "Организация создана", text: `${row.tenant} обслуживается: ${reseller}.`, tone: "success" };
        }
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "create" && route.creationType === "reseller") {
        const values = state.pendingCreateByRoute[route.id] || {};
        if (!String(values.name || "").trim() || !String(values.contact || "").trim()) {
          state.modal = null;
          state.runtimeByRoute[route.id] = { title: "Реселлер не создан", text: "Укажите название и контакт администратора.", tone: "danger" };
        } else {
          const id = `r-created-${(state.createdRowsByRoute[route.id] || []).length + 1}`;
          const row = { id, reseller: values.name.trim(), subtitle: values.contact.trim(), organizations: "0", status: "Активен" };
          state.createdRowsByRoute[route.id] = [...(state.createdRowsByRoute[route.id] || []), row];
          state.selectedByRoute[route.id] = id;
          state.runtimeByRoute[route.id] = { title: "Реселлер создан", text: `${row.reseller} добавлен без назначенных организаций.`, tone: "success" };
        }
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "reassign-reseller") {
        const value = state.pendingResellerByRoute[route.id] || "прямое";
        const reseller = (route.resellerOptions || []).find((option) => option.value === value)?.label || "Прямое обслуживание провайдером";
        state.rowOverridesByRoute[route.id] = { ...(state.rowOverridesByRoute[route.id] || {}), [modalRecordId]: { reseller, resellerId: value } };
        state.runtimeByRoute[route.id] = { title: "Обслуживание изменено", text: `Организация теперь обслуживается: ${reseller}.`, tone: "success" };
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "request-tariff-assignment") {
        const values = state.pendingTariffByRoute[route.id] || {};
        const targetLabel = (route.tariffOptions || []).find((option) => option.value === values.target)?.label || "";
        if (!targetLabel) {
          state.runtimeByRoute[route.id] = { title: "Запрос не отправлен", text: "Выберите целевой тариф Aurora.", tone: "danger" };
        } else {
          state.rowOverridesByRoute[route.id] = { ...(state.rowOverridesByRoute[route.id] || {}), [modalRecordId]: { ...(state.rowOverridesByRoute[route.id]?.[modalRecordId] || {}), pendingPlan: targetLabel, assignmentSource: "Запрос из Aurora · передан в биллинг", reconciliation: "Ожидает подтверждения биллинга" } };
          state.runtimeByRoute[route.id] = { title: "Запрос передан в биллинг", text: `Ожидается подтверждение назначения «${targetLabel}». Действующий тариф не изменён.`, tone: "warning" };
        }
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "correct-tariff-assignment") {
        const values = state.pendingTariffByRoute[route.id] || {};
        const targetLabel = (route.tariffOptions || []).find((option) => option.value === values.target)?.label || "";
        if (!targetLabel || !String(values.reason || "").trim() || !String(values.ticket || "").trim()) {
          state.runtimeByRoute[route.id] = { title: "Назначение не исправлено", text: "Выберите тариф, укажите причину и номер обращения.", tone: "danger" };
        } else {
          state.tariffCorrectionPreviewByRoute[route.id] = { recordId: modalRecordId, target: values.target, targetLabel, reason: String(values.reason).trim(), ticket: String(values.ticket).trim() };
          state.modal = { command: "confirm-tariff-correction", recordId: modalRecordId, title: "Подтвердить ручное исправление", subtitle: state.showServiceMessages ? `${route.id} · admin.tariffs.assignment.correct` : "", body: "", confirmLabel: "Исправить после проверки личности", danger: true, wide: false };
          state.modal.body = modalBodyFor("confirm-tariff-correction", route, modalRecordId);
          render(); return;
        }
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "confirm-tariff-correction") {
        const preview = state.tariffCorrectionPreviewByRoute[route.id];
        if (!preview || String(preview.recordId) !== String(modalRecordId)) {
          state.runtimeByRoute[route.id] = { title: "Назначение не исправлено", text: "Предварительная оценка устарела. Повторите проверку из карточки организации.", tone: "danger" };
        } else {
          state.rowOverridesByRoute[route.id] = { ...(state.rowOverridesByRoute[route.id] || {}), [modalRecordId]: { ...(state.rowOverridesByRoute[route.id]?.[modalRecordId] || {}), plan: preview.targetLabel, pendingPlan: "Нет", assignmentSource: `Ручное исправление · ${preview.ticket}`, reconciliation: "Требуется сверка с биллингом" } };
          state.runtimeByRoute[route.id] = { title: "Назначение исправлено", text: `${preview.targetLabel} применён после усиленной проверки личности. Причина и обращение записаны в аудит; требуется сверка с биллингом.`, tone: "warning" };
          delete state.tariffCorrectionPreviewByRoute[route.id];
        }
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "create-tariff" || modalCommand === "create-tariff-version") {
        const values = state.pendingTariffDefinitionByRoute[route.id] || {};
        if (!String(values.name || "").trim() || !String(values.features || "").trim() || !String(values.limits || "").trim()) {
          state.runtimeByRoute[route.id] = { title: "Черновик не создан", text: "Укажите название, возможности и ограничения Aurora.", tone: "danger" };
        } else if (modalCommand === "create-tariff") {
          const id = `tariff-created-${(state.createdRowsByRoute[route.id] || []).length + 1}`;
          const row = { id, tariff: String(values.name).trim(), version: "—", draftVersion: "1", features: String(values.features).trim(), limits: String(values.limits).trim(), organizations: "0", status: "Черновик" };
          state.createdRowsByRoute[route.id] = [...(state.createdRowsByRoute[route.id] || []), row];
          state.selectedByRoute[route.id] = id;
          state.runtimeByRoute[route.id] = { title: "Черновик тарифа создан", text: `${row.tariff}: версия 1 ещё не активна и никому не назначена.`, tone: "success" };
        } else {
          const record = currentRows(route).find((row) => String(row.id) === String(modalRecordId));
          const nextVersion = String((Number(record?.version) || 0) + 1);
          state.rowOverridesByRoute[route.id] = { ...(state.rowOverridesByRoute[route.id] || {}), [modalRecordId]: { ...(state.rowOverridesByRoute[route.id]?.[modalRecordId] || {}), draftVersion: nextVersion, status: "Есть черновик" } };
          state.runtimeByRoute[route.id] = { title: "Черновик новой версии создан", text: `${String(values.name).trim()}: версия ${nextVersion}. Активная версия ${record?.version || ""} и назначения не изменены.`, tone: "success" };
        }
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "save-license") {
        state.licenseKeyByRoute[route.id] = "";
        state.verifiedLicenseKeyByRoute[route.id] = "";
        state.runtimeByRoute[route.id] = { title: "Лицензия обновлена", text: "Проверенный новый ключ сохранён. Сам ключ больше не возвращается в интерфейс.", tone: "success" };
        render(); restoreLastTriggerFocus(); return;
      }
      if (modalCommand === "clear-logs") {
        state.clearedLogsByRoute[route.id] = true;
        state.runtimeByRoute[route.id] = { title: "Журналы очищены", text: "Встроенные файлы журналов удалены. Журнал административных действий и внешние копии не изменены.", tone: "success" };
        render();
        restoreLastTriggerFocus();
        return;
      }
      if (modalCommand === "upgrade-database-schema") {
        state.databaseScenarioByRoute[route.id] = "current";
        state.runtimeByRoute[route.id] = { title: "Структура БД обновлена", text: "Изменения применены; структура соответствует текущей версии Aurora.", tone: "success" };
        render();
        restoreLastTriggerFocus();
        return;
      }
      if (modalCommand === "create-secret") {
        state.runtimeByRoute[route.id] = { title: "Сервисный клиент создан", text: "Одноразовые учётные данные намеренно скрыты в проверочном прототипе; в продукте они показываются один раз. Область и срок действия зафиксированы.", tone: "success" };
      } else if (modalCommand === "create" && route.kind === "support") {
        state.runtimeByRoute[route.id] = { title: "Запрос отправлен", text: "До решения администратора организации доступ отсутствует.", tone: "warning" };
      } else if (modalCommand === "preview") {
        state.runtimeByRoute[route.id] = { title: "Предварительная оценка готова", text: "Проверены область, версия изменений, зависимости и затронутые объекты. Изменение ещё не опубликовано.", tone: "success" };
      } else if (modalCommand === "publish" && route.kind === "editor") {
        const publishedVersion = state.draftVersionByRoute[route.id] ?? route.draftVersion ?? 1;
        state.publishedVersionByRoute[route.id] = publishedVersion;
        state.runtimeByRoute[route.id] = { title: "Изменения опубликованы", text: `Опубликована версия ${publishedVersion}.`, tone: "success" };
      } else if (modalCommand === "publish") {
        state.runtimeByRoute[route.id] = { title: "Изменение применено", text: "Выбранное изменение применено к указанному объекту.", tone: "success" };
      } else if (modalCommand === "support-consent") {
        state.supportOverridesByRoute[route.id] = { ...(state.supportOverridesByRoute[route.id] || {}), [modalRecordId]: { scenario: "одобрен", status: "Одобрен, ещё не начат", tone: "info", explanation: "Решение принято, но специалист поддержки ещё не начал работу.", actions: [{ command: "support-revoke", label: "Отменить разрешение", variant: "danger" }] } };
        state.runtimeByRoute[route.id] = { title: "Согласие записано", text: "Сеанс может начаться только в указанной области и завершится автоматически. Решение связано с заявкой и записью аудита.", tone: "success" };
      } else if (modalCommand === "support-deny") {
        state.supportOverridesByRoute[route.id] = { ...(state.supportOverridesByRoute[route.id] || {}), [modalRecordId]: { scenario: "завершён", status: "Отклонён", tone: "danger", explanation: "Доступ не предоставлен.", actions: [] } };
        state.runtimeByRoute[route.id] = { title: "Запрос отклонён", text: "Доступ не предоставлен. Причина и участники зафиксированы в журнале административных действий.", tone: "warning" };
      } else if (modalCommand === "support-revoke") {
        state.supportOverridesByRoute[route.id] = { ...(state.supportOverridesByRoute[route.id] || {}), [modalRecordId]: { scenario: "завершён", status: "Отозван", tone: "warning", explanation: "Доступ больше не действует.", actions: [] } };
        state.runtimeByRoute[route.id] = { title: "Сеанс отозван", text: "Новые действия специалиста запрещены; завершение и фактический результат записываются отдельно.", tone: "warning" };
      } else {
        state.runtimeByRoute[route.id] = { title: "Операция принята", text: "Результат отслеживается как отдельная операция; принятый запрос не считается окончательным успехом.", tone: "warning" };
      }
      render();
      restoreLastTriggerFocus();
      return;
    }
    if (command === "apply-filter") {
      const value = (root.querySelector("[data-table-filter]") || root.querySelector("[data-global-filter]"))?.value || "";
      state.filter = value.trim();
      render();
      return;
    }
    if (command === "save-detail-settings") {
      const values = { ...Object.fromEntries((route.fields || []).filter((field) => field.key).map((field) => [field.key, field.value ?? ""])), ...(state.detailSettingsByRoute[route.id] || {}) };
      const missingField = (route.fields || []).find((field) => field.required && !String(values[field.key] || "").trim());
      if (missingField) {
        state.runtimeByRoute[route.id] = { title: "Настройки не сохранены", text: `Заполните поле «${missingField.label}».`, tone: "danger" };
      } else {
        const storedValues = { ...values };
        (route.fields || []).filter((field) => field.secret).forEach((field) => { storedValues[field.key] = ""; });
        state.detailSettingsByRoute[route.id] = storedValues;
        state.runtimeByRoute[route.id] = { title: "Настройки входа сохранены", text: "Конфигурация корпоративного входа сохранена. Новый секрет, если он был указан, больше не возвращается в интерфейс.", tone: "success" };
      }
      render();
      return;
    }
    if (command === "test") { runCheck(route); return; }
    if (command === "save") {
      if (route.kind !== "editor") { showToast("Изменения сохранены."); return; }
      const validationMessage = editorValidationMessage(route);
      if (validationMessage) { showToast(`${validationMessage} Черновик не сохранён.`); return; }
      if (!editorIsDirty(route)) { showToast("Изменений для сохранения нет."); return; }
      const nextVersion = (state.draftVersionByRoute[route.id] ?? route.draftVersion ?? 1) + 1;
      state.draftVersionByRoute[route.id] = nextVersion;
      state.savedEditorValuesByRoute[route.id] = { ...editorValues(route) };
      state.dirtyByRoute[route.id] = false;
      showToast(`Черновик сохранён. Версия черновика: ${nextVersion}.`);
      return;
    }
    if (command === "discard") {
      if (route.kind !== "editor") { showToast("Изменения отменены."); return; }
      state.editorValuesByRoute[route.id] = { ...savedEditorValues(route) }; state.dirtyByRoute[route.id] = false; showToast("Несохранённые изменения отменены."); return;
    }
    if (command === "reset-inherited") { showToast("Черновик сброшен к унаследованному значению; публикация ещё не выполнена."); return; }
    if (command === "retry") { state.runtimeByRoute[route.id] = { title: "Сверка повторена", text: "Повторная сверка выполнена без создания дубликатов.", tone: "success" }; render(); return; }
    if (command === "workflow-next") { state.workflowStepByRoute[route.id] = Math.min((state.workflowStepByRoute[route.id] || 0) + 1, (route.steps || []).length - 1); render(); return; }
    if (command === "workflow-back") { state.workflowStepByRoute[route.id] = Math.max((state.workflowStepByRoute[route.id] || 0) - 1, 0); render(); return; }
    if (command === "open-audit" && routeMap.has("ADM-AUDIT-001")) { navigateTo("ADM-AUDIT-001", { rememberReturn: true }); return; }
    if (command === "copy") {
      const value = target.dataset.copyValue || "aur-2026-08-01-7f3a";
      navigator.clipboard?.writeText(value).catch(() => undefined);
      showToast(target.dataset.copyToast || `Код для службы поддержки скопирован: ${value}`);
      return;
    }
    if (command === "open-route") {
      const targetRouteId = target.dataset.targetRouteId;
      if (targetRouteId && routeMap.has(targetRouteId)) {
        navigateTo(targetRouteId, { sourceRowId: target.dataset.sourceRowId || "", rememberReturn: true });
      }
      return;
    }
    if (command === "open-self") {
      const targetRouteId = config.actor.detailRouteId || "ADM-USER-001";
      if (routeMap.has(targetRouteId)) {
        navigateTo(targetRouteId, { sourceRowId: config.actor.userId || "", rememberReturn: true });
      }
      return;
    }
    if (command === "open-object-detail") {
      const selected = selectedRow(route);
      const titleKey = route.columns?.[0]?.key;
      state.modal = { title: selected?.[titleKey] || selected?.name || selected?.title || route.title, subtitle: "Карточка объекта", body: `<dl class="aa-detail-fields">${Object.entries(selected || {}).filter(([key]) => !["id", "subtitle"].includes(key)).map(([key, value]) => `<div class="aa-detail-field"><dt>${esc(route.fieldLabels?.[key] || key)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`, cancelLabel: "Закрыть" };
      render();
      return;
    }
    if (command === "open-managed-scope") {
      const selected = selectedRow(route);
      const selectedName = selected?.owner || selected?.name || selected?.org || selected?.tenant || "";
      const option = config.scope?.options?.find((item) => item.name === selectedName)
        || config.scope?.options?.find((item) => item.label.includes(selectedName.split(" ")[0]));
      if (option && options.onScopeChange) {
        options.onScopeChange(option.value);
        return;
      }
      if (option) state.scope = option.value;
      state.modal = null;
      if (routeMap.has("ADM-USERS-001")) navigateTo("ADM-USERS-001", { rememberReturn: true });
      else render();
      return;
    }
    showToast("Действие показано в клиентском прототипе; результат сервера не имитируется автоматически.");
  }

  root.addEventListener("click", (event) => {
    if (event.target.matches("[data-modal-backdrop]")) {
      closeModal();
      return;
    }
    if (event.target.closest("[data-check-row]")) return;
    if (event.target.closest("[data-policy-toggle]")) return;
    const target = event.target.closest("button, [data-row-id]");
    if (!target || !root.contains(target)) return;
    const routeId = target.dataset.routeId;
    if (routeId && routeMap.has(routeId)) {
      navigateTo(routeId);
      return;
    }
    const rowId = target.dataset.rowId;
    if (rowId) {
      state.selectedByRoute[state.routeId] = rowId;
      writeHistory("replace");
      render();
      return;
    }
    const tab = target.dataset.tab;
    if (tab) {
      state.activeTabByRoute[state.routeId] = tab;
      writeHistory("replace");
      render();
      return;
    }
    const command = target.dataset.command;
    if (command) handleCommand(command, target);
  }, listenerOptions);

  root.addEventListener("input", (event) => {
    const target = event.target;
    if (target.matches("input[data-create-key]")) {
      const values = { ...(state.pendingCreateByRoute[state.routeId] || {}) };
      values[target.dataset.createKey] = target.type === "checkbox" ? target.checked : target.value;
      state.pendingCreateByRoute[state.routeId] = values;
      if (target.dataset.createKey === "username") {
        const preview = root.querySelector("[data-user-address-preview]");
        if (preview) preview.value = `${target.value || "имя"}@${values.domain || routeMap.get(state.routeId)?.mailDomains?.[0] || ""}`;
      }
      return;
    }
    if (target.matches("input[data-system-setting-key]")) {
      const values = { ...(state.systemSettingsByRoute[state.routeId] || {}) };
      values[target.dataset.systemSettingKey] = target.value;
      state.systemSettingsByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("[data-license-key]")) {
      state.licenseKeyByRoute[state.routeId] = target.value;
      if (state.verifiedLicenseKeyByRoute[state.routeId] !== target.value.trim()) {
        state.verifiedLicenseKeyByRoute[state.routeId] = "";
      }
      const saveButton = root.querySelector('[data-command="save-license"]');
      if (saveButton) saveButton.disabled = !target.value.trim() || state.verifiedLicenseKeyByRoute[state.routeId] !== target.value.trim();
      return;
    }
    if (target.matches("input[data-database-key]")) {
      const values = { ...(state.databaseValuesByRoute[state.routeId] || {}) };
      values[target.dataset.databaseKey] = target.value;
      state.databaseValuesByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("[data-log-query]")) {
      state.logQueryByRoute[state.routeId] = target.value;
      return;
    }
    if (target.matches("input[data-tariff-key]")) {
      const values = { ...(state.pendingTariffByRoute[state.routeId] || {}) };
      values[target.dataset.tariffKey] = target.value;
      state.pendingTariffByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("input[data-tariff-definition-key]")) {
      const values = { ...(state.pendingTariffDefinitionByRoute[state.routeId] || {}) };
      values[target.dataset.tariffDefinitionKey] = target.value;
      state.pendingTariffDefinitionByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("input[data-mail-backend-key], textarea[data-mail-backend-key]")) {
      const values = { ...(state.pendingMailBackendByRoute[state.routeId] || {}) };
      values[target.dataset.mailBackendKey] = target.value;
      state.pendingMailBackendByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("input[data-mail-profile-key]")) {
      const values = { ...(state.pendingMailProfileByRoute[state.routeId] || {}) };
      values[target.dataset.mailProfileKey] = target.value;
      state.pendingMailProfileByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("input[data-integration-registration-key]")) {
      const values = { ...(state.pendingIntegrationRegistrationByRoute[state.routeId] || {}) };
      values[target.dataset.integrationRegistrationKey] = target.value;
      state.pendingIntegrationRegistrationByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("input[data-detail-setting-key]")) {
      const values = { ...(state.detailSettingsByRoute[state.routeId] || {}) };
      values[target.dataset.detailSettingKey] = target.value;
      state.detailSettingsByRoute[state.routeId] = values;
      return;
    }
    if (!target.matches("input[data-editor-key]")) return;
    const values = { ...(state.editorValuesByRoute[state.routeId] || {}) };
    const key = target.dataset.editorKey;
    values[key] = target.value;
    state.editorValuesByRoute[state.routeId] = values;
    const route = routeMap.get(state.routeId);
    const dirty = editorIsDirty(route);
    const validationMessage = editorValidationMessage(route);
    state.dirtyByRoute[state.routeId] = dirty;
    const status = root.querySelector("[data-brand-status]");
    if (status) status.innerHTML = validationMessage ? chip(validationMessage, "danger") : chip(dirty ? "Есть несохранённые изменения" : "Черновик сохранён", dirty ? "warning" : "success");
    const publish = root.querySelector('[data-command="publish"]');
    if (publish) publish.disabled = dirty || Boolean(validationMessage);
    if (key === "name") {
      const name = target.value || routeMap.get(state.routeId)?.previewName || "Northwind Collaboration";
      const previewName = root.querySelector("[data-brand-preview-name]");
      const previewLogo = root.querySelector("[data-brand-preview-logo]");
      if (previewName) previewName.textContent = name;
      if (previewLogo) previewLogo.textContent = name.slice(0, 1).toLocaleUpperCase(config.locale || "ru");
    }
    if (key === "color") {
      const previewLogo = root.querySelector("[data-brand-preview-logo]");
      if (previewLogo) previewLogo.style.background = safeBrandColor(target.value);
    }
  }, listenerOptions);

  root.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("select[data-create-key]")) {
      const values = { ...(state.pendingCreateByRoute[state.routeId] || {}) };
      values[target.dataset.createKey] = target.value;
      state.pendingCreateByRoute[state.routeId] = values;
      if (target.dataset.createKey === "domain") {
        const preview = root.querySelector("[data-user-address-preview]");
        if (preview) preview.value = `${values.username || "имя"}@${target.value}`;
      }
      return;
    }
    if (target.matches("[data-reassign-reseller]")) {
      state.pendingResellerByRoute[state.routeId] = target.value;
      return;
    }
    if (target.matches("select[data-tariff-key]")) {
      const values = { ...(state.pendingTariffByRoute[state.routeId] || {}) };
      values[target.dataset.tariffKey] = target.value;
      state.pendingTariffByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("select[data-mail-profile-key]")) {
      const values = { ...(state.pendingMailProfileByRoute[state.routeId] || {}) };
      values[target.dataset.mailProfileKey] = target.value;
      state.pendingMailProfileByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("select[data-mail-backend-key]")) {
      const values = { ...(state.pendingMailBackendByRoute[state.routeId] || {}) };
      values[target.dataset.mailBackendKey] = target.value;
      state.pendingMailBackendByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("[data-mail-backend-default]")) {
      const values = { ...(state.pendingMailBackendByRoute[state.routeId] || {}) };
      values.defaultForUnmatched = target.checked;
      state.pendingMailBackendByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("select[data-detail-setting-key]")) {
      const values = { ...(state.detailSettingsByRoute[state.routeId] || {}) };
      values[target.dataset.detailSettingKey] = target.value;
      state.detailSettingsByRoute[state.routeId] = values;
      return;
    }
    if (target.matches("[data-policy-toggle]")) {
      const recordId = String(target.dataset.recordId || "");
      const record = currentRows(routeMap.get(state.routeId)).find((row) => String(row.id) === recordId);
      const isIntegrationRole = target.dataset.toggleKind === "integration-role";
      setRowOverride(state.routeId, recordId, { enabled: target.checked, tenantEnabled: target.checked, access: target.checked ? "Разрешена" : "Запрещена", availability: target.checked ? "Разрешён" : "Запрещён" });
      if (isIntegrationRole && !alternativeActive(state.routeId)) options.onTenantIntegrationAvailabilityChange?.(recordId, target.checked);
      const isGoogleSignIn = recordId === "google-sign-in";
      state.runtimeByRoute[state.routeId] = target.checked
        ? { title: isIntegrationRole ? "Роль разрешена" : "Профиль разрешён", text: isGoogleSignIn ? "Вход через Google теперь предлагается всем пользователям организации. Каждый пользователь связывает собственную Google-личность." : `Подключение «${record?.role || record?.name || "внешний сервис"}» теперь доступно всем пользователям организации для новых подключений. Каждый пользователь подтверждает собственный доступ.`, tone: "success" }
        : { title: isGoogleSignIn ? "Вход через Google запрещён" : "Новые подключения запрещены", text: isGoogleSignIn ? "Вход через Google больше не предлагается. Существующие связи внешней личности не удалены автоматически." : `${record?.role || record?.name || "Подключение"} больше не предлагается для новых подключений. Существующие подключения и пользовательские разрешения не изменены.`, tone: "warning" };
      render();
      return;
    }
    if (target.matches("[data-table-choice]")) {
      state.tableChoiceByRoute[state.routeId] = target.value;
      state.selectedByRoute[state.routeId] = "";
      render();
      return;
    }
    if (target.matches("[data-table-choice-toggle]")) {
      const route = routeMap.get(state.routeId);
      state.tableChoiceByRoute[state.routeId] = target.checked ? route.choiceFilter.allValue : route.choiceFilter.defaultValue;
      state.selectedByRoute[state.routeId] = "";
      render();
      return;
    }
    if (target.matches("[data-service-toggle]")) {
      state.showServiceMessages = target.checked;
      if (!target.checked) state.supportScenarioByRoute = {};
      render();
      return;
    }
    if (target.matches("[data-alternative-state-toggle]")) {
      state.alternativeByRoute[state.routeId] = target.checked;
      state.selectedByRoute[state.routeId] = "";
      if (!target.checked) delete state.alternativeRowOverridesByRoute[state.routeId];
      render();
      return;
    }
    if (target.matches("[data-directory-services-toggle]")) {
      options.onDirectoryServicesToggle?.(target.checked, "prototype-toggle");
      return;
    }
    if (target.matches("[data-database-scenario]")) {
      state.databaseScenarioByRoute[state.routeId] = target.value;
      state.runtimeByRoute[state.routeId] = null;
      render();
      return;
    }
    if (target.matches("[data-logging-enabled]")) {
      state.loggingEnabledByRoute[state.routeId] = target.value === "on";
      render();
      return;
    }
    if (target.matches("[data-logging-detail]")) {
      state.logDetailByRoute[state.routeId] = target.value;
      render();
      return;
    }
    if (target.matches("[data-log-level]")) {
      state.logLevelByRoute[state.routeId] = target.value;
      render();
      return;
    }
    if (target.matches("[data-log-category]")) {
      state.logCategoryByRoute[state.routeId] = target.value;
      render();
      return;
    }
    if (target.matches("[data-support-scenario]")) {
      state.supportScenarioByRoute[state.routeId] = target.value;
      state.selectedByRoute[state.routeId] = "";
      render();
      return;
    }
    if (target.matches("[data-activity-result]")) {
      state.activityResultByRoute[state.routeId] = target.value;
      render();
      return;
    }
    if (target.matches("[data-activity-period]")) {
      state.activityPeriodByRoute[state.routeId] = target.value;
      render();
      return;
    }
    if (target.matches("select[data-editor-key]")) {
      const values = { ...(state.editorValuesByRoute[state.routeId] || {}) };
      values[target.dataset.editorKey] = target.value;
      state.editorValuesByRoute[state.routeId] = values;
      render();
      return;
    }
    if (target.matches("[data-mobile-route]")) {
      if (routeMap.has(target.value)) {
        navigateTo(target.value);
      }
      return;
    }
    if (target.matches("[data-scope-select]")) {
      if (options.onScopeChange) {
        options.onScopeChange(target.value);
      }
      return;
    }
    if (target.matches("[data-check-row]")) {
      const current = new Set((state.checkedByRoute[state.routeId] || []).map(String));
      if (target.checked) current.add(String(target.dataset.checkRow)); else current.delete(String(target.dataset.checkRow));
      state.checkedByRoute[state.routeId] = Array.from(current);
      render();
    }
  }, listenerOptions);

  root.addEventListener("pointerover", (event) => {
    const notification = event.target.closest?.("[data-notification-id]");
    if (notification && root.contains(notification)) pauseNotification(notification.dataset.notificationId);
  }, listenerOptions);

  root.addEventListener("pointerout", (event) => {
    const notification = event.target.closest?.("[data-notification-id]");
    if (!notification || notification.contains(event.relatedTarget)) return;
    resumeNotification(notification.dataset.notificationId);
  }, listenerOptions);

  root.addEventListener("focusin", (event) => {
    const notification = event.target.closest?.("[data-notification-id]");
    if (notification) pauseNotification(notification.dataset.notificationId);
  }, listenerOptions);

  root.addEventListener("focusout", (event) => {
    const notification = event.target.closest?.("[data-notification-id]");
    if (!notification || notification.contains(event.relatedTarget)) return;
    resumeNotification(notification.dataset.notificationId);
  }, listenerOptions);

  root.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("tr[data-row-id]")) {
      event.preventDefault();
      event.target.click();
      return;
    }
    if (event.key === "Enter" && event.target.matches("[data-global-filter], [data-table-filter]")) {
      event.preventDefault();
      state.filter = event.target.value.trim();
      render();
    }
  }, listenerOptions);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.modal) closeModal();
  }, listenerOptions);

  global.addEventListener("popstate", (event) => {
    const incoming = event.state || {};
    if (incoming.auroraAdmin === true && incoming.workspaceKey && incoming.workspaceKey !== historyWorkspaceKey) return;
    if (incoming.auroraAdmin === true) {
      state.selectedByRoute = { ...(incoming.selectedByRoute || {}) };
      state.detailContextByRoute = { ...(incoming.detailContextByRoute || {}) };
      state.returnRouteByRoute = { ...(incoming.returnRouteByRoute || {}) };
    }
    const requestedId = String(incoming.routeId || decodeURIComponent(global.location.hash.replace(/^#/, "")) || startRoute);
    const targetRoute = routeMap.get(requestedId);
    if (!targetRoute) {
      state.deniedRouteId = requestedId;
    } else if (targetRoute.requiresContext && targetRoute.sourceRouteId && !contextualRecord(targetRoute)) {
      state.routeId = targetRoute.sourceRouteId;
      state.deniedRouteId = "";
    } else {
      state.routeId = requestedId;
      state.deniedRouteId = "";
    }
    state.filter = "";
    state.modal = null;
    render();
  }, listenerOptions);

  const controller = Object.freeze({
    getState: () => JSON.parse(JSON.stringify(state)),
    screenIds: () => routes.flatMap((route) => [route.id, ...(route.embeddedScreenIds || [])]),
    navigate: (id) => {
      return navigateTo(id);
    },
    unmount: () => {
      lifecycle.abort();
      notificationTimers.forEach((timerState) => global.clearTimeout(timerState.timer));
      notificationTimers.clear();
      operationTimers.forEach((timer) => window.clearTimeout(timer));
      operationTimers.clear();
      root.replaceChildren();
    },
  });

  writeHistory("replace");
  render();
  return controller;
  }

  global.AuroraAdminRuntime = Object.freeze({ mount });
})(window);
