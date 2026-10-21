import { useState } from 'react'

export default function useGlobal() {
  const [compact, setCompact] = useState(false)
  return { compact, setCompact }
}
