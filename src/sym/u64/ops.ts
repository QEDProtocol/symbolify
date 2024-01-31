import { BuiltInFunctionDefinitions, ConstantGenerator, ISymConstant } from "../types.js";

enum U64Ops {
  Add64 = 0,
  Add64Carry = 1,

  Sub64 = 2,
  Sub64Borrow = 3,

  Mul64 = 4,
  Mul64HiLo = 5,
}

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

const U64ConstantGenerator: ConstantGenerator<bigint> = (sym: ISymConstant<bigint>) => {
  const low32 = sym.value & U32_MAX;
  const high32 = (sym.value >> BigInt(32)) & U32_MAX;
  return `b.i64([${high32}n, ${low32}n])`;
};



export {
  U64Ops,
  U64Definitions,
  U64ConstantGenerator,
}