import {time, loadFixture, hre, ethers, expect, anyValue, SignerWithAddress} from "./setup";

describe("DutchAuction", function() {
  async function deploy() {
    const [seller, first_buyer, second_buyer] = await ethers.getSigners();
    const startingPrice = 1000000;
    const discountRate = 1;
    const testItem = "TestItem";

    const DutchAuction = await ethers.getContractFactory("DutchAuction");
    const dutchAuction = await DutchAuction.deploy(startingPrice, discountRate, testItem);
    await dutchAuction.waitForDeployment();
    return {dutchAuction, seller, first_buyer, second_buyer};
  }

  // it("shouldn't create contract if strating price and discount are incorrect", async function() {
  //   const [seller, first_buyer, second_buyer] = await ethers.getSigners();

  //   const DutchAuction = await ethers.getContractFactory ("DutchAuction");
  //   const startingPrice = 1;
  //   const discountRate = 5000;
  //   const testItem = "TestItem";
  //   const txDeploy = DutchAuction.getDeployTransaction(startingPrice, discountRate, testItem);
    
  //   // await expect(DutchAuction.getDeployTransaction(startingPrice, discountRate,testItem)).revertedWith("Starting price and discount are incorrect");

  //   await expect(txDeploy).revertedWith("Starting price and discount are incorrect");
  // });

  it("auction initialized correct and it's not stoped if nobody buying", async function() {
    const {dutchAuction, seller, first_buyer, second_buyer} = await loadFixture(deploy);

    const startingPrice = 1000000;
    const discountRate = 1;
    const testItem = "TestItem";
    expect(await dutchAuction.item()).eq(testItem);
    expect(await dutchAuction.startingPrice()).eq(startingPrice);
    expect(await dutchAuction.discountRate()).eq(discountRate);
    expect(await dutchAuction.stoped()).to.be.false;
  });

  it("should possible to rise get() dutch auction function and price will be decreasing", async function() {
    const {dutchAuction, seller, first_buyer, second_buyer} = await loadFixture(deploy);

    const startingPrice = 1000000;
    const discountRate = 1;
    const duration = 3600 // 1 hour in seconds
    const getResult = await dutchAuction.getPrice();
    expect(getResult).eq(startingPrice);

    //wait for one hour
    await time.increase(duration);

    expect(await dutchAuction.getPrice()).eq(startingPrice - (discountRate * duration));
  });

  it("shouldn't possible to buy if time is gone", async function() {
    const {dutchAuction, seller, first_buyer, second_buyer} = await loadFixture(deploy);

    const startingPrice = 1000000;
    const discountRate = 1;
    const duration = 3600 * 24 * 7; // 1 hour in seconds
    const getResult = await dutchAuction.getPrice();
    expect(getResult).eq(startingPrice);

    //wait for one hour
    await time.increase(duration);

    await expect(dutchAuction.buy({value: 1000})).revertedWith("Ended");
  });

  it("shouldn't possible to buy if not enough funds", async function() {
    const {dutchAuction, seller, first_buyer, second_buyer} = await loadFixture(deploy);

    const startingPrice = 1000000;
    const discountRate = 1;
    const duration = 3600 * 24; // pass 24 hours in seconds
    const getResultAtStart = await dutchAuction.getPrice();
    expect(getResultAtStart).eq(startingPrice);

    //wait for one hour
    await time.increase(duration);

    const getResultThrough24H  = await dutchAuction.getPrice();
    await expect(dutchAuction.connect(first_buyer).buy({value: getResultThrough24H - 1000n})).revertedWith("Not enough funds");
  });

  it("should possible to buy", async function() {
    const {dutchAuction, seller, first_buyer, second_buyer} = await loadFixture(deploy);

    const startingPrice = 1000000;
    const discountRate = 1;
    const duration = 3600; // pass 24 hours in seconds
    const getResultAtStart = await dutchAuction.getPrice();
    //expect(getResultAtStart).eq(startingPrice);

    //wait for one hour
    await time.increase(duration);

    const getResultThrough1H  = await dutchAuction.getPrice();

    console.log(getResultThrough1H);
    // console.log(await ethers.provider.getBalance(first_buyer.address));
    // console.log(await dutchAuction.endsAt());
    // console.log(await dutchAuction.stoped());
    const txBuy = await dutchAuction.connect(first_buyer).buy({value: getResultThrough1H});
    await txBuy.wait();
    //console.log(txBuy);

    console.log(`Seller balance: ${await ethers.provider.getBalance(seller.address)}`);
    console.log(`Buyer balance: ${await ethers.provider.getBalance(first_buyer.address)}`);
    //await expect(txBuy).changeEtherBalances([seller, first_buyer], [getResultThrough1H,-getResultThrough1H]);
  });
});