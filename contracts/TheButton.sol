//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/// @notice TheButton is a contract, where participants pay a fixed amount of ether to call deposit,
/// and then if 3 blocks pass without someone calling deposit, whoever pressed the
/// button last can call claim and get the other participants’ deposits.
contract TheButton {
    /// @notice list of winner rewards
    mapping (address => uint) public rewards;
    /// @notice pending rewards which is not claimed.
    uint public pendingRewards;
    /// @notice last deposited block number.
    uint public lastDepositedBlock;
    /// @notice address of last depositor.
    address public lastDepositor;

    uint constant public MAX_INT = 2**256 - 1;
    uint constant public DEPOSIT_FEE = 0.001 ether;

    event Deposit(address user);
    event Reward(address user, uint amount);
    event Claim(address user, uint amount);

    receive() external payable {
        deposit();
    }

    /**
     * @notice participate the game with fixed amount of ether.
     */
    function deposit() public payable {
        require(msg.value == DEPOSIT_FEE, "TheButton: wrong amount");
        if (block.number - 3 > lastDepositedBlock) {
            emit Reward(lastDepositor, pendingRewards);
            rewards[lastDepositor] += pendingRewards;
            pendingRewards = 0;
        } 
        lastDepositedBlock = pendingRewards == 0 ? MAX_INT : block.number;
        lastDepositor = msg.sender;
        pendingRewards += msg.value;
        emit Deposit(msg.sender);
    }

    /**
     * @notice claim the rewards that rewarded in the game. 
     */
    function claim() external {
        require(rewards[msg.sender] > 0, "TheButton: nothing to claim");
        payable(msg.sender).transfer(rewards[msg.sender]);
        emit Claim(msg.sender, rewards[msg.sender]);
    }
    
    /**
     * @notice return the claimable rewards amount of eth 
     * @param user:address address to check claimable rewards
     */
    function claimableRewards(address user) external view returns(uint) {
        return rewards[user];
    }
}
