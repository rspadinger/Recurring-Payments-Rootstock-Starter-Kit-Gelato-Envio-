const { expect } = require("chai")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")
const { ethers } = require("hardhat")

describe("WillFactory Contract", function () {
    // Deploy all required contracts and set up the environment
    async function deployContractFixture() {
        const [owner, user1, user2, user3] = await ethers.getSigners()

        // Deploy mock ERC20 tokens for testing
        const MockToken = await ethers.getContractFactory("MockERC20")
        const mockToken1 = await MockToken.deploy("Mock Token 1", "MTK1", 18, ethers.parseEther("100000"))
        const mockToken2 = await MockToken.deploy("Mock Token 2", "MTK2", 6, ethers.parseEther("100000"))

        // Deploy WillEscrow with factory address
        const WillEscrow = await ethers.getContractFactory("WillEscrow")
        const willEscrow = await WillEscrow.deploy()

        // Deploy WillRegistry first
        const WillRegistry = await ethers.getContractFactory("WillRegistry")
        const willRegistry = await WillRegistry.deploy()

        // Deploy WillFactory
        const WillFactory = await ethers.getContractFactory("WillFactory")
        const willFactory = await WillFactory.deploy(willRegistry.target, willEscrow.target)

        // Set factory in escrow and registry
        await willEscrow.setFactory(willFactory.target)
        await willRegistry.setFactory(willFactory.target)

        // Mint tokens to users for testing
        await mockToken1.mint(user1.address, ethers.parseEther("1000"))
        await mockToken2.mint(user1.address, ethers.parseUnits("1000", 6))

        // Approve tokens for factory
        await mockToken1.connect(user1).approve(willFactory.target, ethers.parseEther("1000"))
        await mockToken2.connect(user1).approve(willFactory.target, ethers.parseUnits("1000", 6))

        return {
            willFactory,
            willEscrow,
            willRegistry,
            mockToken1,
            mockToken2,
            owner,
            user1,
            user2,
            user3,
        }
    }

    describe("Deployment and Initialization", function () {
        it("Should deploy with correct initial state", async function () {
            const { willFactory, willEscrow, willRegistry } = await loadFixture(deployContractFixture)

            expect(await willFactory.escrow()).to.equal(willEscrow.target)
            expect(await willFactory.registry()).to.equal(willRegistry.target)
            expect(await willFactory.lastWillImplementation()).to.not.equal(ethers.ZeroAddress)
        })
    })
})
