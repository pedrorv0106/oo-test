import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract } from "ethers";
const { getContractFactory, getSigners } = ethers

describe("TheButton", function () {
  let theButton: Contract;
  let signers: Signer[];
  let alice: Signer;
  let bob: Signer;
  let carol: Signer;

  beforeEach(async () => {
    signers = await getSigners();
    alice = signers[1];
    bob = signers[2];
    carol = signers[3];
    const TheButton = await getContractFactory('TheButton', signers[0]);
    theButton = await TheButton.deploy();
    await theButton.deployed();
  })

  it("Should accept the exact amount of deposits from users.", async function () {
    await expect(theButton.connect(alice).deposit({value: ethers.utils.parseEther("0.002")})).to.be.reverted;
    await expect(await theButton.connect(alice).deposit({value: ethers.utils.parseEther("0.001")})).changeEtherBalance(alice, ethers.utils.parseEther("-0.001"));
    await expect(await theButton.connect(bob).deposit({value: ethers.utils.parseEther("0.001")})).changeEtherBalance(bob, ethers.utils.parseEther("-0.001"));
    expect(await theButton.pendingRewards()).to.eq(ethers.utils.parseEther("0.002"));
  });

  it("Should accept the exact amount of direct deposits to the contract. (fallback)", async function () {
    await expect(await alice.sendTransaction({to: theButton.address, value: ethers.utils.parseEther("0.001")})).changeEtherBalance(alice, ethers.utils.parseEther("-0.001"));
    expect(await theButton.pendingRewards()).to.eq(ethers.utils.parseEther("0.001"));
  });

  it("Should give rewards after 3 blocks pass without someone deposits.", async function () {
    await theButton.connect(alice).deposit({value: ethers.utils.parseEther("0.001")});
    await theButton.connect(bob).deposit({value: ethers.utils.parseEther("0.001")});
    await mineBlocks(2);
    await theButton.connect(alice).deposit({value: ethers.utils.parseEther("0.001")});
    expect(await theButton.claimableRewards(bob.getAddress())).to.eq(ethers.utils.parseEther("0"));
  });

  it("Should accept correct user can claim.", async function () {
    await theButton.connect(alice).deposit({value: ethers.utils.parseEther("0.001")});
    await theButton.connect(bob).deposit({value: ethers.utils.parseEther("0.001")});
    await theButton.connect(carol).deposit({value: ethers.utils.parseEther("0.001")});
    await mineBlocks(3);
    await theButton.connect(alice).deposit({value: ethers.utils.parseEther("0.001")});
    expect(await theButton.claimableRewards(carol.getAddress())).to.eq(ethers.utils.parseEther("0.003"));
    await expect(theButton.connect(alice).claim()).to.be.reverted;
    await expect(await theButton.connect(carol).claim()).changeEtherBalance(carol, ethers.utils.parseEther("0.003"));
  });
});

async function mineBlocks(n: number) {
  for (let index = 0; index < n; index++) {
    await ethers.provider.send('evm_mine', []);
  }
}
