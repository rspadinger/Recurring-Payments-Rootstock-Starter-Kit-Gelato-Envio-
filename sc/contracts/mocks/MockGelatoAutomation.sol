// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "../Types.sol";

/**
 * @dev Mock contract to simulate Gelato Automate functionality for testing
 */
contract MockGelatoAutomation is IAutomate {
    mapping(bytes32 => bool) public tasks;
    uint256 public taskCounter;

    // Mock addresses for the automation system - will be set in constructor
    address public mockGelato;
    address public mockProxyModule;
    address public mockOpsProxyFactory;

    // Mock fee details
    uint256 public constant MOCK_FEE = 0.001 ether;
    address public constant MOCK_FEE_TOKEN = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE); // ETH

    event TaskCreated(
        address indexed execAddress,
        bytes execDataOrSelector,
        ModuleData moduleData,
        address feeToken,
        bytes32 indexed taskId
    );

    event TaskCancelled(bytes32 indexed taskId);

    constructor(address _mockGelato, address _mockProxyModule, address _mockOpsProxyFactory) {
        mockGelato = _mockGelato;
        mockProxyModule = _mockProxyModule;
        mockOpsProxyFactory = _mockOpsProxyFactory;
    }

    function createTask(
        address _execAddress,
        bytes calldata _execDataOrSelector,
        ModuleData calldata _moduleData,
        address _feeToken
    ) external returns (bytes32 taskId) {
        taskId = keccak256(abi.encodePacked(_execAddress, _execDataOrSelector, taskCounter));
        taskCounter++;
        tasks[taskId] = true;

        emit TaskCreated(_execAddress, _execDataOrSelector, _moduleData, _feeToken, taskId);
        return taskId;
    }

    function cancelTask(bytes32 _taskId) external {
        require(tasks[_taskId], "Task does not exist");
        tasks[_taskId] = false;
        emit TaskCancelled(_taskId);
    }

    function getTask(bytes32 _taskId) external view returns (bool exists) {
        return tasks[_taskId];
    }

    // IAutomate interface functions
    function getFeeDetails() external pure returns (uint256, address) {
        return (MOCK_FEE, MOCK_FEE_TOKEN);
    }

    function gelato() external view returns (address payable) {
        return payable(mockGelato);
    }

    function taskModuleAddresses(Module) external view returns (address) {
        return mockProxyModule;
    }
}

/**
 * @dev Mock IGelato contract
 */
contract MockGelato is IGelato {
    address public feeCollectorAddress;

    constructor(address _feeCollector) {
        feeCollectorAddress = _feeCollector;
    }

    function feeCollector() external view returns (address) {
        return feeCollectorAddress;
    }
}

/**
 * @dev Mock IProxyModule contract
 */
contract MockProxyModule is IProxyModule {
    address public opsProxyFactoryAddress;

    constructor(address _opsProxyFactory) {
        opsProxyFactoryAddress = _opsProxyFactory;
    }

    function opsProxyFactory() external view returns (address) {
        return opsProxyFactoryAddress;
    }
}

/**
 * @dev Mock IOpsProxyFactory contract
 */
contract MockOpsProxyFactory is IOpsProxyFactory {
    function getProxyOf(address account) external pure returns (address, bool) {
        // Create a deterministic proxy address for testing
        address proxy = address(uint160(uint256(keccak256(abi.encodePacked("proxy", account)))));
        return (proxy, true);
    }
}
