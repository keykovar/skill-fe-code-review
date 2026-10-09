# Hybrid WebView Review Reference

Load this file for hybrid apps, JSBridge changes, native app contracts, app info, WebView lifecycle, mobile compatibility, storage/cookie behavior, keyboard/safe-area behavior, or audio/video restrictions.

## Review Focus

- Verify bridge method names, callback names, payload shape, and error semantics against existing native contracts.
- Distinguish web fallback behavior from native-only behavior.
- Check app version, platform, and capability gating.
- Review callback lifecycle: registration, duplicate registration, cleanup, late callbacks, and page unmount.
- Check foreground/background, route return, app hide/show, and WebView reload behavior.
- Review iOS WKWebView and Android WebView compatibility.
- Check safe-area, viewport, keyboard, input focus, scroll lock, and fixed positioning.
- Verify storage, cookies, localStorage, IndexedDB, and session persistence assumptions.
- Review autoplay, audio, video, camera, microphone, and permission restrictions.
- Check analytics/logging does not leak sensitive payloads.

## Common Findings

- Web code assumes a bridge API exists in every environment.
- Callback remains registered after route or component unmount.
- Native payload is treated as a stable shape without version gating.
- Browser fallback diverges from app behavior.
- iOS keyboard or safe-area behavior breaks fixed UI.

## Evidence To Collect

- Bridge API definition and call sites.
- Native payload examples or existing DTOs.
- Platform/app version gating.
- Page lifecycle and route lifecycle.
- Error reporting and fallback behavior.
