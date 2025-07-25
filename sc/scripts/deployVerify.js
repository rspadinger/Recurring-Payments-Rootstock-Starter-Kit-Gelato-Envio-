const fs = require("fs")
const path = require("path")

const { RECIPIENT, GELATO_AUTOMATION_RSKTESTNET } = process.env

async function main() {
    const network = hre.network.name
    const verifyCommands = []

    // Deploy RecurringPaymentFactory
    const RecurringPaymentFactory = await ethers.getContractFactory("RecurringPaymentFactory")
    const recurringPaymentFactory = await RecurringPaymentFactory.deploy(GELATO_AUTOMATION_RSKTESTNET)
    await recurringPaymentFactory.waitForDeployment()
    console.log("RecurringPaymentsFactory: ", recurringPaymentFactory.target)

    verifyCommands.push(
        `npx hardhat verify --network ${network} ${recurringPaymentFactory.target} "${GELATO_AUTOMATION_RSKTESTNET}"`
    )

    // Write verification commands to verify.sh
    const verifyFilePath = path.join(__dirname, "verify.sh")
    fs.writeFileSync(verifyFilePath, verifyCommands.join("\n"))
    console.log(`\n Verification commands saved to ${verifyFilePath}`)
    console.log(" You can now run:\n")
    console.log(`   bash ${verifyFilePath}\n`)

    //create plan
    const now = Math.floor(Date.now() / 1000) // current timestamp in seconds
    const tx = await recurringPaymentFactory.createPlan(RECIPIENT, 100, 120, now + 30, {
        value: 500,
    })
    await tx.wait()
    console.log("Recurring payment plan created.")
}

main()

//npm run deploy
//npm run verify

//Factory: 0xe6f758beBD1298f94D43ba8bd2a6802B8f0535A7
//RecurringPayments: 0x64748677Bde4c2eEd203Be4E2432De8CB9019593
