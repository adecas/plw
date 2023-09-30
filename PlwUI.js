"use strict";

let compilerContext = new CompilerContext();
let nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(new Compiler(compilerContext));
let stackMachine = new StackMachine();
let tokenReader = null;
let parser = null;
let compiler = null;
let terminalInputStatus = "";
let terminalInputBuffer = [];


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

function inputLoop() {
	while (getConsoleInStatus() === "@get_char") {
		if (terminalInputBuffer.length <= 0) {
			return false;
		}
		setConsoleInStatus("");
		let ch = terminalInputBuffer[0];
		terminalInputBuffer = terminalInputBuffer.slice(1);
		stackMachine.stack[stackMachine.sp - 1] = ch;
		stackMachine.stackMap[stackMachine.sp - 1] = false;
		let smRet = stackMachine.runLoop();
		if (smRet !== null && smRet.errorMsg === "@get_char") {
			setConsoleInStatus("@get_char");
		} else if (smRet !== null) {
			printTextOut(JSON.stringify(smRet));
			return false;
		}
	}
	return true;
}

function execLoop() {
	if (!inputLoop()) {
		return;
	}
	while (parser.peekToken() !== TOK_EOF) {
		let expr = parser.readStatement();
		if (Parser.isError(expr)) {
			printTextOutObject(expr);
			return;
		}
		compiler.resetCode();
		let result = compiler.evalStatement(expr);
		if (result.isError()) {
			printTextOutObject(result);
			return;
		}
		let smRet = stackMachine.execute(compiler.codeBlock, compilerContext.codeBlocks,
			PLW_INTERNALS, nativeFunctionManager.functions);
		if (smRet !== null && smRet.errorMsg === "@get_char") {
			setConsoleInStatus("@get_char");
			if (!inputLoop()) {
				return;
			}
		} else if (smRet !== null) {
			printTextOut(JSON.stringify(smRet));
			return;
		}
	}
}

function compileLoop() {
	let rootCodeBlocks = [];
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
			return;
		}
		if (compiler.codeBlock.codeSize > 0) {
			rootCodeBlocks[rootCodeBlocks.length] = compiler.codeBlock;
		}
	}
	let codeBlockId = compilerContext.codeBlocks.length;
	let codeBlocks = [...compilerContext.codeBlocks, ...rootCodeBlocks];
	let codeBlockCount = codeBlocks.length;
	let compiled = "" + codeBlockCount + " " + codeBlockId + "\n";
	for (let i = 0; i < codeBlockCount; i++) {
		let cb = codeBlocks[i];
		compiled += cb.blockName.length + " " + cb.blockName + "\n" + cb.strConstSize + "\n";
		for (let j = 0; j < cb.strConstSize; j++) {
			compiled += cb.strConsts[j].length + " " + cb.strConsts[j] + "\n";
		}
		compiled += cb.floatConstSize + "\n";
		for (let j = 0; j < cb.floatConstSize; j++) {
			compiled += cb.floatConsts[j] + "\n";
		}		
		compiled += cb.codeSize + "\n";
		for (let j = 0; j < cb.codeSize; j++) {
			compiled += cb.codes[j] + " ";
			if (j % 50 == 49) {
				compiled += "\n";
			}
		}
		compiled += "\n";
	}
	navigator.clipboard.writeText(compiled).then(function() {
    	alert("Compiled code copied to clipboard")
	});	
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

function onCompileClick() {
	onResetContextClick();
	onClearMessageClick();
	tokenReader = new TokenReader(getTextIn(), 1, 1);
	parser = new Parser(tokenReader);
	compiler = new Compiler(compilerContext);
	compileLoop();
}

function onDisplayContextClick() {
	printTextOutObject(compilerContext);
}

function onDisplayStackMachineClick() {
	stackMachine.dump(printTextOut);
}

function onResetContextClick() {
	compilerContext = new CompilerContext();
	nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(new Compiler(compilerContext));
	stackMachine = new StackMachine();
	setConsoleInStatus("");
}

function onClearMessageClick() {
	term.clear();
}

function onCopyAllMessageClick() {
	term.selectAll();
	navigator.clipboard.writeText(term.getSelection()).then(function() {
    	alert("Term content copied to clipboard")
	});
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
	for (let i = 0; i < key.length; i++) {
		terminalInputBuffer[terminalInputBuffer.length] = key.charCodeAt(i);
	}
	if (getConsoleInStatus() === "@get_char") {
		execLoop();
	}
}

