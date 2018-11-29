declare module '@probot/serverless-gcf'

import { e } from '@types/express'
import { ApplicationFunction } from 'probot'

export function serverless(appFn: ApplicationFunction | String): (request: e.Request, response: e.Response) => Promise<any>
