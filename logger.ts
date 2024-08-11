export default function logRequest(request: Request, response: Response, info: Deno.ServeHandlerInfo) {
  const requestUrl = new URL(request.url)

  const path = requestUrl.pathname
  const host = requestUrl.host
  const protocol = requestUrl.protocol.replace(':', '')
  const query = requestUrl.search

  const url = {
    path,
    protocol,
    query,
    host,
  }

  const method = request.method
  const clientIp = info.remoteAddr.hostname
  const headers: Record<string, string> = {}

  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  const responseHeaders: Record<string, string> = {}

  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  const requestTimestamp = Date.now()

  const log: Log = {
    headers,
    url,
    method,
    'client_ip': clientIp,
    'request-timestamp': String(requestTimestamp),
    'response-headers': responseHeaders,
    'response-status': response.status
  }

  console.log(JSON.stringify(log))

  const options = {
    postLogEnabled: Deno.env.get('SERVER_SIDE_LOGGING_POST_LOG_ENABLED') === 'true',
    baseUrl: Deno.env.get('SERVER_SIDE_LOGGING_BASE_URL') ?? '',
    prefix: Deno.env.get('SERVER_SIDE_LOGGING_PREFIX') ?? '',
    zone: Deno.env.get('SERVER_SIDE_LOGGING_ZONE') ?? '',
    apiKey: Deno.env.get('SERVER_SIDE_LOGGING_API_KEY') ?? '',
    pipeline: Deno.env.get('SERVER_SIDE_LOGGING_PIPELINE') ?? '',
  }

  if (options.postLogEnabled)
    postLog(log, options)
}

function postLog(
  log: Log,
  loggerConfig: LoggerOptions,
) {
  const loggerBaseUrl = loggerConfig.baseUrl
  const loggerPrefix = loggerConfig.prefix
  const loggerZone = loggerConfig.zone
  const loggerApiKey = loggerConfig.apiKey
  const loggerPipeline = loggerConfig.pipeline

  fetch(loggerBaseUrl + `/push/${loggerPrefix}/${loggerZone}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': `${loggerPrefix}-${loggerZone}`,
      'x-api-key': loggerApiKey,
      'x-pipeline': loggerPipeline,
    },
    body: JSON.stringify(log),
  })
    .then(async (response) => {
      const responseJson = await response.json()

      if (!responseJson.database.errors) {
        return
      }

      console.error('Failed to post log', JSON.stringify(responseJson, null, 2))
    })
    .catch((error) => {
      console.error('Failed to post log', error)
    })
}

interface Log {
  'headers': Record<string, string | undefined>
  'response-headers': Record<string, string | undefined>
  'response-status': number
  'url': {
    path: string
    protocol: string
    query: string
  }
  'method': string
  'client_ip': string
  'request-timestamp': string,
}

interface LoggerOptions {
  postLogEnabled: boolean
  baseUrl: string
  prefix: string
  zone: string
  apiKey: string
  pipeline: string
}
