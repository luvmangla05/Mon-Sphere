// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title UserRegistry - register usernames & store optional public key
/// @notice Lightweight user registry for identity + pubKey used by other modules

import "@openzeppelin/contracts/access/Ownable.sol";

contract UserRegistry is Ownable {

    constructor() Ownable(msg.sender) {}   // ✅ FIXED OpenZeppelin v5 constructor

    struct Profile {
        string username;
        string pubKey; // optional encryption public key or other metadata pointer
        bool exists;
    }

    mapping(address => Profile) private _profiles;
    mapping(string => address) private _usernameToAddr;

    event UserRegistered(address indexed user, string username);
    event PublicKeyUpdated(address indexed user, string pubKey);
    event UserDeleted(address indexed user);

    error UsernameTaken();
    error NotRegistered();
    error AlreadyRegistered();

    /// @notice register a new account with username and optional public key
    function register(string calldata username, string calldata pubKey) external {
        if (_profiles[msg.sender].exists) revert AlreadyRegistered();
        if (_usernameToAddr[username] != address(0)) revert UsernameTaken();

        _profiles[msg.sender] = Profile({ username: username, pubKey: pubKey, exists: true });
        _usernameToAddr[username] = msg.sender;

        emit UserRegistered(msg.sender, username);
        if (bytes(pubKey).length > 0) {
            emit PublicKeyUpdated(msg.sender, pubKey);
        }
    }

    /// @notice update or set public key
    function updatePublicKey(string calldata pubKey) external {
        if (!_profiles[msg.sender].exists) revert NotRegistered();
        _profiles[msg.sender].pubKey = pubKey;
        emit PublicKeyUpdated(msg.sender, pubKey);
    }

    /// @notice delete account and free username (irreversible)
    function deleteAccount() external {
        if (!_profiles[msg.sender].exists) revert NotRegistered();
        string memory name = _profiles[msg.sender].username;
        delete _usernameToAddr[name];
        delete _profiles[msg.sender];
        emit UserDeleted(msg.sender);
    }

    /* ========== VIEWS ========== */

    function isRegistered(address who) external view returns (bool) {
        return _profiles[who].exists;
    }

    function getProfile(address who) external view returns (string memory username, string memory pubKey, bool exists) {
        Profile storage p = _profiles[who];
        return (p.username, p.pubKey, p.exists);
    }

    function addressOfUsername(string calldata username) external view returns (address) {
        return _usernameToAddr[username];
    }
}
