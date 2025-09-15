// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./RecurringPaymentFactory.sol";
import "./AutomateTaskCreatorUpgradeable.sol";

import "hardhat/console.sol";

/// @title Recurring Payments on Rootstock with Gelato
/// @notice Allows users to create recurring payment plans
/// @dev Uses Gelato Solidity Functions to automate periodic payments
contract RecurringPayment is Initializable, Ownable, AutomateTaskCreatorUpgradeable {
    address public immutable factory;

    address public payer;
    address public recipient;
    uint256 public amount;
    uint256 public interval;
    uint256 public startTime;
    bytes32 public taskId;
    string public title;

    enum PlanStatus {
        Active,
        Paused,
        Canceled
    }
    PlanStatus public status;

    //@note this is not required, because we'll use graphql
    uint256 public lastPaid;
    uint256 public totalPayments;

    event PaymentExecuted(
        address indexed plan,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp,
        string title
    );

    event FundsAdded(
        address indexed plan,
        address indexed planOwner,
        address indexed payer,
        uint256 amount,
        uint256 timestamp,
        string title
    );

    event FundsReceived(
        address indexed plan,
        address indexed planOwner,
        address indexed payer,
        uint256 amount,
        uint256 timestamp,
        string title
    );

    event PaymentTaskCreated(address indexed payer, bytes32 taskId, address plan);
    event AmountUpdated(address indexed plan, uint256 oldAmount, uint256 newAmount);
    event IntervalUpdated(address indexed plan, uint256 oldInterval, uint256 newInterval);
    event PlanPaused(address indexed plan, address indexed payer, uint256 timestamp);
    event PlanUnpaused(address indexed plan, address indexed payer, uint256 timestamp);
    event PlanCancelled(address indexed plan, address indexed payer, uint256 refundedAmount, uint256 timestamp);

    modifier onlyFactory() {
        require(msg.sender == factory, "Not Factory");
        _;
    }

    /// @notice factory and automate are immutable values set in the implementation contract,
    /// and all clones will share those same values via the shared bytecode.
    /// Also, because RecurringPayment contracts are clones (constructor is not executed on clones),
    /// we inherit from the upgradeable version of AutomateTaskCreator.
    /// This allows us to call the `AutomateReady.init()` function inside `initialize()`,
    /// ensuring the correct `dedicatedMsgSender` proxy is derived for each RecurringPayment clone.
    /// @dev Sets the factory address and initializes the AutomateTaskCreator with the Gelato Automate contract.
    /// @param _factory The address of the RecurringPaymentFactory contract.
    /// @param _automate The address of the Gelato Automate contract used for task automation.
    constructor(address _factory, address _automate) Ownable(msg.sender) AutomateTaskCreatorUpgradeable(_automate) {
        factory = _factory;
    }

    // ********************* EXTERNAL FUNCTIONS *********************

    /// @notice Handle funds sent via plain transfer/send or EOA
    receive() external payable {
        emit FundsReceived(address(this), payer, msg.sender, msg.value, block.timestamp, title);
    }

    /// @notice Initializes the recurring payment plan with user-defined parameters.
    /// @dev This function replaces the constructor in cloneable contracts. Can only be called once.
    /// @param _payer The address funding the payment plan and receiving refunds upon cancellation.
    /// @param _recipient The address receiving the recurring payments.
    /// @param _amount The amount to be paid in each interval (in wei).
    /// @param _interval The time between payments, in seconds.
    /// @param _startTime The timestamp when the first payment can be executed.
    /// @param _title The title of the payment plan.
    function initialize(
        address _payer,
        address _recipient,
        uint256 _amount,
        uint256 _interval,
        uint256 _startTime,
        string memory _title
    ) external payable initializer {
        payer = _payer;
        recipient = _recipient;
        amount = _amount;
        interval = _interval;
        startTime = _startTime;
        status = PlanStatus.Active;
        title = _title;

        _transferOwnership(_payer);

        //required to set dedicatedMsgSender (proxy derived from this contract) and feeCollector in AutomateReadyUpgradeable contract
        __AutomateReady_init(address(this));

        _createTask();
    }

    /// @notice Executes the scheduled payment if conditions are met
    function executePayment() external onlyDedicatedMsgSender {
        require(status == PlanStatus.Active, "Plan not active");
        require(address(this).balance >= amount, "Insufficient user funds");

        if (lastPaid == 0) {
            require(block.timestamp >= startTime, "Too early for first payment");
        } else {
            require(block.timestamp >= lastPaid + interval, "Payment interval not reached");
        }

        //creatorFunds[plan.payer] -= plan.amount;
        lastPaid = block.timestamp;
        totalPayments += 1;

        //this could be extended to support ERC20 tokens for payments
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit PaymentExecuted(address(this), payer, recipient, amount, block.timestamp, title);
    }

    /// @notice Adds RSK to the funding balance
    /// @dev This could be extended to support ERC20 tokens for funding and payments. Function can be called by any address
    function addFunds() external payable {
        require(msg.value > 0, "No funding was provided");
        emit FundsAdded(address(this), payer, msg.sender, msg.value, block.timestamp, title);
    }

    /// @notice Cancel a recurring payment plan (only the owner can)
    function cancelPlan() external onlyOwner {
        require(status != PlanStatus.Canceled, "Already canceled");
        status = PlanStatus.Canceled;

        _cancelTask(taskId);

        // Refund remaining RSK to the payer
        uint256 refund = address(this).balance;
        if (refund > 0) {
            (bool success, ) = payer.call{value: refund}("");
            require(success, "Refund failed");
        }

        emit PlanCancelled(address(this), payer, refund, block.timestamp);
    }

    /// @notice Update the recurring payment amount
    /// @dev Only the owner (payer) can modify the payment amount
    /// @param _newAmount The new amount to be paid in each cycle (must be greater than 0)
    function setAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > 0, "Amount must be greater than zero");
        uint256 oldAmount = amount;
        amount = _newAmount;

        emit AmountUpdated(address(this), oldAmount, _newAmount);
    }

    /// @notice Update the payment interval (in seconds)
    /// @dev Only the owner (payer) can modify the payment interval
    /// @param _newInterval The new interval between payments (must be at least 60 seconds)
    function setInterval(uint256 _newInterval) external onlyOwner {
        require(_newInterval >= 60, "Interval must be at least 60 seconds");
        uint256 oldInterval = interval;
        interval = _newInterval;
        emit IntervalUpdated(address(this), oldInterval, _newInterval);
    }

    /// @notice Pause the recurring payment plan
    /// @dev Only the owner (payer) can pause the plan; no payments can be executed while paused
    function pausePlan() external onlyOwner {
        require(status == PlanStatus.Active, "Only active plans can be paused");
        status = PlanStatus.Paused;
        emit PlanPaused(address(this), payer, block.timestamp);
    }

    /// @notice Unpause the recurring payment plan
    /// @dev Only the owner (payer) can unpause the plan
    function resumePlan() external onlyOwner {
        require(status == PlanStatus.Paused, "Only paused plans can be resumed");
        status = PlanStatus.Active;
        emit PlanUnpaused(address(this), payer, block.timestamp);
    }

    // fees are subsidized on Testnet, for Mainnet, funds need to be provided to pay for txn fees
    // for now, deposit USDC on Polygon
    // don't forget to approve GasTank (0x7506C12a824d73D9b08564d5Afc22c949434755e) to spend USDC before depositing =>
    // Polygon USDC: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 => call approve (on write as proxy in polygonscan.com)
    function depositFundsForGelatoFeePayments(uint256 _amount, address _token) external payable {
        _depositFunds1Balance(_amount, _token, address(this));
    }

    // ********************* GETTER FUNCTIONS *********************

    /// @notice Check if a plan is ready for payment
    /// @return canExec True if payment should be executed now
    /// @return execPayload payload for call to executePayment
    function checkPayment() external view returns (bool canExec, bytes memory execPayload) {
        bool shouldPay = (status == PlanStatus.Active &&
            address(this).balance >= amount &&
            (lastPaid == 0 ? block.timestamp >= startTime : block.timestamp >= lastPaid + interval));

        if (shouldPay) {
            return (true, abi.encodeCall(this.executePayment, ()));
        }

        return (false, bytes(""));
    }

    /// @notice Get timestamp of next payment
    function getNextPaymentTime() external view returns (uint256) {
        if (status != PlanStatus.Active) return 0;
        if (lastPaid == 0) return startTime;
        return lastPaid + interval;
    }

    /// @notice Get status of plan
    function getStatus() external view returns (PlanStatus) {
        return status;
    }

    // ********************* INTERNAL FUNCTIONS *********************

    function _createTask() internal {
        require(taskId == bytes32(""), "Task already created");

        bytes memory execData = abi.encode(this.executePayment.selector);

        //it is important to specify the modules in the correct order as specified in Types::Module
        ModuleData memory moduleData = ModuleData({modules: new Module[](3), args: new bytes[](3)});
        moduleData.modules[0] = Module.RESOLVER;
        moduleData.modules[1] = Module.PROXY;
        moduleData.modules[2] = Module.TRIGGER;

        moduleData.args[0] = _resolverModuleArg(address(this), abi.encodeCall(this.checkPayment, ()));
        moduleData.args[1] = _proxyModuleArg();
        moduleData.args[2] = _blockTriggerModuleArg();

        taskId = _createTask(address(this), execData, moduleData, address(0));

        emit PaymentTaskCreated(payer, taskId, address(this));
    }
}
