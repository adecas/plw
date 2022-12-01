"use strict";

let compilerContext = new CompilerContext();
let nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(compilerContext);
let stackMachine = new StackMachine();
let tokenReader = null;
let parser = null;
let compiler = null;
let terminalInputStatus = "";


function addTextOut(text) {
	term.write(text);
}

function printTextOut(text) {
	term.writeln(text);
}

function printTextOutObject(obj) {
	term.writeln(JSON.stringify(obj, null, 2).replaceAll("\n", "\r\n"));
}

function clearDebugText() {
	document.getElementById("debug").value = "";
}

function getTextIn() {
	let textIn = textinEditor.getSelectedText();
	if (textIn) return textIn;
	return textinEditor.getValue();
}

function setConsoleInStatus(status) {
	if (status) {
		term.focus();
	}
	terminalInputStatus = status;
}

function getConsoleInStatus(status) {
	return terminalInputStatus;
}

function execLoop() {
	while (parser.peekToken() !== TOK_EOF) {
		let expr = parser.readStatement();
		if (Parser.isError(expr)) {
			printTextOutObject(expr);
			break;
		}
		compiler.resetCode();
		let result = compiler.evalStatement(expr);
		if (result.isError()) {
			printTextOutObject(result);
			break;
		} else {
			let smRet = stackMachine.execute(compiler.codeBlock, compilerContext.codeBlocks, nativeFunctionManager.functions);
			if (smRet !== null && smRet.errorMsg === "@get_char") {
				setConsoleInStatus("@get_char");
				break;
			}
			if (smRet !== null) {
				printTextOut(JSON.stringify(smRet));
				break;
			}
		}
	}
}

function onScrollToClick() {
	document.getElementById("scrollto").scrollIntoView(true);
	term.focus();
}

function onExecClick() {
	try {
		setConsoleInStatus("");
		tokenReader = new TokenReader(getTextIn(), 1, 1);
		parser = new Parser(tokenReader);
		compiler = new Compiler(compilerContext);
		execLoop();
	} catch (error) {
		console.log(error);
		printTextOut(error.message);
		printTextOut(error.stack.replaceAll("\n", "\r\n"));
	}
}

function onDisplayContextClick() {
	printTextOutObject(compilerContext);
}

function onDisplayStackMachineClick() {
	stackMachine.dump(printTextOut);
}

function onResetContextClick() {
	compilerContext = new CompilerContext();
	nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(compilerContext);
	stackMachine = new StackMachine();
	setConsoleInStatus("");
}

function onClearMessageClick() {
	term.clear();
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

function onInputFileChange() {
	var fileReader = new FileReader();
	fileReader.onload = function() {
		textinEditor.setValue(fileReader.result);
		onResetContextClick();
		onClearMessageClick();
	};
	fileReader.readAsText(document.getElementById("inputfile").files[0]);
}

function onTerminalKey(key) {
	if (getConsoleInStatus() === "@get_char") {
		setConsoleInStatus("");
		if (key.length > 0) {
			let ch = key.charCodeAt(0);
			stackMachine.stack[stackMachine.sp - 1] = ch;
			stackMachine.stackMap[stackMachine.sp - 1] = false;
			let smRet = stackMachine.runLoop();
			if (smRet !== null) {
				if (smRet.errorMsg === "@get_char") {
					setConsoleInStatus("@get_char");
				} else {
					setConsoleInStatus("");
				}
			} else {
				execLoop();
			}
		}	
	}
}

