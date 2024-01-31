import { runBTCTest } from "./btcTest.js";

function splitU128(x: bigint){
  const lo = x & BigInt("0xFFFFFFFFFFFFFFFF");
  const hi = x >> BigInt(64);
  return [lo, hi];
}
function addU64(x: bigint, y: bigint){
  return (x + y) & BigInt("0xFFFFFFFFFFFFFFFF");
}
function runMain() {
  const inputs: bigint[] = [
    0xaef1572239d24e7cn,
    0x373e888fde3ec692n,
    0x689bbff7a4543a9an,
  ]
  const {code, results} = runBTCTest(inputs);
  console.log("========= CODE =========");
  console.log(code);
  console.log("========= RESULTS =========");
  console.log(results.map(x=>x.toString(16)));

  const sum = addU64(inputs[0], inputs[1]);
  const [productLo, productHi] = splitU128(inputs[2] * sum);
  const sum2 = addU64(productLo, productHi);

  console.log(`Expected: ${productLo.toString(16)} ${productHi.toString(16)} ${sum2.toString(16)}`);

}

runMain();