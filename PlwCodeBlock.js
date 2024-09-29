"use strict";
/******************************************************************************************************************************************

	CodeBlock
	
	Represent an executable unit of byte codes

******************************************************************************************************************************************/

class CodeBlock {

	constructor(blockName) {
		this.blockName = blockName;
		this.codes = [];
		this.codeSize = 0;
		this.strConsts = [];
		this.strConstSize = 0;
		this.floatConsts = [];
		this.floatConstSize = 0;
	}
	
	currentLoc() {
		return this.codeSize - 1;
	}
	
	addStrConst(str) {
		for (let i = 0; i < this.strConstSize; i++) {
			if (this.strConsts[i] === str) {
				return i;
			}
		}
		let strId = this.strConstSize;
		this.strConsts[strId] = str;
		this.strConstSize++;
		return strId;
	}
	
	addFloatConst(f) {
		for (let i = 0; i < this.floatConstSize; i++) {
			if (this.floatConsts[i] === f) {
				return i;
			}
		}
		let floatId = this.floatConstSize;
		this.floatConsts[floatId] = f;
		this.floatConstSize++;
		return floatId;
	}

	setLoc(offset) {
		this.codes[offset] = this.codeSize;
	}
	
	code1(inst) {
		this.codes[this.codeSize] = PLW_OPCODE_NOARG;
		this.codeSize++;
		this.codes[this.codeSize] = inst;
		this.codeSize++;
	}
	
	code2(inst, arg) {
		this.codes[this.codeSize] = inst;
		this.codeSize++;
		this.codes[this.codeSize] = arg;
		this.codeSize++;
	}
	
	codeSuspend() {
		this.code1(PLW_OPCODE_SUSPEND);
	}
	
	codePush(val) {
		this.code2(PLW_OPCODE_PUSH, val);
		return this.codeSize - 1;
	}
	
	codePushf(val) {
		this.code2(PLW_OPCODE_PUSHF, val);
	}
		
	codePushGlobal(offset) {
		this.code2(PLW_OPCODE_PUSH_GLOBAL, offset);
	}
	
	codePushGlobalForMutate(offset) {
		this.code2(PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE, offset);
	}
	
	codePushLocal(offset) {
		this.code2(PLW_OPCODE_PUSH_LOCAL, offset);
	}
	
	codePushLocalMove(offset) {
		this.code2(PLW_OPCODE_PUSH_LOCAL_MOVE, offset);
	}	
	
	codePushLocalForMutate(offset) {
		this.code2(PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE, offset);
	}	
		
	codePopGlobal(offset) {
		this.code2(PLW_OPCODE_POP_GLOBAL, offset);
	}
	
	codePopLocal(offset) {
		this.code2(PLW_OPCODE_POP_LOCAL, offset);
	}
	
	codePopVoid(count) {
		this.code2(PLW_OPCODE_POP_VOID, count);
	}
	
	codeAdd() {
		this.code1(PLW_OPCODE_ADD);
	}
	
	codeSub() {
		this.code1(PLW_OPCODE_SUB);
	}

	codeDiv() {
		this.code1(PLW_OPCODE_DIV);
	}

	codeRem() {
		this.code1(PLW_OPCODE_REM);
	}

	codeMul() {
		this.code1(PLW_OPCODE_MUL);
	}
	
	codeNeg() {
		this.code1(PLW_OPCODE_NEG);
	}
	
	codeGt() {
		this.code1(PLW_OPCODE_GT);
	}

	codeGte() {
		this.code1(PLW_OPCODE_GTE);
	}

	codeLt() {
		this.code1(PLW_OPCODE_LT);
	}

	codeLte() {
		this.code1(PLW_OPCODE_LTE);
	}
	
	// real

	codeAddf() {
		this.code1(PLW_OPCODE_ADDF);
	}
	
	codeSubf() {
		this.code1(PLW_OPCODE_SUBF);
	}

	codeDivf() {
		this.code1(PLW_OPCODE_DIVF);
	}

	codeMulf() {
		this.code1(PLW_OPCODE_MULF);
	}
	
	codeNegf() {
		this.code1(PLW_OPCODE_NEGF);
	}
	
	codeGtf() {
		this.code1(PLW_OPCODE_GTF);
	}

	codeGtef() {
		this.code1(PLW_OPCODE_GTEF);
	}

	codeLtf() {
		this.code1(PLW_OPCODE_LTF);
	}

	codeLtef() {
		this.code1(PLW_OPCODE_LTEF);
	}
		
	// real

	codeAnd() {
		this.code1(PLW_OPCODE_AND);
	}
	
	codeOr() {
		this.code1(PLW_OPCODE_OR);
	}
	
	codeNot() {
		this.code1(PLW_OPCODE_NOT);
	}
		
	codeJz(offset) {
		this.code2(PLW_OPCODE_JZ, offset);
		return this.codeSize - 1;
	}
	
	codeJnz(offset) {
		this.code2(PLW_OPCODE_JNZ, offset);
		return this.codeSize - 1;
	}
	
	codeJmp(offset) {
		this.code2(PLW_OPCODE_JMP, offset);
		return this.codeSize - 1;
	}
				
	codeCall(ptr) {
		this.code2(PLW_OPCODE_CALL, ptr);
	}
		
	codeCallNative(ptr) {
		this.code2(PLW_OPCODE_CALL_NATIVE, ptr);
	}
	
	codeEq(count) {
		this.code2(PLW_OPCODE_EQ, count);
	}
	
	codeRet(count) {
		this.code2(PLW_OPCODE_RET, count);
	}
	
	codeDup(count) {
		this.code2(PLW_OPCODE_DUP, count);
	}
	
	codeSwap(count) {
		this.code2(PLW_OPCODE_SWAP, count);
	}
		
	codeExt(extOpcode) {
		this.code2(PLW_OPCODE_EXT, extOpcode);
	}
	
}

class MergedCodeBlockItem {

	constructor(blockName, codeOffset) {
		this.blockName = blockName;
		this.codeOffset = codeOffset;
	}

}

class MergedCodeBlock {

	constructor() {
		this.itemCount = 0;
		this.items = [];
		this.strConsts = [];
		this.strConstSize = 0;
		this.floatConsts = [];
		this.floatConstSize = 0;
		this.codes = [];
		this.codeSize = 0;
		this.entryPoint = 0;
	}
	
	beginEntryPoint() {
		this.entryPoint = this.codeSize;
	}
	
	addStrConst(str) {
		for (let i = 0; i < this.strConstSize; i++) {
			if (this.strConsts[i] === str) {
				return i;
			}
		}
		let strId = this.strConstSize;
		this.strConsts[strId] = str;
		this.strConstSize++;
		return strId;
	}
	
	addFloatConst(f) {
		for (let i = 0; i < this.floatConstSize; i++) {
			if (this.floatConsts[i] === f) {
				return i;
			}
		}
		let floatId = this.floatConstSize;
		this.floatConsts[floatId] = f;
		this.floatConstSize++;
		return floatId;
	}
	
	addCodeBlock(codeBlock) {
		let codeOffset = this.codeSize;
		this.items[this.itemCount] = new MergedCodeBlockItem(codeBlock.blockName, codeOffset);
		this.itemCount++;
		let strConstMap = [];
		for (let i = 0; i < codeBlock.strConstSize; i++) {
			strConstMap[i] = this.addStrConst(codeBlock.strConsts[i]);
		}
		let floatConstMap = [];
		for (let i = 0; i < codeBlock.floatConstSize; i++) {
			floatConstMap[i] = this.addFloatConst(codeBlock.floatConsts[i]);
		}
		let codePos = 0;
		while (codePos < codeBlock.codeSize - 1) {
			let opcode = codeBlock.codes[codePos]; codePos++;
			let arg = codeBlock.codes[codePos]; codePos++;
			if (opcode === PLW_OPCODE_JZ || opcode === PLW_OPCODE_JNZ || opcode === PLW_OPCODE_JMP) {
				arg += codeOffset;
			} else if (opcode === PLW_OPCODE_EXT && arg === PLW_LOPCODE_CREATE_STRING) {
				if (codePos < 2 || this.codes[this.codeSize - 2] !== PLW_OPCODE_PUSH) {
					return "create_string argument is not immediate";
				} else {
					this.codes[this.codeSize - 1] = strConstMap[this.codes[this.codeSize - 1]]
				}
			} else if (opcode === PLW_OPCODE_PUSHF) {
				arg = floatConstMap[arg];
			}
			this.codes[this.codeSize] = opcode; this.codeSize++;
			this.codes[this.codeSize] = arg; this.codeSize++;
		}
		return null;
	}
	
	endMerge() {
		return this.fixCallsOffset();
	}
	
	fixCallsOffset() {
		let codePos = 0;
		while (codePos < this.codeSize - 1) {
			let opcode = this.codes[codePos]; codePos++;
			let arg = this.codes[codePos]; codePos++;
			if (opcode === PLW_OPCODE_CALL) {
				this.codes[codePos - 1] = this.items[arg].codeOffset;
			} else if (opcode === PLW_OPCODE_EXT && arg === PLW_LOPCODE_CREATE_GENERATOR) {
				if (codePos < 4 || this.codes[codePos - 4] !== PLW_OPCODE_PUSH) {
					return "Invalid Create Generator args";
				}
				this.codes[codePos - 3] = this.items[this.codes[codePos - 3]].codeOffset;
			}
		}
		return null;
	}
	
	dump(println) {
		println("Merged code block, entry point at " + this.entryPoint);
		if (this.strConstSize > 0) {
			println("  string consts:");
			for (let i = 0; i < this.strConstSize; i++) {
				println("    " + i + ": " + this.strConsts[i]);
			}
		}
		if (this.floatConstSize > 0) {
			println("  float consts:");
			for (let i = 0; i < this.floatConstSize; i++) {
				println("    " + i + ": " + this.floatConsts[i]);
			}
		}
		println("  code blocks:");
		for (let i = 0; i < this.itemCount; i++) {
			println("    " + i + ": " + this.items[i].blockName + " at " + this.items[i].codeOffset);
		}
		println("  code:");
		for (let i = 0; i < this.codeSize - 1; i += 2) {
			let opcode = this.codes[i];
			let arg1 = this.codes[i + 1];
			let prefix = "" + i + ": ";
			prefix = "          ".substring(0, 10 - prefix.length) + prefix;
			if (opcode === PLW_OPCODE_NOARG) {
				println(prefix + PLW_NOARG_OPCODES[arg1]);
			} else if (opcode === PLW_OPCODE_EXT) {
				println(prefix + PLW_LOPCODES[arg1]);
			} else {
				let opcodeName = PLW_OPCODES[opcode];
				println(prefix + opcodeName + "                              ".substring(0, 26 - opcodeName.length) + arg1);
			}
		}
	}
	
	compiledFormat() {
		let compiled = "" + this.strConstSize + "\n";
		for (let j = 0; j < this.strConstSize; j++) {
			compiled += this.strConsts[j].length + " " + this.strConsts[j] + "\n";
		}
		compiled += this.floatConstSize + "\n";
		for (let j = 0; j < this.floatConstSize; j++) {
			compiled += this.floatConsts[j] + "\n";
		}
		compiled += this.entryPoint + "\n";
		compiled += this.codeSize + "\n";
		for (let j = 0; j < this.codeSize; j++) {
			compiled += this.codes[j] + " ";
			if (j % 50 == 49) {
				compiled += "\n";
			}
		}
		return compiled;
	}

}

