import './style.css';

const SCENES = [
  {
    href: '/shader-bloom/',
    title: 'Shader Bloom',
    subtitle: 'Escena con ShaderMaterial + interacción',
    controls: 'Drag, scroll y flechas',
  },
];

const cards = SCENES.map(
  (scene) => `
    <a class="scene-card" href="${scene.href}">
      <span class="scene-title">${scene.title}</span>
      <span class="scene-subtitle">${scene.subtitle}</span>
      <span class="scene-controls">${scene.controls}</span>
    </a>
  `,
).join('');

document.querySelector('#app').innerHTML = `
  <main class="hub">
    <h1>Classwork 2</h1>
    <p>Enlaces a escenas WebGL construidas sobre la base de <code>example-app</code>.</p>
    <section class="scene-grid">${cards}</section>
  </main>
`;
