# @mobigent/core

Shared protocol types for Mobigent.

Use this package when you need the canonical capability manifest, action, resource, event, policy, and bridge message types.

```ts
import type { ActionDefinition, CapabilityManifest } from "@mobigent/core";
```

The bridge protocol has a separate `protocolVersion` field on `hello` and manifests. SDK package versions can move independently, while the gateway can still negotiate wire compatibility.

Use `validateCapabilityManifest(manifest)` when accepting manifests from custom SDKs or test harnesses. The gateway uses the same validator before it accepts app capabilities, including duplicate tool-name checks across actions, resources, and components.
