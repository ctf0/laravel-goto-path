'use strict'

import {
    env,
    workspace,
    Uri,
    window,
    commands
} from 'vscode'
import escapeStringRegexp from 'escape-string-regexp';

const path = require('path')
const sep = path.sep

let ws

export function setWs(uri) {
    ws = workspace.getWorkspaceFolder(uri)?.uri.fsPath
}

/* -------------------------------------------------------------------------- */

let cache_store_link = []

export async function getFilePaths(method, text) {
    // allow files only
    // as we don't have an api for revel in sidebar
    if (!text.includes('.')) {
        return []
    }

    text = text.replace(/['"]/g, '')

    let cache_key = `${method}_${text}`
    let list      = checkCache(cache_store_link, cache_key)

    if (!list.length) {
        list = await getData(method, text)

        if (list.length) {
            saveCache(cache_store_link, cache_key, list)
        }
    }

    return list
}

async function getData(method, text) {
    let paths  = config.list[method]
    let result = []

    // in case a method can have multiple paths config
    if (!Array.isArray(paths)) {
        paths = [paths]
    }

    for (const path of paths) {
        let p    = path.replace(/[\\\/]/g, sep)
        let file = text.replace(/[\\\/]/g, sep)

        result.push({
            tooltip: file,
            fileUri: Uri.file(normalizePath(`${ws}${p}${sep}${file}`))
        })
    }

    return result
}

function normalizePath(path)
{
    return path
            .replace(/\/+/g, '/')
            .replace(/\+/g, '\\')
}


/* Helpers ------------------------------------------------------------------ */

function checkCache(cache_store, text) {
    let check = cache_store.find((e) => e.key == text)

    return check ? check.val : []
}

function saveCache(cache_store, text, val) {
    checkCache(cache_store, text).length
        ? false
        : cache_store.push({
            key : text,
            val : val
        })

    return val
}

/* Config ------------------------------------------------------------------- */
export const PACKAGE_NAME = 'laravelGotoPath'
export let config: any = {}
export let methods: any = ''

export function readConfig() {
    config  = workspace.getConfiguration(PACKAGE_NAME)
    methods = Object.keys(config.list).map((e) => escapeStringRegexp(e)).join('|')
}
