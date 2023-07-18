import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PannerService {
  panningOffset$: Subject<{ x: number; y: number }> = new Subject();
  isGrabbing$: Subject<boolean> = new Subject();
  dragState = {
    currentOffset: {
      x: 0,
      y: 0,
    },
    isDragging: false,
  };
  lastPanningOffset = {
    x: 0,
    y: 0,
  };
  recenter() {
    this.dragState = {
      currentOffset: {
        x: 0,
        y: 0,
      },
      isDragging: false,
    };
    this.lastPanningOffset = {
      x: 0,
      y: 0,
    };
    this.panningOffset$.next({ x: 0, y: 0 });
  }
}
