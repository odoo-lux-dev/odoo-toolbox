/**
 * Type declarations for Odoo's py.js library
 * Located in src/utils/odoo-py_js/
 */

declare module "@/utils/odoo-py_js/py.js" {
    export interface Token {
        type: string
        value: string
        pos: number
    }

    export interface AST {
        type: string
        [key: string]: unknown
    }

    /**
     * Parses an expression into a valid AST representation
     */
    export function parseExpr(expr: string): AST

    /**
     * Evaluates a python expression
     */
    export function evaluateExpr(
        expr: string,
        context?: Record<string, unknown>
    ): unknown

    /**
     * Evaluates a python expression to return a boolean
     */
    export function evaluateBooleanExpr(
        expr: string,
        context?: Record<string, unknown>
    ): boolean

    /**
     * Parse tokens from a python expression
     */
    export function tokenize(expr: string): Token[]

    /**
     * Parse an AST from tokens
     */
    export function parse(tokens: Token[]): AST

    /**
     * Evaluate an AST
     */
    export function evaluate(
        ast: AST,
        context?: Record<string, unknown>
    ): unknown

    /**
     * Format an AST for debugging
     */
    export function formatAST(ast: AST): string
}
