// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Chats - 1:1 sessions + groups; emits events with CIDs (messages stored off-chain)

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IFriends {
    function areFriends(address a, address b) external view returns (bool);
}

contract Chats is ReentrancyGuard, Ownable(msg.sender) {
    using Counters for Counters.Counter;
    Counters.Counter private _sessionCounter;
    Counters.Counter private _groupCounter;

    IFriends public friends;

    constructor(address friendsAddr) {
        friends = IFriends(friendsAddr);
    }

    /* ===== Sessions ===== */
    struct Session {
        uint256 id;
        address a;
        address b;
        bool exists;
        bool closed;
        string lastCid;
        uint256 createdAt;
    }

    mapping(uint256 => Session) public sessions;
    mapping(address => uint256[]) private _userSessions;

    event SessionCreated(uint256 indexed sessionId, address indexed a, address indexed b, uint256 ts);
    event SessionClosed(uint256 indexed sessionId, address closedBy, uint256 ts);
    event DirectMessage(uint256 indexed sessionId, address indexed from, string cid, uint256 ts);

    error NotFriends();
    error SessionNotFound();
    error NotParticipant();

    function createSession(address peer) external nonReentrant returns (uint256) {
        if (!friends.areFriends(msg.sender, peer)) revert NotFriends();

        _sessionCounter.increment();
        uint256 sid = _sessionCounter.current();

        sessions[sid] = Session({
            id: sid,
            a: msg.sender,
            b: peer,
            exists: true,
            closed: false,
            lastCid: "",
            createdAt: block.timestamp
        });

        _userSessions[msg.sender].push(sid);
        _userSessions[peer].push(sid);

        emit SessionCreated(sid, msg.sender, peer, block.timestamp);
        return sid;
    }

    function sendMessage(uint256 sessionId, string calldata cid) external nonReentrant {
        Session storage s = sessions[sessionId];
        if (!s.exists || s.closed) revert SessionNotFound();
        if (msg.sender != s.a && msg.sender != s.b) revert NotParticipant();

        s.lastCid = cid;

        emit DirectMessage(sessionId, msg.sender, cid, block.timestamp);
    }

    function endSession(uint256 sessionId) external nonReentrant {
        Session storage s = sessions[sessionId];
        if (!s.exists) revert SessionNotFound();
        if (msg.sender != s.a && msg.sender != s.b) revert NotParticipant();

        s.closed = true;

        emit SessionClosed(sessionId, msg.sender, block.timestamp);
    }

    function getMySessions(address who) external view returns (uint256[] memory) {
        return _userSessions[who];
    }

    function getLastCid(uint256 sessionId) external view returns (string memory) {
        return sessions[sessionId].lastCid;
    }

    /* ===== Groups ===== */

    struct Group {
        uint256 id;
        address creator;
        string name;
        bool exists;
        uint256 createdAt;
    }

    mapping(uint256 => Group) public groups;
    mapping(uint256 => address[]) private _groupMembers;

    // ✅ FIXED MAPPING SYNTAX HERE
    mapping(uint256 => mapping(address => bool)) private _isGroupMember;

    event GroupCreated(uint256 indexed groupId, address indexed creator, string name, uint256 ts);
    event GroupMemberAdded(uint256 indexed groupId, address added);
    event GroupMemberRemoved(uint256 indexed groupId, address removed);
    event GroupMessage(uint256 indexed groupId, address indexed from, string cid, uint256 ts);
    event GroupDeleted(uint256 indexed groupId, address deletedBy, uint256 ts);

    error GroupNotFound();

    function createGroup(string calldata name, address[] calldata initialMembers)
        external
        nonReentrant
        returns (uint256)
    {
        _groupCounter.increment();
        uint256 gid = _groupCounter.current();

        groups[gid] = Group({
            id: gid,
            creator: msg.sender,
            name: name,
            exists: true,
            createdAt: block.timestamp
        });

        _groupMembers[gid].push(msg.sender);
        _isGroupMember[gid][msg.sender] = true;

        for (uint i = 0; i < initialMembers.length; i++) {
            address m = initialMembers[i];
            if (friends.areFriends(msg.sender, m) && !_isGroupMember[gid][m]) {
                _groupMembers[gid].push(m);
                _isGroupMember[gid][m] = true;
            }
        }

        emit GroupCreated(gid, msg.sender, name, block.timestamp);
        return gid;
    }

    function sendGroupMessage(uint256 groupId, string calldata cid) external nonReentrant {
        if (!groups[groupId].exists) revert GroupNotFound();
        if (!_isGroupMember[groupId][msg.sender]) revert NotParticipant();

        emit GroupMessage(groupId, msg.sender, cid, block.timestamp);
    }

    function addMember(uint256 groupId, address newMember) external nonReentrant {
        if (!groups[groupId].exists) revert GroupNotFound();
        if (!_isGroupMember[groupId][msg.sender] && msg.sender != groups[groupId].creator)
            revert NotParticipant();

        if (!_isGroupMember[groupId][newMember]) {
            _groupMembers[groupId].push(newMember);
            _isGroupMember[groupId][newMember] = true;
            emit GroupMemberAdded(groupId, newMember);
        }
    }

    function removeMember(uint256 groupId, address member) external nonReentrant {
        if (!groups[groupId].exists) revert GroupNotFound();
        if (!_isGroupMember[groupId][msg.sender] && msg.sender != groups[groupId].creator)
            revert NotParticipant();

        if (_isGroupMember[groupId][member]) {
            _isGroupMember[groupId][member] = false;

            address[] storage arr = _groupMembers[groupId];
            for (uint i = 0; i < arr.length; i++) {
                if (arr[i] == member) {
                    arr[i] = arr[arr.length - 1];
                    arr.pop();
                    break;
                }
            }

            emit GroupMemberRemoved(groupId, member);
        }
    }

    function deleteGroup(uint256 groupId) external nonReentrant {
        if (!groups[groupId].exists) revert GroupNotFound();
        if (msg.sender != groups[groupId].creator && msg.sender != owner()) revert NotParticipant();

        delete groups[groupId];
        delete _groupMembers[groupId];

        emit GroupDeleted(groupId, msg.sender, block.timestamp);
    }
}
