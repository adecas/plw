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
0000000: 0061 736d 0100 0000 0128 0760 017f 017f 
0000010: 6000 017f 6002 7f7f 0060 017f 0060 027f 
0000020: 7f03 7f7f 7f60 027f 7f01 7f60 037f 7f7f 
0000030: 017f 031b 1a00 0100 0200 0200 0200 0200 
0000040: 0303 0000 0300 0000 0403 0500 0606 0305 
0000050: 0301 0001 060b 027f 0141 080b 7f01 4108 
0000060: 0b07 f501 1006 6d65 6d6f 7279 0200 124d 
0000070: 454d 5f66 6972 7374 4672 6565 426c 6f63 
0000080: 6b03 000d 4d45 4d5f 6c61 7374 426c 6f63 
0000090: 6b03 0108 4d45 4d5f 696e 6974 000c 094d 
00000a0: 454d 5f61 6c6c 6f63 000e 084d 454d 5f66 
00000b0: 7265 6500 0f0a 5245 465f 6372 6561 7465 
00000c0: 0010 0952 4546 5f69 6e63 5263 0011 0952 
00000d0: 4546 5f64 6563 5263 0012 1052 4546 5f64 
00000e0: 7570 5074 7256 616c 5074 7200 130b 5245 
00000f0: 465f 6465 7374 726f 7900 140f 5245 465f 
0000100: 6372 6561 7465 4172 7261 7900 150d 5245 
0000110: 465f 6172 7261 7953 697a 6500 160f 5245 
0000120: 465f 636f 6e63 6174 4172 7261 7900 1714 
0000130: 5245 465f 636f 6e63 6174 4261 7369 6341 
0000140: 7272 6179 0018 1052 4546 5f64 6573 7472 
0000150: 6f79 4172 7261 7900 190a b608 1a0a 0041 
0000160: 0720 006a 4178 710b 0400 4110 0b07 0020 
0000170: 0028 0200 0b09 0020 0020 0136 0200 0b07 
0000180: 0020 0028 0204 0b09 0020 0020 0136 0204 
0000190: 0b07 0020 0028 0208 0b09 0020 0020 0136 
00001a0: 0208 0b07 0020 0028 020c 0b09 0020 0020 
00001b0: 0136 020c 0b09 0020 0010 0641 7f46 0b08 
00001c0: 0020 0041 7f10 070b 2a00 2000 2400 2000 
00001d0: 2401 2300 3f00 4180 8004 6c23 006b 1003 
00001e0: 2300 4100 1005 2300 4100 1007 2300 4100 
00001f0: 1009 0b2e 0102 7f20 0010 016a 2101 2300 
0000200: 2102 0240 2002 4504 400c 010b 2001 2002 
0000210: 1002 4d04 400c 010b 2002 1008 2102 0b20 
0000220: 020b d101 0107 7f20 0045 0440 4100 0f0b 
0000230: 2000 1000 2100 2000 100d 2101 2001 4504 
0000240: 4000 0b20 0110 0221 0220 0110 0621 0320 
0000250: 0110 0821 0420 0110 0b20 0220 0010 0141 
0000260: 046c 6a4a 0440 2001 2000 1001 6a10 0320 
0000270: 0120 0110 026a 2105 2005 2002 2001 1002 
0000280: 6b10 0320 0520 0110 0520 0520 0310 0720 
0000290: 0520 0410 0920 0345 0440 2005 2400 0520 
00002a0: 0320 0510 090b 2004 4100 4704 4020 0420 
00002b0: 0510 070b 2001 2301 4604 4020 0524 0105 
00002c0: 2001 2002 6a21 0620 0620 0510 050b 0520 
00002d0: 0345 0440 2004 2400 0520 0320 0410 090b 
00002e0: 2004 4100 4a04 4020 0420 0310 070b 0b20 
00002f0: 0110 016a 0bd5 0201 0a7f 2000 1001 6b21 
0000300: 0120 0110 0221 0220 0110 0421 0341 0021 
0000310: 0420 0341 0047 0440 2003 100a 4504 4041 
0000320: 0121 040b 0b20 0120 026a 2105 4100 2106 
0000330: 2005 4100 4704 4020 0510 0a45 0440 4101 
0000340: 2106 0b0b 2004 0440 2006 0440 2005 1002 
0000350: 2107 2005 2007 6a21 0820 0320 0310 0220 
0000360: 0220 076a 6a10 0320 0523 0146 0440 2003 
0000370: 2401 0520 0820 0310 050b 2005 1006 2109 
0000380: 2005 1008 210a 2009 4504 4020 0a24 0005 
0000390: 2009 200a 1009 0b20 0a41 0047 0440 200a 
00003a0: 2009 1007 0b05 2003 2003 1002 2002 6a10 
00003b0: 0320 0123 0146 0440 2003 2401 0520 0520 
00003c0: 0310 050b 0b05 2006 0440 2005 1002 2107 
00003d0: 2005 2007 6a21 0820 0510 0621 0920 0510 
00003e0: 0821 0a20 0120 0220 076a 1003 2001 2009 
00003f0: 1007 2001 200a 1009 2005 2301 4604 4020 
0000400: 0124 0105 2008 2001 1005 0b20 0945 0440 
0000410: 2001 2400 0520 0920 0110 090b 200a 4100 
0000420: 4704 4020 0a20 0110 070b 0520 0141 0010 
0000430: 0720 0123 0010 0923 0041 0047 0440 2300 
0000440: 2001 1007 0b20 0124 000b 0b0b 1901 017f 
0000450: 2000 4104 6a10 0e21 0120 0141 0136 0200 
0000460: 2001 4104 6a0b 1a01 017f 2000 4104 6b21 
0000470: 0120 0120 0128 0200 4101 6a36 0200 2000 
0000480: 0b1e 0102 7f20 0041 046b 2101 2001 2802 
0000490: 0041 016b 2102 2001 2002 3602 0020 020b 
00004a0: 0800 2000 2001 2000 0b09 0020 0041 046b 
00004b0: 100f 0b23 0101 7f20 0020 016c 4108 6a10 
00004c0: 0e21 0220 0220 0036 0200 2002 4101 3602 
00004d0: 0420 0241 086a 0b0a 0020 0041 086b 2802 
00004e0: 000b 4601 047f 2000 1016 2103 2001 1016 
00004f0: 2104 2003 2004 6a21 0520 0520 0210 1521 
0000500: 0620 0320 026c 2103 2004 2002 6c21 0420 
0000510: 0620 0020 03fc 0a00 0020 0620 036a 2001 
0000520: 2004 fc0a 0000 2006 0b5e 0104 7f20 0010 
0000530: 1621 0320 0110 1621 0420 0320 046a 2105 
0000540: 2005 2002 1015 2106 2003 2002 6c21 0320 
0000550: 0420 026c 2104 2006 2000 2003 fc0a 0000 
0000560: 2006 2003 6a20 0120 04fc 0a00 0020 0010 
0000570: 1245 0440 2000 1019 0b20 0110 1245 0440 
0000580: 2001 1019 0b20 060b 0900 2000 4108 6b10 
0000590: 0f0b
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
	let irModule = compilerContext.irModule;
	irModule.addFunction(new PlwIRFunction("_main", null, 0, [], [], PlwIR.block(irTopStmts)));
	
	let wasmCompiler = new PlwIRWasmCompiler(irModule);
	wasmCompiler.compileModule();
	let bytes = wasmCompiler.moduleBytes();

	WebAssembly.instantiate(PLW_RT_MODULE).then((plwruntime) => {
		plwruntime.instance.exports.MEM_init(8);
		let importObject = {
			"plwruntime": plwruntime.instance.exports,
			"plwnative": {
				"print(text)": 	function(ptr) {
					let mem = new Uint32Array(plwruntime.instance.exports.memory.buffer);
					let offset = ptr / 4;
					let len = mem[offset - 2];
					let codes = mem.slice(offset, offset + len);
					printTextOut(String.fromCharCode(...codes));
					if (plwruntime.instance.exports.REF_decRc(ptr) === 0) {
						plwruntime.instance.exports.REF_destroyArray(ptr);
					}
				},
				"text(integer)": function(i) {
					let txt = "" + i;
					let ptr = plwruntime.instance.exports.REF_createArray(txt.length, 4);
					let memPtr = ptr / 4;
					let mem = new Uint32Array(plwruntime.instance.exports.memory.buffer);
					for (let i = 0; i < txt.length; i++) {
						mem[memPtr + i] = txt.charCodeAt(i);
					}
					return ptr;
				},
				"text(boolean)": function(b) {
					let txt = b === 0 ? "false" : "true";
					let ptr = plwruntime.instance.exports.REF_createArray(txt.length, 4);
					let memPtr = ptr / 4;
					let mem = new Uint32Array(plwruntime.instance.exports.memory.buffer);
					for (let i = 0; i < txt.length; i++) {
						mem[memPtr + i] = txt.charCodeAt(i);
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

