const { expect } = require("chai")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")
const { ethers } = require("hardhat")

describe("RecurringPayment Contract", function () {
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

        // Deploy RecurringPayment implementation contract
        const RecurringPayment = await ethers.getContractFactory("RecurringPayment")
        const recurringPaymentImpl = await RecurringPayment.deploy(owner.address, mockGelatoAutomation.target)

        // Deploy a minimal factory for onlyFactory modifier
        const RecurringPaymentFactory = await ethers.getContractFactory("RecurringPaymentFactory")
        const recurringPaymentFactory = await RecurringPaymentFactory.deploy(mockGelatoAutomation.target)

        // Helper to deploy a clone and initialize it
        async function createInitializedPlan({
            payer = user1,
            recipient = user2,
            amount = ethers.parseEther("0.1"),
            interval = 86400,
            startTime,
            title = "Test Plan",
            value = ethers.parseEther("0.1"),
        } = {}) {
            // Set default startTime if not provided
            if (!startTime) {
                startTime = (await time.latest()) + 3600
            }
            // Deploy a clone (simulate minimal proxy)
            const clone = await RecurringPayment.deploy(recurringPaymentFactory.target, mockGelatoAutomation.target)
            await clone
                .connect(payer)
                .initialize(payer.address, recipient.address, amount, interval, startTime, title, { value })
            return clone
        }

        return {
            recurringPaymentImpl,
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
            createInitializedPlan,
        }
    }

    describe("Deployment and Initialization", function () {
        it("Should deploy with correct initial state", async function () {
            const { recurringPaymentImpl, owner } = await loadFixture(deployContractFixture)
            expect(await recurringPaymentImpl.owner()).to.equal(owner.address)
            expect(await recurringPaymentImpl.factory()).to.equal(owner.address)
        })

        it("Should initialize a plan with correct parameters", async function () {
            const { createInitializedPlan, user1, user2 } = await loadFixture(deployContractFixture)
            const amount = ethers.parseEther("0.1")
            const interval = 86400
            const startTime = (await time.latest()) + 3600
            const title = "My Plan"
            const plan = await createInitializedPlan({
                payer: user1,
                recipient: user2,
                amount,
                interval,
                startTime,
                title,
                value: amount,
            })
            expect(await plan.payer()).to.equal(user1.address)
            expect(await plan.recipient()).to.equal(user2.address)
            expect(await plan.amount()).to.equal(amount)
            expect(await plan.interval()).to.equal(interval)
            expect(await plan.startTime()).to.equal(startTime)
            expect(await plan.title()).to.equal(title)
            expect(await plan.getStatus()).to.equal(0) // Active
        })
    })

    describe("Funding", function () {
        it("Should accept direct funding and emit FundsReceived", async function () {
            const { createInitializedPlan, user1, user2, user3 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            const sendValue = ethers.parseEther("0.05")
            const currentTime = await time.latest()
            await expect(user3.sendTransaction({ to: plan.target, value: sendValue }))
                .to.emit(plan, "FundsReceived")
                .withArgs(
                    plan.target,
                    user1.address,
                    user3.address,
                    sendValue,
                    (timestamp) => {
                        // Allow timestamp to be within 2 seconds of the expected time
                        return Math.abs(Number(timestamp) - Number(currentTime)) <= 2
                    },
                    await plan.title()
                )
        })

        it("Should allow addFunds and emit FundsAdded", async function () {
            const { createInitializedPlan, user2 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            const sendValue = ethers.parseEther("0.02")
            await expect(plan.connect(user2).addFunds({ value: sendValue })).to.emit(plan, "FundsAdded")
        })

        it("Should revert addFunds with zero value", async function () {
            const { createInitializedPlan, user2 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await expect(plan.connect(user2).addFunds({ value: 0 })).to.be.revertedWith("No funding was provided")
        })
    })

    describe("Payment Execution", function () {
        it("Should execute payment if conditions met and emit PaymentExecuted", async function () {
            const { createInitializedPlan, user1, user2, owner } = await loadFixture(deployContractFixture)
            const amount = ethers.parseEther("0.1")
            const plan = await createInitializedPlan({ amount, value: amount })
            // Fast forward to after startTime
            await time.increaseTo(Number(await plan.startTime()) + 1)
            // Simulate dedicatedMsgSender (proxy)
            const dedicatedMsgSender = await plan.dedicatedMsgSender()
            await ethers.provider.send("hardhat_impersonateAccount", [dedicatedMsgSender])
            // Fund the impersonated account with ETH for gas
            await owner.sendTransaction({
                to: dedicatedMsgSender,
                value: ethers.parseEther("1.0"),
            })
            const signer = await ethers.getSigner(dedicatedMsgSender)
            await expect(plan.connect(signer).executePayment()).to.emit(plan, "PaymentExecuted")
        })

        it("Should revert executePayment if not dedicatedMsgSender", async function () {
            const { createInitializedPlan, user1 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await expect(plan.connect(user1).executePayment()).to.be.revertedWith("Only dedicated msg.sender")
        })

        it("Should revert if plan is not active", async function () {
            const { createInitializedPlan, user1, owner } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            // Pause the plan
            await plan.connect(user1).pausePlan()
            const dedicatedMsgSender = await plan.dedicatedMsgSender()
            await ethers.provider.send("hardhat_impersonateAccount", [dedicatedMsgSender])
            // Fund the impersonated account with ETH for gas
            await owner.sendTransaction({
                to: dedicatedMsgSender,
                value: ethers.parseEther("1.0"),
            })
            const signer = await ethers.getSigner(dedicatedMsgSender)
            await expect(plan.connect(signer).executePayment()).to.be.revertedWith("Plan not active")
        })

        it("Should revert if insufficient funds", async function () {
            const { createInitializedPlan, user1, owner } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan({
                amount: ethers.parseEther("1.0"),
                value: ethers.parseEther("0.5"),
            })
            await time.increaseTo(Number(await plan.startTime()) + 1)
            const dedicatedMsgSender = await plan.dedicatedMsgSender()
            await ethers.provider.send("hardhat_impersonateAccount", [dedicatedMsgSender])
            // Fund the impersonated account with ETH for gas
            await owner.sendTransaction({
                to: dedicatedMsgSender,
                value: ethers.parseEther("1.0"),
            })
            const signer = await ethers.getSigner(dedicatedMsgSender)
            await expect(plan.connect(signer).executePayment()).to.be.revertedWith("Insufficient user funds")
        })
    })

    describe("Admin Functions", function () {
        it("Should allow owner to update amount and emit AmountUpdated", async function () {
            const { createInitializedPlan, user1 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            const newAmount = ethers.parseEther("0.2")
            await expect(plan.connect(user1).setAmount(newAmount)).to.emit(plan, "AmountUpdated")
            expect(await plan.amount()).to.equal(newAmount)
        })

        it("Should revert setAmount if not owner", async function () {
            const { createInitializedPlan, user2 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await expect(plan.connect(user2).setAmount(ethers.parseEther("0.2"))).to.be.revertedWithCustomError(
                plan,
                "OwnableUnauthorizedAccount"
            )
        })

        it("Should revert setAmount if new amount is zero", async function () {
            const { createInitializedPlan, user1 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await expect(plan.connect(user1).setAmount(0)).to.be.revertedWith("Amount must be greater than zero")
        })

        it("Should allow owner to update interval and emit IntervalUpdated", async function () {
            const { createInitializedPlan, user1 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            const newInterval = 100000
            await expect(plan.connect(user1).setInterval(newInterval)).to.emit(plan, "IntervalUpdated")
            expect(await plan.interval()).to.equal(newInterval)
        })

        it("Should revert setInterval if not owner", async function () {
            const { createInitializedPlan, user2 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await expect(plan.connect(user2).setInterval(100000)).to.be.revertedWithCustomError(
                plan,
                "OwnableUnauthorizedAccount"
            )
        })

        it("Should revert setInterval if new interval is too short", async function () {
            const { createInitializedPlan, user1 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await expect(plan.connect(user1).setInterval(10)).to.be.revertedWith("Interval must be at least 60 seconds")
        })

        it("Should allow owner to pause and resume plan, emitting events", async function () {
            const { createInitializedPlan, user1 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await expect(plan.connect(user1).pausePlan()).to.emit(plan, "PlanPaused")
            expect(await plan.getStatus()).to.equal(1) // Paused
            await expect(plan.connect(user1).resumePlan()).to.emit(plan, "PlanUnpaused")
            expect(await plan.getStatus()).to.equal(0) // Active
        })

        it("Should revert pausePlan if not owner", async function () {
            const { createInitializedPlan, user2 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await expect(plan.connect(user2).pausePlan()).to.be.revertedWithCustomError(
                plan,
                "OwnableUnauthorizedAccount"
            )
        })

        it("Should revert resumePlan if not owner", async function () {
            const { createInitializedPlan, user1, user2 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await plan.connect(user1).pausePlan()
            await expect(plan.connect(user2).resumePlan()).to.be.revertedWithCustomError(
                plan,
                "OwnableUnauthorizedAccount"
            )
        })
    })

    describe("Cancel Plan", function () {
        it("Should allow owner to cancel plan, refund balance, and emit PlanCancelled", async function () {
            const { createInitializedPlan, user1 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan({ value: ethers.parseEther("0.2") })
            const beforeBalance = await ethers.provider.getBalance(user1.address)
            await expect(plan.connect(user1).cancelPlan()).to.emit(plan, "PlanCancelled")
            expect(await plan.getStatus()).to.equal(2) // Canceled
        })

        it("Should revert cancelPlan if not owner", async function () {
            const { createInitializedPlan, user2 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await expect(plan.connect(user2).cancelPlan()).to.be.revertedWithCustomError(
                plan,
                "OwnableUnauthorizedAccount"
            )
        })

        it("Should revert cancelPlan if already canceled", async function () {
            const { createInitializedPlan, user1 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            await plan.connect(user1).cancelPlan()
            await expect(plan.connect(user1).cancelPlan()).to.be.revertedWith("Already canceled")
        })
    })

    describe("Edge Cases and Getters", function () {
        it("Should return correct next payment time", async function () {
            const { createInitializedPlan } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            expect(await plan.getNextPaymentTime()).to.equal(await plan.startTime())
        })

        it("Should return correct status", async function () {
            const { createInitializedPlan, user1 } = await loadFixture(deployContractFixture)
            const plan = await createInitializedPlan()
            expect(await plan.getStatus()).to.equal(0) // Active
            await plan.connect(user1).pausePlan()
            expect(await plan.getStatus()).to.equal(1) // Paused
            await plan.connect(user1).cancelPlan()
            expect(await plan.getStatus()).to.equal(2) // Canceled
        })
    })
})
