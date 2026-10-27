import json,io
c=json.load(open('.tools/comments.json',encoding='utf-8')); t=json.load(open('.tools/tr.json',encoding='utf-8'))
by={}
for i,r in enumerate(c): by.setdefault(r['f'],[]).append((r['a'],r['b'],t[str(i)],r['t']))
for f,items in by.items():
    raw=open(f,'rb').read(); crlf=b'\r\n' in raw
    s=raw.decode('utf-8')
    for a,b,new,old in sorted(items,reverse=True):
        assert s[a:b]==old,(f,a)
        if crlf and '\n' in new: new=new.replace('\r\n','\n').replace('\n','\r\n')
        s=s[:a]+new+s[b:]
    open(f,'wb').write(s.encode('utf-8'))
print('ok',len(by))
