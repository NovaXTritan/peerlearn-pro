import { describe, it, expect } from 'vitest'

function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000) }

describe('helpers', ()=>{
  it('daysBetween works', ()=>{
    expect(daysBetween('2024-01-01','2024-01-02')).toBe(1)
    expect(daysBetween('2024-01-01','2024-01-01')).toBe(0)
  })
})

describe('matching', ()=>{
  function score(userSkills, candidate){ return candidate.skills.filter(s=>userSkills.includes(s.toLowerCase())).length }
  it('scores overlap', ()=>{
    const me = ['sql','excel']
    expect(score(me,{skills:['excel','python']})).toBe(1)
    expect(score(me,{skills:['sql','excel']})).toBe(2)
    expect(score(me,{skills:['go']})).toBe(0)
  })
})