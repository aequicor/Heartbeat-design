# Aurora — Opalescent Material 3 Design System

**Product:** Heartbeat 2.0 / AI Studio  
**Targets:** Compose Multiplatform (Android + JVM Desktop); visual tokens are platform-agnostic  
**Concept:** A quiet pastel workspace with a visually distinctive, living chat surface.

## Direction

Aurora combines **Opalescent / Iridescent** lighting with a predominantly calm, opaque material language. The workspace must never become a full-screen animated gradient. The user's attention belongs to the content and the chat composer. Use lavender, Granny Smith apple green, blush, icy blue, and pearl white. Glow is contextual and concentrated around the central chat frame, the composer, and generation feedback.

## Colors

| Token | Hex | Usage |
|---|---|---|
| `aurora.pearl` | `#FEFDFC` | Chat surface |
| `aurora.canvas` | `#F8F8F5` | Workspace background |
| `aurora.lavender` | `#E8DFF7` | Primary luminous accent |
| `aurora.grannyApple` | `#D8E9BD` | Soft green accent / selected states |
| `aurora.blush` | `#F8E2EA` | Secondary sheen |
| `aurora.iceBlue` | `#DCECF2` | Spectral cool highlight |
| `aurora.ink` | `#302E39` | Main content text |
| `aurora.mutedText` | `#5A5663` | Secondary text |
| `aurora.primary` | `#66557E` | High-contrast CTA / focus state |
| `aurora.secondary` | `#4D6B48` | Functional green / active indicator |
| `aurora.outlineVariant` | `#E6E1E9` | Dividers |

### Material 3 mapping

| Role | Value |
|---|---|
| `primary` / `onPrimary` | `#66557E` / `#FFFFFF` |
| `primaryContainer` | `#E8DFF7` |
| `secondary` / `onSecondary` | `#4D6B48` / `#FFFFFF` |
| `secondaryContainer` | `#D8E9BD` |
| `tertiary` / `tertiaryContainer` | `#8F5A76` / `#F8E2EA` |
| `background` / `surface` | `#F8F8F5` / `#FEFDFC` |
| `onSurface` / `onSurfaceVariant` | `#302E39` / `#5A5663` |
| `outlineVariant` | `#E6E1E9` |

Keep the Aurora brand theme deterministic by default; disable platform Dynamic Color unless the user explicitly selects system wallpaper coloring.

## Surfaces and components

| Element | Design contract |
|---|---|
| Workspace | Opaque warm-white surface; static pastel hues; no continuous animation |
| Sidebar | Low-contrast, clear navigation; selected item gets lavender-to-apple tint |
| Chat frame | 28–32 dp rounded edge; 1.5–2 dp opalescent gradient border; subtle corner glow |
| Chat interior | 95–100% opaque pearl; content-first; transparent ambient color only near corners |
| Composer | 24–26 dp corners; opalescent contour; strong focus response; no flashing or flicker |
| Assistant marker | Small iridescent pearl/orb; not a large avatar or floating blob |
| User message | Pale green fill, high legibility, no animated background |
| Send action | Deep lavender solid button for predictable affordance and text/icon contrast |
| Model selector | Low-emphasis surface chip; meaningful model identity, not decoration |
| Thinking | Small breathing orb and local shimmer; reduce motion supported |
| Error | High-contrast semantic/error color and text; do not encode failure only in hue |

## Motion states

| State | Timing | Behavior |
|---|---:|---|
| Idle | Static / optional very slow CSS preview | No continuous expensive Compose animation |
| Hover | 140–190 ms | Small surface highlight and elevation shift |
| Focus on composer | 240–320 ms | Border becomes sharper and slightly brighter |
| Send | 180–240 ms | Gentle button press, content enters without large displacement |
| Generating | 4.5–6 s / cycle | Shimmer on chat border + orb breathing; no full-window animation |
| Completion | 300–450 ms | Glow returns to idle |
| Reduced motion | 0 ms for non-essential movement | Replace shimmer by a static highlight + textual progress |

Motion should reflect agent state. If `EngineState` or session state indicates thinking, derive `isActive` in presentation; the component itself must not own business logic. Animations belong in Compose UI and should be active only while needed. Keep static typography and list contents out of per-frame recomposition.

## Spacing and shape

- Base spacing: 4 dp increments; typical gaps 8 / 12 / 16 / 24 / 32 dp.
- Main outer chat radius: 30–32 dp on desktop.
- Composer radius: 24–26 dp.
- Container padding: 24–32 dp desktop and 16–20 dp compact width.
- Limit readable chat content to ~640–760 dp, but allow composer to fill the chat column.
- On narrow windows, collapse the sidebar into an accessible navigation drawer.

## KMP integration

- `designsystem/foundation`: Aurora palette, Material 3 `ColorScheme`, shapes and theme adapter.
- `designsystem/components`: `AuroraChatFrame`, `AuroraComposer`, `AuroraThinkingIndicator` and message surfaces.
- `features/aistudio`: screen composition and connection to `AiEngine`/session UI states, without colors or animations in domain logic.
- For non-Compose native targets, reuse visual tokens and motion contracts; Kotlin Compose implementations cannot be used as native UI directly.
- Integrate SVG/vector icons from your established icon library (e.g. Tabler) rather than embedding icon path source in business components.

## Acceptance criteria

The visual hierarchy must still be clear with all animations disabled. Primary text and actionable controls need adequate contrast. No user-facing text should sit over a moving multicolor gradient. Ambient light must not appear to be a permanent loading state. Test animations and resize behavior on Android and desktop separately; avoid heavy fullscreen blur and shader effects in a chat with a long lazy list.

## Deliverables

- `AuroraPreview.html` — browser preview with a local, simulated input and live-effect toggle; no AI backend.
- `AuroraChat.kt` — Compose Multiplatform + Material 3 theme, opalescent frame, composer, and a small sample screen. No package statement or project-specific imports; integrate into `commonMain` and wire to real state.
