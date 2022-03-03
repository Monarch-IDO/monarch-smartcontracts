// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { ERC20Vote } from "./vendor/ERC20Vote.sol";

contract ForgeV1 is Initializable, ERC20Vote, ReentrancyGuardUpgradeable, AccessControlUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Stake {
        uint256 amount;
        uint256 shares;
        uint256 lockTime;
        uint256 lockDays;
        bool unstaked;
    }

    uint256 private constant PRECISION = 1e8;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    IERC20Upgradeable public token;
    mapping(address => Stake[]) public users;
    uint256 public totalUsers;
    uint256 public totalShares;
    uint256 public lockDaysMin;
    uint256 public lockDaysMax;
    uint256 public shareBonusPerYear;
    uint256 public shareBonusPerToken;
    uint256[50] private __gap;

    event Staked(address indexed user, uint256 amount, uint256 lockDays, uint256 shares);
    event Unstaked(address indexed staker, uint256 stakeIndex, uint256 amount);
    event UnstakedEarly(address indexed staker, uint256 stakeIndex, uint256 amount, uint256 returned);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(
        address _owner,
        address _token,
        uint256 _lockDaysMin,
        uint256 _lockDaysMax,
        uint256 _shareBonusPerYear,
        uint256 _shareBonusPerToken
    ) public initializer {
        __ReentrancyGuard_init();
        __ERC20Vote_init("stakedXRUNE", "sXRUNE", 18);
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, _owner);
        token = IERC20Upgradeable(_token);
        lockDaysMin = _lockDaysMin;
        lockDaysMax = _lockDaysMax;
        shareBonusPerYear = _shareBonusPerYear;
        shareBonusPerToken = _shareBonusPerToken;
    }

    function _stake(address user, uint256 amount, uint256 lockDays) internal nonReentrant {
        require(lockDays >= lockDaysMin && lockDays <= lockDaysMax, "invalid lockDays");

        if (users[user].length == 0) {
            totalUsers += 1;
        }

        (uint256 shares,) = calculateShares(amount, lockDays);
        totalShares += shares;
        users[user].push(Stake({
            amount: amount,
            shares: shares,
            lockTime: uint48(block.timestamp),
            lockDays: lockDays,
            unstaked: false
        }));

        _mint(user, shares);

        emit Staked(user, amount, lockDays, shares);
    }

    function stake(uint256 amount, uint256 lockDays) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        _stake(msg.sender, amount, lockDays);
    }

    function onTokenTransfer(address user, uint amount, bytes calldata data) external {
        require(msg.sender == address(token), "onTokenTransfer: not token");
        uint256 lockDays = abi.decode(data, (uint256));
        _stake(user, amount, lockDays);
    }

    function unstake(uint stakeIndex) external nonReentrant {
        require(stakeIndex < users[msg.sender].length, "invalid index");
        Stake storage stakeRef = users[msg.sender][stakeIndex];
        require(!stakeRef.unstaked, "already unstaked");
        require(stakeRef.lockTime + (stakeRef.lockDays * 86400) <= block.timestamp, "too early");

        totalShares -= stakeRef.shares;
        stakeRef.unstaked = true;
        _burn(msg.sender, stakeRef.shares);

        token.safeTransfer(msg.sender, stakeRef.amount);

        emit Unstaked(msg.sender, stakeIndex, stakeRef.amount);
    }

    function unstakeEarly(uint stakeIndex) external nonReentrant {
        require(stakeIndex < users[msg.sender].length, "invalid index");
        Stake storage stakeRef = users[msg.sender][stakeIndex];
        require(!stakeRef.unstaked, "already unstaked");
        require(block.timestamp < stakeRef.lockTime + (stakeRef.lockDays * 86400), "not early");


        totalShares -= stakeRef.shares;
        stakeRef.unstaked = true;
        _burn(msg.sender, stakeRef.shares);

        uint256 progress = ((block.timestamp - stakeRef.lockTime) * 1e12) / (stakeRef.lockDays * 86400);
        uint256 returned = (stakeRef.amount * progress) / 1e12;
        token.safeTransfer(msg.sender, returned);

        emit UnstakedEarly(msg.sender, stakeIndex, stakeRef.amount, returned);
    }

    function calculateShares(
        uint256 amount, uint256 lockDays
    ) public view returns (uint256, uint256) {
        uint256 longTermBonus = amount * lockDays * shareBonusPerYear / 365 / PRECISION;
        uint256 stakingMoreBonus = amount * amount * shareBonusPerToken / 1e18 / PRECISION;
        uint256 shares = amount + longTermBonus + stakingMoreBonus;
        return (shares, longTermBonus);
    }

    function getUserInfo(address user) public view returns (uint256, uint256, uint256) {
        uint256 totalAmount = 0;
        uint256 totalShares = 0;
        for (uint i = 0; i < users[user].length; i++) {
            Stake storage stakeRef = users[user][i];
            if (stakeRef.unstaked) continue;

            totalAmount += stakeRef.amount;
            totalShares += stakeRef.shares;
        }
        return (totalAmount, totalShares, users[user].length);
    }

    function userStakeCount(address user) public view returns (uint) {
        return users[user].length;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        revert("non-transferable");
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        revert("non-transferable");
    }
}
