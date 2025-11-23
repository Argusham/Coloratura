// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ColorMatchGameCUSDModule = buildModule("ColorMatchGameCUSDModule", (m) => {
  // cUSD Token addresses on different networks
  // Celo Mainnet: 0x765DE816845861e75A25fCA122bb6898B8B1282a

 
  const cusdToken = m.getParameter(
    "cusdToken",
    "0x765DE816845861e75A25fCA122bb6898B8B1282a"
  );

  // Deploy the ColorMatchGame contract with cUSD token address
  const colorMatchGame = m.contract("ColorMatchGame", [cusdToken], {
    id: "ColorMatchGameCUSD",
  });

  return { colorMatchGame };
});

export default ColorMatchGameCUSDModule;
