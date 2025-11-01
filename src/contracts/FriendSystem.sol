// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./UserRegistry.sol";

contract FriendSystem {
    UserRegistry public registry;

    constructor(address _registry) {
        registry = UserRegistry(_registry);
    }

    enum RequestStatus { NONE, SENT, RECEIVED, FRIENDS }

    struct FriendRequest {
        RequestStatus status;
    }

    // user => (other user => status)
    mapping(address => mapping(address => RequestStatus)) public relations;

    event FriendRequestSent(address indexed from, address indexed to);
    event FriendRequestAccepted(address indexed from, address indexed to);
    event FriendRemoved(address indexed user, address indexed exFriend);
    event FriendRequestDeclined(address indexed from, address indexed to);

    error NotRegistered();
    error AlreadyFriends();
    error RequestAlreadySent();
    error NoIncomingRequest();

    modifier onlyRegistered() {
        if (!registry.isRegistered(msg.sender)) revert NotRegistered();
        _;
    }

    function sendFriendRequest(address to) external onlyRegistered {
        if (!registry.isRegistered(to)) revert NotRegistered();
        if (relations[msg.sender][to] == RequestStatus.FRIENDS) revert AlreadyFriends();
        if (relations[msg.sender][to] == RequestStatus.SENT) revert RequestAlreadySent();

        relations[msg.sender][to] = RequestStatus.SENT;
        relations[to][msg.sender] = RequestStatus.RECEIVED;

        emit FriendRequestSent(msg.sender, to);
    }

    function acceptFriendRequest(address from) external onlyRegistered {
        if (relations[msg.sender][from] != RequestStatus.RECEIVED) revert NoIncomingRequest();

        relations[msg.sender][from] = RequestStatus.FRIENDS;
        relations[from][msg.sender] = RequestStatus.FRIENDS;

        emit FriendRequestAccepted(from, msg.sender);
    }

    function declineFriendRequest(address from) external onlyRegistered {
        if (relations[msg.sender][from] != RequestStatus.RECEIVED) revert NoIncomingRequest();

        relations[msg.sender][from] = RequestStatus.NONE;
        relations[from][msg.sender] = RequestStatus.NONE;

        emit FriendRequestDeclined(from, msg.sender);
    }

    function removeFriend(address friendAddr) external onlyRegistered {
        if (relations[msg.sender][friendAddr] != RequestStatus.FRIENDS) revert AlreadyFriends();

        relations[msg.sender][friendAddr] = RequestStatus.NONE;
        relations[friendAddr][msg.sender] = RequestStatus.NONE;

        emit FriendRemoved(msg.sender, friendAddr);
    }

    function getRelation(address a, address b) external view returns (RequestStatus) {
        return relations[a][b];
    }

    function areFriends(address a, address b) external view returns (bool) {
    return relations[a][b] == RequestStatus.FRIENDS;
}

}
