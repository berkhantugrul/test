node -e "const p=require('./package.json'); console.log(Object.entries({...p.dependencies, ...p.devDependencies}).map(([k,v]) => `${k}: ${v}`).join('\n'))" > dependencies.txt
