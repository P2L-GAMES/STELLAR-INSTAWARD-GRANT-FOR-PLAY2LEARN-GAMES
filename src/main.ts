import '@/style.css';
import { createApp } from '@/app';

const canvas = document.getElementById('scene');

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Missing #scene canvas');
}

const app = createApp(canvas);
app.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => app.dispose());
}

window.addEventListener('beforeunload', () => app.dispose());

export type { App } from '@/app';