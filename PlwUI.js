"use strict";

function hexDumpToByteArray(dump) {	
	let parsedDump = [];
	let lines = dump.split("\n");
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i].trim();
		let colonPos = line.indexOf(":");
		if (colonPos !== -1) {
			line = line.substring(colonPos + 1);
			let words = line.split(" ");
			for (let j = 0; j < words.length; j++) {
				let word = words[j].trim();
				if (word.length >= 2) {
					parsedDump[parsedDump.length] = parseInt(word.substring(0, 2), 16);
				}
				if (word.length >= 4) {
					parsedDump[parsedDump.length] = parseInt(word.substring(2, 4), 16);
				}
			}
		}
	}
	return new Uint8Array(parsedDump);
}

const PLW_RT_MODULE = hexDumpToByteArray(`
0000000: 0061 736d 0100 0000 0113 0460 017f 017f 
0000010: 6000 017f 6002 7f7f 0060 017f 0003 1514 
0000020: 0001 0002 0002 0002 0002 0003 0300 0003 
0000030: 0000 0003 0503 0100 0106 0b02 7f01 4108 
0000040: 0b7f 0141 080b 0784 010a 066d 656d 6f72 
0000050: 7902 0012 4d45 4d5f 6669 7273 7446 7265 
0000060: 6542 6c6f 636b 0300 0d4d 454d 5f6c 6173 
0000070: 7442 6c6f 636b 0301 084d 454d 5f69 6e69 
0000080: 7400 0c09 4d45 4d5f 616c 6c6f 6300 0e08 
0000090: 4d45 4d5f 6672 6565 000f 0a52 4546 5f63 
00000a0: 7265 6174 6500 1009 5245 465f 696e 6352 
00000b0: 6300 1109 5245 465f 6465 6352 6300 120b 
00000c0: 5245 465f 6465 7374 726f 7900 130a e006 
00000d0: 140a 0041 0720 006a 4178 710b 0400 4110 
00000e0: 0b07 0020 0028 0200 0b09 0020 0020 0136 
00000f0: 0200 0b0a 0020 0041 046a 2802 000b 0c00 
0000100: 2000 4104 6a20 0136 0200 0b0a 0020 0041 
0000110: 086a 2802 000b 0c00 2000 4108 6a20 0136 
0000120: 0200 0b0a 0020 0041 0c6a 2802 000b 0c00 
0000130: 2000 410c 6a20 0136 0200 0b09 0020 0010 
0000140: 0641 7f46 0b08 0020 0041 7f10 070b 2a00 
0000150: 2000 2400 2000 2401 2300 3f00 4180 8004 
0000160: 6c23 006b 1003 2300 4100 1005 2300 4100 
0000170: 1007 2300 4100 1009 0b2e 0102 7f20 0010 
0000180: 016a 2101 2300 2102 0240 2002 4504 400c 
0000190: 010b 2001 2002 1002 4d04 400c 010b 2002 
00001a0: 1008 2102 0b20 020b d101 0107 7f20 0045 
00001b0: 0440 4100 0f0b 2000 1000 2100 2000 100d 
00001c0: 2101 2001 4504 4000 0b20 0110 0221 0220 
00001d0: 0110 0621 0320 0110 0821 0420 0110 0b20 
00001e0: 0220 0010 0141 046c 6a4a 0440 2001 2000 
00001f0: 1001 6a10 0320 0120 0110 026a 2105 2005 
0000200: 2002 2001 1002 6b10 0320 0520 0110 0520 
0000210: 0520 0310 0720 0520 0410 0920 0345 0440 
0000220: 2005 2400 0520 0320 0510 090b 2004 4100 
0000230: 4704 4020 0420 0510 070b 2001 2301 4604 
0000240: 4020 0524 0105 2001 2002 6a21 0620 0620 
0000250: 0510 050b 0520 0345 0440 2004 2400 0520 
0000260: 0320 0410 090b 2004 4100 4a04 4020 0420 
0000270: 0310 070b 0b20 0110 016a 0bd5 0201 0a7f 
0000280: 2000 1001 6b21 0120 0110 0221 0220 0110 
0000290: 0421 0341 0021 0420 0341 0047 0440 2003 
00002a0: 100a 4504 4041 0121 040b 0b20 0120 026a 
00002b0: 2105 4100 2106 2005 4100 4704 4020 0510 
00002c0: 0a45 0440 4101 2106 0b0b 2004 0440 2006 
00002d0: 0440 2005 1002 2107 2005 2007 6a21 0820 
00002e0: 0320 0310 0220 0220 076a 6a10 0320 0523 
00002f0: 0146 0440 2003 2401 0520 0820 0310 050b 
0000300: 2005 1006 2109 2005 1008 210a 2009 4504 
0000310: 4020 0a24 0005 2009 200a 1009 0b20 0a41 
0000320: 0047 0440 200a 2009 1007 0b05 2003 2003 
0000330: 1002 2002 6a10 0320 0123 0146 0440 2003 
0000340: 2401 0520 0520 0310 050b 0b05 2006 0440 
0000350: 2005 1002 2107 2005 2007 6a21 0820 0510 
0000360: 0621 0920 0510 0821 0a20 0120 0220 076a 
0000370: 1003 2001 2009 1007 2001 200a 1009 2005 
0000380: 2301 4604 4020 0124 0105 2008 2001 1005 
0000390: 0b20 0945 0440 2001 2400 0520 0920 0110 
00003a0: 090b 200a 4100 4704 4020 0a20 0110 070b 
00003b0: 0520 0141 0010 0720 0123 0010 0923 0041 
00003c0: 0047 0440 2300 2001 1007 0b20 0124 000b 
00003d0: 0b0b 1901 017f 2000 4104 6a10 0e21 0120 
00003e0: 0141 0136 0200 2001 4104 6a0b 1a01 017f 
00003f0: 2000 4104 6b21 0120 0120 0128 0200 4101 
0000400: 6a36 0200 2000 0b1e 0102 7f20 0041 046b 
0000410: 2101 2001 2802 0041 016a 2102 2001 2002 
0000420: 3602 0020 020b 0900 2000 4104 6b10 0f0b
`);


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
			PLW_LOPS, nativeFunctionManager.functions);
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
	let irTopStmts = [];
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
		irTopStmts[irTopStmts.length] = result.ir;
	}
	let irFuncs = compilerContext.irFuncs.concat([new PlwIRFunction("_main", null, 0, [], [], PlwIR.block(irTopStmts))]);
	printTextOut("Globals:");
	printTextOutObject(compilerContext.globalScope.irVarTypes);
	printTextOut("Functions:");
	printTextOutObject(irFuncs);
	
	let testIRModule = new PlwIRModule("test", compilerContext.globalScope.irVarTypes, irFuncs);
	let wasmCompiler = new PlwIRWasmCompiler(testIRModule);
	wasmCompiler.compileModule();
	let bytes = wasmCompiler.moduleBytes();

	WebAssembly.instantiate(PLW_RT_MODULE).then((plwruntime) => {
		plwruntime.instance.exports.MEM_init(8);
		let importObject = {
			"plwruntime": plwruntime.instance.exports,
			"plwnative": {
				"print(text)": 	function(ptr) {
					let mem = new Uint32Array(plwruntime.instance.exports.memory.buffer);
					ptr = ptr / 4;
					let len = mem[ptr];
					let codes = mem.slice(ptr + 1, ptr + 1 + len);
					printTextOut(String.fromCharCode(...codes));
				},
				"text(integer)": function(i) {
					let txt = "" + i;
					let ptr = plwruntime.instance.exports.REF_create((txt.length + 1) * 4);
					let memPtr = ptr / 4;
					let mem = new Uint32Array(plwruntime.instance.exports.memory.buffer);
					mem[memPtr] = txt.length;
					for (let i = 0; i < txt.length; i++) {
						mem[memPtr + 1 + i] = txt.charCodeAt(i);
					}
					return ptr;
				}
			}
		};
		WebAssembly.instantiate(new Uint8Array(bytes), importObject).then((module) => {
			module.instance.exports._main();
		});
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

