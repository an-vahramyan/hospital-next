import re, sys, json, os
NONEN = re.compile(r'[\u0400-\u04FF\u0530-\u058F]')
def comments(src, css=False):
    out=[]; i=0; n=len(src); st=None
    while i<n:
        c=src[i]
        if st:
            if c=='\\' : i+=2; continue
            if c==st: st=None
            i+=1; continue
        if css:
            if src.startswith('/*',i):
                j=src.find('*/',i+2); j=n if j<0 else j+2
                out.append((i,j)); i=j; continue
            if c in '"\'': st=c
            i+=1; continue
        if src.startswith('//',i) and (i==0 or src[i-1]!=':'):
            j=src.find('\n',i); j=n if j<0 else j
            out.append((i,j)); i=j; continue
        if src.startswith('/*',i):
            j=src.find('*/',i+2); j=n if j<0 else j+2
            out.append((i,j)); i=j; continue
        if c in '"\'`': st=c
        i+=1
    return out
root=sys.argv[1]; res=[]
for dp,dn,fn in os.walk(root):
    dn[:]=[d for d in dn if d not in('node_modules','.next','.git','.tools','reference')]
    for f in fn:
        if not f.endswith(('.ts','.tsx','.css','.mjs','.js','.prisma')): continue
        p=os.path.join(dp,f); s=open(p,encoding='utf-8').read()
        for a,b in comments(s,f.endswith('.css')):
            t=s[a:b]
            if NONEN.search(t): res.append({'f':os.path.relpath(p,root).replace('\\','/'),'a':a,'b':b,'t':t})
json.dump(res,open(os.path.join(root,'.tools','comments.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=0)
print(len(res), len({r['f'] for r in res}))
