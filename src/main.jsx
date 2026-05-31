// Polyfill Node globals for Cardano/Mesh transitive deps before anything else loads.
import { Buffer } from 'buffer';
if (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = Buffer;
if (typeof globalThis.global === 'undefined') globalThis.global = globalThis;
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    version: 'v18.0.0',
    browser: true,
    platform: 'browser',
    nextTick: (fn, ...args) => Promise.resolve().then(() => fn(...args)),
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
