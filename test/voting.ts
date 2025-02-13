import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("AkpoloVoting", function () {
    async function deployContracts() {
        const [owner, voter1, voter2, voter3] = await ethers.getSigners();

        // Deploy ERC20 Token for Voting
        const AkpoloToken = await ethers.getContractFactory("AkpoloToken");
        const akpoloToken = await AkpoloToken.deploy();
        // await akpoloToken.deployed();

        // Get Current Block Timestamp
        const latestBlock = await ethers.provider.getBlock("latest");
        if (!latestBlock) throw new Error("Latest block not found");
        const votingStart = latestBlock.timestamp + 100; // Start voting in 100 seconds
        const votingDuration = 3600; // 1 hour

        // Deploy Voting Contract
        const AkpoloVoting = await ethers.getContractFactory("AkpoloVoting");
        const akpoloVoting = await AkpoloVoting.deploy(
            akpoloToken.target,
            votingStart,
            votingDuration
        );
        // await akpoloVoting.deployed();

        // Distribute tokens to voters
        await akpoloToken.transfer(voter1.address, 5);
        await akpoloToken.transfer(voter2.address, 5);
        await akpoloToken.transfer(voter3.address, 5);

        return { akpoloToken, akpoloVoting, owner, voter1, voter2, voter3 };
    }

    it("Should deploy the contracts successfully", async function () {
        const { akpoloVoting } = await loadFixture(deployContracts);
        expect(akpoloVoting.target).to.be.properAddress;
    });

    it("Should allow owner to register candidates", async function () {
        const { akpoloVoting, owner } = await loadFixture(deployContracts);

        await expect(akpoloVoting.connect(owner).registerCandidate("Alice"))
            .to.emit(akpoloVoting, "CandidateRegistered")
            .withArgs(0, "Alice");

        await expect(akpoloVoting.connect(owner).registerCandidate("Bob"))
            .to.emit(akpoloVoting, "CandidateRegistered")
            .withArgs(1, "Bob");
    });

    it("Should prevent non-owners from registering candidates", async function () {
        const { akpoloVoting, voter1 } = await loadFixture(deployContracts);
        // await expect(akpoloVoting.connect(voter1).registerCandidate("Charlie"))
        //     .to.be.revertedWith("Ownable: caller is not the owner"); 
            await expect(akpoloVoting.connect(voter1).registerCandidate("Charlie"))
  .to.be.revertedWithCustomError(akpoloVoting, "OwnableUnauthorizedAccount")
  .withArgs(voter1);
    });

    it("Should allow users to vote when voting starts", async function () {
        const { akpoloVoting, akpoloToken, voter1 } = await loadFixture(deployContracts);

        // Register Candidates
        await akpoloVoting.registerCandidate("Alice");
        await akpoloVoting.registerCandidate("Bob");

        // Try voting before start time
        await expect(akpoloVoting.connect(voter1).vote(0))
            .to.be.revertedWith("Voting has not started yet");

        // Move time forward to start voting
        await time.increaseTo((await time.latest()) + 200);

        // Approve tokens before voting
        await akpoloToken.connect(voter1).approve(akpoloVoting.target, 1);

        // Vote for candidate 0
        await expect(akpoloVoting.connect(voter1).vote(0))
            .to.emit(akpoloVoting, "Voted")
            .withArgs(voter1.address, 0);
    });

    it("Should prevent multiple voting from the same user", async function () {
        const { akpoloVoting, akpoloToken, voter1 } = await loadFixture(deployContracts);

        await akpoloVoting.registerCandidate("Alice");

        // Move time forward
        await time.increaseTo((await time.latest()) + 200);

        // Approve tokens and vote
        await akpoloToken.connect(voter1).approve(akpoloVoting.target, 1);
        await akpoloVoting.connect(voter1).vote(0);

        // Try voting again
        await expect(akpoloVoting.connect(voter1).vote(0))
            .to.be.revertedWith("You have already voted");
    });

    it("Should prevent voting after the deadline", async function () {
        const { akpoloVoting, akpoloToken, voter2 } = await loadFixture(deployContracts);

        await akpoloVoting.registerCandidate("Alice");

        // Move time beyond the voting period
        await time.increaseTo((await time.latest()) + 4000);

        // Try voting
        await expect(akpoloVoting.connect(voter2).vote(0))
            .to.be.revertedWith("Voting period has ended");
    });

    it("Should allow the owner to reveal results after voting ends", async function () {
        const { akpoloVoting, akpoloToken, voter1, voter2, voter3, owner } = await loadFixture(deployContracts);

        await akpoloVoting.registerCandidate("Alice");
        await akpoloVoting.registerCandidate("Bob");

        // Move time forward
        await time.increaseTo((await time.latest()) + 200);

        // Approve tokens and vote
        await akpoloToken.connect(voter1).approve(akpoloVoting.target, 1);
        await akpoloToken.connect(voter2).approve(akpoloVoting.target, 1);
        await akpoloToken.connect(voter3).approve(akpoloVoting.target, 1);

        await akpoloVoting.connect(voter1).vote(0);
        await akpoloVoting.connect(voter2).vote(1);
        await akpoloVoting.connect(voter3).vote(0);

        // Move time to end voting
        await time.increaseTo((await time.latest()) + 4000);

        // Reveal results
        await expect(akpoloVoting.connect(owner).revealResults())
            .to.emit(akpoloVoting, "ResultsRevealed")
            .withArgs([2, 1]); // Alice = 2 votes, Bob = 1 vote
    });

    it("Should prevent non-owners from revealing results", async function () {
        const { akpoloVoting, voter1 } = await loadFixture(deployContracts);
        // await expect(akpoloVoting.connect(voter1).revealResults())
        //     .to.be.revertedWith("Ownable: caller is not the owner");
            await expect(akpoloVoting.connect(voter1).revealResults())
  .to.be.revertedWithCustomError(akpoloVoting , "OwnableUnauthorizedAccount")
  .withArgs(voter1.address);

    });

    it("Should prevent results from being revealed before voting ends", async function () {
        const { akpoloVoting, owner } = await loadFixture(deployContracts);
        await expect(akpoloVoting.connect(owner).revealResults())
            .to.be.revertedWith("Voting period is still ongoing");
    });

    it("Should return correct candidate details", async function () {
        const { akpoloVoting } = await loadFixture(deployContracts);
        await akpoloVoting.registerCandidate("Alice");

        const candidate = await akpoloVoting.getCandidate(0);
        expect(candidate[0]).to.equal("Alice");
        expect(candidate[1]).to.equal(0);
    });

    it("Should prevent retrieving non-existent candidates", async function () {
        const { akpoloVoting } = await loadFixture(deployContracts);
        await expect(akpoloVoting.getCandidate(5)).to.be.revertedWith("Invalid candidate ID");
        
    });
});
