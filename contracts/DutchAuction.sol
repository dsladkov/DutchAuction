// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract DutchAuction {
  uint256 private constant DURATION = 7 days; //DutchAuction duration
  address payable public immutable seller; //item seller
  uint256 public immutable startingPrice;
  uint256 public immutable startAt;
  uint256 public immutable endsAt;
  uint256 public immutable discountRate;
  string public item;
  bool public stoped;


  constructor(
    uint256 _startingPrice,
    uint256 _discountRate,
    string memory _item
  ) {
    seller = payable(msg.sender);
    startingPrice = _startingPrice;
    discountRate = _discountRate;
    startAt = block.timestamp;
    endsAt = block.timestamp + DURATION;

    require(startingPrice >= discountRate * 7,
    "Starting price and discount are incorrect");

    item = _item;
  }

  modifier notStoped() {
    require(!stoped, "Stooped");
    _;
  }

  function getPrice() public view notStoped returns(uint256) {
    uint256 timeElapsed = block.timestamp - startAt;
    uint256 discount = discountRate * timeElapsed;
    return startingPrice - discount;
  }

  function buy() external payable notStoped {
    require(block.timestamp < endsAt, "Ended");

    uint256 price = getPrice();

    require(msg.value >= price, "Not enough funds");



    uint256 refund = msg.value - price;

    if(refund > 0) {
      payable(msg.sender).transfer(refund);
    }
    seller.transfer(address(this).balance);
    stoped = true;
  }
}