#!/usr/bin/env node
/** stdio entry — for a creator running the catalog locally. */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './mcp.ts'

await createServer().connect(new StdioServerTransport())
