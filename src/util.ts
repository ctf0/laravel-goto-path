'use strict';

import escapeStringRegexp from 'escape-string-regexp';
import * as path from 'node:path';
import {
    Uri,
    workspace,
} from 'vscode';

const sep = path.sep;

let ws;

export function setWs(uri) {
    ws = workspace.getWorkspaceFolder(uri)?.uri.fsPath;
}

/* -------------------------------------------------------------------------- */

const cache_store_link = [];

export async function getFilePaths(method, text) {
    // allow files only
    // as we don't have an api for revel in sidebar
    if (!text.includes('.')) {
        return [];
    }

    text = text.replace(/['"]/g, '');

    const cache_key = `${method}_${text}`;
    let list = checkCache(cache_store_link, cache_key);

    if (!list.length) {
        list = await getData(method, text);

        if (list.length) {
            saveCache(cache_store_link, cache_key, list);
        }
    }

    return list;
}

async function getData(method, text) {
    let paths = config.list[method];
    const result = [];

    // in case a method can have multiple paths config
    if (!Array.isArray(paths)) {
        paths = [paths];
    }

    for (const path of paths) {
        const p = path.replace(/[\\\/]/g, sep);
        const file = text.replace(/[\\\/]/g, sep);

        result.push({
            tooltip : file,
            fileUri : Uri.file(normalizePath(`${ws}${p}${sep}${file}`)),
        });
    }

    return result;
}

function normalizePath(path) {
    return path
        .replace(/\/+/g, '/')
        .replace(/\+/g, '\\');
}


/* Helpers ------------------------------------------------------------------ */

function checkCache(cache_store, text) {
    const check = cache_store.find((e) => e.key == text);

    return check ? check.val : [];
}

function saveCache(cache_store, text, val) {
    checkCache(cache_store, text).length
        ? false
        : cache_store.push({
            key : text,
            val : val,
        });

    return val;
}

/* Config ------------------------------------------------------------------- */
export const PACKAGE_NAME = 'laravelGotoPath';
export let config: any = {};
export let methods: any = '';

export function readConfig() {
    config = workspace.getConfiguration(PACKAGE_NAME);
    methods = Object.keys(config.list).map((e) => escapeStringRegexp(e)).join('|');
}
