import type { PhotoExif } from '../lib/types'

// Viewfinder-style readout: solid black, white monospace text, deliberately
// not tied to the site's semantic color tokens — this is meant to look like
// a camera's settings display, not app UI chrome. Renders nothing if the
// photo has no extracted EXIF fields at all. Used both in the gallery grid
// and the photo carousel — the wrapper in both places must be a `relative`
// element that shrink-wraps the rendered image (not full-width), since this
// overlay is `absolute inset-x-0 bottom-0` and would otherwise span empty
// space beside a narrower image.
export default function ExifOverlay({ exif }: { exif?: PhotoExif }) {
  const fields: [name: string, value: string | undefined][] = [
    ['camera', exif?.camera],
    ['aperture', exif?.aperture],
    ['shutterSpeed', exif?.shutterSpeed],
    ['iso', exif?.iso],
    ['focalLength', exif?.focalLength],
  ]
  const present = fields.filter((field): field is [string, string] =>
    Boolean(field[1]),
  )
  if (present.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap justify-between items-center gap-x-3 gap-y-0.5 rounded-b-lg bg-black/85 px-3 py-1.5 font-mono text-[11px] leading-tight text-white">
      {present.map(([name, value]) => (
        <span key={name}>{value}</span>
      ))}
    </div>
  )
}
