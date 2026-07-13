import { isRouteErrorResponse, useRouteError } from 'react-router'

export default function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-color">
        {notFound ? 'Not found' : 'Something went wrong'}
      </h1>
      <p className="text-muted-color">
        {notFound
          ? 'That page does not exist.'
          : 'Could not load this page. Try again in a moment.'}
      </p>
    </div>
  )
}
