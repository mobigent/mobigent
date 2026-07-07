import type { CapabilityManifest } from '@mobigent/core';

export type MobigentAppleAppIntentPlan = {
  kind: 'mobigent.apple-app-intents.plan';
  appId: string;
  appName: string;
  sdk: CapabilityManifest['sdk'];
  intents: Array<{
    name: string;
    title: string;
    description: string;
    risk: 'low' | 'medium' | 'high';
    requiresConfirmation: boolean;
    swiftTypeName: string;
  }>;
};

export type MobigentAndroidAppActionsPlan = {
  kind: 'mobigent.android-app-actions.plan';
  appId: string;
  appName: string;
  sdk: CapabilityManifest['sdk'];
  actions: Array<{
    name: string;
    capability: string;
    description: string;
    risk: 'low' | 'medium' | 'high';
    requiresConfirmation: boolean;
    deepLink: string;
  }>;
};

export function createAppleAppIntentsPlan(
  manifest: CapabilityManifest,
): MobigentAppleAppIntentPlan {
  return {
    kind: 'mobigent.apple-app-intents.plan',
    appId: manifest.appId,
    appName: manifest.appName,
    sdk: manifest.sdk,
    intents: manifest.actions.map((action) => ({
      name: action.name,
      title: action.description,
      description: action.description,
      risk: action.confirmation?.risk ?? 'low',
      requiresConfirmation: Boolean(action.confirmation?.required),
      swiftTypeName: `${toPascalCase(action.name)}Intent`,
    })),
  };
}

export function createAndroidAppActionsPlan(
  manifest: CapabilityManifest,
): MobigentAndroidAppActionsPlan {
  return {
    kind: 'mobigent.android-app-actions.plan',
    appId: manifest.appId,
    appName: manifest.appName,
    sdk: manifest.sdk,
    actions: manifest.actions.map((action) => ({
      name: action.name,
      capability: `actions.intent.${toConstantCase(action.name)}`,
      description: action.description,
      risk: action.confirmation?.risk ?? 'low',
      requiresConfirmation: Boolean(action.confirmation?.required),
      deepLink: `mobigent://${manifest.appId}/actions/${encodeURIComponent(action.name)}`,
    })),
  };
}

export function renderAppleAppIntentsSwift(plan: MobigentAppleAppIntentPlan): string {
  const intents = plan.intents
    .map(
      (intent) => `struct ${intent.swiftTypeName}: AppIntent {
  static var title: LocalizedStringResource = "${escapeSwift(intent.title)}"
  static var description = IntentDescription("${escapeSwift(intent.description)}")

  func perform() async throws -> some IntentResult {
    // Forward this call to MobigentClient or your React Native Mobigent module.
    return .result()
  }
}`,
    )
    .join('\n\n');

  return `import AppIntents

// Generated Mobigent App Intents plan for ${escapeSwift(plan.appName)}.
${intents}
`;
}

export function renderAndroidAppActionsXml(plan: MobigentAndroidAppActionsPlan): string {
  const shortcuts = plan.actions
    .map(
      (action) => `  <capability android:name="${escapeXml(action.capability)}">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="${escapeXml(plan.appId)}"
      android:targetClass="${escapeXml(plan.appId)}.MainActivity">
      <url-template android:value="${escapeXml(action.deepLink)}" />
    </intent>
  </capability>`,
    )
    .join('\n');

  return `<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
${shortcuts}
</shortcuts>
`;
}

const toPascalCase = (value: string) =>
  value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');

const toConstantCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .join('_')
    .toUpperCase();

const escapeSwift = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
