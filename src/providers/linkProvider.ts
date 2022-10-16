'use strict'

import {
    DocumentLink,
    DocumentLinkProvider,
    TextDocument,
    window
} from 'vscode'
import * as util from '../util'

export default class LinkProvider implements DocumentLinkProvider {
    methods: string

    constructor() {
        this.methods = util.methods
    }

    async provideDocumentLinks(doc: TextDocument): Promise<DocumentLink[]> {
        let editor = window.activeTextEditor

        if (editor) {
            util.setWs(doc.uri)

            const text = doc.getText()

            let regex   = new RegExp(`(${this.methods})\\((['"][^$]*?['"])`, 'g')
            let links   = []
            let matches = text.matchAll(regex)

            for (const match of matches) {
                let method  = match[1]
                let found   = match[2]
                let i       = match.index + method.length + 1
                let files   = await util.getFilePaths(method, found)
                const range = doc.getWordRangeAtPosition(doc.positionAt(i), new RegExp(found))

                if (files.length && range) {
                    for (const file of files) {
                        let documentlink     = new DocumentLink(range, file.fileUri)
                        documentlink.tooltip = file.tooltip

                        links.push(documentlink)
                    }
                }
            }

            return links
        }
    }
}
