#!/usr/bin/env python3
"""ATLAS SOLARIS 16: server-side JPL snapshots, never browser-embedded API calls."""
import argparse, datetime as dt, json, math, pathlib, re, sys, time
import urllib.parse, urllib.request

ROOT=pathlib.Path(__file__).resolve().parent.parent
CAD_PATH=ROOT/"data/neo-close-approaches.json"
ORB_PATH=ROOT/"data/neo-orbits.json"
CAD="https://ssd-api.jpl.nasa.gov/cad.api"
SBDB="https://ssd-api.jpl.nasa.gov/sbdb.api"
UA="AtlasSolaris-NEO/16.0 (+https://github.com/gawierzba/atlas-solaris)"
FIELDS=["des","orbit_id","jd","cd","dist","dist_min","dist_max","v_rel","v_inf","t_sigma_f","h","diameter","diameter_sigma","fullname"]

def get(url,params):
    url=url+"?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"application/json"})
    with urllib.request.urlopen(req,timeout=30) as r:
        body=r.read(4_000_001)
    if len(body)>4_000_000: raise ValueError("API result too large")
    return json.loads(body.decode("utf-8"))

def numeric(o,k):
    try: x=float(o[k]); return x if math.isfinite(x) else None
    except (KeyError,TypeError,ValueError): return None

def write(path,obj):
    content=json.dumps(obj,ensure_ascii=False,indent=2)+"\n"
    if not path.exists() or path.read_text("utf-8")!=content:
        path.write_text(content,encoding="utf-8")
        print("Updated",path)

def cad_fetch():
    today=dt.datetime.now(dt.timezone.utc).date()
    params={"body":"Earth","date-min":str(today),"date-max":str(today+dt.timedelta(days=366)),
            "dist-max":"0.05","sort":"date","limit":"100","diameter":"true","fullname":"true"}
    raw=get(CAD,params)
    if str(raw.get("signature",{}).get("version"))!="1.5": raise ValueError("CAD version mismatch")
    cols=raw.get("fields",[])
    if not set(FIELDS).issubset(cols): raise ValueError("Unexpected CAD fields")
    rows=[]
    for values in raw.get("data",[]):
        src=dict(zip(cols,values))
        row={k:src.get(k) for k in FIELDS}
        for k in ("jd","dist","dist_min","dist_max","v_rel","v_inf","h","diameter","diameter_sigma"):
            row[k]=numeric(src,k)
        if any(row[k] is None for k in ("jd","dist","dist_min","dist_max","v_rel")):continue
        if not 0<=row["dist_min"]<=row["dist"]<=row["dist_max"]:continue
        row["des"]=str(row["des"]).strip()
        row["fullname"]=str(row["fullname"] or row["des"]).strip()[:150]
        rows.append(row)
    if not rows: raise ValueError("No validated CAD records: retaining old snapshot")
    return {"schema":1,"mode":"jpl-cad-snapshot","generatedAt":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            "notice":"Statyczna kopia danych NASA/JPL. Nie stanowi oceny ryzyka zderzenia.",
            "source":CAD,"query":params,"fields":FIELDS,"total":int(raw.get("total",len(rows))),
            "rows":sorted(rows,key=lambda x:x["jd"])}

def sbdb_fetch(des):
    raw=get(SBDB,{"sstr":des,"full-prec":"true"})
    if str(raw.get("signature",{}).get("version"))!="1.3": raise ValueError("SBDB version mismatch")
    orb=raw.get("orbit") or {}; obj=raw.get("object") or {}
    e={item["name"]:item.get("value") for item in orb.get("elements",[]) if isinstance(item,dict) and "name" in item}
    ecc=numeric(e,"e"); a=numeric(e,"a"); q=numeric(e,"q")
    if a is None and ecc is not None and ecc<1 and q is not None:a=q/(1-ecc)
    if a is None or ecc is None or not 0<=ecc<1 or not 0<a<100:return None
    epoch=numeric(orb,"epoch");inc=numeric(e,"i");node=numeric(e,"om");w=numeric(e,"w");ma=numeric(e,"ma")
    if ma is None and epoch is not None and numeric(e,"tp") is not None:
        ma=((epoch-numeric(e,"tp"))/(365.2568983*a**1.5)*360)%360
    if any(v is None for v in (epoch,inc,node,w,ma)):return None
    return {"des":str(des).strip(),"name":str(obj.get("fullname") or des).strip()[:150],
            "kind":"comet" if re.search(r"(^\d+P|^P/|^C/|^D/)",str(des),re.I) else "asteroid",
            "epoch":epoch,"equinox":str(orb.get("equinox") or "J2000"),"a":a,"e":ecc,"i":inc,"om":node,"w":w,"ma":ma,
            "moid":numeric(orb,"moid"),"period":numeric(e,"per") or 365.2568983*a**1.5,
            "orbit_id":str(orb.get("orbit_id") or ""),"soln_date":str(orb.get("soln_date") or ""),
            "source":SBDB+"?sstr="+urllib.parse.quote(str(des)),"approx":False}

def update_orbits(cad):
    data=json.loads(ORB_PATH.read_text("utf-8"))
    objects=data["objects"]
    wanted=["99942","101955","67P","1P"]
    for row in sorted(cad["rows"],key=lambda x:x["dist"])[:4]:
        if row["des"] not in wanted:wanted.append(row["des"])
    for idx,des in enumerate(wanted[:8]):
        if idx:time.sleep(2) # sequential, courteous JPL API rate
        try:
            entry=sbdb_fetch(des)
            if entry:objects[des]=entry
        except Exception as exc:
            print("SBDB",des,exc,file=sys.stderr)
    data.update({"schema":1,"mode":"jpl-sbdb-snapshot",
                 "generatedAt":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                 "source":SBDB,"objects":objects})
    return data

def main():
    arg=argparse.ArgumentParser();arg.add_argument("--update-orbits",action="store_true")
    args=arg.parse_args()
    cad=cad_fetch() # No mutation until the primary API returned valid data.
    if args.update_orbits:write(ORB_PATH,update_orbits(cad))
    write(CAD_PATH,cad)
    print("Snapshot rows",len(cad["rows"]),"total",cad["total"],"as of",cad["generatedAt"])

if __name__=="__main__":main()
