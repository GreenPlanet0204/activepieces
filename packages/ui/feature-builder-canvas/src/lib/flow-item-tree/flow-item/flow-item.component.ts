import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, map, Observable, of, startWith } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  FLOW_ITEM_HEIGHT,
  FLOW_ITEM_WIDTH,
  SPACE_BETWEEN_ITEM_CONTENT_AND_LINE,
  VERTICAL_LINE_LENGTH,
} from './flow-item-connection/draw-utils';
import {
  BuilderSelectors,
  FlowItem,
  Point,
  FlowStructureUtil,
} from '@activepieces/ui/feature-builder-store';
import { PannerService } from '../../canvas-utils/panning/panner.service';
import { ZoomingService } from '../../canvas-utils/zooming/zooming.service';

@Component({
  selector: 'app-flow-item',
  templateUrl: './flow-item.component.html',
  styleUrls: [],
})
export class FlowItemComponent implements OnInit {
  flowGraphContainer = {};
  transformObs$: Observable<string>;
  @Input() insideLoopOrBranch = false;
  @Input() hoverState = false;
  @Input() trigger = false;
  _flowItemData: FlowItem;
  @Input() set flowItemData(value: FlowItem) {
    this._flowItemData = value;
    this.selected$ = this.store
      .select(BuilderSelectors.selectCurrentStepName)
      .pipe(
        map((stepName) => {
          if (this._flowItemData == undefined) {
            return false;
          }
          return this._flowItemData.name == stepName;
        })
      );
    this.flowGraphContainer = this.flowGraphContainerCalculator();
  }

  dragging = false;
  selected$: Observable<boolean> = of(false);
  viewMode$: Observable<boolean> = of(false);
  dragDelta: Point | undefined;

  constructor(
    private store: Store,
    private pannerService: PannerService,
    private zoomingService: ZoomingService
  ) {}

  ngOnInit(): void {
    this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
    if (FlowStructureUtil.isTrigger(this._flowItemData)) {
      const translate$ = this.pannerService.panningOffset$.asObservable().pipe(
        startWith({ x: 0, y: 0 }),
        map((val) => {
          return `translate(${val.x}px,${val.y}px)`;
        })
      );
      const scale$ = this.zoomingService.zoomingScale$.asObservable().pipe(
        startWith(1),
        map((val) => {
          return `scale(${val})`;
        })
      );
      this.transformObs$ = combineLatest({
        scale: scale$,
        translate: translate$,
      }).pipe(
        map((value) => {
          return `${value.scale} ${value.translate}`;
        })
      );
    }
  }

  flowContentContainer() {
    return {
      left: `calc(50% - ${FLOW_ITEM_WIDTH / 2}px )`,
      position: 'relative',
      width: FLOW_ITEM_WIDTH + 'px',
    };
  }

  flowGraphContainerCalculator() {
    return {
      top: FlowStructureUtil.isTrigger(this._flowItemData) ? '50px' : '0px',
      width: this._flowItemData.boundingBox!.width + 'px',
      height: this._flowItemData.boundingBox!.height + 'px',
      left: `calc(50% - ${this._flowItemData.boundingBox!.width / 2}px )`,
      position: 'relative',
    };
  }

  nextActionItem() {
    return {
      width: FLOW_ITEM_WIDTH + 'px',
      height: FLOW_ITEM_HEIGHT + 'px',
      top:
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        VERTICAL_LINE_LENGTH +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        'px',
      left: '0px',
      position: 'absolute',
    };
  }
}
