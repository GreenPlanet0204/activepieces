import { Store } from "@activepieces/pieces-framework";

interface TimebasedPolling<INPUT> {
    strategy: DedupeStrategy.TIMEBASED;
    items: (
        { propsValue, lastFetchEpochMS }: { propsValue: INPUT, lastFetchEpochMS: number },
    ) => Promise<{
        epochMilliSeconds: number;
        data: unknown;
    }[]
    >;
}

interface LastItemPolling<INPUT> {
    strategy: DedupeStrategy.LAST_ITEM;
    items: (
        { propsValue }: { propsValue: INPUT },
    ) => Promise<{
        id: unknown;
        data: unknown;
    }[]
    >;
}

export enum DedupeStrategy {
    TIMEBASED,
    LAST_ITEM
}

export type Polling<T> = TimebasedPolling<T> | LastItemPolling<T>;

export const pollingHelper = {
    async poll<INPUT>(polling: Polling<INPUT>, { store, propsValue }: { store: Store, propsValue: INPUT }): Promise<unknown[]> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED: {
                const lastEpochMilliSeconds = (await store.get<number>("lastPoll")) ?? 0;
                const items = await polling.items({ propsValue, lastFetchEpochMS: lastEpochMilliSeconds});
                const newLastEpochMilliSeconds = items.reduce((acc, item) => Math.max(acc, item.epochMilliSeconds), lastEpochMilliSeconds);
                await store.put("lastPoll", newLastEpochMilliSeconds);
                return items.filter(f => f.epochMilliSeconds > lastEpochMilliSeconds).map((item) => item.data);
            }
            case DedupeStrategy.LAST_ITEM: {
                const lastItemId = (await store.get<unknown>("lastItem"));
                const items = await polling.items({ propsValue });
                const newLastItem = items?.[0]?.id;
                if (!newLastItem) {
                    return items;
                }
                await store.put("lastItem", newLastItem);
                // get  items until you find the last item
                const lastItemIndex = items.findIndex(f => f.id === lastItemId);
                return items?.slice(0, lastItemIndex).map((item) => item.data) ?? [];
            }
        }
    },
    async onEnable<INPUT>(polling: Polling<INPUT>, { store, propsValue }: { store: Store, propsValue: INPUT }): Promise<void> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED: {
                await store.put("lastPoll", Date.now());
                break;
            }
            case DedupeStrategy.LAST_ITEM: {
                const items = (await polling.items({ propsValue }));
                await store.put("lastItem", items?.[0]?.id);
                break;
            }
        }
    },
    async onDisable<INPUT>(polling: Polling<INPUT>, { store, propsValue }: { store: Store, propsValue: INPUT }): Promise<void> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED:
            case DedupeStrategy.LAST_ITEM:
                return;
        }
    },
    async test<INPUT>(polling: Polling<INPUT>, { propsValue }: { store: Store, propsValue: INPUT }): Promise<unknown[]> {
        let items = [];
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED: {
                items = await polling.items({ propsValue, lastFetchEpochMS: 0 });
                break;
            }
            case DedupeStrategy.LAST_ITEM: {
                items = await polling.items({ propsValue });
                break;
            }
        }
        return getFirstFiveOrAll(items.map((item) => item.data));
    }
}

function getFirstFiveOrAll(array: unknown[]) {
    if (array.length <= 5) {
        return array;
    } else {
        return array.slice(0, 5);
    }
}
