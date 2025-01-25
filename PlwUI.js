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
0000000: 0061 736d 0100 0000 0130 0860 017f 017f 
0000010: 6000 017f 6002 7f7f 0060 017f 0060 027f 
0000020: 7f03 7f7f 7f60 027f 7f01 7f60 037f 7f7f 
0000030: 017f 6004 7f7f 7f7f 017f 031c 1b00 0100 
0000040: 0200 0200 0200 0200 0303 0000 0300 0000 
0000050: 0403 0500 0606 0703 0503 0100 0106 0b02 
0000060: 7f01 4108 0b7f 0141 080b 0787 0211 066d 
0000070: 656d 6f72 7902 0012 4d45 4d5f 6669 7273 
0000080: 7446 7265 6542 6c6f 636b 0300 0d4d 454d 
0000090: 5f6c 6173 7442 6c6f 636b 0301 084d 454d 
00000a0: 5f69 6e69 7400 0c09 4d45 4d5f 616c 6c6f 
00000b0: 6300 0e08 4d45 4d5f 6672 6565 000f 0a52 
00000c0: 4546 5f63 7265 6174 6500 1009 5245 465f 
00000d0: 696e 6352 6300 1109 5245 465f 6465 6352 
00000e0: 6300 1210 5245 465f 6475 7050 7472 5661 
00000f0: 6c50 7472 0013 0b52 4546 5f64 6573 7472 
0000100: 6f79 0014 0f52 4546 5f63 7265 6174 6541 
0000110: 7272 6179 0015 0d52 4546 5f61 7272 6179 
0000120: 5369 7a65 0016 0f52 4546 5f63 6f6e 6361 
0000130: 7441 7272 6179 0017 1452 4546 5f63 6f6e 
0000140: 6361 7442 6173 6963 4172 7261 7900 180f 
0000150: 5245 465f 7370 6c69 6365 4172 7261 7900 
0000160: 1910 5245 465f 6465 7374 726f 7941 7272 
0000170: 6179 001a 0ad8 081b 0a00 4107 2000 6a41 
0000180: 7871 0b04 0041 100b 0700 2000 2802 000b 
0000190: 0900 2000 2001 3602 000b 0700 2000 2802 
00001a0: 040b 0900 2000 2001 3602 040b 0700 2000 
00001b0: 2802 080b 0900 2000 2001 3602 080b 0700 
00001c0: 2000 2802 0c0b 0900 2000 2001 3602 0c0b 
00001d0: 0900 2000 1006 417f 460b 0800 2000 417f 
00001e0: 1007 0b2a 0020 0024 0020 0024 0123 003f 
00001f0: 0041 8080 046c 2300 6b10 0323 0041 0010 
0000200: 0523 0041 0010 0723 0041 0010 090b 2e01 
0000210: 027f 2000 1001 6a21 0123 0021 0202 4020 
0000220: 0245 0440 0c01 0b20 0120 0210 024d 0440 
0000230: 0c01 0b20 0210 0821 020b 2002 0bd1 0101 
0000240: 077f 2000 4504 4041 000f 0b20 0010 0021 
0000250: 0020 0010 0d21 0120 0145 0440 000b 2001 
0000260: 1002 2102 2001 1006 2103 2001 1008 2104 
0000270: 2001 100b 2002 2000 1001 4104 6c6a 4a04 
0000280: 4020 0120 0010 016a 1003 2001 2001 1002 
0000290: 6a21 0520 0520 0220 0110 026b 1003 2005 
00002a0: 2001 1005 2005 2003 1007 2005 2004 1009 
00002b0: 2003 4504 4020 0524 0005 2003 2005 1009 
00002c0: 0b20 0441 0047 0440 2004 2005 1007 0b20 
00002d0: 0123 0146 0440 2005 2401 0520 0120 026a 
00002e0: 2106 2006 2005 1005 0b05 2003 4504 4020 
00002f0: 0424 0005 2003 2004 1009 0b20 0441 004a 
0000300: 0440 2004 2003 1007 0b0b 2001 1001 6a0b 
0000310: d502 010a 7f20 0010 016b 2101 2001 1002 
0000320: 2102 2001 1004 2103 4100 2104 2003 4100 
0000330: 4704 4020 0310 0a45 0440 4101 2104 0b0b 
0000340: 2001 2002 6a21 0541 0021 0620 0541 0047 
0000350: 0440 2005 100a 4504 4041 0121 060b 0b20 
0000360: 0404 4020 0604 4020 0510 0221 0720 0520 
0000370: 076a 2108 2003 2003 1002 2002 2007 6a6a 
0000380: 1003 2005 2301 4604 4020 0324 0105 2008 
0000390: 2003 1005 0b20 0510 0621 0920 0510 0821 
00003a0: 0a20 0945 0440 200a 2400 0520 0920 0a10 
00003b0: 090b 200a 4100 4704 4020 0a20 0910 070b 
00003c0: 0520 0320 0310 0220 026a 1003 2001 2301 
00003d0: 4604 4020 0324 0105 2005 2003 1005 0b0b 
00003e0: 0520 0604 4020 0510 0221 0720 0520 076a 
00003f0: 2108 2005 1006 2109 2005 1008 210a 2001 
0000400: 2002 2007 6a10 0320 0120 0910 0720 0120 
0000410: 0a10 0920 0523 0146 0440 2001 2401 0520 
0000420: 0820 0110 050b 2009 4504 4020 0124 0005 
0000430: 2009 2001 1009 0b20 0a41 0047 0440 200a 
0000440: 2001 1007 0b05 2001 4100 1007 2001 2300 
0000450: 1009 2300 4100 4704 4023 0020 0110 070b 
0000460: 2001 2400 0b0b 0b19 0101 7f20 0041 046a 
0000470: 100e 2101 2001 4101 3602 0020 0141 046a 
0000480: 0b1a 0101 7f20 0041 046b 2101 2001 2001 
0000490: 2802 0041 016a 3602 0020 000b 1e01 027f 
00004a0: 2000 4104 6b21 0120 0128 0200 4101 6b21 
00004b0: 0220 0120 0236 0200 2002 0b08 0020 0020 
00004c0: 0120 000b 0900 2000 4104 6b10 0f0b 2301 
00004d0: 017f 2000 2001 6c41 086a 100e 2102 2002 
00004e0: 2000 3602 0020 0241 0136 0204 2002 4108 
00004f0: 6a0b 0a00 2000 4108 6b28 0200 0b46 0104 
0000500: 7f20 0010 1621 0320 0110 1621 0420 0320 
0000510: 046a 2105 2005 2002 1015 2106 2003 2002 
0000520: 6c21 0320 0420 026c 2104 2006 2000 2003 
0000530: fc0a 0000 2006 2003 6a20 0120 04fc 0a00 
0000540: 0020 060b 5e01 047f 2000 1016 2103 2001 
0000550: 1016 2104 2003 2004 6a21 0520 0520 0210 
0000560: 1521 0620 0320 026c 2103 2004 2002 6c21 
0000570: 0420 0620 0020 03fc 0a00 0020 0620 036a 
0000580: 2001 2004 fc0a 0000 2000 1012 4504 4020 
0000590: 0010 1a0b 2001 1012 4504 4020 0110 1a0b 
00005a0: 2006 0b21 0101 7f20 0220 0310 1521 0420 
00005b0: 0420 0020 0120 036c 6a20 0220 036c fc0a 
00005c0: 0000 2004 0b09 0020 0041 086b 100f 0b
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
				},
				"subtext(text,integer,integer)": function(ptr, offset, size) {
					let ptrSize = plwruntime.instance.exports.REF_arraySize(ptr);
					offset = Number(offset);
					size = Number(size);
					let firstIndex = offset < 0 ? 0 : offset;
					let lastIndex = offset + size;
					if (lastIndex < firstIndex) {
						lastIndex = firstIndex;
					} else if (lastIndex > ptrSize) {
						lastIndex = ptrSize;
					}
					let result = plwruntime.instance.exports.REF_spliceArray(ptr, offset, lastIndex - firstIndex, 4);
					if (plwruntime.instance.exports.REF_decRc(ptr) === 0) {
						plwruntime.instance.exports.REF_destroyArray(ptr);
					}
					return result;
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

