import { Trigger, TriggerStrategy } from '@activepieces/pieces-framework'
import {
    CollectionId,
    ExecuteTriggerResponse,
    FlowVersion,
    PieceTrigger,
    ProjectId,
    RunEnvironment,
    TriggerHookType,
    TriggerType,
} from '@activepieces/shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowQueue } from '../workers/flow-worker/flow-queue'
import { engineHelper } from './engine-helper'
import { getPiece } from '@activepieces/pieces-apps'
import { webhookService } from '../webhooks/webhook-service'
import { appEventRoutingService } from '../app-event-routing/app-event-routing.service'
import { captureException } from '@sentry/node'

export const triggerUtils = {
    async executeTrigger(params: ExecuteTrigger): Promise<unknown[]> {
        const { payload, flowVersion, projectId, collectionId, simulate } = params
        const flowTrigger = flowVersion.trigger
        let payloads = []
        switch (flowTrigger.type) {
            case TriggerType.PIECE: {
                const pieceTrigger = getPieceTrigger(flowTrigger)
                try {
                    payloads = await engineHelper.executeTrigger({
                        hookType: TriggerHookType.RUN,
                        flowVersion: flowVersion,
                        triggerPayload: payload,
                        collectionId,
                        webhookUrl: await webhookService.getWebhookUrl({
                            flowId: flowVersion.flowId,
                            simulate,
                        }),
                        projectId: projectId,
                    }) as unknown[]
                }
                catch (e) {
                    const error = new ActivepiecesError({
                        code: ErrorCode.TRIGGER_FAILED,
                        params: {
                            triggerName: pieceTrigger.name,
                            pieceName: flowTrigger.settings.pieceName,
                            pieceVersion: flowTrigger.settings.pieceVersion,
                            error: e,
                        },
                    }, `Flow ${flowTrigger.name} with ${pieceTrigger.name} trigger throws and error, returning as zero payload `)
                    captureException(error)
                    payloads = []
                }
                break
            }
            default:
                payloads = [payload]
                break
        }
        return payloads
    },

    async enable({ collectionId, flowVersion, projectId, simulate }: EnableOrDisableParams): Promise<void> {
        switch (flowVersion.trigger.type) {
            case TriggerType.PIECE:
                await enablePieceTrigger({
                    collectionId,
                    projectId,
                    flowVersion,
                    simulate,
                })
                break
            default:
                break
        }
    },

    async disable({ collectionId, flowVersion, projectId, simulate }: EnableOrDisableParams): Promise<void> {
        switch (flowVersion.trigger.type) {
            case TriggerType.PIECE:
                await disablePieceTrigger({
                    collectionId,
                    projectId,
                    flowVersion,
                    simulate,
                })
                break
            default:
                break
        }
    },
}

const disablePieceTrigger = async (params: EnableOrDisableParams): Promise<void> => {
    const { flowVersion, projectId, collectionId, simulate } = params
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = getPieceTrigger(flowTrigger)

    await engineHelper.executeTrigger({
        hookType: TriggerHookType.ON_DISABLE,
        flowVersion: flowVersion,
        collectionId,
        webhookUrl: await webhookService.getWebhookUrl({
            flowId: flowVersion.flowId,
            simulate,
        }),
        projectId: projectId,
    })

    switch (pieceTrigger.type) {
        case TriggerStrategy.APP_WEBHOOK:
            await appEventRoutingService.deleteListeners({projectId, flowId: flowVersion.flowId })
            break
        case TriggerStrategy.WEBHOOK:
            break
        case TriggerStrategy.POLLING:
            await flowQueue.removeRepeatableJob({
                id: flowVersion.id,
            })
            break
    }
}

const enablePieceTrigger = async (params: EnableOrDisableParams): Promise<void> => {
    const { flowVersion, projectId, collectionId, simulate } = params
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = getPieceTrigger(flowTrigger)

    const webhookUrl = await webhookService.getWebhookUrl({
        flowId: flowVersion.flowId,
        simulate,
    })

    const response = await engineHelper.executeTrigger({
        hookType: TriggerHookType.ON_ENABLE,
        flowVersion: flowVersion,
        collectionId,
        webhookUrl,
        projectId: projectId,
    })

    switch (pieceTrigger.type) {
        case TriggerStrategy.APP_WEBHOOK: {
            const appName = flowTrigger.settings.pieceName
            const listeners = (response as ExecuteTriggerResponse).listeners
            for(const listener of listeners){
                await appEventRoutingService.createListeners({
                    projectId,
                    flowId: flowVersion.flowId,
                    appName,
                    events: listener.events,
                    identifierValue: listener.identifierValue,
                })
            }
            break
        }
        case TriggerStrategy.WEBHOOK:
            break
        case TriggerStrategy.POLLING: {
            const scheduleOptions = (response as ExecuteTriggerResponse).scheduleOptions
            await flowQueue.add({
                id: flowVersion.id,
                data: {
                    projectId,
                    environment: RunEnvironment.PRODUCTION,
                    collectionId,
                    flowVersion,
                    triggerType: TriggerType.PIECE,
                },
                scheduleOptions: scheduleOptions,
            })
            break

        }
    }
}

const getPieceTrigger = (trigger: PieceTrigger): Trigger => {
    const piece = getPiece(trigger.settings.pieceName)

    if (piece === null) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_NOT_FOUND,
            params: {
                pieceName: trigger.settings.pieceName,
                pieceVersion: trigger.settings.pieceVersion,
            },
        })
    }
    const pieceTrigger = piece.getTrigger(trigger.settings.triggerName)
    if (pieceTrigger == null) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_TRIGGER_NOT_FOUND,
            params: {
                pieceName: trigger.settings.pieceName,
                pieceVersion: trigger.settings.pieceVersion,
                triggerName: trigger.settings.triggerName,
            },
        })
    }

    return pieceTrigger
}

type BaseParams = {
    collectionId: CollectionId
    projectId: ProjectId
    flowVersion: FlowVersion
    simulate: boolean
}

type EnableOrDisableParams = BaseParams

type ExecuteTrigger = BaseParams & {
    payload: unknown
}
