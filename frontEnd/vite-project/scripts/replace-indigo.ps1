$root = Join-Path $PSScriptRoot "..\src"
$replacements = @(
  @{ p = 'bg-indigo-600'; r = 'bg-[#1B3F8B]' },
  @{ p = 'hover:bg-indigo-700'; r = 'hover:bg-[#162d5e]' },
  @{ p = 'text-indigo-600'; r = 'text-[#1B3F8B]' },
  @{ p = 'border-indigo-600'; r = 'border-[#1B3F8B]' },
  @{ p = 'border-t-indigo-600'; r = 'border-t-[#1B3F8B]' },
  @{ p = 'ring-indigo-600'; r = 'ring-[#1B3F8B]' },
  @{ p = 'from-indigo-600'; r = 'from-[#1B3F8B]' },
  @{ p = 'to-indigo-600'; r = 'to-[#162d5e]' },
  @{ p = 'via-indigo-500'; r = 'via-[#2563EB]' },
  @{ p = 'via-indigo-600'; r = 'via-[#1B3F8B]' },
  @{ p = 'to-indigo-500'; r = 'to-[#2563EB]' },
  @{ p = 'from-indigo-500'; r = 'from-[#2563EB]' },
  @{ p = 'hover:bg-indigo-600'; r = 'hover:bg-[#1B3F8B]' },
  @{ p = 'hover:text-indigo-600'; r = 'hover:text-[#1B3F8B]' },
  @{ p = 'hover:border-indigo-600'; r = 'hover:border-[#1B3F8B]' },
  @{ p = 'hover:bg-indigo-100'; r = 'hover:bg-[#EFF6FF]' },
  @{ p = 'hover:text-indigo-500'; r = 'hover:text-[#2563EB]' },
  @{ p = 'hover:bg-indigo-50'; r = 'hover:bg-[#EFF6FF]' },
  @{ p = 'hover:border-indigo-200'; r = 'hover:border-[#BFDBFE]' },
  @{ p = 'bg-indigo-50'; r = 'bg-[#EFF6FF]' },
  @{ p = 'text-indigo-700'; r = 'text-[#1B3F8B]' },
  @{ p = 'text-indigo-500'; r = 'text-[#2563EB]' },
  @{ p = 'ring-indigo-500/30'; r = 'ring-[#BFDBFE]/50' },
  @{ p = 'ring-indigo-500/20'; r = 'ring-[#BFDBFE]/40' },
  @{ p = 'focus:ring-indigo-500/25'; r = 'focus:ring-[#BFDBFE]/50' },
  @{ p = 'focus:ring-indigo-500/20'; r = 'focus:ring-[#BFDBFE]/40' },
  @{ p = 'focus:border-indigo-500'; r = 'focus:border-[#1B3F8B]' },
  @{ p = 'focus:border-indigo-400'; r = 'focus:border-[#2563EB]' },
  @{ p = 'focus:ring-indigo-400'; r = 'focus:ring-[#BFDBFE]' },
  @{ p = 'ring-indigo-400'; r = 'ring-[#93C5FD]' },
  @{ p = 'shadow-indigo-600/25'; r = 'shadow-[#1B3F8B]/20' },
  @{ p = 'shadow-indigo-600/20'; r = 'shadow-[#1B3F8B]/15' },
  @{ p = 'shadow-indigo-500/30'; r = 'shadow-[#2563EB]/25' },
  @{ p = 'dark:text-indigo-400'; r = 'dark:text-[#93C5FD]' },
  @{ p = 'dark:hover:text-indigo-300'; r = 'dark:hover:text-[#BFDBFE]' },
  @{ p = 'dark:after:bg-indigo-400'; r = 'dark:after:bg-[#93C5FD]' },
  @{ p = 'dark:hover:bg-indigo-400'; r = 'dark:hover:bg-[#93C5FD]' },
  @{ p = 'dark:shadow-indigo-900/40'; r = 'dark:shadow-slate-900/40' },
  @{ p = 'dark:shadow-indigo-900/30'; r = 'dark:shadow-slate-900/30' },
  @{ p = 'bg-indigo-400/20'; r = 'bg-[#93C5FD]/20' },
  @{ p = 'dark:bg-indigo-600/15'; r = 'dark:bg-[#1B3F8B]/15' },
  @{ p = 'from-blue-600 to-indigo-600'; r = 'from-[#1B3F8B] to-[#162d5e]' },
  @{ p = 'from-blue-700 via-blue-600 to-indigo-600'; r = 'from-[#1B3F8B] via-[#2563EB] to-[#162d5e]' },
  @{ p = 'from-indigo-600 to-blue-600'; r = 'from-[#1B3F8B] to-[#2563EB]' },
  @{ p = 'from-blue-500 to-indigo-600'; r = 'from-[#2563EB] to-[#162d5e]' },
  @{ p = 'from-indigo-600 via-indigo-500 to-blue-600'; r = 'from-[#1B3F8B] via-[#2563EB] to-[#2563EB]' },
  @{ p = 'after:bg-indigo-600'; r = 'after:bg-[#1B3F8B]' },
  @{ p = 'dark:hover:text-indigo-400'; r = 'dark:hover:text-[#93C5FD]' }
)

Get-ChildItem -Path $root -Recurse -Include *.jsx,*.js,*.css | ForEach-Object {
  $c = [IO.File]::ReadAllText($_.FullName)
  $n = $c
  foreach ($x in $replacements) {
    $n = $n.Replace($x.p, $x.r)
  }
  if ($n -ne $c) {
    [IO.File]::WriteAllText($_.FullName, $n)
    Write-Host "Updated $($_.FullName)"
  }
}
