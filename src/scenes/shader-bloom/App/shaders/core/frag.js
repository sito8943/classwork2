export default `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uTime;
  uniform float uGlow;
  uniform float uScroll;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vWave;
  varying float vPulse;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), 2.2);

    float bandA = sin(vWorldPosition.y * 3.5 + uTime * 1.7 + uScroll * 0.06);
    float bandB = cos(vWorldPosition.x * 4.2 - uTime * 1.4 - uScroll * 0.08);
    float blend = (bandA * 0.5 + bandB * 0.5) * 0.5 + 0.5;

    vec3 layerA = mix(uColorA, uColorB, blend);
    vec3 layerB = mix(uColorB, uColorC, smoothstep(-0.8, 0.9, vWave));
    vec3 color = mix(layerA, layerB, fresnel * 0.65 + vPulse * 0.35);

    color *= 0.76 + (fresnel * uGlow * 1.6);
    color += vPulse * 0.12;

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
