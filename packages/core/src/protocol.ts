export type JsonObject = Record<string, unknown>;

export type JsonSchema = {
  type: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  description?: string;
  enum?: string[];
};

export type ConfirmationPolicy = {
  required: boolean;
  title?: string;
  message?: string;
  risk?: 'low' | 'medium' | 'high';
};

export type CapabilityPolicy = {
  readOnly?: boolean;
  foregroundOnly?: boolean;
  requiresUser?: boolean;
  allowedAgents?: string[];
  rateLimitPerMinute?: number;
  sensitiveData?: string[];
};

export type ActionDefinition = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
  confirmation?: ConfirmationPolicy;
  policy?: CapabilityPolicy;
};

export type ResourceDefinition = {
  name: string;
  description: string;
  outputSchema?: JsonSchema;
  policy?: CapabilityPolicy;
};

export type ComponentDefinition = {
  name: string;
  description: string;
  propsSchema?: JsonSchema;
  policy?: CapabilityPolicy;
};

export type CapabilityManifest = {
  appId: string;
  appName: string;
  sdk: 'ios' | 'android' | 'react-native';
  version: string;
  protocolVersion?: number;
  actions: ActionDefinition[];
  resources: ResourceDefinition[];
  components: ComponentDefinition[];
};

export type ManifestSignature = {
  alg: 'hmac-sha256';
  keyId?: string;
  signature: string;
};

export type BridgeMessage =
  | {
      type: 'hello';
      appId: string;
      appName: string;
      sdk: CapabilityManifest['sdk'];
      version: string;
      protocolVersion?: number;
      authToken?: string;
    }
  | {
      type: 'ready';
      protocolVersion: number;
      supportedProtocolVersions: number[];
    }
  | {
      type: 'manifest';
      manifest: CapabilityManifest;
      signature?: ManifestSignature;
    }
  | {
      type: 'call_action';
      id: string;
      name: string;
      input: JsonObject;
    }
  | {
      type: 'read_resource';
      id: string;
      name: string;
    }
  | {
      type: 'focus_component';
      id: string;
      name: string;
      props: JsonObject;
    }
  | {
      type: 'action_result';
      id: string;
      ok: true;
      result: unknown;
    }
  | {
      type: 'resource_result';
      id: string;
      ok: true;
      result: unknown;
    }
  | {
      type: 'component_result';
      id: string;
      ok: true;
      result: unknown;
    }
  | {
      type: 'action_result' | 'resource_result' | 'component_result';
      id: string;
      ok: false;
      error: string;
    }
  | {
      type: 'event';
      name: string;
      payload: JsonObject;
      at: string;
    }
  | {
      type: 'ping';
      id: string;
      at: string;
    }
  | {
      type: 'pong';
      id: string;
      at: string;
    };

export type ToolDescriptor = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
  readOnly: boolean;
  risk: 'low' | 'medium' | 'high';
  app: {
    id: string;
    name: string;
  };
};

export type ToolCallResult = {
  tool: string;
  result: unknown;
};

export function toolName(appId: string, capabilityName: string) {
  return `${sanitize(appId)}.${capabilityName}`;
}

export function sanitize(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

export function validateCapabilityManifest(manifest: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(manifest)) {
    return { ok: false, errors: ['manifest must be an object'] };
  }

  requireString(manifest, 'appId', '$.appId', errors);
  requireString(manifest, 'appName', '$.appName', errors);
  if (manifest.sdk !== 'ios' && manifest.sdk !== 'android' && manifest.sdk !== 'react-native') {
    errors.push('$.sdk must be ios, android, or react-native');
  }
  requireString(manifest, 'version', '$.version', errors);
  const protocolVersion = manifest.protocolVersion;
  if (
    protocolVersion !== undefined &&
    (!Number.isInteger(protocolVersion) || Number(protocolVersion) < 1)
  ) {
    errors.push('$.protocolVersion must be a positive integer');
  }

  validateCapabilityArray(manifest.actions, '$.actions', errors, validateActionDefinition);
  validateCapabilityArray(manifest.resources, '$.resources', errors, validateResourceDefinition);
  validateCapabilityArray(manifest.components, '$.components', errors, validateComponentDefinition);
  validateUniqueManifestToolNames(manifest, errors);

  return errors.length ? { ok: false, errors } : { ok: true };
}

function validateUniqueManifestToolNames(manifest: Record<string, unknown>, errors: string[]) {
  if (typeof manifest.appId !== 'string') {
    return;
  }

  const seen = new Map<string, string>();
  const candidates: Array<{ name: string; path: string }> = [];

  if (Array.isArray(manifest.actions)) {
    manifest.actions.forEach((action, index) => {
      if (isRecord(action) && typeof action.name === 'string') {
        candidates.push({ name: action.name, path: `$.actions[${index}].name` });
      }
    });
  }
  if (Array.isArray(manifest.resources)) {
    manifest.resources.forEach((resource, index) => {
      if (isRecord(resource) && typeof resource.name === 'string') {
        candidates.push({ name: `get_${resource.name}`, path: `$.resources[${index}].name` });
      }
    });
  }
  if (Array.isArray(manifest.components)) {
    manifest.components.forEach((component, index) => {
      if (isRecord(component) && typeof component.name === 'string') {
        candidates.push({ name: `show_${component.name}`, path: `$.components[${index}].name` });
      }
    });
  }

  for (const candidate of candidates) {
    const fullToolName = toolName(manifest.appId, candidate.name);
    const previousPath = seen.get(fullToolName);
    if (previousPath) {
      errors.push(
        `${candidate.path} exposes duplicate tool name ${fullToolName}; first declared at ${previousPath}`,
      );
      continue;
    }
    seen.set(fullToolName, candidate.path);
  }
}

function validateCapabilityArray<T>(
  value: unknown,
  path: string,
  errors: string[],
  validateItem: (item: Record<string, unknown>, path: string, errors: string[]) => T,
) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`${path}[${index}] must be an object`);
      return;
    }
    validateItem(item, `${path}[${index}]`, errors);
  });
}

function validateActionDefinition(action: Record<string, unknown>, path: string, errors: string[]) {
  requireString(action, 'name', `${path}.name`, errors);
  requireString(action, 'description', `${path}.description`, errors);
  validateJsonSchemaShape(action.inputSchema, `${path}.inputSchema`, errors);
  if (action.outputSchema !== undefined) {
    validateJsonSchemaShape(action.outputSchema, `${path}.outputSchema`, errors);
  }
  if (action.confirmation !== undefined) {
    validateConfirmationPolicy(action.confirmation, `${path}.confirmation`, errors);
  }
  if (action.policy !== undefined) {
    validateCapabilityPolicy(action.policy, `${path}.policy`, errors);
  }
}

function validateResourceDefinition(
  resource: Record<string, unknown>,
  path: string,
  errors: string[],
) {
  requireString(resource, 'name', `${path}.name`, errors);
  requireString(resource, 'description', `${path}.description`, errors);
  if (resource.outputSchema !== undefined) {
    validateJsonSchemaShape(resource.outputSchema, `${path}.outputSchema`, errors);
  }
  if (resource.policy !== undefined) {
    validateCapabilityPolicy(resource.policy, `${path}.policy`, errors);
  }
}

function validateComponentDefinition(
  component: Record<string, unknown>,
  path: string,
  errors: string[],
) {
  requireString(component, 'name', `${path}.name`, errors);
  requireString(component, 'description', `${path}.description`, errors);
  if (component.propsSchema !== undefined) {
    validateJsonSchemaShape(component.propsSchema, `${path}.propsSchema`, errors);
  }
  if (component.policy !== undefined) {
    validateCapabilityPolicy(component.policy, `${path}.policy`, errors);
  }
}

function validateJsonSchemaShape(schema: unknown, path: string, errors: string[]) {
  if (!isRecord(schema)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (typeof schema.type !== 'string' && !isStringArray(schema.type)) {
    errors.push(`${path}.type must be a string or array of strings`);
  }
  if (schema.properties !== undefined && !isRecord(schema.properties)) {
    errors.push(`${path}.properties must be an object`);
  }
  if (schema.required !== undefined && !isStringArray(schema.required)) {
    errors.push(`${path}.required must be an array of strings`);
  }
  if (schema.enum !== undefined && !isStringArray(schema.enum)) {
    errors.push(`${path}.enum must be an array of strings`);
  }
}

function validateConfirmationPolicy(policy: unknown, path: string, errors: string[]) {
  if (!isRecord(policy)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof policy.required !== 'boolean') {
    errors.push(`${path}.required must be a boolean`);
  }
  if (
    policy.risk !== undefined &&
    policy.risk !== 'low' &&
    policy.risk !== 'medium' &&
    policy.risk !== 'high'
  ) {
    errors.push(`${path}.risk must be low, medium, or high`);
  }
}

function validateCapabilityPolicy(policy: unknown, path: string, errors: string[]) {
  if (!isRecord(policy)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const key of ['readOnly', 'foregroundOnly', 'requiresUser'] as const) {
    if (policy[key] !== undefined && typeof policy[key] !== 'boolean') {
      errors.push(`${path}.${key} must be a boolean`);
    }
  }
  if (policy.allowedAgents !== undefined && !isStringArray(policy.allowedAgents)) {
    errors.push(`${path}.allowedAgents must be an array of strings`);
  }
  const rateLimitPerMinute = policy.rateLimitPerMinute;
  if (
    rateLimitPerMinute !== undefined &&
    (!Number.isInteger(rateLimitPerMinute) || Number(rateLimitPerMinute) < 1)
  ) {
    errors.push(`${path}.rateLimitPerMinute must be a positive integer`);
  }
  if (policy.sensitiveData !== undefined && !isStringArray(policy.sensitiveData)) {
    errors.push(`${path}.sensitiveData must be an array of strings`);
  }
}

function requireString(
  value: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
) {
  if (typeof value[key] !== 'string' || !value[key]) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJson(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as JsonObject)
        .filter(([, childValue]) => childValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, childValue]) => [key, sortJson(childValue)]),
    );
  }

  return value;
}

export type ValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      errors: string[];
    };

export function validateJsonSchema(
  schema: JsonSchema,
  value: unknown,
  path = '$',
): ValidationResult {
  const errors: string[] = [];
  validate(schema, value, path, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}

function validate(schema: JsonSchema, value: unknown, path: string, errors: string[]) {
  if (schema.enum && !schema.enum.includes(String(value))) {
    errors.push(`${path} must be one of: ${schema.enum.join(', ')}`);
    return;
  }

  if (!matchesSchemaType(schema.type, value)) {
    errors.push(`${path} must be ${formatSchemaType(schema.type)}`);
    return;
  }

  if (schemaTypeIncludes(schema.type, 'object') && matchesType('object', value)) {
    validateObject(schema, value as JsonObject, path, errors);
    return;
  }

  if (schemaTypeIncludes(schema.type, 'array') && schema.items && Array.isArray(value)) {
    value.forEach((item, index) =>
      validate(schema.items as JsonSchema, item, `${path}[${index}]`, errors),
    );
  }
}

function validateObject(schema: JsonSchema, value: JsonObject, path: string, errors: string[]) {
  for (const requiredKey of schema.required ?? []) {
    if (!(requiredKey in value)) {
      errors.push(`${path}.${requiredKey} is required`);
    }
  }

  for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
    if (key in value && value[key] !== undefined) {
      validate(childSchema, value[key], `${path}.${key}`, errors);
    }
  }
}

function matchesSchemaType(type: string | string[], value: unknown) {
  return Array.isArray(type)
    ? type.some((candidate) => matchesType(candidate, value))
    : matchesType(type, value);
}

function schemaTypeIncludes(type: string | string[], candidate: string) {
  return Array.isArray(type) ? type.includes(candidate) : type === candidate;
}

function formatSchemaType(type: string | string[]) {
  return Array.isArray(type) ? type.join(' or ') : type;
}

function matchesType(type: string, value: unknown) {
  switch (type) {
    case 'object':
      return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      return true;
  }
}
