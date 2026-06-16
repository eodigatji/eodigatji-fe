import { RouterProvider } from 'react-router-dom'
import NotificationBootstrap from './app/NotificationBootstrap'
import { router } from './app/router'

function App() {
  return (
    <>
      <NotificationBootstrap />
      <RouterProvider router={router} />
    </>
  )
}

export default App
