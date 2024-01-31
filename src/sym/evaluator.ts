import { BuiltInFunctionDefinitions, ISym, ISymEvaluator, ISymStore, SymType } from "./types.js";




class SymEvaluatorBase<O extends string | number | symbol ,T> implements ISymEvaluator<O,T> {
  definitions: BuiltInFunctionDefinitions<O, T>;
  constructor(definitions: BuiltInFunctionDefinitions<O, T>){
    this.definitions = definitions;
  }
  
  evaluate(store: ISymStore<O, T>, inputs: T[], sym: ISym<O, T>): T | T[] {
    if(sym.type === SymType.Constant){
      return sym.value;
    }else if(sym.type === SymType.Input){
      return inputs[sym.index];
    }else if(sym.type === SymType.TargetAt){
      const target = this.evaluate(store, inputs, store.getSym(sym.ref));
      if(!Array.isArray(target)){
        throw new Error("TargetAt must be used on an array");
      }
      return target[sym.index];
    }else if(sym.type === SymType.BuiltIn){
      const args = sym.args.map((argSym)=>(this.evaluate(store, inputs, store.getSym(argSym))));
      const r = this.definitions[sym.op].implementation(args as any);
      return r;
  }else{
      throw new Error("Unknown sym type: "+(sym as any).type);
  }
  }
}


export {
  SymEvaluatorBase,
}