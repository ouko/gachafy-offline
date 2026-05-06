// OneSignal Service Worker
// The SDK loader is self-hosted to reduce CDN exposure.
// NOTE: The loader may dynamically fetch additional OneSignal modules from
// cdn.onesignal.com. This is a known limitation — service-worker
// importScripts() does not support Subresource Integrity.
importScripts('/onesignal/OneSignalSDK.page.js');
