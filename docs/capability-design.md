# Capability Design Guide

Mobigent works best when app capabilities are small, typed, and intentionally safe. Treat the SDK as a product API for agents, not as a shortcut around your app's business logic.

## Design Principles

- Start read-only, then add one confirmed write.
- Prefer feature namespaces such as `expense.list` or `cart.checkout`.
- Keep actions boring and specific.
- Make descriptions literal. Agents use them to decide when to call a tool.
- Use tight JSON schemas. Avoid `object` without properties for production tools.
- Return stable, compact results. Do not dump whole screens or private records.
- Put sensitive or irreversible behavior behind confirmation.

## Actions

Actions change something or ask the app to perform work.

Good actions:

- `expense.create`
- `profile.update_display_name`
- `cart.apply_coupon`
- `message.draft_reply`

Risky actions that should require confirmation:

- payments, orders, bookings, transfers
- deleting records
- sending messages
- changing account settings
- exposing private files or personal data

Avoid actions such as:

- `do_anything`
- `tap_button`
- `run_command`
- `update_state`

Those are too broad for safe agent use.

## Resources

Resources are read-only app state.

Good resources:

- `expense.list`
- `cart.current`
- `workspace.active`
- `profile.public_summary`

Resources should not mutate state, trigger network writes, or start flows. If reading data has side effects, make it an action and describe the risk.

## Components And Surfaces

Components describe important UI surfaces the agent can reason about or focus.

Use components for:

- opening a detail screen
- focusing a record
- moving the app to a safe context before an action
- exposing screen-owned tools only while the screen is mounted

Do not use components as a generic remote-control layer.

## Events

Events tell the agent or gateway that something happened in the app.

Good events:

- `expense.created`
- `sync.failed`
- `user.selected_record`
- `checkout.completed`

Keep event payloads small and redact sensitive values before emitting.

## Schema Checklist

Before shipping a capability:

- every required field is listed
- every string has a clear meaning
- numbers include units in the description when needed
- enums are used for constrained values
- output schemas are defined for data the agent will rely on
- error states are expected and documented in the handler

## Naming Checklist

Use:

- lowercase feature namespaces
- action verbs for writes
- nouns for resources
- stable names that will survive UI redesigns

Avoid:

- screen coordinates
- button labels
- temporary implementation details
- provider-specific names like `chatgpt_create`

Mobigent tools should describe app capability, not the current agent.
