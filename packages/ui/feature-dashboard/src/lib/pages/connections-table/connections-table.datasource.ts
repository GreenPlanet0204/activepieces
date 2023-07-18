import { DataSource } from '@angular/cdk/collections';
import { Observable, combineLatest, switchMap, tap, map } from 'rxjs';
import { AppConnection, FlowRun } from '@activepieces/shared';
import {
  ProjectService,
  AppConnectionsService,
  ApPaginatorComponent,
} from '@activepieces/ui/common';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ConnectionsTableDataSource extends DataSource<FlowRun> {
  data: AppConnection[] = [];
  constructor(
    private pageSize$: Observable<number>,
    private pageCursor$: Observable<string>,
    private paginator: ApPaginatorComponent,
    private projectService: ProjectService,
    private connectionsService: AppConnectionsService,
    private refresh$: Observable<boolean>
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<any[]> {
    return combineLatest({
      pageCursor: this.pageCursor$,
      pageSize: this.pageSize$,
      project: this.projectService.getSelectedProject(),
      refresh: this.refresh$,
    }).pipe(
      switchMap((res) => {
        return this.connectionsService.list({
          limit: res.pageSize,
          cursor: res.pageCursor,
        });
      }),
      tap((res) => {
        this.paginator.next = res.next;
        this.paginator.previous = res.previous;
        this.data = res.data;
      }),
      map((res) => res.data)
    );
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {
    //ignore
  }
}
