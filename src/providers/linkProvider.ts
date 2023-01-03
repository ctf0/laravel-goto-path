'use strict';

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

        if (editor) {
            util.setWs(doc.uri);

            const text = doc.getText();

            const regex = new RegExp(`(${this.methods})\\((['"][^$]*?['"])`, 'g');
            const links = [];
            const matches = text.matchAll(regex);

            for (const match of matches) {
                const method = match[1];
                const found = match[2];
                const i = match.index + method.length + 1;
                const files = await util.getFilePaths(method, found);
                const range = doc.getWordRangeAtPosition(doc.positionAt(i), new RegExp(found));

                if (files.length && range) {
                    for (const file of files) {
                        const documentlink = new DocumentLink(range, file.fileUri);
                        documentlink.tooltip = file.tooltip;

                        links.push(documentlink);
                    }
                }
            }

            return links;
        }
    }
}
