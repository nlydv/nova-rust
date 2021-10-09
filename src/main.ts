import { RustFormatter } from './rust-formatter'
import { RustIssueProvider } from './rust-issue-provider'
import { RustLanguageServer } from './rust-lang-server'
import {
  makeScriptsExecutable,
  getLatestBinary,
  replaceBinary,
} from './server-install'

let langServer: RustLanguageServer | null = null

export async function activate() {
  // Do work when the extension is activated
  langServer = new RustLanguageServer()
  langServer.start()
  let issueProvider = new RustIssueProvider()
  let formatter = new RustFormatter()
  nova.workspace.onDidAddTextEditor(async (editor: TextEditor) => {
    editor.onWillSave((editor: TextEditor) => {
      return formatter.format(editor)
    })
    editor.onDidSave(async () => {
      issueProvider.run()
    })
  })
  issueProvider.run()
  await makeScriptsExecutable()
  getLatestBinary().then((restart: boolean) => {
    console.log(`Update check finished.${restart ? ' Binary downloaded.' : ''}`)
    if (restart) {
      langServer?.client?.onDidStop(() => {
        console.log('Moving binary and restarting.')
        replaceBinary()
        langServer?.start()
      })
      langServer?.stop()
    }
  })
}

export function deactivate() {
  // Clean up state before the extension is deactivated
  if (langServer) {
    langServer.deactivate()
    langServer = null
  }
}
