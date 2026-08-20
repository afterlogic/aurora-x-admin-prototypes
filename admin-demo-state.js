(function (global) {
  "use strict";

  const roleDefinitions = Object.freeze([
    Object.freeze({
      id: "google-sign-in",
      family: "Google",
      role: "Вход через Google",
      purpose: "Вход через Google",
      subtitle: "google.sign_in · отдельная граница аутентификации",
      connection: "OAuth 2.0",
      registration: "Вход Google · проверена",
      oauthClientId: "824763109521-aurora-signin.apps.googleusercontent.com",
      callbackPath: "login",
      oauthScopes: Object.freeze([
        Object.freeze({ value: "openid", description: "Подтвердить идентификатор Google-пользователя." }),
        Object.freeze({ value: "email", description: "Получить подтверждённый адрес электронной почты." }),
        Object.freeze({ value: "profile", description: "Получить основные данные профиля для отображения." }),
      ]),
      tenantPurpose: "Способ входа",
    }),
    Object.freeze({
      id: "google-gmail",
      family: "Google",
      role: "Gmail",
      purpose: "Почта Gmail",
      subtitle: "google.gmail · обычная почта IMAP/SMTP",
      connection: "OAuth 2.0",
      registration: "Gmail · проверена",
      oauthClientId: "824763109521-aurora-gmail.apps.googleusercontent.com",
      callbackPath: "gmail",
      oauthScopes: Object.freeze([
        Object.freeze({ value: "openid", description: "Подтвердить ту же Google-личность пользователя." }),
        Object.freeze({ value: "email", description: "Сопоставить подтверждённый адрес подключаемого ящика." }),
        Object.freeze({ value: "https://mail.google.com/", description: "Разрешить доступ к Gmail по IMAP/SMTP OAuth2." }),
      ]),
      tenantPurpose: "Внешний ящик IMAP/SMTP",
    }),
    Object.freeze({
      id: "google-drive",
      family: "Google",
      role: "Диск Google",
      purpose: "Диск Google",
      subtitle: "google.drive · полноценное хранилище · единый интерфейс Aurora",
      connection: "OAuth 2.0",
      registration: "Диск Google · проверена",
      oauthClientId: "824763109521-aurora-drive.apps.googleusercontent.com",
      callbackPath: "drive",
      featureKey: "google-drive",
      oauthScopes: Object.freeze([
        Object.freeze({ value: "openid", description: "Подтвердить ту же Google-личность пользователя." }),
        Object.freeze({ value: "email", description: "Сопоставить подтверждённый адрес владельца файлового подключения." }),
        Object.freeze({ value: "https://www.googleapis.com/auth/drive", description: "Разрешить файловому модулю работать со всем Диском Google через общий файловый API." }),
      ]),
      tenantPurpose: "Файловое хранилище",
    }),
  ]);

  const globalAvailability = new Map(roleDefinitions.map((role) => [role.id, true]));
  const organizationPolicies = new Map([
    ["tenant:northwind", {
      providerAllowed: { "google-sign-in": true, "google-gmail": true, "google-drive": false },
      tenantEnabled: { "google-sign-in": false, "google-gmail": false, "google-drive": false },
    }],
    ["tenant:adatum", {
      providerAllowed: { "google-sign-in": true, "google-gmail": true, "google-drive": true },
      tenantEnabled: { "google-sign-in": true, "google-gmail": false, "google-drive": false },
    }],
    ["tenant:default", {
      providerAllowed: { "google-sign-in": true, "google-gmail": true, "google-drive": true },
      tenantEnabled: { "google-sign-in": false, "google-gmail": false, "google-drive": false },
    }],
  ]);

  function policyFor(contextId) {
    if (!organizationPolicies.has(contextId)) {
      organizationPolicies.set(contextId, {
        providerAllowed: Object.fromEntries(roleDefinitions.map((role) => [role.id, true])),
        tenantEnabled: Object.fromEntries(roleDefinitions.map((role) => [role.id, false])),
      });
    }
    return organizationPolicies.get(contextId);
  }

  function providerActions(roleId, available, registrationState) {
    const actions = [{ command: "configure-integration-role", label: "Настроить OAuth-регистрацию" }];
    if (registrationState !== "configured") return actions;
    actions.push(available
      ? { command: "disable-provider-integration", label: "Выключить для организаций", variant: "danger" }
      : { command: "enable-provider-integration", label: "Сделать доступной организациям" });
    if (roleId === "google-gmail") actions.splice(1, 0, { command: "open-route", targetRouteId: "PROV-MAIL-PROFILES-001", label: "Открыть почтовый профиль" });
    return actions;
  }

  function providerRows(options = {}) {
    return roleDefinitions.map((role) => {
      const { featureKey, ...publicRole } = role;
      const alternative = Boolean(options.alternative);
      const registrationState = alternative && role.id === "google-drive" ? "missing" : "configured";
      const available = alternative && role.id === "google-gmail" ? false : Boolean(globalAvailability.get(role.id));
      const state = registrationState !== "configured" ? "Требует настройки" : available ? "Доступна организациям" : "Выключена";
      return {
        ...publicRole,
        state,
        registrationState,
        globalAvailable: available,
        scopes: role.oauthScopes.map((scope) => scope.value).join(" · "),
        detailActions: providerActions(role.id, available, registrationState),
      };
    });
  }

  function organizationRows(contextId, options = {}) {
    const policy = policyFor(contextId);
    const viewer = options.viewer === "provider" ? "provider" : "tenant";
    const alternative = Boolean(options.alternative);
    return roleDefinitions.map((role) => {
      const globalAllowed = Boolean(globalAvailability.get(role.id));
      let providerAllowed = globalAllowed && policy.providerAllowed[role.id] !== false;
      let tenantEnabled = providerAllowed && Boolean(policy.tenantEnabled[role.id]);
      if (alternative) {
        if (role.id === "google-sign-in") providerAllowed = false;
        if (role.id === "google-gmail") tenantEnabled = providerAllowed;
        if (role.id === "google-drive") providerAllowed = globalAllowed;
      }
      const availability = !providerAllowed
        ? "Запрещено провайдером"
        : tenantEnabled ? "Разрешено" : viewer === "provider" ? "Разрешено провайдером · запрещено организацией" : "Запрещён";
      const detailActions = viewer === "provider"
        ? !globalAllowed
          ? []
          : [providerAllowed
            ? { command: "deny-organization-integration", label: "Запретить организации", variant: "danger" }
            : { command: "allow-organization-integration", label: "Разрешить организации" }]
        : role.id === "google-gmail" ? [{ command: "open-route", targetRouteId: "ADM-MAIL-PROFILES-001", label: "Открыть почтовый профиль" }] : [];
      return {
        id: role.id,
        role: role.role,
        subtitle: role.subtitle.replace("обычная почта IMAP/SMTP", "отдельное почтовое согласие").replace("отдельная граница аутентификации", "отдельное согласие на вход"),
        purpose: role.tenantPurpose,
        availability,
        providerAllowed,
        tenantEnabled,
        enabled: tenantEnabled,
        toggleKind: viewer === "tenant" && providerAllowed ? "integration-role" : undefined,
        detailHint: viewer === "provider"
          ? !globalAllowed
            ? "Роль глобально выключена в разделе «Интеграции». Разрешить её только этой организации нельзя."
            : providerAllowed
            ? `Провайдер разрешил роль. Политика организации: ${tenantEnabled ? "разрешена" : "запрещена"}.`
            : "Роль запрещена верхней политикой провайдера для этой организации."
          : undefined,
        detailActions,
      };
    });
  }

  function setGlobalAvailability(roleId, available) {
    if (!roleDefinitions.some((role) => role.id === roleId)) return false;
    globalAvailability.set(roleId, Boolean(available));
    return true;
  }

  function setOrganizationProviderAllowed(contextId, roleId, allowed) {
    const policy = policyFor(contextId);
    policy.providerAllowed[roleId] = Boolean(allowed);
    if (!allowed) policy.tenantEnabled[roleId] = false;
    return true;
  }

  function setTenantEnabled(contextId, roleId, enabled) {
    const policy = policyFor(contextId);
    if (!globalAvailability.get(roleId) || policy.providerAllowed[roleId] === false) return false;
    policy.tenantEnabled[roleId] = Boolean(enabled);
    return true;
  }

  global.AuroraAdminDemoState = Object.freeze({
    providerRows,
    organizationRows,
    setGlobalAvailability,
    setOrganizationProviderAllowed,
    setTenantEnabled,
  });
})(window);
