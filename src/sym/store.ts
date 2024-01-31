import { ISym, ISymHasher, ISymStore, SymbolId } from "./types.js";

class SymStoreCore<O, T> implements ISymStore<O, T>{
  hasher: ISymHasher<O, T>;
  symbolMap: Record<SymbolId, ISym<O, T>> = {};
  constructor(hasher: ISymHasher<O, T>) {
    this.hasher = hasher;
  }
  getSym(id: SymbolId): ISym<O, T> {
    if(Object.hasOwnProperty.call(this.symbolMap, id)){
      return this.symbolMap[id];
    }
    throw new Error("symbol not found for hash '"+id+"'");
  }
  getSymId(sym: ISym<O, T>): SymbolId {
    return this.hasher.hash(sym);
  }
  addSym(sym: ISym<O, T>): SymbolId {
    const id = this.getSymId(sym);
    if(Object.hasOwnProperty.call(this.symbolMap, id)){
      return id;
    }
    this.symbolMap[id] = sym;
    return id;
  }

}

export {
  SymStoreCore,
}