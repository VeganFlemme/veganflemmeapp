type NutrientDisplayProps = {
  name: string; current: number; target: number; unit: string; info?: string
}
const safePct = (cur:number, tgt:number) => {
  if (!tgt || tgt<=0) return 0
  return Math.min(100, (cur / tgt) * 100)
}
export const NutrientDisplay = ({ name, current, target, unit, info }: NutrientDisplayProps) => {
  const pct = safePct(current, target)
  const status = pct < 70 ? 'bg-red-500' : pct < 90 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{name}</span>
        </div>
        <span className="text-xs text-gray-500">
          {Math.round(current)}/{target} {unit}
        </span>
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
           className="h-2 w-full rounded bg-gray-200 overflow-hidden">
        <div className={`h-2 ${status}`} style={{ width: `${pct}%` }}/>
      </div>
    </div>
  )
}
