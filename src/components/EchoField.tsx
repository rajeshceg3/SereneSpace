import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useEchoStore } from '../stores/useEchoStore';

const tempObject = new THREE.Object3D();

export const EchoField = () => {
  const echoes = useEchoStore((state) => state.echoes);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    // Update instance matrices
    echoes.forEach((echo, i) => {
      tempObject.position.set(...echo.position);
      // Give them a slight random rotation based on ID hash or timestamp
      tempObject.rotation.y = echo.timestamp * 0.001;
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.count = echoes.length;
    meshRef.current.instanceMatrix.needsUpdate = true;

  }, [echoes]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, 100]} // Max 100 echoes matches store limit
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial
        color="#00FFFF"
        wireframe
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};
