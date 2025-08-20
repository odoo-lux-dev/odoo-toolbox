export type OptionCategory = "Odoo.SH" | "Odoo"

export interface DatabaseInfo {
    version: string
    database: string
    serverInfo: string
    debugMode: string
    language: string
}

export interface TechnicalFieldInfo {
    name: string
    type?: string
    label?: string
    value?: string
    isRequired?: boolean
    isReadonly?: boolean
}

export interface ViewInfo {
    currentModel?: string
    currentRecordId?: number
    technicalFields: EnhancedTechnicalFieldInfo[]
    viewType?: string
    totalFields: number
    websiteInfo?: WebsiteInfo
}

export interface DebugFieldInfo {
    name: string
    label: string
    type: string
    widget: string | null
    context: string | null
    domain: unknown[] | null
    invisible: boolean | string | null
    column_invisible: boolean | string | null
    readonly: boolean | string | null
    required: boolean | string | null
    changeDefault: boolean
    relation: string | null
    compute?: string | null
    related?: string | null
    store?: boolean | null
    selection?: Array<[string, string]> | null
}

export interface EnhancedTechnicalFieldInfo extends TechnicalFieldInfo {
    debugInfo?: DebugFieldInfo
    hasDebugData: boolean
    canBeRequired?: boolean
    canBeReadonly?: boolean
}

export interface WebsiteInfo {
    websiteId: string
    mainObject: string
    viewXmlId: string | null
    viewId: string | null
    isPublished: boolean | null
    canOptimizeSeo: boolean | null
    canPublish: boolean | null
    isEditable: boolean | null
    isLogged: boolean
    language: string | null
}
