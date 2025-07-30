const { OWNER, RECIPIENT, RSK_TESTNET_RPC_URL, WALLET_PRIVATE_KEY } = process.env

const factoryAddress = "0xe6f758beBD1298f94D43ba8bd2a6802B8f0535A7"
const planAddress = "0x64748677Bde4c2eEd203Be4E2432De8CB9019593"

let tx

async function main() {
    const [signer] = await ethers.getSigners()
    const factory = await ethers.getContractAt("RecurringPaymentFactory", factoryAddress, signer)
    const plan = await ethers.getContractAt("RecurringPayment", planAddress, signer)

    if (true) {
        const recPayAddress = await factory.getPayerPlans()
        console.log("RecPay Address: ", recPayAddress[0])

        const recPay = await ethers.getContractAt("RecurringPayment", recPayAddress[0], signer)
        console.log("Automate: ", await recPay.automate())
        console.log("Factory: ", await recPay.factory())
        console.log("TaskId: ", await recPay.taskId())
        console.log("Total Payments: ", await recPay.totalPayments())
        console.log("Last Paid: ", await recPay.lastPaid())

        //console.log("Status: ", await recPay.status())
        console.log("Amount: ", await recPay.amount())
        console.log("Start Time: ", await recPay.startTime())
        console.log("Balance: ", await await ethers.provider.getBalance(plan))
        console.log("Block.timestamp: ", (await ethers.provider.getBlock("latest")).timestamp)

        const [canExec, execPayload] = await recPay.checkPayment()
        console.log("canExec:", canExec)
        console.log("execPayload (encoded call):", execPayload)

        console.log("dedicatedMsgSender: ", await recPay.dedicatedMsgSender())
    }

    // create plan
    if (false) {
        const now = Math.floor(Date.now() / 1000) // current timestamp in seconds
        tx = await factory.createPlan(RECIPIENT, 100, 120, now + 20, {
            value: 500,
        })
        await tx.wait()

        // const recPayAddress = await factory.getPayerPlans()
        // console.log("RecPay Address: ", recPayAddress[1])

        console.log("Recurring payment plan created.")
    }

    // change amount
    if (false) {
        tx = await plan.pausePlan()
        await tx.wait()
        console.log("Plan paused.")
    }

    // pause plan
    if (true) {
        tx = await plan.setAmount(100)
        await tx.wait()
        console.log("Amount changed!")
    }

    // unpause plan
    if (false) {
        tx = await plan.resumePlan()
        await tx.wait()
        console.log("Plan unpaused.")
    }

    // cancel plan
    if (false) {
        tx = await plan.cancelPlan()
        await tx.wait()
        console.log("Plan cancelled.")
    }
}

main()

//sample task: https://app.gelato.cloud/functions/0xd1f20db3caa29feb86bdc124cfb90ee66db4f034079400e44e12f62d7526ab7d?type=overview&chainId=31
