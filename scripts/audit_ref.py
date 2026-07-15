import ezdxf, os
from collections import Counter

def audit(path):
    print('=' * 70)
    print('FILE:', path)
    if not os.path.exists(path):
        print('  MISSING'); return
    print('  size:', os.path.getsize(path), 'bytes')
    try:
        doc = ezdxf.readfile(path)
    except Exception as e:
        print('  READ FAILED:', repr(e)); return
    print('  ACADVER:', doc.header.get('$ACADVER'))
    msp = doc.modelspace()
    counts = Counter(e.dxftype() for e in msp)
    print('  ENTITY COUNTS:', dict(counts))
    a = doc.audit()
    print('  AUDIT errors=%d fixes=%d' % (len(a.errors), len(a.fixes)))
    for e in a.errors[:25]:
        print('    ERR:', e)
    # extents
    emin = doc.header.get('$EXTMIN'); emax = doc.header.get('$EXTMAX')
    print('  EXTMIN:', emin, 'EXTMAX:', emax)
    # overall width/height from *D1 / first dim block ext line
    # negative coordinate scan
    neg = 0
    for e in msp:
        try:
            if e.dxftype() == 'LINE':
                for k in ('x', 'y', 'x1', 'y1'):
                    v = e.dxf.get(k)
                    if v is not None and v < 0:
                        neg += 1; break
        except Exception:
            pass
    print('  LINEs with a negative coord:', neg)
    # dim value scan (MTEXT in dim blocks)
    dims = []
    for e in msp.query('MTEXT'):
        t = (e.dxf.get('text') or '').strip()
        if t.isdigit():
            dims.append(int(t))
    print('  dim string values (mm):', sorted(set(dims)))

for p in [
    r'C:\Users\USER\Downloads\C009_Floor_Plan.dxf',
    r'C:\Users\USER\Documents\Muskans autocad solution\THE ULTIMATE INTERIOR DESIGN APPLICATION\output\ground-floor-plan-reconstructed.dxf',
]:
    audit(p)
