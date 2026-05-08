export default `
  attribute float aRandom;

  uniform float uTime;
  uniform float uDistortion;
  uniform float uScroll;
  uniform vec2 uPointer;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vWave;
  varying float vPulse;

  void main() {
    vec3 np = position;

    float time = uTime * 1.2;
    float waveA = sin((np.y + uScroll * 0.18) * 7.0 + time * 2.0 + aRandom * 6.2831853);
    float waveB = cos((np.x - uScroll * 0.15) * 6.0 - time * 1.7 + aRandom * 5.1);
    float wave = mix(waveA, waveB, 0.5);

    float displacement = wave * 0.28 * uDistortion;
    np += normal * displacement;

    np.x += sin(np.y * 5.0 + time + aRandom * 4.0) * 0.05 * uDistortion;
    np.z += cos(np.x * 4.0 - time * 0.8 + aRandom * 3.0) * 0.04 * uDistortion;

    vec4 worldPosition = modelMatrix * vec4(np, 1.0);

    vec2 pointerOffset = worldPosition.xy - (uPointer * 2.6);
    float pointerDist = length(pointerOffset);
    float pulse = exp(-pointerDist * 1.9);

    worldPosition.xyz += normalize(worldPosition.xyz) * pulse * 0.22 * uDistortion;

    vec4 viewPosition = viewMatrix * worldPosition;

    gl_Position = projectionMatrix * viewPosition;

    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWave = wave;
    vPulse = pulse;
  }
`;
