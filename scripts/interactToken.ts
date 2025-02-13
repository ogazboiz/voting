import { ethers } from "hardhat";

async function main() {
    const [owner, user] = await ethers.getSigners();
    const tokenAddress = "0x8ee6365644426A4b21B062D05596613b8cbffbe3"; // Replace with actual token address

    const Token = await ethers.getContractFactory("AkpoloToken");
    const token = Token.attach(tokenAddress);

    // Check balance
    const ownerBalance = await token.balanceOf(owner.address);
    console.log(`Owner balance: ${ethers.formatUnits(ownerBalance, 18)} AKP`);

    // Transfer tokens
    console.log("Transferring 10 AKP to user...");
    const tx = await token.transfer(user.address, ethers.parseUnits("10", 18));
    await tx.wait();
    console.log("Transfer successful!");

    // Check new balance
    const userBalance = await token.balanceOf(user.address);
    console.log(`User balance: ${ethers.formatUnits(userBalance, 18)} AKP`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
