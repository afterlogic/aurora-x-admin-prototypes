(function (global) {
  "use strict";

  const host = document.getElementById("aurora-admin-app");
  if (!host || !global.AuroraAdminRuntime || !global.AuroraProviderConsoleManifest || !global.AuroraAdminDemoState) {
    throw new Error("Aurora Provider Console bootstrap dependencies are missing");
  }
  const selfHostedEntry = host.dataset.auroraProviderMode === "self-hosted";
  const defaultContextId = selfHostedEntry ? "installation:local" : "provider:contoso";

  let activeProviderOptions = null;

  function mountProvider(options = {}) {
    global.AuroraProviderConsole?.unmount();
    const accessProfile = options.accessProfile || "superadmin";
    const directoryServicesEnabled = Boolean(options.directoryServicesEnabled);
    const directoryServicesRetained = Boolean(options.directoryServicesRetained);
    const multiOrganizationEnabled = options.multiOrganizationEnabled !== false;
    const protectedUserSessionEnabled = Boolean(options.protectedUserSessionEnabled);
    const mailUserLifecycleHooksEnabled = Boolean(options.mailUserLifecycleHooksEnabled);
    const contextId = options.contextId || "provider:contoso";
    const systemIdentity = options.systemIdentity || {
      productName: "Aurora",
      mobileAppName: "Aurora Mobile",
      providerName: "Contoso Cloud Services",
      supportUrl: "https://help.contoso.example",
      defaultLogo: "contoso-logo.svg",
      primaryColor: "#315FCA",
      defaultBrandName: "Пространство Contoso",
      mailDomain: "mail.contoso.example",
      accessHostnamePattern: "{организация}.contoso-mail.example",
    };
    const config = global.AuroraProviderConsoleManifest.createEffectiveConfig({
      accessProfile,
      directoryServicesEnabled,
      directoryServicesRetained,
      multiOrganizationEnabled,
      protectedUserSessionEnabled,
      mailUserLifecycleHooksEnabled,
      contextId,
      ...systemIdentity,
    });
    activeProviderOptions = {
      accessProfile,
      directoryServicesEnabled,
      directoryServicesRetained,
      multiOrganizationEnabled,
      protectedUserSessionEnabled,
      mailUserLifecycleHooksEnabled,
      contextId,
      systemIdentity,
      showServiceMessages: options.showServiceMessages,
    };
    const requestedRoute = options.previousConfig
      ? global.AuroraProviderConsoleManifest.preservedRouteForContextChange(options.previousConfig, config, options.requestedRoute)
      : options.requestedRoute;
    if (options.previousConfig) {
      const normalizedUrl = new URL(global.location.href);
      normalizedUrl.hash = requestedRoute || config.startRoute;
      global.history.replaceState(null, "", normalizedUrl);
    }
    global.AuroraProviderConsole = global.AuroraAdminRuntime.mount({
      root: host,
      config,
      requestedRoute,
      showServiceMessages: options.showServiceMessages,
      directoryServicesEnabled,
      onScopeChange(nextContextId) {
        const currentState = global.AuroraProviderConsole?.getState() || {};
        const nextUrl = new URL(global.location.href);
        nextUrl.searchParams.set("context", nextContextId);
        global.history.pushState({ ...(global.history.state || {}), contextId: nextContextId }, "", nextUrl);
        mountProvider({
          accessProfile,
          contextId: nextContextId,
          directoryServicesEnabled,
          directoryServicesRetained,
          multiOrganizationEnabled,
          protectedUserSessionEnabled,
          mailUserLifecycleHooksEnabled,
          systemIdentity,
          previousConfig: config,
          requestedRoute: currentState.routeId,
          showServiceMessages: currentState.showServiceMessages,
        });
      },
      onSystemIdentityChange(nextIdentity) {
        mountProvider({
          accessProfile,
          contextId,
          directoryServicesEnabled,
          directoryServicesRetained,
          multiOrganizationEnabled,
          protectedUserSessionEnabled,
          mailUserLifecycleHooksEnabled,
          systemIdentity: nextIdentity,
          requestedRoute: "PROV-SYSTEM-001",
          showServiceMessages: global.AuroraProviderConsole?.getState()?.showServiceMessages,
        });
      },
      onDirectoryServicesToggle(nextEnabled, source) {
        const currentState = global.AuroraProviderConsole?.getState() || {};
        mountProvider({
          accessProfile,
          directoryServicesEnabled: nextEnabled,
          directoryServicesRetained: source === "provider-action"
            ? directoryServicesRetained || directoryServicesEnabled || nextEnabled
            : nextEnabled,
          requestedRoute: currentState.routeId,
          showServiceMessages: currentState.showServiceMessages,
          multiOrganizationEnabled,
          protectedUserSessionEnabled,
          mailUserLifecycleHooksEnabled,
          contextId,
          systemIdentity,
        });
      },
      onProviderIntegrationAvailabilityChange(roleId, nextAllowed) {
        global.AuroraAdminDemoState.setGlobalAvailability(roleId, nextAllowed);
      },
      onOrganizationIntegrationAvailabilityChange(roleId, nextAllowed) {
        global.AuroraAdminDemoState.setOrganizationProviderAllowed(contextId, roleId, nextAllowed);
      },
    });
    return global.AuroraProviderConsole;
  }

  const requestedRoute = decodeURIComponent(global.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(global.location.search);
  const requestedAccessProfile = query.get("access") || "superadmin";
  const contextId = query.get("context") || defaultContextId;
  const multiOrganizationEnabled = selfHostedEntry ? false : query.get("multi") !== "off";
  mountProvider({ requestedRoute, contextId, accessProfile: requestedAccessProfile, multiOrganizationEnabled, protectedUserSessionEnabled: query.get("protectedSession") === "on", mailUserLifecycleHooksEnabled: query.get("mailHooks") === "on" });

  global.addEventListener("popstate", () => {
    const nextQuery = new URLSearchParams(global.location.search);
    const nextContextId = nextQuery.get("context") || defaultContextId;
    if (!activeProviderOptions || nextContextId === activeProviderOptions.contextId) return;
    mountProvider({
      ...activeProviderOptions,
      contextId: nextContextId,
      requestedRoute: decodeURIComponent(global.location.hash.replace(/^#/, "")),
      previousConfig: null,
    });
  });
})(window);
