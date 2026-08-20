(function (global) {
  "use strict";

  let activeController = null;

  const microfrontend = Object.freeze({
    mount(host, options = {}) {
      if (!host || !global.AuroraAdminRuntime || !global.AuroraTenantAdminManifest || !global.AuroraAdminDemoState) {
        throw new Error("Aurora Tenant Admin microfrontend dependencies are missing");
      }
      activeController?.unmount();
      const profileId = options.profileId || global.AuroraTenantAdminManifest.defaultProfile;
      const directoryServicesEnabled = Boolean(options.directoryServicesEnabled);
      const effectiveConfig = global.AuroraTenantAdminManifest.createEffectiveConfig(profileId, {
        directoryServicesEnabled,
        protectedUserSessionEnabled: Boolean(options.protectedUserSessionEnabled),
        mailUserLifecycleHooksEnabled: Boolean(options.mailUserLifecycleHooksEnabled),
        productName: options.productName,
        mobileAppName: options.mobileAppName,
      });
      const config = { ...effectiveConfig, ...(options.config || {}) };
      activeController = global.AuroraAdminRuntime.mount({
        root: host,
        config,
        requestedRoute: options.requestedRoute,
        showServiceMessages: options.showServiceMessages,
        directoryServicesEnabled,
        onDirectoryServicesToggle(nextEnabled) {
          const currentState = activeController?.getState() || {};
          microfrontend.mount(host, {
            ...options,
            directoryServicesEnabled: nextEnabled,
            requestedRoute: currentState.routeId,
            showServiceMessages: currentState.showServiceMessages,
          });
        },
        onTenantIntegrationAvailabilityChange(roleId, nextEnabled) {
          global.AuroraAdminDemoState.setTenantEnabled(options.contextId || "tenant:northwind", roleId, nextEnabled);
        },
      });
      return activeController;
    },
    unmount() {
      activeController?.unmount();
      activeController = null;
    },
  });

  global.AuroraTenantAdminMicrofrontend = microfrontend;

  const standaloneHost = document.querySelector("[data-aurora-tenant-admin-autostart]");
  if (standaloneHost) {
    const parameters = new URLSearchParams(global.location.search);
    const profileId = parameters.get("profile") || global.AuroraTenantAdminManifest.defaultProfile;
    const requestedRoute = decodeURIComponent(global.location.hash.replace(/^#/, ""));
    global.AuroraTenantAdmin = microfrontend.mount(standaloneHost, {
      profileId,
      requestedRoute,
      productName: parameters.get("product") || undefined,
      mobileAppName: parameters.get("mobile") || undefined,
      protectedUserSessionEnabled: parameters.get("protectedSession") === "on",
      mailUserLifecycleHooksEnabled: parameters.get("mailHooks") === "on",
    });
  }
})(window);
