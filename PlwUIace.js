"use strict";

let compilerContext = new CompilerContext();
let nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(compilerContext);
let stackMachine = new StackMachine();

function printTextOut(text) {
	let textout = document.getElementById("textout");
	textout.value += text + "\n";
	textout.scrollTop = textout.scrollHeight;
}

function printTextOutObject(obj) {
	let textout = document.getElementById("textout");
	textout.value += JSON.stringify(obj, null, 2) + "\n";
	textout.scrollTop = textout.scrollHeight;
}

function getTextIn() {
	let textIn = textinEditor.getSelectedText();
	if (textIn) return textIn;
	return textinEditor.getValue();
}

function onExecClick(isDebug) {
	try {
		let tokenReader = new TokenReader(getTextIn(), 1, 1);
		let parser = new Parser(tokenReader);
		let compiler = new Compiler(compilerContext);
		while (parser.peekToken() !== TOK_EOF) {
			let expr = parser.readStatement();
			if (Parser.isError(expr)) {
				printTextOutObject(expr);
				break;
			}
			if (isDebug) {
				printTextOut("=== AST =================================");
				printTextOutObject(expr);
			}
			compiler.resetCode();
			let result = compiler.evalStatement(expr);
			if (isDebug) {
				printTextOut("=== Compiler ============================");
				printTextOutObject(compiler);
			}
			if (result.isError()) {
				printTextOutObject(result);
				break;
			} else {
				let smRet = stackMachine.execute(compiler.codeBlock, compilerContext.codeBlocks, nativeFunctionManager.functions);
				if (isDebug) {
					printTextOut("=== StackMaching ========================");
					printTextOutObject(stackMachine);
				}
				printTextOut(smRet === null ? "ok" : JSON.stringify(smRet));
			}
		}
	} catch (error) {
		console.log(error);
		printTextOut(error.message);
		printTextOut(error.stack);
	}
}


function onEvalClick() {
	try {
		let tokenReader = new TokenReader(getTextIn(), 1, 1);
		let parser = new Parser(tokenReader);
		let compiler = new Compiler(compilerContext);
		while (parser.peekToken() !== TOK_EOF) {
			let expr = parser.readExpression();
			if (Parser.isError(expr)) {
				printTextOutObject(expr);
				break;
			}
			compiler.resetCode();
			let result = compiler.eval(expr);
			if (result.isError()) {			
				printTextOutObject(result);
				break;
			}
			let smRet = stackMachine.execute(compiler.codeBlock, compilerContext.codeBlocks, nativeFunctionManager.functions);
			if (smRet === null) {
				if (result.tag !== "res-ok") {
					printTextOutObject(stackMachine.popResult());
				}
			} else {
				printTextOutObject(smRet);
			}
		}
	} catch (error) {
		console.log(error);
		printTextOut(error.message);
		printTextOut(error.stack);
	}
}

function onDisplayContextClick() {
	printTextOutObject(compilerContext);
}

function onDisplayStackMachineClick() {
	printTextOutObject(stackMachine);
}

function onResetContextClick() {
	compilerContext = new CompilerContext();
	nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(compilerContext);
	stackMachine = new StackMachine();
}

function onClearMessageClick() {
	document.getElementById("textout").value = "";
}

function fillSnippetSelect() {
	let snipSelect = document.getElementById("snippets");
	let snips = document.getElementsByClassName("snippet");
	for (let i = 0; i < snips.length; i++) {
		let option = document.createElement("option");
		option.value = snips[i].id;
		option.text = snips[i].innerText;
		snipSelect.add(option);
	}
}

function onSnippetChange() {
	let snip = document.getElementById("snippets").value;
	if (snip === "" || !snip.endsWith("-title")) {
		return;
	}
	snip = snip.substring(0, snip.length - 6);
	textinEditor.setValue(document.getElementById(snip).innerText);
	onResetContextClick();
	onClearMessageClick();
	onExecClick(false);
}
