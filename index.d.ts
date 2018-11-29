declare module '@probot/serverless-gcf'

import { Request, Response } from 'express'
import { ApplicationFunction } from 'probot'

export function serverless(appFn: ApplicationFunction | String): (request: Request, response: Response) => Promise<any>
