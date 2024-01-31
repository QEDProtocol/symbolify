enum SymType {
  Input = 0,
  Constant = 1,
  TargetAt = 2,
  BuiltIn = 3,
}

type SymbolId = string;
interface ISymInput {
  type: SymType.Input;
  index: number;
  layout: number;
}

interface ISymConstant<T> {
  type: SymType.Constant;
  value: T;
  layout: number;
}

interface ISymTargetAt {
  type: SymType.TargetAt;
  index: number;
  ref: SymbolId;
  layout: number;
}

interface ISymBuiltIn<O> {
  type: SymType.BuiltIn;
  op: O;
  args: SymbolId[];
  consumeArgs: boolean[];
  referencedOutputs: boolean[];
}


type ISym<O, T> = ISymInput | ISymConstant<T> | ISymTargetAt | ISymBuiltIn<O>;
type BuiltInFunctionImpl<T> = (args: T[]) => T[];

interface IBuiltInFunctionDefnition<O extends string | number | symbol, T> {
  returnLayout: number[];
  implementation: BuiltInFunctionImpl<T>;
  codeGenerator: (op: ISymBuiltIn<O>, store: ISymStore<O, T>)=>string;
}
type ConstantGenerator<T> = (c: ISymConstant<T>)=>string;

interface ICodeGeneratorCore {
  pickStack(refs: string[]): string;
  rollStack(refs: string[]): string;
  tagStack(refs: string[]): string;
  dropStack(count: number): string;
}
type BuiltInFunctionDefinitions<O extends string | number | symbol, T> = Record<O, IBuiltInFunctionDefnition<O, T>>;

interface ISymHasher<O, T> {
  hash(sym: ISym<O, T>): SymbolId;
}

interface ISymStore<O, T> {
  getSym(id: SymbolId): ISym<O, T>;
  addSym(sym: ISym<O, T>): SymbolId;
  getSymId(sym: ISym<O, T>): SymbolId;
}


interface ISymEvaluator<O, T> {
  evaluate(store: ISymStore<O, T>, inputs: T[], sym: ISym<O, T>): T | T[];
}


export {
  SymType,
}

export type {
  ISymInput,
  ISymConstant,
  ISymTargetAt,
  ISymBuiltIn,
  ISymEvaluator,
  ISymHasher,
  ISymStore,
  ISym,
  BuiltInFunctionDefinitions,
  IBuiltInFunctionDefnition,
  BuiltInFunctionImpl,
  ConstantGenerator,
  ICodeGeneratorCore,
  SymbolId,
}