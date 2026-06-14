# Privacy Policy — AIRadar

**Effective date:** 2026
**Maintainer:** Vijaya Kumar L (Rise With VJ) · risewithvj@gmail.com
**Project:** https://github.com/risewithvj/AIRadar

## The short version

**AIRadar does not collect, transmit, sell, or share any of your data — ever.**
There are no accounts, no analytics, no telemetry, no trackers, no ads, and no servers operated by us. Everything happens locally inside your browser.

## What data exists, and where it lives

AIRadar keeps a small amount of **usage state** so it can show your meters and timers:

- Session / weekly usage percentages
- Estimated token counts and burn rate
- Reset timestamps
- Your HUD position and any token budget you set

All of this is stored **only** in your browser's local extension storage (`storage.local`) on your own device. It is never uploaded anywhere. Clearing the extension's data (the **Clear data** button) or uninstalling removes it.

## Network activity

AIRadar makes **no requests to any third-party server** and has **no backend of its own**.

The single exception is a **first-party** call: on Claude, AIRadar reads Claude's own usage signal from Claude's own API using **your existing logged-in session**, purely to display **your own** usage back to you. That response is rendered locally and is **not** stored off-device or sent anywhere else. On other platforms, AIRadar estimates tokens by reading the assistant's reply **locally in the page** — nothing is sent out.

## Permissions, explained

| Permission | Why it's needed |
|---|---|
| `storage` | Save your meters, timers, HUD position and budget locally. |
| `alarms` | Schedule a lightweight check when a usage window resets. |
| Host access to the listed AI sites | Inject the on-page HUD and read usage signals **only** on those AI chat pages. |

AIRadar requests **no** broad permissions (no "all sites", no `tabs` snooping beyond the active AI tab, no `webRequest`, no remote code).

## What we never do

- ❌ Collect personal information
- ❌ Read or store your prompts or the AI's answers
- ❌ Send anything to analytics or advertising networks
- ❌ Use cookies for tracking
- ❌ Run remote/hosted code

## Children

AIRadar is a developer utility and is not directed at children under 13.

## Changes

Any future change to this policy will be committed to this repository with an updated effective date.

## Contact

Questions? **risewithvj@gmail.com** — or open an issue at https://github.com/risewithvj/AIRadar/issues
