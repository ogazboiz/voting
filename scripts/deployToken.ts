import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying AkpoloToken with account: ${deployer.address}`);

    const Token = await ethers.getContractFactory("AkpoloToken");
    const token = await Token.deploy();
    await token.waitForDeployment();

    console.log(`AkpoloToken deployed at: ${await token.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
