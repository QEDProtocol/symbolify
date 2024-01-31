import { runBTCTest } from "./btcTest.js";

function runMain() {
  const {code, results} = runBTCTest();
  console.log("========= CODE =========");
  console.log(code);
  console.log("========= RESULTS =========");
  console.log(results);

}

runMain();