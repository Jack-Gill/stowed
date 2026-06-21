# Pull-on-reconnect over Supabase Realtime for cross-device sync

Cross-device sync is triggered by app open, reconnection to the network, and a manual refresh button — not by a persistent Supabase Realtime WebSocket subscription.

Supabase Realtime would push changes from other devices instantly, but a persistent WebSocket connection costs battery and is not justified for this use case: simultaneous active packing across two devices is not a real scenario this app needs to optimise for. The one or two second latency of a pull-on-open is imperceptible.
