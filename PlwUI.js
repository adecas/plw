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

function clearDebugText() {
	document.getElementById("debug").value = "";
}

function printDebugText(text) {
	let textout = document.getElementById("debug");
	textout.value += text + "\n";
	textout.scrollTop = textout.scrollHeight;
}

function printDebugObject(obj) {
	let textout = document.getElementById("debug");
	textout.value += JSON.stringify(obj, null, 2) + "\n";
	textout.scrollTop = textout.scrollHeight;
}

function getTextIn() {
	let textIn = document.getElementById("textin");
	let beginPos = textIn.selectionStart;
	let endPos = textIn.selectionEnd;
	return beginPos === endPos ? textIn.value : textIn.value.substring(beginPos, endPos);
}

function onExecClick(isDebug) {
	try {
		clearDebugText();
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
				printDebugText("=== AST =================================");
				printDebugObject(expr);
			}
			compiler.resetCode();
			let result = compiler.eval(expr);
			if (isDebug) {
				printDebugText("=== Compiler ============================");
				printDebugObject(compiler);
			}
			if (result.isError()) {
				printTextOutObject(result);
				break;
			} else {
				let smRet = stackMachine.execute(compiler.codeBlock, compilerContext.codeBlocks, nativeFunctionManager.functions);
				if (isDebug) {
					printDebugText("=== StackMaching ========================");
					printDebugObject(stackMachine);
				}
				printTextOut(smRet);
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
		document.getElementById("debug").value = "";
		let tokenReader = new TokenReader(getTextIn(), 1, 1);
		let parser = new Parser(tokenReader);
		let compiler = new Compiler(compilerContext);
		while (parser.peekToken() !== TOK_EOF) {
			let expr = parser.readExpression();
			if (Parser.isError(expr)) {
				printTextOutObject(expr);
				break;
			}
			document.getElementById("debug").value += JSON.stringify(expr, null, 2);
			compiler.resetCode();
			let result = compiler.eval(expr);
			// printTextOutObject(result);
			// printTextOutObject(compiler.codeBlock);
			if (!result.isError()) {
				let smRet = stackMachine.execute(compiler.codeBlock, compilerContext.codeBlocks, nativeFunctionManager.functions);
				if (smRet === "ok") {
					if (result.tag !== "res-ok") {
						printTextOutObject(stackMachine.popResult());
					}
				} else {
					printTextOut(smRet);
				}
				// printTextOutObject(stackMachine);
			}
			if (result.isError()) {
				break;
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

function onResetContextClick() {
	compilerContext = new CompilerContext();
	nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(compilerContext);
	stackMachine = new StackMachine();
}

function onClearMessageClick() {
	document.getElementById("textout").value = "";
}

