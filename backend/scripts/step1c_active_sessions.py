"""
Diagnostic: list active Windows audio render sessions on the default output
device, with their current peak meter value, to determine whether anything
is actually rendering audio right now (independent of loopback capture).
"""
import time
from pycaw.pycaw import AudioUtilities, ISimpleAudioVolume
from pycaw.utils import AudioUtilities as AU2

sessions = AudioUtilities.GetAllSessions()
print(f"Found {len(sessions)} audio sessions:\n")
for s in sessions:
    proc = s.Process
    name = proc.name() if proc else "(system sounds)"
    state = s.State  # 0=Inactive, 1=Active, 2=Expired
    try:
        meter = s._ctl.QueryInterface(__import__("pycaw.pycaw", fromlist=["IAudioMeterInformation"]).IAudioMeterInformation)
        peak = meter.GetPeakValue()
    except Exception as e:
        peak = f"(no meter: {e})"
    print(f"  proc={name!r} state={state} peak={peak}")
