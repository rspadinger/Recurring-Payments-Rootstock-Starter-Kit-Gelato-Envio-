// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./RecurringPayment.sol";

import "hardhat/console.sol";

contract RecurringPaymentFactory is Ownable {
    address public immutable recurringPaymentImplementation;

    //@note this is not required, because we'll use graphql to get this information from the PlanCreated event
    mapping(address => address[]) public payerToPlans;
    mapping(address => address[]) public recipientToPlans;

    event PlanCreated(
        address indexed planAddress,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        uint256 interval,
        uint256 startTime
    );

    /// @notice Deploys the implementation contract for RecurringPayment with factory and Gelato automation addresses.
    /// @param _gelatoAutomation The address of the Gelato automation contract used for task scheduling.
    constructor(address _gelatoAutomation) Ownable(msg.sender) {
        recurringPaymentImplementation = address(new RecurringPayment(address(this), _gelatoAutomation));
    }

    /// @notice Creates a new recurring payment plan clone and initializes it with the specified parameters.
    /// @param _recipient The address that will receive the payments.
    /// @param _amount The amount to be paid in each interval (in wei).
    /// @param _interval The time interval (in seconds) between payments.
    /// @param _startTime The timestamp from which payments start.
    function createPlan(address _recipient, uint256 _amount, uint256 _interval, uint256 _startTime) external payable {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount >= 10, "Payment amount must be at least 10 wei");
        require(_interval >= 60, "Payment interval must be at least 1 minute");
        require(_startTime >= block.timestamp, "Start time must be in the future");
        require(msg.value >= _amount, "Insufficient initial funding");

        address plan = Clones.clone(recurringPaymentImplementation);

        payerToPlans[msg.sender].push(plan);
        recipientToPlans[_recipient].push(plan);

        RecurringPayment(payable(plan)).initialize{value: msg.value}(
            msg.sender,
            _recipient,
            _amount,
            _interval,
            _startTime
        );

        emit PlanCreated(plan, msg.sender, _recipient, _amount, _interval, _startTime);
    }

    /// @notice Returns the list of recurring payment plans created by the caller (payer).
    /// @return An array of addresses representing the payer's recurring payment plans.
    function getPayerPlans() external view returns (address[] memory) {
        return payerToPlans[msg.sender];
    }

    /// @notice Returns the list of recurring payment plans where the caller is the recipient.
    /// @return An array of addresses representing the recipient's recurring payment plans.
    function getRecipientPlans() external view returns (address[] memory) {
        return recipientToPlans[msg.sender];
    }
}
