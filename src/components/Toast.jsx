import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const queue = []
let notify = null

export function toast(msg){
  queue.push({id: Date.now()+Math.random(), msg})
  notify && notify([...queue])
  setTimeout(()=>{ queue.shift(); notify && notify([...queue]) }, 2400)
}

export function ToastHost(){
  const [list,setList] = React.useState([])
  React.useEffect(()=>{ notify=setList; return ()=>notify=null },[])
  return (
    <div style={{position:'fixed', bottom:80, right:14, display:'grid', gap:8, zIndex:20}}>
      <AnimatePresence>
        {list.map(t=>(
          <motion.div key={t.id} initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}} className="card">
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}