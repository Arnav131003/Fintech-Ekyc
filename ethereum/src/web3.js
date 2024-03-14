import Web3 from "web3";

//use givenProvider to access the ethereum network
const web3 = new Web3(Web3.givenProvider || "ws://localhost:3000");

export default web3;
