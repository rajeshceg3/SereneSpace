import { useDestinationStore } from '../stores/useDestinationStore';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useAtlasStore } from '../stores/useAtlasStore';
import type { AtlasNode } from '../types';
import { CAMERA_INITIAL_Z } from '../constants';

export class AtlasService {
  private static instance: AtlasService;
  private lastTrackedId: string | null = null;

  private constructor() {}

  public static getInstance(): AtlasService {
    if (!AtlasService.instance) {
      AtlasService.instance = new AtlasService();
    }
    return AtlasService.instance;
  }

  public trackPosition(cameraZ: number): void {
    const { destinations } = useDestinationStore.getState();

    // Find the destination closest to the camera
    let closestDist = Infinity;
    let closestDest = null;

    // We only check destinations that are reasonably close to avoid iterating everything if list is huge
    // But list is culled, so it's small (approx 20 items).
    for (const dest of destinations) {
      const dist = Math.abs(dest.coordinates[2] - cameraZ);
      if (dist < closestDist) {
        closestDist = dist;
        closestDest = dest;
      }
    }

    // Threshold: Only "visit" if we are within 20 units
    if (closestDest && closestDist < 20) {
      // Check if already tracked in this session to avoid spam
      if (this.lastTrackedId === closestDest.id) return;

      // Check if already in Atlas (persisted)
      const atlasNodes = useAtlasStore.getState().nodes;
      if (atlasNodes.some((n) => n.id === closestDest.id)) {
          this.lastTrackedId = closestDest.id; // Update tracker so we don't re-check constanty
          return;
      }

      this.lastTrackedId = closestDest.id;

      const stress = useResonanceStore.getState().currentStress;
      const coherenceScore = Math.round((1 - stress) * 100);

      const node: AtlasNode = {
        ...closestDest,
        visitedAt: Date.now(),
        stressLevel: stress,
        coherenceScore: coherenceScore,
      };

      useAtlasStore.getState().addNode(node);
    }
  }

  public teleport(node: AtlasNode): number {
    // 1. Reset Destination Store to just this node
    // We use setState to directly manipulate the store state from outside components
    useDestinationStore.setState({
      destinations: [node],
      activeDestination: node.id,
      // We don't reset cameraTargetZ here, the caller will handle the camera move
    });

    // 2. Calculate target Z (camera usually sits at +Z relative to object)
    const targetZ = node.coordinates[2] + CAMERA_INITIAL_Z;

    // 3. Move Camera
    useDestinationStore.getState().setCameraTargetZ(targetZ);

    return targetZ;
  }
}

export const atlasService = AtlasService.getInstance();
