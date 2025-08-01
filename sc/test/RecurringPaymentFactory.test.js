const { expect } = require("chai")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")
const { ethers } = require("hardhat")

describe("RecurringPaymentFactory Contract", function () {
    // Deploy all required contracts and set up the environment
    async function deployContractFixture() {
        const [owner, user1, user2, user3] = await ethers.getSigners()

        // Deploy RecurringPaymentFactory
        const RecurringPaymentFactory = await ethers.getContractFactory("RecurringPaymentFactory")
        const recurringPaymentFactory = await RecurringPaymentFactory.deploy()


        return {
            recurringPaymentFactory
            owner,
            user1,
        }
    }

    describe("Deployment and Initialization", function () {
        it("Should deploy with correct initial state", async function () {
            const { recurringPaymentFactory, willEscrow, willRegistry } = await loadFixture(deployContractFixture)

        })
    })
})
