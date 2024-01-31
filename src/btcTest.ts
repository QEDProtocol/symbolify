import { BitcoinVMCodeGeneratorCore } from "./sym/btcCodeGen.js";
import { SymCodeGenerator } from "./sym/codeGenerator.js";
import { SymEvaluatorBase } from "./sym/evaluator.js";
import { SymHasherMD5 } from "./sym/hasher.js";
import { SymStoreCore } from "./sym/store.js";
import { U64Builder } from "./sym/u64/index.js";
import { U64ConstantGenerator, U64Definitions, U64Ops } from "./sym/u64/ops.js";

function runBTCTest() {
  const hasher = new SymHasherMD5<U64Ops, bigint>();
  const store = new SymStoreCore<U64Ops, bigint>(hasher);
  const builder = new U64Builder(store, U64Definitions, 2);
  const input1 = builder.addInput();
  const input2 = builder.addInput();
  const input3 = builder.addInput();

  let [sum, carry] = builder.Add64Carry(input1, input2);
  let [productLo, productHi] = builder.Mul64HiLo(sum, input3);

  let [sum2, carry2] = builder.Add64Carry(productLo, productHi);



  builder.addOutputs([productLo, productHi, sum2]);


  const codeGen = new SymCodeGenerator(U64ConstantGenerator, builder, BitcoinVMCodeGeneratorCore);
  const inputs: bigint[] = [

    0xaef1572239d24e7cn ,0x373e888fde3ec692n ,0x689bbff7a4543a9an

    
  ]
  const evaluator = new SymEvaluatorBase(U64Definitions);
  const results = builder.outputs.map(x=>store.getSym(x)).map(sym=>evaluator.evaluate(store, inputs, sym));
  return {
    code: codeGen.generateCodeForAll(),
    results,
  }
}

export {
  runBTCTest,
}