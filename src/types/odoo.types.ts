import type { FieldMetadata } from "./devtools.types"

// Odoo domain types - operator can be any string, let Odoo handle validation
export type OdooDomainOperator = string
export type OdooDomainCondition = [string, OdooDomainOperator, unknown]
export type OdooDomainLogical = "&" | "|" | "!"
export type OdooDomain = (OdooDomainCondition | OdooDomainLogical)[]

export interface OdooRpcParams {
    model: string
    method: string
    args?: unknown[]
    kwargs?: Record<string, unknown>
    context?: Record<string, unknown>
    fieldsMetadata?: Record<string, FieldMetadata>
}
export interface OdooActionParams {
    action: Record<string, unknown> | number | string
    options?: Record<string, unknown>
}

export interface OdooSearchParams {
    model: string
    domain?: OdooDomain
    fields?: string[]
    offset?: number
    limit?: number
    order?: string | Array<{ name: string; asc?: boolean }>
    context?: Record<string, unknown>
}

export interface OdooSearchReadParams extends OdooSearchParams {
    ids?: number[]
    fieldsMetadata?: Record<string, FieldMetadata>
}

export interface OdooWriteParams {
    model: string
    ids: number[]
    values: Record<string, unknown>
    context?: Record<string, unknown>
}
export interface OdooCreateParams {
    model: string
    values: Record<string, unknown>[]
    context?: Record<string, unknown>
}

export interface OdooCallMethodParams {
    model: string
    method: string
    ids: number[]
    args?: unknown[]
    kwargs?: Record<string, unknown>
    context?: Record<string, unknown>
}

export interface OdooArchiveParams {
    model: string
    ids: number[]
    context?: Record<string, unknown>
}

export interface OdooUnarchiveParams {
    model: string
    ids: number[]
    context?: Record<string, unknown>
}

export interface OdooUnlinkParams {
    model: string
    ids: number[]
    context?: Record<string, unknown>
}

export interface OdooOpenViewParams {
    model: string
    recordIds?: number[] | number
    domain?: unknown[]
    options?: Record<string, unknown>
    asPopup?: boolean
}

export interface OdooPageInfo {
    model?: string
    recordIds?: number[]
    domain?: unknown[]
    viewType?: string
    title?: string
}

export interface OdooInfo {
    version: number | null
    database?: string
}

export interface OdooRpcError {
    code: number
    data: {
        arguments: unknown[]
        context: Record<string, unknown>
        debug: string
        message: string
        name: string
    }
    exceptionName: string
    id: number
    message: string
    model: string
    name: "RPC_ERROR"
    type: "server"
}

export interface RpcContext {
    model: string
    method: string
    args?: unknown[]
    kwargs?: Record<string, unknown>
}

export interface ExtendedError extends Error {
    odooError?: OdooRpcError
    originalError?: unknown
    rpcContext?: RpcContext
}
