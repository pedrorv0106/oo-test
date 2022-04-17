
import { ethers } from "hardhat";

async function main() {
  const TheButton = await ethers.getContractFactory("TheButton");
  const theButton = await TheButton.deploy();

  await theButton.deployed();

  console.log("TheButton deployed to:", theButton.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
