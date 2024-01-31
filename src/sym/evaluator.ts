import { BuiltInFunctionDefinitions, ISym, ISymEvaluator, ISymStore, SymType, SymbolId } from "./types.js";




class SymEvaluatorBase<O extends string | number | symbol, T> implements ISymEvaluator<O, T> {
  definitions: BuiltInFunctionDefinitions<O, T>;
  cache: Record<SymbolId, any> = {};
  constructor(definitions: BuiltInFunctionDefinitions<O, T>) {
    this.definitions = definitions;
  }

  evaluateNoCache(store: ISymStore<O, T>, inputs: T[], sym: ISym<O, T>, noCache: boolean): T | T[] {
    if (sym.type === SymType.Constant) {
      return sym.value;
    } else if (sym.type === SymType.Input) {
      return inputs[sym.index];
    } else if (sym.type === SymType.TargetAt) {
      const target = this.evaluate(store, inputs, store.getSym(sym.ref));
      if (!Array.isArray(target)) {
        throw new Error("TargetAt must be used on an array");
      }
      return target[sym.index];
    } else if (sym.type === SymType.BuiltIn) {
      const args = sym.args.map((argSym) => (this.evaluate(store, inputs, store.getSym(argSym), noCache)));
      const r = this.definitions[sym.op].implementation(args as any);
      return r;
    } else {
      throw new Error("Unknown sym type: " + (sym as any).type);
    }
  }
  evaluate(store: ISymStore<O, T>, inputs: T[], sym: ISym<O, T>, noCache = false): T | T[] {
    if(noCache){
      return this.evaluateNoCache(store, inputs, sym, noCache);
    }
    const id = store.getSymId(sym);
    if (Object.hasOwnProperty.call(this.cache, id)) {
      return this.cache[id];
    }
    const r = this.evaluateNoCache(store, inputs, sym, noCache);
    this.cache[id] = r;
    return r;
  }
}


export {
  SymEvaluatorBase,
}