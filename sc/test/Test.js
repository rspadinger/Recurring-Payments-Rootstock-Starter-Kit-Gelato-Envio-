
const assert = require("assert");
const { TestHelpers } = require("generated");
const { MockDb, RecurringPayment } = TestHelpers;

describe("RecurringPayment contract AmountUpdated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for RecurringPayment contract AmountUpdated event
  const event = RecurringPayment.AmountUpdated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("RecurringPayment_AmountUpdated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await RecurringPayment.AmountUpdated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualRecurringPaymentAmountUpdated = mockDbUpdated.entities.RecurringPayment_AmountUpdated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedRecurringPaymentAmountUpdated = {
      id:`${event.chainId}_${event.block.number}_${event.logIndex}`,
      plan: event.params.plan,
      oldAmount: event.params.oldAmount,
      newAmount: event.params.newAmount,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualRecurringPaymentAmountUpdated,
      expectedRecurringPaymentAmountUpdated,
      "Actual RecurringPaymentAmountUpdated should be the same as the expectedRecurringPaymentAmountUpdated"
    );
  });
});
