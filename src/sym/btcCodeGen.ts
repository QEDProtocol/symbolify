import { ICodeGeneratorCore } from "./types.js";
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

export {
  BitcoinVMCodeGeneratorCore,
}