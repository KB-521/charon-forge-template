'use client'

import { App, Button } from 'antd'

export default function StarterAction() {
  const { message } = App.useApp()

  return (
    <Button
      type="primary"
      size="large"
      onClick={() => {
        void message.success('All set. Make it yours!')
      }}
    >
      Try a little interaction
    </Button>
  )
}
