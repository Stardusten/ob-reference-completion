import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo, EditorTransaction, fuzzySearch, FuzzySuggestModal,
	TFile
} from "obsidian";
import {DataviewApi, getAPI} from "obsidian-dataview";
import {Suggestion} from "./Candidate";

export class ReferenceCompletion
	extends EditorSuggest<Suggestion>
{

	// 是否启用补全
	public enable: boolean;
	private app: App;
	private dataview: DataviewApi;
	// 当前文件路径
	private sourcePath: string;

	constructor(app: App) {
		super(app);
		this.enable = true;
		this.app = app;
		this.dataview = getAPI(app)!; // TODO handle error
		this.sourcePath = this.app.workspace.getActiveFile()!.path; // TODO handle error
		// 当前 active 的文件改变时，更新 sourcePath
		app.workspace.on(
			'active-leaf-change',
			async () => {
				this.sourcePath = this.app.workspace.getActiveFile()!.path; // TODO handle error
			}
		)
	}

	// 提供所有候选
	getSuggestions(context: EditorSuggestContext): Suggestion[] | Promise<Suggestion[]> {
		const query = context.query;
		const queryResult = this.dataview.page(query)?.file;
		// 所有出链、入链作为候选
		const outlinksNumber = queryResult.outlinks.length;
		return  queryResult.outlinks
			.concat(queryResult.inlinks)
			.flatMap((link: any, i: any) => {
				const linkFile = this.app.metadataCache.getFirstLinkpathDest(link.path, this.sourcePath);
				if (linkFile)
					return [{
						linkPath: link.path,
						linkText: this.app.metadataCache.fileToLinktext(linkFile, this.sourcePath),
						linkType: i >= outlinksNumber ? "in" : "out",
					}];
				return [];
			});
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		console.log('Enter onTrigger');
		// 如果未启用补全，直接返回 null，补全窗口不会弹出
		if (!this.enable)
			return null;
		// 检测光标所在行
		const lineNumber = editor.getCursor().line;
		const lineString = editor.getLine(lineNumber).slice(0, editor.getCursor().ch);
		console.log('Current Line: ' + lineString);
		const matchResult = lineString.match(/\[\[(.*?)]]$/);
		if (matchResult == null)
			return null;
		console.log('Match Log: ' + matchResult);
		// start, end 是括号内文字的起止位置
		return {
			start: { line: cursor.line, ch: cursor.ch - 2 - matchResult[1].length },
			end:   { line: cursor.line, ch: cursor.ch - 2 },
			query: matchResult[1],
		};
	}

	// 指定如何渲染每条候选
	renderSuggestion(suggestion: Suggestion, el: HTMLElement): void {
		const leftTypeHintDiv = createDiv({
			text: suggestion.linkType,
			cls: 'reference-suggestion-type-' + suggestion.linkType,
		});
		const rightSuggestionDiv = createDiv();
		rightSuggestionDiv.createDiv({
			text: suggestion.linkText
		});
		// 截取路径中文件夹部分
		// e.g. /xxx/yyy/zz.md => /xxx/yy
		const matchPath = suggestion.linkPath.match(/(.*)\//);
		if (matchPath) {
			rightSuggestionDiv.createDiv({
				text: matchPath[1],
				cls: 'reference-suggestion-link-path',
			});
		}
		el.append(leftTypeHintDiv);
		el.append(rightSuggestionDiv);
	}

	// 指定选中一条候选（回车）后的操作
	selectSuggestion(suggestion: Suggestion, evt: MouseEvent | KeyboardEvent): void {
		if (!this.context)
			return;
		const editor = this.context.editor;

		// 替换为选中的补全内容
		editor.replaceRange(
			suggestion.linkText,
			this.context.start,
			this.context.end
		);

		// 光标后移
		const currentCursor = editor.getCursor();
		editor.setCursor({
			line: currentCursor.line,
			ch: currentCursor.ch + suggestion.linkText.length,
		});

		this.close();
	}
}
