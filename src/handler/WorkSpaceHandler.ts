/*
 * @Author: DevMoxi moxiout@gmail.com
 * @Date: 2022-08-25 16:57:56
 * @LastEditTime: 2022-09-17 12:13:26
 */
import * as vscode from "vscode";
import { ConfigScope, Sections } from "../data/ConfigScope";
import { DocsPanel } from "../panels/DocsPanel";
import { includesInArray } from "../utils/ExtraUtil";
import { isNotEmpty } from "../utils/SomeUtil";

export class WorkspaceHandler {
	context: vscode.ExtensionContext;
	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	/**
	 * 初始化
	 * @param context
	 */
	init(context: vscode.ExtensionContext): WorkspaceHandler {
		// commands
		context.subscriptions.push(
			vscode.commands.registerCommand("extension.llseaids.config", (uri) => {
				//ConfigPanel.render(context.extensionUri);
			}),
			vscode.commands.registerCommand("extension.llseaids.docs", () => {
				DocsPanel.render();
			})
		);
		// may first time run
		var libraryPath = vscode.workspace
			.getConfiguration()
			.get("extension.llseaids.libraryPath");
		if (libraryPath === null) {
			vscode.commands.executeCommand("extension.llseaids.config");
		}
		return this;
	}
	static buildSnippetString(language: string): vscode.SnippetString {
		//TODO: 多语言支持
		if (language === "typescript") {
			language = "javascript";
		}
		switch (language) {
			case "javascript": {
				const referencePath = ConfigScope.library().get("js").recent_index;
				if (referencePath === undefined) {
					const noReminder = ConfigScope.global().get(Sections.noReminder);
					if (noReminder !== true) {
						vscode.window
							.showWarningMessage(
								"咱就说你都没有配置任何库",
								"前往配置",
								"不再提醒"
							)
							.then((v) => {
								if (v === "前往配置") {
								} else if (v === "不再提醒") {
									ConfigScope.global().save(Sections.noReminder, true);
									ConfigScope.global().save(Sections.noReminder, true);
								}
							});
					}
					return new vscode.SnippetString("");
				}
				const body = `
				ll.registerPlugin(
					/* name */ "$1",
					/* introduction */ "$2",
					/* version */ "$3",
					/* otherInformation */ "$4"
				);`;
				const header =
					'//LiteLoaderScript Dev Helper\n/// <reference path="' +
					referencePath +
					'"/> \n\n' +
					body +
					" \n\n\n$5";
				return new vscode.SnippetString(header);
			}
			default: {
				return new vscode.SnippetString("不支持的语言");
			}
		}
	}
	// 编辑器上下文引用
	public snippetCompletion(): WorkspaceHandler {
		const provider = vscode.languages.registerCompletionItemProvider(
			["javascript", "typescript", "lua"],
			{
				provideCompletionItems(
					document: vscode.TextDocument,
					position: vscode.Position
				) {
					const snippetCompletion = new vscode.CompletionItem({
						description: " 快捷导入LiteLoaderSE补全引用",
						label: "llse",
					});
					const snippetCompletion2 = new vscode.CompletionItem({
						description: " 快捷导入LiteLoaderSE补全引用",
						label: "lxl",
					});
					snippetCompletion.insertText = WorkspaceHandler.buildSnippetString(
						document.languageId
					);
					return [snippetCompletion, snippetCompletion2];
				},
			},
			"ll" // triggered whenever a 'll' is being typed
		);
		this.context.subscriptions.push(provider);
		return this;
	}
	public onCreateFile(): WorkspaceHandler {
		vscode.workspace.onDidCreateFiles(function (e: vscode.FileCreateEvent) {
			e.files.forEach(function (p) {
				let path = p.fsPath.toLowerCase();
				const pathIncludes = ["lxl.", "ll.", "llse.", "lls."];
				includesInArray(pathIncludes, path, () => {
					setTimeout(function () {
						vscode.window.activeTextEditor?.insertSnippet(
							WorkspaceHandler.buildSnippetString(
								vscode.window.activeTextEditor.document.languageId
							)
						);
					}, 1000);
				});
			});
		});
		return this;
	}
}
