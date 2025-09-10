export function makeICS({ title, description = '', startTs, durationMins = 60 }) {
  const dt = (ts)=> new Date(ts).toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'
  const start = dt(startTs)
  const end = dt(startTs + durationMins*60000)
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PeerLearn//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',
    `DTSTAMP:${dt(Date.now())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n')
  const blob = new Blob([ics], {type:'text/calendar'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download = title.replace(/\s+/g,'_')+'.ics'; a.click(); URL.revokeObjectURL(url)
}