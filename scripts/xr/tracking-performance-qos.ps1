param([int[]]$ProcessIds)
# Read-only Windows diagnostics for the PIDs supplied by this browser's CDP session.
# No priority, affinity, power policy, process or thread state is changed.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class XrReadOnlyQos {
  [StructLayout(LayoutKind.Sequential)] public struct State { public uint Version, ControlMask, StateMask; }
  public class Result { public bool Ok; public int Error; public uint ControlMask, StateMask, PriorityClass; }
  [DllImport("kernel32.dll", SetLastError=true)] static extern IntPtr OpenProcess(uint access, bool inherit, uint id);
  [DllImport("kernel32.dll", SetLastError=true)] static extern IntPtr OpenThread(uint access, bool inherit, uint id);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool GetProcessInformation(IntPtr handle, int kind, ref State state, uint size);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool GetThreadInformation(IntPtr handle, int kind, ref State state, uint size);
  [DllImport("kernel32.dll")] static extern uint GetPriorityClass(IntPtr handle);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
  public static Result Query(uint id, bool thread) {
    IntPtr handle = thread ? OpenThread(0x0040, false, id) : OpenProcess(0x1000, false, id);
    if (handle == IntPtr.Zero) return new Result { Ok=false, Error=Marshal.GetLastWin32Error() };
    try {
      State state = new State { Version=1 };
      bool ok = thread ? GetThreadInformation(handle, 3, ref state, 12) : GetProcessInformation(handle, 4, ref state, 12);
      return new Result { Ok=ok, Error=ok?0:Marshal.GetLastWin32Error(), ControlMask=state.ControlMask, StateMask=state.StateMask, PriorityClass=thread?0:GetPriorityClass(handle) };
    } finally { CloseHandle(handle); }
  }
}
'@
$rows = foreach ($taskPid in $ProcessIds) {
  try {
    $taskProcess = [System.Diagnostics.Process]::GetProcessById($taskPid)
    $threads = foreach ($taskThread in $taskProcess.Threads) {
      try {
        [pscustomobject]@{ id=$taskThread.Id; basePriority=$taskThread.BasePriority; cpuMs=$taskThread.TotalProcessorTime.TotalMilliseconds; qos=[XrReadOnlyQos]::Query($taskThread.Id, $true) }
      } catch { [pscustomobject]@{ id=$taskThread.Id; error=$_.Exception.Message } }
    }
    [pscustomobject]@{ id=$taskPid; cpuMs=$taskProcess.TotalProcessorTime.TotalMilliseconds; memory=$taskProcess.WorkingSet64; qos=[XrReadOnlyQos]::Query($taskPid, $false); threads=@($threads) }
  } catch { [pscustomobject]@{ id=$taskPid; error=$_.Exception.Message } }
}
@($rows) | ConvertTo-Json -Depth 8 -Compress
