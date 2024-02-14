// import { Registry, loadGrammarWithLanguageDefinition } from 'monaco-textmate'
import {createOnigScanner, createOnigString, loadWASM} from 'vscode-oniguruma'
import {registerLanguages} from '../tm/register'
import {rehydrateRegexps} from '../tm/configuration'
import VsCodeDarkTheme from '../tm/vs-dark-plus-theme'
import MonacoEditor from 'react-monaco-editor'
import type * as monaco from 'monaco-editor'
import {useState} from 'react'
import { editor } from 'monaco-editor'
import { SimpleLanguageInfoProvider } from '../tm/providers'
import type {LanguageId} from '../tm/register';
import type {ScopeName, TextMateGrammar, ScopeNameInfo} from '../tm/providers'

interface DemoScopeNameInfo extends ScopeNameInfo {
	path: string;
}

const data: ArrayBuffer | Response = await loadVSCodeOnigurumWASM();

loadWASM(data);

const onigLib = Promise.resolve({
    createOnigScanner,
    createOnigString,
});

const Editor2 = () => {
	// const [code, setCode] = useState('function x() {console.log("Hello, world!");}')
	const [code, setCode] = useState('# Hey there\n\nThis is a test\n\n```python\nprint("Hello, world!")\n```')

	const onChange = (newValue: string, e: any) => {
		setCode(newValue)
	}

	return (
		<MonacoEditor
			editorDidMount={editorDidMount}
			editorWillMount={editorWillMount}
			onChange={onChange}
			width="800"
			height="600"
			// language="javascript"
			language="python"
			theme="vs-dark"
			value={code}
			options={{
				selectOnLineNumbers: true
			}}
	/>
  )
}

export default Editor2

const fetchConfiguration = async (
    language: LanguageId,
  ): Promise<monaco.languages.LanguageConfiguration> => {
    const uri = `/configurations/${language}.json`;
    const response = await fetch(uri);
    const rawConfiguration = await response.text();
    return rehydrateRegexps(rawConfiguration);
  };

const fetchGrammar = async (scopeName: ScopeName): Promise<TextMateGrammar> => {
    const {path} = grammars[scopeName];
    const uri = `/grammars/${path}`;
    const response = await fetch(uri);
    const grammar = await response.text();
    const type = path.endsWith('.json') ? 'json' : 'plist';
    return {type, grammar};
  };

const grammars: {[scopeName: string]: DemoScopeNameInfo} = {
    'source.python': {
      language: 'python',
      path: 'MagicPython.tmLanguage.json',
    },
  };

const languages: monaco.languages.ILanguageExtensionPoint[] = [
    {
      id: 'python',
      extensions: [
        '.py',
        '.rpy',
        '.pyw',
        '.cpy',
        '.gyp',
        '.gypi',
        '.pyi',
        '.ipy',
        '.bzl',
        '.cconf',
        '.cinc',
        '.mcconf',
        '.sky',
        '.td',
        '.tw',
      ],
      aliases: ['Python', 'py'],
      filenames: ['Snakefile', 'BUILD', 'BUCK', 'TARGETS'],
      firstLine: '^#!\\s*/?.*\\bpython[0-9.-]*\\b',
    },
];

// Taken from https://github.com/microsoft/vscode/blob/829230a5a83768a3494ebbc61144e7cde9105c73/src/vs/workbench/services/textMate/browser/textMateService.ts#L33-L40
async function loadVSCodeOnigurumWASM(): Promise<Response | ArrayBuffer> {
	const response = await fetch('/node_modules/vscode-oniguruma/release/onig.wasm');
	const contentType = response.headers.get('content-type');
	if (contentType === 'application/wasm') {
	  return response;
	}

	// Using the response directly only works if the server sets the MIME type 'application/wasm'.
	// Otherwise, a TypeError is thrown when using the streaming compiler.
	// We therefore use the non-streaming compiler :(.
	return await response.arrayBuffer();
}

function editorDidMount(editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) {
	editor.focus()
}

function editorWillMount(monaco: typeof import('monaco-editor')) {
	const provider = new SimpleLanguageInfoProvider({
		grammars,
		fetchGrammar,
		configurations: languages.map((language) => language.id),
		fetchConfiguration,
		theme: VsCodeDarkTheme,
		onigLib,
		monaco,
	});

	registerLanguages(
		languages,
		(language: LanguageId) => provider.fetchLanguageInfo(language),
		monaco,
	);

	monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
		noSemanticValidation: true,
		noSyntaxValidation: false
	})
}
