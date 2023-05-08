import debounce from 'lodash.debounce';
import {
    Uri,
    commands,
    languages,
    window,
    workspace,
} from 'vscode';
import LinkProvider from './providers/linkProvider';
import * as util from './util';

let providers: any = [];

export function activate({ subscriptions }) {
    util.readConfig();

    // config
    subscriptions.push(
        workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(util.PACKAGE_NAME)) {
                util.readConfig();
            }
        }),
        commands.registerCommand(util.cmndName, async (args = undefined) => {
            if (args !== undefined) {
                const { folderPath } = args;

                await commands.executeCommand('workbench.action.focusSideBar');
                await commands.executeCommand('revealInExplorer', Uri.parse(folderPath));
            }
        }),
    );

    // links
    initProviders();
    subscriptions.push(
        window.onDidChangeActiveTextEditor(async (e) => {
            await clearAll();
            initProviders();
        }),
    );
}

const initProviders = debounce(() => {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider()));
}, 250);

function clearAll() {
    return new Promise((res, rej) => {
        providers.map((e) => e.dispose());
        providers = [];

        setTimeout(() => res(true), 500);
    });
}

export function deactivate() {
    clearAll();
}
