// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AkpoloVoting is Ownable {
    IERC20 public akpoloToken;
    uint256 public votingStart;
    uint256 public votingEnd;
    bool public resultsRevealed;
    
    struct Candidate {
        string name;
        uint256 voteCount;
    }
    
    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => uint256) public votes;
    mapping(uint256 => uint256) public candidateVotes;
    
    event CandidateRegistered(uint256 indexed candidateId, string name);
    event Voted(address indexed voter, uint256 candidateId);
    event ResultsRevealed(uint256[] results);
    event VotingTimesUpdated(uint256 newVotingStart, uint256 newVotingEnd);

    constructor(address _tokenAddress, uint256 _votingStart, uint256 _votingDuration) Ownable(msg.sender) {
        akpoloToken = IERC20(_tokenAddress);
        votingStart = _votingStart;
        votingEnd = _votingStart + _votingDuration;
        resultsRevealed = false;
    }
    
    // Function to update the voting start time and duration
    function setVotingTimes(uint256 _votingStart, uint256 _votingDuration) external onlyOwner {
        votingStart = _votingStart;
        votingEnd = _votingStart + _votingDuration;
        resultsRevealed = false;  // Reset results if the times are changed
        
        emit VotingTimesUpdated(votingStart, votingEnd);
    }
    
    function registerCandidate(string memory _name) external onlyOwner {
        candidates.push(Candidate({ name: _name, voteCount: 0 }));
        emit CandidateRegistered(candidates.length - 1, _name);
    }
    
    function vote(uint256 _candidateId) external {
        require(block.timestamp >= votingStart, "Voting has not started yet");
        require(block.timestamp < votingEnd, "Voting period has ended");
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId < candidates.length, "Invalid candidate ID");
        require(akpoloToken.balanceOf(msg.sender) >= 1, "Insufficient tokens to vote");
        require(akpoloToken.transferFrom(msg.sender, address(this), 1), "Token transfer failed");
        
        votes[msg.sender] = 1;
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount += 1;
        candidateVotes[_candidateId] += 1;
        
        emit Voted(msg.sender, _candidateId);
    }
    
    function revealResults() external onlyOwner {
        require(block.timestamp >= votingEnd, "Voting period is still ongoing");
        require(!resultsRevealed, "Results already revealed");
        
        resultsRevealed = true;
        uint256[] memory results = new uint256[](candidates.length);
        for (uint256 i = 0; i < candidates.length; i++) {
            results[i] = candidates[i].voteCount;
        }
        
        emit ResultsRevealed(results);
    }
    
    function getCandidate(uint256 _candidateId) external view returns (string memory, uint256) {
        require(_candidateId < candidates.length, "Invalid candidate ID");
        return (candidates[_candidateId].name, candidates[_candidateId].voteCount);
    }
}
