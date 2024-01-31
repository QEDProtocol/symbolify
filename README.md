# Symbolify
Symbolic evaluation of BigInt computations + compilation to different BigInt limb sizes


## Usage
```bash
npm install
npm build
npm start
```


1. Define a list of built in operations
```typescript
enum U64Ops {
  Add64 = 0,
  Add64Carry = 1,

  Sub64 = 2,
  Sub64Borrow = 3,

  Mul64 = 4,
  Mul64HiLo = 5,
}
```

2. Write definitions for the different built-ins, and define the output limb sizes (# of stack elements), and code generation:
```typescript
const U64_MAX = BigInt("0xFFFFFFFFFFFFFFFF");
const U32_MAX = BigInt("0xFFFFFFFF");
const U64_MAX_PLUS_1 = BigInt("0x10000000000000000");
const U64Definitions: BuiltInFunctionDefinitions<U64Ops, bigint> = {
  [U64Ops.Add64]: {
    returnLayout: [2],
    implementation: (args) => {
      const [a, b] = args;
      return [(a + b) & U64_MAX];
    },
    codeGenerator: () => `b.OP_U32X2_ADD();`
  },
  [U64Ops.Add64Carry]: {
    returnLayout: [2, 1],
    implementation: (args) => {
      const [a, b] = args;
      const result = a + b;
      return [(result & U64_MAX), result > U64_MAX ? BigInt(1) : BigInt(0)];
    },
    codeGenerator: () => `b.OP_U32X2_ADD_CARRY();`
  },
  [U64Ops.Sub64]: {
    returnLayout: [2],
    implementation: (args) => {
      const [a, b] = args;
      return [(a - b + U64_MAX_PLUS_1) & U64_MAX];
    },
    codeGenerator: () => `b.OP_U32X2_SUB();`
  },
  [U64Ops.Sub64Borrow]: {
    returnLayout: [2, 1],
    implementation: (args) => {
      const [a, b] = args;
      const result = a - b;
      return [((result + U64_MAX_PLUS_1) & U64_MAX), result < 0 ? BigInt(1) : BigInt(0)];
    },
    codeGenerator: () => `b.OP_U32X2_SUB_BORROW();`
  },
  [U64Ops.Mul64]: {
    returnLayout: [2],
    implementation: (args) => {
      const [a, b] = args;
      return [(a * b) & U64_MAX];
    },
    codeGenerator: () => `b.OP_U32X2_MUL();`
  },
  [U64Ops.Mul64HiLo]: {
    returnLayout: [2, 2],
    implementation: (args) => {
      const [a, b] = args;
      const result = a * b;
      return [(result >> BigInt(64)) & U64_MAX, result & U64_MAX];
    },
    codeGenerator: () => `b.OP_U32X2_MUL_HI_LO();`
  },

};
```

3. Define a constant code emitter (for constant number values):
```typescript
const U64ConstantGenerator: ConstantGenerator<bigint> = (sym: ISymConstant<bigint>) => {
  const low32 = sym.value & U32_MAX;
  const high32 = (sym.value >> BigInt(32)) & U32_MAX;
  return `b.i64([${high32}n, ${low32}n])`;
};
```

4. Define a core code emitter for stack operations:
```typescript
const BitcoinVMCodeGeneratorCore : ICodeGeneratorCore = {
  pickStack: function (refs: string[]): string {
    return `b.pickTag(${JSON.stringify(refs)})`;
  },
  rollStack: function (refs: string[]): string {
    return `b.rollTag(${JSON.stringify(refs)})`;
  },
  tagStack: function (refs: string[]): string {
    return `b.tag(${JSON.stringify(refs)})`;
  },
  dropStack: function (count: number): string {
    const pairCount = Math.floor(count/2);
    const lines: string[] = [];
    for(let i=0;i<pairCount;i++){
      lines.push(`b.OP_2DROP();`);
    }
    if((count&1) === 1){
      lines.push(`b.OP_DROP();`)
    }
    return lines.join("\n");
  }
}
```

5. Write an example program, evaluate it and compile to your desired target:
```typescript
const hasher = new SymHasherMD5<U64Ops, bigint>();
const store = new SymStoreCore<U64Ops, bigint>(hasher);
const builder = new U64Builder(store, U64Definitions, 2);
const input1 = builder.addInput();
const input2 = builder.addInput();
const input3 = builder.addInput();

// note that carry is auto-dropped since it is not used =)
let [sum, carry] = builder.Add64Carry(input1, input2);
let [productLo, productHi] = builder.Mul64HiLo(sum, input3);


// note that carry2 is auto-dropped since it is not used =)
let [sum2, carry2] = builder.Add64Carry(productLo, productHi);



builder.addOutputs([productLo, productHi, sum2]);


const codeGen = new SymCodeGenerator(U64ConstantGenerator, builder, BitcoinVMCodeGeneratorCore);
const inputs: bigint[] = [
  0xaef1572239d24e7cn, // input1
  0x373e888fde3ec692n, // input2
  0x689bbff7a4543a9an, // input3
];
const evaluator = new SymEvaluatorBase(U64Definitions);
const results = builder.outputs.map(x=>store.getSym(x)).map(sym=>evaluator.evaluate(store, inputs, sym));
// results= [u128(u64(input+input2)*input3).lo, u128(u64(input+input2)*input3).hi, u128(u64(input+input2)*input3).lo+u128(u64(input+input2)*input3).hi]
```