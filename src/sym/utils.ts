const sumArray = (values: number[])=>values.reduce((a,b)=>a+b, 0);

function seq(count: number, reverse = false): number[]{
  const values = [];
  for(let i=0;i<count;i++){
    values.push(reverse?(count-1-i):i);
  }
  return values;
}

export {
  sumArray,
  seq,
}