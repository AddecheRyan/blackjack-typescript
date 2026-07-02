// Was getting an error stating that FormEvent was deprecated, this is a fix for that
// Github issue from react-router: https://github.com/remix-run/react-router/issues/14795

import type { SubmitEventHandler } from 'react'

declare module 'react' {
  interface FetcherFormProps {
    onSubmit?: SubmitEventHandler<HTMLFormElement>
  }
}