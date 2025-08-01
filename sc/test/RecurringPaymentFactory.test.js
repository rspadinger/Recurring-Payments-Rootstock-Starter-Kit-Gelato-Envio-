const { expect } = require("chai")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")
const { ethers } = require("hardhat")

describe("RecurringPaymentFactory Contract", function () {
    // Deploy all required contracts and set up the environment
    async function deployContractFixture() {
        const [owner, user1, user2, user3, feeCollector] = await ethers.getSigners()

        // Deploy mock contracts in dependency order
        const MockOpsProxyFactory = await ethers.getContractFactory("MockOpsProxyFactory")
        const mockOpsProxyFactory = await MockOpsProxyFactory.deploy()

        const MockProxyModule = await ethers.getContractFactory("MockProxyModule")
        const mockProxyModule = await MockProxyModule.deploy(mockOpsProxyFactory.target)

        const MockGelato = await ethers.getContractFactory("MockGelato")
        const mockGelato = await MockGelato.deploy(feeCollector.address)

        // Deploy MockGelatoAutomation with all dependencies
        const MockGelatoAutomation = await ethers.getContractFactory("MockGelatoAutomation")
        const mockGelatoAutomation = await MockGelatoAutomation.deploy(
            mockGelato.target,
            mockProxyModule.target,
            mockOpsProxyFactory.target
        )

        // Deploy RecurringPaymentFactory with mock Gelato automation
        const RecurringPaymentFactory = await ethers.getContractFactory("RecurringPaymentFactory")
        const recurringPaymentFactory = await RecurringPaymentFactory.deploy(mockGelatoAutomation.target)

        return {
            recurringPaymentFactory,
            mockGelatoAutomation,
            mockGelato,
            mockProxyModule,
            mockOpsProxyFactory,
            owner,
            user1,
            user2,
            user3,
            feeCollector,
        }
    }

    describe("Deployment and Initialization", function () {
        it("Should deploy with correct initial state", async function () {
            const { recurringPaymentFactory, owner, mockGelatoAutomation } = await loadFixture(deployContractFixture)

            expect(await recurringPaymentFactory.owner()).to.equal(owner.address)
            expect(await recurringPaymentFactory.recurringPaymentImplementation()).to.not.equal(ethers.ZeroAddress)
        })

        it("Should deploy implementation contract correctly", async function () {
            const { recurringPaymentFactory } = await loadFixture(deployContractFixture)

            const implementationAddress = await recurringPaymentFactory.recurringPaymentImplementation()
            expect(implementationAddress).to.not.equal(ethers.ZeroAddress)

            // Verify the implementation contract exists and has correct factory address
            const RecurringPayment = await ethers.getContractFactory("RecurringPayment")
            const implementation = RecurringPayment.attach(implementationAddress)
            expect(await implementation.factory()).to.equal(recurringPaymentFactory.target)
        })
    })

    describe("Plan Creation", function () {
        const planParams = {
            recipient: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // user2 address
            amount: ethers.parseEther("0.1"),
            interval: 86400, // 1 day
            startTime: 0, // Will be set in tests
            title: "Test Payment Plan",
        }

        it("Should create a plan successfully", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600 // 1 hour from now
            const params = { ...planParams, startTime: futureTime }

            const initialBalance = await ethers.provider.getBalance(user1.address)
            const tx = await recurringPaymentFactory
                .connect(user1)
                .createPlan(params.recipient, params.amount, params.interval, params.startTime, params.title, {
                    value: params.amount,
                })

            const receipt = await tx.wait()
            const event = receipt.logs.find((log) => {
                try {
                    const parsed = recurringPaymentFactory.interface.parseLog(log)
                    return parsed.name === "PlanCreated"
                } catch {
                    return false
                }
            })

            expect(event).to.not.be.undefined
            const parsedEvent = recurringPaymentFactory.interface.parseLog(event)
            expect(parsedEvent.args.plan).to.not.equal(ethers.ZeroAddress)
            expect(parsedEvent.args.payer).to.equal(user1.address)
            expect(parsedEvent.args.recipient).to.equal(params.recipient)
            expect(parsedEvent.args.amount).to.equal(params.amount)
            expect(parsedEvent.args.interval).to.equal(params.interval)
            expect(parsedEvent.args.startTime).to.equal(params.startTime)
            expect(parsedEvent.args.title).to.equal(params.title)

            // Verify plan is added to payer's plans
            const payerPlans = await recurringPaymentFactory.connect(user1).getPayerPlans()
            //console.log("payerPlans: ", payerPlans)
            expect(payerPlans).to.have.lengthOf(1)
            expect(payerPlans[0]).to.equal(parsedEvent.args.plan)

            // Verify plan is added to recipient's plans
            const recipientPlans = await recurringPaymentFactory.connect(user2).getRecipientPlans()
            expect(recipientPlans).to.have.lengthOf(1)
            expect(recipientPlans[0]).to.equal(parsedEvent.args.plan)
        })

        it("Should revert when recipient is zero address", async function () {
            const { recurringPaymentFactory, user1 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const params = { ...planParams, startTime: futureTime }

            await expect(
                recurringPaymentFactory
                    .connect(user1)
                    .createPlan(ethers.ZeroAddress, params.amount, params.interval, params.startTime, params.title, {
                        value: params.amount,
                    })
            ).to.be.revertedWith("Invalid recipient")
        })

        it("Should revert when amount is less than 10 wei", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const params = { ...planParams, startTime: futureTime, amount: 5 }

            await expect(
                recurringPaymentFactory
                    .connect(user1)
                    .createPlan(params.recipient, params.amount, params.interval, params.startTime, params.title, {
                        value: params.amount,
                    })
            ).to.be.revertedWith("Payment amount must be at least 10 wei")
        })

        it("Should revert when interval is less than 60 seconds", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const params = { ...planParams, startTime: futureTime, interval: 30 }

            await expect(
                recurringPaymentFactory
                    .connect(user1)
                    .createPlan(params.recipient, params.amount, params.interval, params.startTime, params.title, {
                        value: params.amount,
                    })
            ).to.be.revertedWith("Payment interval must be at least 1 minute")
        })

        it("Should revert when start time is in the past", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const pastTime = (await time.latest()) - 3600 // 1 hour ago
            const params = { ...planParams, startTime: pastTime }

            await expect(
                recurringPaymentFactory
                    .connect(user1)
                    .createPlan(params.recipient, params.amount, params.interval, params.startTime, params.title, {
                        value: params.amount,
                    })
            ).to.be.revertedWith("Start time must be in the future")
        })

        it("Should revert when insufficient initial funding", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const params = { ...planParams, startTime: futureTime }

            await expect(
                recurringPaymentFactory.connect(user1).createPlan(
                    params.recipient,
                    params.amount,
                    params.interval,
                    params.startTime,
                    params.title,
                    { value: params.amount - ethers.parseEther("0.01") } // Less than required amount
                )
            ).to.be.revertedWith("Insufficient initial funding")
        })

        it("Should revert when title is too long", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const longTitle = "A".repeat(61) // 61 characters, exceeds 60 limit
            const params = { ...planParams, startTime: futureTime, title: longTitle }

            await expect(
                recurringPaymentFactory
                    .connect(user1)
                    .createPlan(params.recipient, params.amount, params.interval, params.startTime, params.title, {
                        value: params.amount,
                    })
            ).to.be.revertedWith("Title too long")
        })

        it("Should allow creating multiple plans for same payer", async function () {
            const { recurringPaymentFactory, user1, user2, user3 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const amount = ethers.parseEther("0.1")

            // Create first plan
            await recurringPaymentFactory
                .connect(user1)
                .createPlan(user2.address, amount, 86400, futureTime, "Plan 1", { value: amount })

            // Create second plan
            await recurringPaymentFactory.connect(user1).createPlan(
                user3.address,
                amount,
                172800, // 2 days
                futureTime,
                "Plan 2",
                { value: amount }
            )

            const payerPlans = await recurringPaymentFactory.connect(user1).getPayerPlans()
            expect(payerPlans).to.have.lengthOf(2)
        })

        it("Should allow creating multiple plans for same recipient", async function () {
            const { recurringPaymentFactory, user1, user2, user3 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const amount = ethers.parseEther("0.1")

            // Create first plan
            await recurringPaymentFactory
                .connect(user1)
                .createPlan(user2.address, amount, 86400, futureTime, "Plan 1", { value: amount })

            // Create second plan from different payer
            await recurringPaymentFactory
                .connect(user3)
                .createPlan(user2.address, amount, 172800, futureTime, "Plan 2", { value: amount })

            const recipientPlans = await recurringPaymentFactory.connect(user2).getRecipientPlans()
            expect(recipientPlans).to.have.lengthOf(2)
        })
    })

    describe("Plan Retrieval Functions", function () {
        it("Should return empty arrays for new users", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const payerPlans = await recurringPaymentFactory.connect(user1).getPayerPlans()
            const recipientPlans = await recurringPaymentFactory.connect(user2).getRecipientPlans()

            expect(payerPlans).to.have.lengthOf(0)
            expect(recipientPlans).to.have.lengthOf(0)
        })

        it("Should return correct plans for payer", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const amount = ethers.parseEther("0.1")

            // Create plan
            const tx = await recurringPaymentFactory
                .connect(user1)
                .createPlan(user2.address, amount, 86400, futureTime, "Test Plan", { value: amount })

            const receipt = await tx.wait()
            const event = receipt.logs.find((log) => {
                try {
                    const parsed = recurringPaymentFactory.interface.parseLog(log)
                    return parsed.name === "PlanCreated"
                } catch {
                    return false
                }
            })
            const parsedEvent = recurringPaymentFactory.interface.parseLog(event)

            const payerPlans = await recurringPaymentFactory.connect(user1).getPayerPlans()
            expect(payerPlans).to.have.lengthOf(1)
            expect(payerPlans[0]).to.equal(parsedEvent.args.plan)
        })

        it("Should return correct plans for recipient", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const amount = ethers.parseEther("0.1")

            // Create plan
            const tx = await recurringPaymentFactory
                .connect(user1)
                .createPlan(user2.address, amount, 86400, futureTime, "Test Plan", { value: amount })

            const receipt = await tx.wait()
            const event = receipt.logs.find((log) => {
                try {
                    const parsed = recurringPaymentFactory.interface.parseLog(log)
                    return parsed.name === "PlanCreated"
                } catch {
                    return false
                }
            })
            const parsedEvent = recurringPaymentFactory.interface.parseLog(event)

            const recipientPlans = await recurringPaymentFactory.connect(user2).getRecipientPlans()
            expect(recipientPlans).to.have.lengthOf(1)
            expect(recipientPlans[0]).to.equal(parsedEvent.args.plan)
        })
    })

    describe("Events", function () {
        it("Should emit PlanCreated event with correct parameters", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const amount = ethers.parseEther("0.1")
            const interval = 86400
            const title = "Test Payment Plan"

            await expect(
                recurringPaymentFactory
                    .connect(user1)
                    .createPlan(user2.address, amount, interval, futureTime, title, { value: amount })
            )
                .to.emit(recurringPaymentFactory, "PlanCreated")
                .withArgs(
                    (planAddress) => planAddress !== ethers.ZeroAddress,
                    user1.address,
                    user2.address,
                    amount,
                    interval,
                    futureTime,
                    title
                )
        })
    })

    describe("Edge Cases", function () {
        it("Should handle minimum valid values", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const minAmount = 10 // Minimum amount
            const minInterval = 60 // Minimum interval
            const maxTitle = "A".repeat(60) // Maximum title length

            await expect(
                recurringPaymentFactory
                    .connect(user1)
                    .createPlan(user2.address, minAmount, minInterval, futureTime, maxTitle, { value: minAmount })
            ).to.not.be.reverted
        })

        it("Should handle empty title", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const amount = ethers.parseEther("0.1")

            await expect(
                recurringPaymentFactory.connect(user1).createPlan(
                    user2.address,
                    amount,
                    86400,
                    futureTime,
                    "", // Empty title
                    { value: amount }
                )
            ).to.not.be.reverted
        })
    })

    describe("Gas Optimization", function () {
        it("Should create plan with reasonable gas usage", async function () {
            const { recurringPaymentFactory, user1, user2 } = await loadFixture(deployContractFixture)

            const futureTime = (await time.latest()) + 3600
            const amount = ethers.parseEther("0.1")

            const tx = await recurringPaymentFactory
                .connect(user1)
                .createPlan(user2.address, amount, 86400, futureTime, "Test Plan", { value: amount })

            const receipt = await tx.wait()
            // Gas usage should be reasonable (less than 1M gas for plan creation)
            expect(receipt.gasUsed).to.be.lessThan(1000000)
        })
    })
})
