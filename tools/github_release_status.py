"""Use Git's configured credential helper without printing or storing its token."""
import argparse, json, os, subprocess, urllib.request
REPO='glebuha7676-droid/Slime_eats'
def api(endpoint):
    result=subprocess.run(['git','-c','http.sslBackend=openssl','-c','credential.interactive=never','credential','fill'],input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,check=True)
    fields=dict(line.split('=',1) for line in result.stdout.splitlines() if '=' in line)
    token=fields.get('password')
    if not token: raise RuntimeError('GitHub credential unavailable')
    request=urllib.request.Request('https://api.github.com/repos/'+REPO+endpoint,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Slime-release-check'})
    with urllib.request.urlopen(request,timeout=30) as response:return json.load(response)
if __name__=='__main__':
    pages=api('/pages');runs=api('/actions/workflows/pages.yml/runs?per_page=1')['workflow_runs']
    print(json.dumps({'gameUrl':pages.get('html_url'),'buildType':pages.get('build_type'),'pagesStatus':pages.get('status'),'latestRun':{k:runs[0].get(k) for k in ['id','head_sha','status','conclusion','html_url']} if runs else None}))
