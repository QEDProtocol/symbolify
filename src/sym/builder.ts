import { BuiltInFunctionDefinitions, ISymBuiltIn, ISymInput, ISymStore, SymType, SymbolId } from "./types.js";

class SymBuilder<O extends string | number | symbol , T> {
  store: ISymStore<O, T>;
  inputCount: number = 0;
  inputs: ISymInput[] = [];
  outputs: SymbolId[] = [];
  definitions: BuiltInFunctionDefinitions<O,T>;
  defaultLayout: number;
  constructor(store: ISymStore<O, T>, definitions: BuiltInFunctionDefinitions<O,T>, defaultLayout = 1){
    this.store = store;
    this.definitions = definitions;
    this.defaultLayout = defaultLayout;
  }
  getReferenceOutputsForBuiltIn(op: O, ref: SymbolId): SymbolId[]{
    return this.definitions[op].returnLayout.map((l, i)=>this.store.getSymId({
      type: SymType.TargetAt,
      index: i,
      ref: ref,
      layout: l,
    }));
  }
  addInput(layout?: number): SymbolId {
    const index = this.inputs.length;
    const input: ISymInput = {
      type: SymType.Input,
      index,
      layout: layout ?? this.defaultLayout,
    };
    this.inputs.push(input);
    return this.store.addSym(input)
  }
  addInputs(count = 1, layout?: number): SymbolId[] {
    const hashes = [];
    for(let i = 0; i < count; i++){
      hashes.push(this.addInput(layout));
    }
    return hashes;
  }
  op(op: O, args: SymbolId[]): SymbolId {
    return this.store.addSym({
      type: SymType.BuiltIn,
      op,
      args,
      consumeArgs: [],
      referencedOutputs: [],
    })
  }
  builtInOp(op: O, args: SymbolId[]): SymbolId[] {
    const outputCount = this.definitions[op].returnLayout.length;
    const ref = this.op(op, args);
    return this.targetsAt(ref, outputCount, this.definitions[op].returnLayout);
  }
  constant(value: T, layout?: number): SymbolId {
    return this.store.addSym({
      type: SymType.Constant,
      value,
      layout: layout ?? this.defaultLayout,
    })
  }
  constants(values: T[], layout?: number): SymbolId[] {
    const hashes = [];
    for(const value of values){
      hashes.push(this.constant(value, layout));
    }
    return hashes;
  }
  targetAt(ref: SymbolId, index: number, layout?: number): SymbolId {
    return this.store.addSym({
      type: SymType.TargetAt,
      ref,
      index,
      layout: layout ?? this.defaultLayout,
    })
  }
  targetsAt(ref: SymbolId, count: number, layouts: number[] = []): SymbolId[] {
    const hashes = [];
    for(let i = 0; i < count; i++){
      hashes.push(this.targetAt(ref, i, layouts[i]));
    }
    return hashes;
  }
  addOutput(ref: SymbolId){
    this.outputs.push(ref);
  }
  addOutputs(refs: SymbolId[]){
    this.outputs.push(...refs);
  }
  computeConsume(ref: SymbolId, symbolsReferenced: Record<SymbolId, number>, builtInList: {ref: SymbolId, sym: ISymBuiltIn<O>}[]): boolean {
    const refStatus = symbolsReferenced[ref];
    if(refStatus === 1){
      return false;
    }else if(refStatus !== 2){
      symbolsReferenced[ref] = 1;
    }
    const sym = this.store.getSym(ref);
    if(sym.type === SymType.BuiltIn){
      builtInList.push({sym, ref});
      sym.consumeArgs = sym.args.map((arg)=>(this.computeConsume(arg, symbolsReferenced, builtInList)));
    }else if(sym.type === SymType.TargetAt){
      this.computeConsume(sym.ref, symbolsReferenced, builtInList);
    }
    return refStatus !== 2;
  }
  getBuiltInOutputIds({ref, sym}: {ref: SymbolId, sym: ISymBuiltIn<O>}): SymbolId[]{
    return this.definitions[sym.op].returnLayout.map((_, i)=>this.store.getSymId({
      type: SymType.TargetAt,
      ref,
      index: i,
      layout: -1,
    }));
  }
  computeConsumeAndReferencedOutputs(){
    const symbolsReferenced: Record<SymbolId, number> = {};
    for(const output of this.outputs){
      symbolsReferenced[output] = 2;
    }
    const builtInList: {ref: SymbolId, sym: ISymBuiltIn<O>}[] = [];
    for(const output of this.outputs){
      this.computeConsume(output, symbolsReferenced, builtInList);
    }
    for(const builtInItem of builtInList){
      builtInItem.sym.referencedOutputs = this.getBuiltInOutputIds(builtInItem).map(id=>!!symbolsReferenced[id]);
    }
  }

}

export {
  SymBuilder,
}