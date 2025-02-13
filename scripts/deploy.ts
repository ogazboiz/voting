import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    const tokenAddress = "0x8ee6365644426A4b21B062D05596613b8cbffbe3"; // Replace with actual ERC-20 token address
    const votingStart = Math.floor(Date.now() / 1000); // Current timestamp
    const votingDuration = 3600; // 1 hour voting duration

    // Deploy contract
    const AkpoloVoting = await ethers.getContractFactory("AkpoloVoting");
    const votingContract = await AkpoloVoting.deploy(tokenAddress, votingStart, votingDuration);
    // await votingContract.deployed();

    console.log(`AkpoloVoting deployed at: ${votingContract.target}`);

    // Optionally, update voting times after deployment if needed
    const newVotingStart = Math.floor(Date.now() / 1000) + 3600; // Set new start time (e.g., 1 hour from now)
    const newVotingDuration = 7200; // Set new duration (e.g., 2 hours)
    
    console.log(`Updating voting times to start at ${newVotingStart} and end at ${newVotingStart + newVotingDuration}`);
    
    await votingContract.setVotingTimes(newVotingStart, newVotingDuration);

    console.log(`Voting times updated successfully!`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
