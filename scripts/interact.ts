import { ethers, network } from "hardhat";

async function main() {
    const [owner, voter] = await ethers.getSigners();
    const contractAddress = "0x7549a25b9a5206569f6778c6be6a7620687f5A38";

    const AkpoloVoting = await ethers.getContractFactory("AkpoloVoting");
    const votingContract = await AkpoloVoting.attach(contractAddress);

    // Register candidate
    console.log("Registering candidate...");
    const tx1 = await votingContract.connect(owner).registerCandidate("Alice");
    await tx1.wait();
    console.log("Candidate Alice registered.");

    // Voter votes for candidate 0
    console.log("Voting for candidate 0...");
    const tokenAddress = await votingContract.akpoloToken();
    const token = await ethers.getContractAt("IERC20", tokenAddress);

    console.log("Approving token transfer...");
    const approveTx = await token.connect(voter).approve(contractAddress, 1);
    await approveTx.wait();

    const voteTx = await votingContract.connect(voter).vote(0);
    await voteTx.wait();
    console.log("Vote cast successfully!");

    // 🔥 **Increase blockchain time to simulate voting period ending**
    console.log("Advancing time to end voting period...");
    await network.provider.send("evm_increaseTime", [3600 * 24]); // Increase by 1 day
    await network.provider.send("evm_mine"); // Mine a new block

    // Reveal results after voting period
    console.log("Revealing results...");
    const revealTx = await votingContract.connect(owner).revealResults();
    await revealTx.wait();
    console.log("Results revealed!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
