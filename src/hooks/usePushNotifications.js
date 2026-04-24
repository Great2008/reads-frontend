import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      setPermission(Notification.permission);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then(setSubscription);
      });
    }
  }, []);

  const subscribe = async () => {
    if (!supported || !VAPID_PUBLIC_KEY) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      setSubscription(sub);
      setPermission(Notification.permission);
      // Send subscription to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(sub.toJSON()),
      });
      return sub;
    } catch (e) {
      console.error('Push subscribe error:', e);
      return null;
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;
    await subscription.unsubscribe();
    setSubscription(null);
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
  };

  return { supported, permission, subscription, subscribe, unsubscribe };
}
