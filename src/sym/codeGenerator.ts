import { SymBuilder } from "./builder.js";
import { ConstantGenerator, ICodeGeneratorCore, ISymTargetAt, SymType, SymbolId } from "./types.js";
import { seq } from "./utils.js";

class SymCodeGenerator<O extends string | number | symbol ,T> {
  constantGenerator: ConstantGenerator<T>;
  builder: SymBuilder<O, T>;
  codeGenCore: ICodeGeneratorCore;
  symReferenceTagsCache: Record<SymbolId, string[]> = {};
  constructor(constantGenerator: ConstantGenerator<T>, builder: SymBuilder<O, T>, codeGenCore: ICodeGeneratorCore){
    this.constantGenerator = constantGenerator;
    this.builder = builder;
    this.codeGenCore = codeGenCore;
    this.builder.computeConsumeAndReferencedOutputs();
  }
  getSymbolLimbTag(ref: SymbolId, limbIndex: number): string {
    return `s${ref}_${limbIndex}`;
  }
  getSetTagsForSymbol(ref: SymbolId): string[] {
    const cached = this.symReferenceTagsCache[ref];
    if(cached){
      return cached;
    }
    const sym = this.builder.store.getSym(ref);
    let value: string[] = [];
    if(sym.type === SymType.Input || sym.type === SymType.Constant || sym.type === SymType.TargetAt){
      value = seq(sym.layout, true).map(i=>this.getSymbolLimbTag(ref, i)).reverse();
    }else if(sym.type === SymType.BuiltIn){
      const outputRefs = this.builder.getReferenceOutputsForBuiltIn(sym.op, ref).reverse();
      value = outputRefs.map((ref)=>this.getSetTagsForSymbol(ref)).reduce((a,b)=>a.concat(b), []);
    }
    //value = value.reverse();
    this.symReferenceTagsCache[ref] = value.concat([]);
    return value;
  }
  getSelectTagsForSymbol(ref: SymbolId): string[] {
    return this.getSetTagsForSymbol(ref).concat([]).reverse();
  }
  generateCode(ref: SymbolId, code: string[], hasGeneratedMap: Record<SymbolId, boolean> = {}): string[] {
    if(hasGeneratedMap[ref]){
      return this.getSelectTagsForSymbol(ref);
    }
    hasGeneratedMap[ref] = true;
    const sym = this.builder.store.getSym(ref);
    if(sym.type === SymType.Input){
      return this.getSelectTagsForSymbol(ref);
    }else if(sym.type === SymType.Constant){
      code.push(this.constantGenerator(sym));
      code.push(this.codeGenCore.tagStack(this.getSetTagsForSymbol(ref)));
      return this.getSelectTagsForSymbol(ref);
    }else if(sym.type === SymType.TargetAt){
      this.generateCode(sym.ref, code, hasGeneratedMap);
      return this.getSelectTagsForSymbol(ref);
    }else if(sym.type === SymType.BuiltIn){
      let curTags = [];
      let shouldConsume = false;
      for(let i=0;i<sym.consumeArgs.length;i++){
        const iShouldConsume = sym.consumeArgs[i];
        if(iShouldConsume !== shouldConsume){
          if(curTags.length){
            if(shouldConsume){
              code.push(this.codeGenCore.rollStack(curTags));
            }else{
              code.push(this.codeGenCore.pickStack(curTags));
            }
            curTags = [];
          }
          shouldConsume = iShouldConsume;
        }
        curTags.push(...this.generateCode(sym.args[i], code, hasGeneratedMap));
      }
      if(curTags.length){
        if(shouldConsume){
          code.push(this.codeGenCore.rollStack(curTags));
        }else{
          code.push(this.codeGenCore.pickStack(curTags));
        }
      }
      code.push(this.builder.definitions[sym.op].codeGenerator(sym, this.builder.store));
      code.push(this.codeGenCore.tagStack(this.getSetTagsForSymbol(ref)));
      const selTags = this.getSelectTagsForSymbol(ref);
      for(let i=0;i<sym.referencedOutputs.length;i++){
        if(!sym.referencedOutputs[i]){
          const resultTargetAt: ISymTargetAt = {
            type: SymType.TargetAt,
            index: i,
            ref,
            layout: this.builder.definitions[sym.op].returnLayout[i],
          };
          const resultTargetAtRef = this.builder.store.getSymId(resultTargetAt);
          code.push(this.codeGenCore.rollStack(this.getSelectTagsForSymbol(resultTargetAtRef)));
          code.push(this.codeGenCore.dropStack(this.builder.definitions[sym.op].returnLayout[i]));
        }

      }
      return this.getSelectTagsForSymbol(ref);
    }else{
      throw new Error("Unknown sym type: "+(sym as any).type);
    }

  }
  generateCodeForAll(): string {
    const code: string[] = [];
    const hasGeneratedMap: Record<SymbolId, boolean> = {};
    const inputSetTags = this.builder.inputs.concat([]).reverse().map(x=>this.getSetTagsForSymbol(this.builder.store.getSymId(x))).reduce((a,b)=>a.concat(b),[]);
    code.push(this.codeGenCore.tagStack(inputSetTags));
    
    for(const outputRef of this.builder.outputs){
      if(hasGeneratedMap[outputRef]){
        code.push(this.codeGenCore.rollStack(this.getSelectTagsForSymbol(outputRef)));
      }else{
        this.generateCode(outputRef, code, hasGeneratedMap);
      }
    }
    return code.join("\n\n");
  }

}
export {
  SymCodeGenerator,
}