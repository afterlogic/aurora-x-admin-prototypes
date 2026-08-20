(function (global) {
  "use strict";

  function materialize(value, enabledFeatures) {
    if (Array.isArray(value)) {
      return value.map((item) => materialize(item, enabledFeatures)).filter((item) => item !== undefined);
    }
    if (!value || typeof value !== "object") return value;
    if (value.featureKey && !enabledFeatures.has(value.featureKey)) return undefined;

    const overrides = value.featureOverrides || {};
    const merged = { ...value };
    for (const featureKey of enabledFeatures) {
      if (overrides[featureKey]) Object.assign(merged, overrides[featureKey]);
    }
    delete merged.featureKey;
    delete merged.featureOverrides;

    return Object.fromEntries(
      Object.entries(merged)
        .map(([key, item]) => [key, materialize(item, enabledFeatures)])
        .filter(([, item]) => item !== undefined)
    );
  }

  function materializeConfig(config, enabledFeatureKeys = []) {
    return materialize(config, new Set(enabledFeatureKeys));
  }

  global.AuroraAdminCapabilities = Object.freeze({ materializeConfig });
})(window);
