const { OWNER, RECIPIENT, RSK_TESTNET_RPC_URL, WALLET_PRIVATE_KEY } = process.env

const factoryAddress = "0x2A99FeB537de85d249fF4eCC0313B59B0fbeDEBa"
const planAddress = "0x628ADBdd079fa810A2Dc19Cc2a35F64d50399C98"

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

        console.log("Active: ", await recPay.active())
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
        console.log("Recurring payment plan created.")
    }

    // pause plan
    if (false) {
        tx = await plan.unpausePlan()
        await tx.wait()
        console.log("Plan paused.")
    }

    // cancel plan
    if (false) {
        tx = await plan.cancelPlan()
        await tx.wait()
        console.log("Plan cancelled.")
    }
}

main()
