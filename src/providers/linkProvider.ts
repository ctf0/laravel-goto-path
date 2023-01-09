'use strict';

import escapeStringRegexp from 'escape-string-regexp';
import {
    DocumentLink,
    DocumentLinkProvider,
    TextDocument,
    window,
} from 'vscode';
import * as util from '../util';

export default class LinkProvider implements DocumentLinkProvider {
    methods: string;

    constructor() {
        this.methods = util.methods;
    }

    async provideDocumentLinks(doc: TextDocument): Promise<DocumentLink[]> {
        const editor = window.activeTextEditor;
        const links: DocumentLink[] = [];

        if (editor) {
            util.setWs(doc.uri);

            const text = doc.getText();
            const regex = new RegExp(`(?<=(${this.methods})\\()['"]([^$]*?)['"]`, 'g');
            const matches = text.matchAll(regex);

            for (const match of matches) {
                const method = match[1];
                const found = match[2];

                const files = await util.getFilePaths(method, found);
                const range = doc.getWordRangeAtPosition(
                    // @ts-ignore
                    doc.positionAt(match.index + found.length),
                    new RegExp(escapeStringRegexp(found)),
                );

                if (files.length && range) {
                    for (const file of files) {
                        const documentlink: DocumentLink = new DocumentLink(range, file.fileUri);
                        documentlink.tooltip = file.tooltip;

                        links.push(documentlink);
                    }
                }
            }
        }

        return links;
    }
}
