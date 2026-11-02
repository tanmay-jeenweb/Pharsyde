import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.025);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Group for objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Abstract Botanical Crystal Sculpture
    const coreGeometry = new THREE.IcosahedronGeometry(1.6, 3);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.4,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.6,
      ior: 1.5,
      reflectivity: 0.8,
      wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    mainGroup.add(coreMesh);

    // Outer subtle wireframe halo with #8EF705
    const wireGeo = new THREE.IcosahedronGeometry(1.95, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x8ef705,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    mainGroup.add(wireMesh);

    // 2. Floating Botanical Seeds / Orbiting Facets
    const floatingElements = [];
    const shardGeo = new THREE.OctahedronGeometry(0.28, 0);
    const shardMatGreen = new THREE.MeshStandardMaterial({
      color: 0x8ef705,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x5fa803,
      emissiveIntensity: 0.35
    });
    const shardMatCoral = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0xc2410c,
      emissiveIntensity: 0.3
    });

    for (let i = 0; i < 16; i++) {
      const isCoral = i % 3 === 0;
      const mesh = new THREE.Mesh(shardGeo, isCoral ? shardMatCoral : shardMatGreen);
      
      const angle = (i / 16) * Math.PI * 2;
      const radius = 2.8 + Math.random() * 1.6;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 3,
        Math.sin(angle) * radius
      );
      mesh.scale.setScalar(0.4 + Math.random() * 0.6);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      floatingElements.push({
        mesh,
        speedX: (Math.random() - 0.5) * 0.008,
        speedY: (Math.random() - 0.5) * 0.008,
        rotSpeed: 0.01 + Math.random() * 0.02,
        initialY: mesh.position.y,
        timeOffset: Math.random() * 10
      });
      mainGroup.add(mesh);
    }

    // 3. Atmospheric Particle Cloud
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const greenColor = new THREE.Color(0x8ef705);
    const coralColor = new THREE.Color(0xea580c);
    const slateColor = new THREE.Color(0x94a3b8);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

      let c;
      const r = Math.random();
      if (r < 0.55) c = greenColor;
      else if (r < 0.8) c = coralColor;
      else c = slateColor;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.7
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 4. Studio & Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    // #8EF705 Accent Light
    const greenLight = new THREE.PointLight(0x8ef705, 50, 18);
    greenLight.position.set(4, 3, 4);
    scene.add(greenLight);

    // Coral Accent Light
    const coralLight = new THREE.PointLight(0xf97316, 35, 16);
    coralLight.position.set(-4, -2, 3);
    scene.add(coralLight);

    // Directional Studio Light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(0, 8, 5);
    scene.add(dirLight);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax interpolation
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      mainGroup.rotation.y = elapsedTime * 0.15 + targetX * 0.4;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.12) * 0.15 - targetY * 0.3;

      wireMesh.rotation.y = -elapsedTime * 0.08;
      wireMesh.rotation.z = Math.cos(elapsedTime * 0.1) * 0.1;

      // Pulse core slightly
      const pulse = 1 + Math.sin(elapsedTime * 1.5) * 0.03;
      coreMesh.scale.set(pulse, pulse, pulse);

      // Animate floating elements
      floatingElements.forEach((item) => {
        item.mesh.rotation.x += item.rotSpeed;
        item.mesh.rotation.y += item.rotSpeed;
        item.mesh.position.y = item.initialY + Math.sin(elapsedTime * 0.8 + item.timeOffset) * 0.35;
      });

      // Animate particle drift
      particleSystem.rotation.y = elapsedTime * 0.03;

      // Orbit Lights
      greenLight.position.x = Math.cos(elapsedTime * 0.6) * 5;
      greenLight.position.z = Math.sin(elapsedTime * 0.6) * 5 + 2;

      coralLight.position.x = Math.sin(elapsedTime * 0.5) * 5;
      coralLight.position.y = Math.cos(elapsedTime * 0.4) * 3;

      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      coreGeometry.dispose();
      coreMaterial.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      shardGeo.dispose();
      shardMatGreen.dispose();
      shardMatCoral.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-[#F8FAFC]/70" />
      <div className="absolute inset-0 bg-radial-green pointer-events-none opacity-40" />
    </div>
  );
}
