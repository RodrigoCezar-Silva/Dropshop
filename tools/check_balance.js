const fs=require('fs');
const path=process.argv[2];
if(!path){console.error('Usage: node check_balance.js <file>'); process.exit(2)}
const s=fs.readFileSync(path,'utf8');
let stack=[];
let line=1,col=0;
let inSingle=false,inDouble=false,inTemplate=false,inCommentLine=false,inCommentBlock=false;\
for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(ch==='\n'){line++;col=0;inCommentLine=false; continue}
  col++;
  const prev=s[i-1]||'';
  if(inCommentLine){continue}
  if(inCommentBlock){
    if(prev==='*' && ch==='/' ){ inCommentBlock=false }
    continue
  }
  if(!inSingle && !inDouble && !inTemplate){
    if(prev==='/' && ch==='/' ){ inCommentLine=true; continue }
    if(prev==='/' && ch==='*'){ inCommentBlock=true; continue }
  }
  if(!inTemplate && !inDouble && ch==="'" && prev!=='\\') inSingle=!inSingle;
  else if(!inTemplate && !inSingle && ch==='"' && prev!=='\\') inDouble=!inDouble;
  else if(!inSingle && !inDouble && ch==='`' && prev!=='\\') inTemplate=!inTemplate;
  if(inSingle||inDouble||inTemplate) continue;
  if(ch==='('||ch==='['||ch==='{') stack.push({ch, line, col});
  else if(ch===')'||ch===']'||ch==='}'){
    const last=stack.pop();
    if(!last){ console.error(`Unmatched closing ${ch} at ${line}:${col}`); process.exit(1)}
    const match = (last.ch==='('&&ch===')')||(last.ch==='['&&ch===']')||(last.ch==='{'&&ch==='}');
    if(!match){ console.error(`Mismatched ${last.ch} opened at ${last.line}:${last.col} closed by ${ch} at ${line}:${col}`); process.exit(1)}
  }
}
if(inSingle||inDouble||inTemplate||inCommentBlock){ console.error('Unclosed string/template/comment. state:',{inSingle,inDouble,inTemplate,inCommentBlock}); process.exit(1)}
if(stack.length){ console.error('Unclosed openings:', stack); process.exit(1)}
console.log('Balanced');
