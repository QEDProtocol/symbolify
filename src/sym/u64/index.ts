import { SymBuilder } from "../builder.js";
import { U64Ops } from "./ops.js";

class U64Builder extends SymBuilder<U64Ops, bigint> {
  Add64Carry(a: string, b: string) {
    return this.builtInOp(U64Ops.Add64Carry, [a, b]);
  }
  Sub64Borrow(a: string, b: string) {
    return this.builtInOp(U64Ops.Sub64Borrow, [a, b]);
  }
  Mul64HiLo(a: string, b: string) {
    return this.builtInOp(U64Ops.Mul64HiLo, [a, b]);
  }
}

export {
  U64Builder,
}