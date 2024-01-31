import { ISym, ISymHasher, SymType } from "./types.js";
import SparkMD5 from 'spark-md5';

class SymHasherMD5<O, T> implements ISymHasher<O,T> {
  valueSerializer: (value: T) => string;
  constructor(valueSerializer: (value: T) => string = (value)=>(value+"")){
    this.valueSerializer = valueSerializer;
  }

  hash(sym: ISym<O, T>): string {
    if(sym.type === SymType.Constant){
      return SparkMD5.hash(sym.type+"`"+this.valueSerializer(sym.value)+"`"+sym.layout);
    }else if(sym.type === SymType.Input){
      return SparkMD5.hash(sym.type+"`"+sym.index);
    }else if(sym.type === SymType.TargetAt){
      return SparkMD5.hash(sym.type+"`"+sym.ref+"`"+sym.index);
    }else if(sym.type === SymType.BuiltIn){
      return SparkMD5.hash(sym.type+"`"+sym.op+"__"+sym.args.join(","));
    }else{
      throw new Error("Unknown sym type: "+(sym as any).type);
    }
  }
}

export {
  SymHasherMD5,
}