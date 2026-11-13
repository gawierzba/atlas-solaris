"""Offline integrity checks for ATLAS SOLARIS 16 snapshot formats (no API requests)."""
import json
import math
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parent.parent
AU_KM=149597870.7
LD_KM=384400.0

class NeoDataTests(unittest.TestCase):
    def setUp(self):
        self.cad=json.loads((ROOT/"data/neo-close-approaches.json").read_text("utf-8"))
        self.orbits=json.loads((ROOT/"data/neo-orbits.json").read_text("utf-8"))

    def test_cad_snapshot_schema_and_provenance(self):
        self.assertEqual(self.cad["schema"],1)
        self.assertIn(self.cad["mode"],["documentation-example","jpl-cad-snapshot"])
        self.assertTrue(self.cad["source"].startswith("https://ssd-api.jpl.nasa.gov/"))
        self.assertGreater(len(self.cad["rows"]),0)
        if self.cad["mode"]=="jpl-cad-snapshot":
            self.assertIsNotNone(self.cad.get("generatedAt"))

    def test_cad_distances_and_velocity(self):
        prev=0
        for row in self.cad["rows"]:
            for key in ("jd","dist","dist_min","dist_max","v_rel"):
                self.assertTrue(math.isfinite(float(row[key])),(row["des"],key))
            self.assertGreater(float(row["jd"]),prev)
            prev=float(row["jd"])
            self.assertLessEqual(0,float(row["dist_min"]))
            self.assertLessEqual(float(row["dist_min"]),float(row["dist"]))
            self.assertLessEqual(float(row["dist"]),float(row["dist_max"]))
            self.assertGreater(float(row["v_rel"]),0)

    def test_published_apophis_example_when_in_demo_mode(self):
        if self.cad["mode"]!="documentation-example":
            self.skipTest("Live snapshot replaced documentation examples")
        a=next(x for x in self.cad["rows"] if x["des"]=="99942")
        km=a["dist"]*AU_KM
        self.assertGreater(km,38000)
        self.assertLess(km,38030)
        self.assertAlmostEqual(km/LD_KM,.09888835597,places=7)
        self.assertLess(a["dist_min"],a["dist_max"])
        self.assertGreater(a["v_rel"],7)

    def test_seeded_elliptic_orbits(self):
        orbits=self.orbits["objects"]
        for obj in orbits.values():
            self.assertGreater(obj["a"],0)
            self.assertLess(obj["a"],100)
            self.assertGreaterEqual(obj["e"],0)
            self.assertLess(obj["e"],1)
            self.assertTrue(-180<=obj["i"]<=180)
            for key in ("ma","w","om","epoch"):
                self.assertTrue(math.isfinite(float(obj[key])),obj)
        self.assertIn("99942",orbits)
        self.assertIn("101955",orbits)
        self.assertIn("67P",orbits)
        self.assertEqual(orbits["67P"]["kind"],"comet")
        self.assertAlmostEqual(orbits["67P"]["a"]*(1-orbits["67P"]["e"]),1.21248,places=4)

if __name__=="__main__":
    unittest.main()
