/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
    RecurringPayment,
    RecurringPayment_AmountUpdated,
    RecurringPayment_FundsAdded,
    RecurringPayment_FundsReceived,
    RecurringPayment_IntervalUpdated,
    RecurringPayment_PaymentExecuted,
    RecurringPayment_PaymentTaskCreated,
    RecurringPayment_PlanCancelled,
    RecurringPayment_PlanPaused,
    RecurringPayment_PlanUnpaused,
    RecurringPaymentFactory,
    RecurringPaymentFactory_PlanCreated,
} from "generated"

RecurringPayment.AmountUpdated.handler(async ({ event, context }) => {
    const entity: RecurringPayment_AmountUpdated = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        plan: event.params.plan,
        oldAmount: event.params.oldAmount,
        newAmount: event.params.newAmount,
    }

    context.RecurringPayment_AmountUpdated.set(entity)
})

RecurringPayment.FundsAdded.handler(async ({ event, context }) => {
    const entity: RecurringPayment_FundsAdded = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        payer: event.params.payer,
        amount: event.params.amount,
        timestamp: event.params.timestamp,
    }

    context.RecurringPayment_FundsAdded.set(entity)
})

RecurringPayment.FundsReceived.handler(async ({ event, context }) => {
    const entity: RecurringPayment_FundsReceived = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        payer: event.params.payer,
        amount: event.params.amount,
        timestamp: event.params.timestamp,
    }

    context.RecurringPayment_FundsReceived.set(entity)
})

RecurringPayment.IntervalUpdated.handler(async ({ event, context }) => {
    const entity: RecurringPayment_IntervalUpdated = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        plan: event.params.plan,
        oldInterval: event.params.oldInterval,
        newInterval: event.params.newInterval,
    }

    context.RecurringPayment_IntervalUpdated.set(entity)
})

RecurringPayment.PaymentExecuted.handler(async ({ event, context }) => {
    const entity: RecurringPayment_PaymentExecuted = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        planAddress: event.params.planAddress,
        payer: event.params.payer,
        recipient: event.params.recipient,
        amount: event.params.amount,
        timestamp: event.params.timestamp,
    }

    context.RecurringPayment_PaymentExecuted.set(entity)
})

RecurringPayment.PaymentTaskCreated.handler(async ({ event, context }) => {
    const entity: RecurringPayment_PaymentTaskCreated = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        taskId: event.params.taskId,
        payer: event.params.payer,
        plan: event.params.plan,
    }

    context.RecurringPayment_PaymentTaskCreated.set(entity)
})

RecurringPayment.PlanCancelled.handler(async ({ event, context }) => {
    const entity: RecurringPayment_PlanCancelled = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        planAddress: event.params.planAddress,
        payer: event.params.payer,
        refundedAmount: event.params.refundedAmount,
        timestamp: event.params.timestamp,
    }

    context.RecurringPayment_PlanCancelled.set(entity)
})

RecurringPayment.PlanPaused.handler(async ({ event, context }) => {
    const entity: RecurringPayment_PlanPaused = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        plan: event.params.plan,
    }

    context.RecurringPayment_PlanPaused.set(entity)
})

RecurringPayment.PlanUnpaused.handler(async ({ event, context }) => {
    const entity: RecurringPayment_PlanUnpaused = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        plan: event.params.plan,
    }

    context.RecurringPayment_PlanUnpaused.set(entity)
})

RecurringPaymentFactory.PlanCreated.handler(async ({ event, context }) => {
    const entity: RecurringPaymentFactory_PlanCreated = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        planAddress: event.params.planAddress,
        payer: event.params.payer,
        recipient: event.params.recipient,
        amount: event.params.amount,
        interval: event.params.interval,
        startTime: event.params.startTime,
    }

    context.RecurringPaymentFactory_PlanCreated.set(entity)
})

// Register RecurringPayment contracts whenever they're created by the factory
RecurringPaymentFactory.PlanCreated.contractRegister(async ({ event, context }) => {
    // Register the new Plan contract using its address from the event
    context.addRecurringPayment(event.params.planAddress)

    context.log.info(`Registered new Plan at ${event.params.planAddress}`)
})
