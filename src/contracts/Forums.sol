// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IUsers {
    function isRegistered(address user) external view returns (bool);
}

contract Forums is AccessControl {
    using Counters for Counters.Counter;

    // Counters
    Counters.Counter private _forumCounter;
    Counters.Counter private _postCounter;
    Counters.Counter private _commentCounter;

    // Roles
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    // User registry reference
    IUsers public users;

    // ===================== STRUCTS ======================

    struct Forum {
        uint256 id;
        string title;
        address creator;
        bool exists;
        uint256 createdAt;
    }

    struct Post {
        uint256 id;
        uint256 forumId;
        address author;
        string cid;     // IPFS CID
        uint256 ts;
        int256 score;
        bool exists;
    }

    struct Comment {
        uint256 id;
        uint256 postId;
        address author;
        string cid;     // IPFS CID for comment
        uint256 ts;
    }

    // ===================== STORAGE ======================

    mapping(uint256 => Forum) public forums;
    mapping(uint256 => Post) public posts;
    mapping(uint256 => Comment) public comments;

    mapping(uint256 => uint256[]) private _forumPosts;
    mapping(uint256 => uint256[]) private _postComments;

    // postId → user → 1 / -1 / 0
    mapping(uint256 => mapping(address => int8)) public voteByUser;

    // ===================== EVENTS ======================

    event ForumCreated(uint256 indexed forumId, string title, address creator);
    event ForumDeleted(uint256 indexed forumId, address deletedBy);

    event PostCreated(uint256 indexed postId, uint256 indexed forumId, address author, string cid);
    event PostVoted(uint256 indexed postId, address voter, int8 vote, int256 newScore);

    event CommentCreated(uint256 indexed commentId, uint256 indexed postId, address author, string cid);

    // ===================== ERRORS ======================

    error NotRegistered();

    // ===================== CONSTRUCTOR ======================

    constructor(address usersAddr) {
        users = IUsers(usersAddr);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender);
    }

    // ===================== FORUM FUNCTIONS ======================

    function createForum(string calldata title) external returns (uint256) {
        if (!users.isRegistered(msg.sender)) revert NotRegistered();

        _forumCounter.increment();
        uint256 fid = _forumCounter.current();

        forums[fid] = Forum({
            id: fid,
            title: title,
            creator: msg.sender,
            exists: true,
            createdAt: block.timestamp
        });

        emit ForumCreated(fid, title, msg.sender);
        return fid;
    }

    function deleteForum(uint256 forumId) external {
        Forum storage f = forums[forumId];
        require(f.exists, "Not found");
        require(
            f.creator == msg.sender || hasRole(MODERATOR_ROLE, msg.sender),
            "Not allowed"
        );

        delete forums[forumId];
        emit ForumDeleted(forumId, msg.sender);
    }

    // ===================== POSTS ======================

    function createPost(uint256 forumId, string calldata cid) external returns (uint256) {
        if (!users.isRegistered(msg.sender)) revert NotRegistered();
        require(forums[forumId].exists, "Forum not found");

        _postCounter.increment();
        uint256 pid = _postCounter.current();

        posts[pid] = Post({
            id: pid,
            forumId: forumId,
            author: msg.sender,
            cid: cid,
            ts: block.timestamp,
            score: 0,
            exists: true
        });

        _forumPosts[forumId].push(pid);

        emit PostCreated(pid, forumId, msg.sender, cid);
        return pid;
    }

    function getPostsForForum(uint256 forumId)
        external
        view
        returns (uint256[] memory)
    {
        return _forumPosts[forumId];
    }

    function votePost(uint256 postId, int8 vote) external {
        require(posts[postId].exists, "Post not found");
        require(vote == 1 || vote == -1 || vote == 0, "Invalid vote");

        int8 prev = voteByUser[postId][msg.sender];

        // remove previous vote
        if (prev == 1) posts[postId].score -= 1;
        else if (prev == -1) posts[postId].score += 1;

        voteByUser[postId][msg.sender] = vote;

        // add new vote
        if (vote == 1) posts[postId].score += 1;
        else if (vote == -1) posts[postId].score -= 1;

        emit PostVoted(postId, msg.sender, vote, posts[postId].score);
    }

    // ===================== COMMENTS ======================

    function createComment(uint256 postId, string calldata cid) external returns (uint256) {
        if (!users.isRegistered(msg.sender)) revert NotRegistered();
        require(posts[postId].exists, "Post not found");

        _commentCounter.increment();
        uint256 cid_ = _commentCounter.current();

        comments[cid_] = Comment({
            id: cid_,
            postId: postId,
            author: msg.sender,
            cid: cid,
            ts: block.timestamp
        });

        _postComments[postId].push(cid_);

        emit CommentCreated(cid_, postId, msg.sender, cid);
        return cid_;
    }

    function getCommentsForPost(uint256 postId)
        external
        view
        returns (uint256[] memory)
    {
        return _postComments[postId];
    }
}
