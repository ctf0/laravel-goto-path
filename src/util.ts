'use strict';

import escapeStringRegexp from 'escape-string-regexp';
import * as path from 'node:path';
import {
    Uri,
    workspace,
    WorkspaceConfiguration,
} from 'vscode';

const sep = path.sep;
export const cmndName = 'lgp.revealFolder';
const scheme = `command:${cmndName}`;
let ws;

export function setWs(uri) {
    ws = workspace.getWorkspaceFolder(uri)?.uri.fsPath;
}

/* -------------------------------------------------------------------------- */

const cache_store_link = [];

export async function getFilePaths(method, text) {
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

function prepareArgs(args: object) {
    return encodeURIComponent(JSON.stringify([args]));
}

async function getData(method, text) {
    let paths = config.list[method];
    const result: any = [];

    // in case a method can have multiple paths config
    if (!Array.isArray(paths)) {
        paths = [paths];
    }

    const isAFolder = !text.includes('.');

    for (const path of paths) {
        const p = path.replace(/[\\\/]/g, sep);
        let file = text.replace(/[\\\/]/g, sep);
        file = normalizePath(`${ws}${p}${sep}${file}`);

        let fileUri: Uri;

        if (isAFolder) {
            const args = prepareArgs({ folderPath: file });

            fileUri = Uri.parse(`${scheme}?${args}`);
        } else {
            fileUri = Uri.file(file);
        }

        result.push({
            tooltip : file,
            fileUri : fileUri,
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
export let config: WorkspaceConfiguration;
export let methods: any = '';

export function readConfig() {
    config = workspace.getConfiguration(PACKAGE_NAME);
    methods = Object.keys(config.list).map((e) => escapeStringRegexp(e)).join('|');
}
