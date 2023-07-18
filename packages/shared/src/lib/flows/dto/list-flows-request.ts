import { Static, Type } from "@sinclair/typebox";
import { CollectionId } from "../../collections/collection";
import { Cursor } from "../../common/seek-page";

export const ListFlowsRequest = Type.Object({
    collectionId: Type.String({}),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
});

export type ListFlowsRequest = Omit<Omit<Static<typeof ListFlowsRequest>, "collectionId">, "cursor"> & { collectionId: CollectionId, cursor: Cursor | undefined };
