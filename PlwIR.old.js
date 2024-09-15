"use strict";

const PLW_IR_TYPE_I64                   = 0;

const PLW_IR_TYPES = [
	"i64"
];

const PLW_IR_OP_CALL                    = 0;
const PLW_IR_OP_LOCAL                   = 1;
const PLW_IR_OP_SET_LOCAL               = 2;
const PLW_IR_OP_I64                     = 3;
const PLW_IR_OP_ADD_I64                 = 4;
const PLW_IR_OP_SUB_I64                 = 5;
const PLW_IR_OP_MUL_I64                 = 6;
const PLW_IR_OP_DIV_I64                 = 7;
const PLW_IR_OP_REM_I64                 = 8;
const PLW_IR_OP_NEG_I64                 = 9;
const PLW_IR_OP_EQ_I64                  = 10;
const PLW_IR_OP_GT_I64                  = 11;
const PLW_IR_OP_GTE_I64                 = 12;
const PLW_IR_OP_LT_I64                  = 13;
const PLW_IR_OP_LTE_I64                 = 14;


const PLW_IR_OPS = [
	"call",
	"local",
	"set_local",
	"i64",
	"add_i64",
	"sub_i64",
	"mul_i64",
	"div_i64",
	"rem_i64",
	"neg_i64",
	"eq_i64",
	"gt_i64",
	"gte_i64",
	"lt_i64",
	"lte_i64"
];


class PlwIROp {

	constructor(op, param = null) {
		this.op = op;
		this.param = param;
	}
	
	textFormat() {
		return PLW_IR_OPS[this.op] + (this.param === null ? "" : " " + this.param);
	}

}

class PlwIRBranch {

	constructor() {
		this.fromBranchs = [];
		this.nextBranch = -1;
		this.nextBranchIfTrue = -1;
		this.nextBranchIfFalse = -1;
		this.ops = [];
		this.opCount = 0;
	}
	
	clear() {
		this.fromBranchs = [];
		this.nextBranch = -1;
		this.nextBranchIfTrue = -1;
		this.nextBranchIfFalse = -1;
		this.ops = [];
		this.stack = [];
		this.stackLen = 0;
	}
		
	addFrom(fromBranch) {
		this.fromBranchs[this.fromBranchs.length] = fromBranch;
		return this;
	}
	
	addOp(op) {
		this.ops[this.opCount] = op;
		this.opCount++;		
	}
	
	textFormat() {
		let txt = "";
		let prefix = "";
		if (this.fromBranchs.length > 0) {
			txt += "from";
			for (let i = 0; i < this.fromBranchs.length; i++) {
				txt += " " + this.fromBranchs[i];
			}
			prefix = ", ";
		}
		if (this.nextBranch !== -1) {
			txt += prefix + "next " + this.nextBranch;
			prefix = ", ";
		}
		if (this.nextBranchIfTrue !== -1) {
			txt += prefix + "nextTrue " + this.nextBranchIfTrue;
			prefix = ", ";
		}
		if (this.nextBranchIfFalse !== -1) {
			txt += prefix + "nextFalse " + this.nextBranchIfFalse;
			prefix = ", ";
		}
		txt += "\n";
		for (let i = 0; i < this.opCount; i++) {
			txt += "    " + this.ops[i].textFormat() + "\n";
		}
		return txt;
	}
}


class PlwIRFunction {

	constructor() {
		this.paramCount = 0;
		this.locals = [];
		this.results = [];
		this.branchs = [new PlwIRBranch([], 0)];
		this.branchStack = [];
		this.branchStackLen = 0;
	}
	
	setParamCount(paramCount) {
		this.paramCount = paramCount;
		return this;
	}	
	
	addLocal(slotType) {
		this.locals[this.locals.length] = slotType;
		return this;
	}
	
	addLocalI64() {
		return this.addLocal(PLW_IR_TYPE_I64);
	}

	addResult(slotType) {
		this.results[this.results.length] = slotType;
		return this;
	}
	
	addResultI64() {
		return this.addResult(PLW_IR_TYPE_I64);
	}
	
	currentBranchIndex() {
		return this.branchs.length - 1;
	}
	
	currentBranch() {
		return this.branchs[this.currentBranchIndex()];
	}
	
	previousBranchIndex() {
		return this.branchs.length - 2;
	}
	
	previousBranch() {
		return this.branchs[this.previousBranchIndex()];
	}	
	
	addOp(op, param = null) {
		this.currentBranch().addOp(new PlwIROp(op, param));
		return this;
	}
	
	addOpCall(funcIndex) {
		return this.addOp(PLW_IR_OP_CALL, funcIndex);
	}
	
	addOpLocal(localIndex) {
		return this.addOp(PLW_IR_OP_LOCAL, localIndex);
	}
	
	addOpSetLocal(localIndex) {
		return this.addOp(PLW_IR_OP_SET_LOCAL, localIndex);
	}
	
	addOpI64(intValue) {
		return this.addOp(PLW_IR_OP_I64, intValue);
	}
	
	addOpAddI64() {
		return this.addOp(PLW_IR_OP_ADD_I64);
	}
	
	addOpSubI64() {
		return this.addOp(PLW_IR_OP_SUB_I64);
	}
	
	addOpMulI64() {
		return this.addOp(PLW_IR_OP_MUL_I64);
	}
	
	addOpDivI64() {
		return this.addOp(PLW_IR_OP_DIV_I64);
	}
	
	addOpRemI64() {
		return this.addOp(PLW_IR_OP_REM_I64);
	}
	
	addOpEqI64() {
		return this.addOp(PLW_IR_OP_EQ_I64);
	}
	
	addOpGtI64() {
		return this.addOp(PLW_IR_OP_GT_I64);
	}
	
	addOpGteI64() {
		return this.addOp(PLW_IR_OP_GTE_I64);
	}
	
	addOpLtI64() {
		return this.addOp(PLW_IR_OP_LT_I64);
	}
	
	addOpLteI64() {
		return this.addOp(PLW_IR_OP_LTE_I64);
	}
	
	addBranch() {
		let branchIndex = this.branchs.length;
		this.branchs[branchIndex] = new PlwIRBranch(this.currentBranch().stack, this.currentBranch().stackLen);
		return branchIndex;
	}
	
	pushBranch(branchType, branchIndex) {
		this.branchStack[this.branchStackLen] = {"branchType": branchType, "branchIndex": branchIndex, "exitBranchs": []};
		this.branchStackLen++;
	}
	
	popBranch() {
		this.branchStackLen--;
		return this.branchStack[this.branchStackLen];
	}
		
	beginIf() {
		let branchIndex = this.addBranch();
		this.currentBranch().addFrom(branchIndex - 1);
		this.pushBranch("if", branchIndex);
		this.branchs[branchIndex - 1].nextBranchIfTrue = branchIndex;
		return this;
	}
	
	beginElse() {
		let branchIndex = this.addBranch();
		let ifInfo = this.popBranch();
		if (ifInfo.branchType !== "if") {
			return null;
		}
		this.pushBranch("else", branchIndex);
		this.branchs[ifInfo.branchIndex - 1].nextBranchIfFalse = branchIndex;
		this.currentBranch().addFrom(ifInfo.branchIndex - 1);
		return this;		
	}
	
	endIf() {
		let branchIndex = this.addBranch();
		let ifInfo = this.popBranch();
		if (ifInfo.branchType !== "if" && ifInfo.branchType !== "else") {
			return null;
		}
		this.branchs[ifInfo.branchIndex].nextBranch = branchIndex;
		this.currentBranch().addFrom(ifInfo.branchIndex);
		if (ifInfo.branchType === "else") {
			this.branchs[ifInfo.branchIndex - 1].nextBranch = branchIndex;
			this.currentBranch().addFrom(ifInfo.branchIndex - 1);
			
		} else {
			this.branchs[ifInfo.branchIndex - 1].nextBranchIfFalse = branchIndex;
			this.currentBranch().addFrom(ifInfo.branchIndex - 1);
		}
		return this;
	}
	
	beginLoop() {
		let branchIndex = this.addBranch();
		this.currentBranch().addFrom(branchIndex - 1);
		this.pushBranch("loop", branchIndex);
		this.branchs[branchIndex - 1].nextBranch = branchIndex;
		return this;		
	}
	
	endLoop() {
		let branchIndex = this.addBranch();
		let loopInfo = this.popBranch();
		if (loopInfo.branchType !== "loop") {
			return null;
		}
		for (let i = 0; i < loopInfo.exitBranchs.length; i++) {
			this.branchs[loopInfo.exitBranchs[i]].nextBranch = branchIndex;
			this.currentBranch().addFrom(loopInfo.exitBranchs[i]);
		}
		this.branchs[branchIndex - 1].nextBranch = loopInfo.branchIndex;
		this.branchs[loopInfo.branchIndex].addFrom(branchIndex - 1);
		return this;
	}
	
	exitLoop() {
		let loopInfoIndex = this.branchStackLen - 1;
		while (loopInfoIndex >= 0 && this.branchStack[loopInfoIndex].branchType !== "loop") {
			loopInfoIndex--;
		}
		if (loopInfoIndex < 0) {
			return null;
		}
		let loopInfo = this.branchStack[loopInfoIndex];
		loopInfo.exitBranchs[loopInfo.exitBranchs.length] = this.branchs.length - 1;
		this.addBranch();
		return this;
	}
	
	exitFunc() {
		this.addBranch();
		return this;
	}
		
	textFormat() {
		let txt = "func param " + this.paramCount + " local";
		for (let i = 0; i < this.locals.length; i++) {
			txt += " " + PLW_IR_TYPES[this.locals[i]];
		}
		txt += " result";
		for (let i = 0; i < this.results.length; i++) {
			txt += " " + PLW_IR_TYPES[this.results[i]];
		}
		txt += "\n";
		for (let i = 0; i < this.branchs.length; i++) {
			txt += "\n" + i + ": " + this.branchs[i].textFormat();
		}
		txt += "\nend func\n";
		return txt;
	}
		
}


class PlwIROptimizer {

	constructor(func) {
		this.func = func;
	}

	optimize() {
		for (let i = 0; i < 10; i++) {
			let optimCount = 0;
			optimCount += this.removeTrivials();
			optimCount += this.trimBranches();
			if (optimCount === 0) {
				break;
			}
		}
	}
	
	trimBranches() {
		let trimCount = 0;
		for (let i = 0; i < this.func.branchs.length; i++) {
			let branch = this.func.branchs[i];
			if (i > 0 && branch.fromBranchs.length === 0) {
				branch.clear();
			} 
			if (branch.nextBranch !== null && branch.opCount === 0) {
				for (let j = 0; j < branch.fromBranchs.length; j++) {
					let fromBranch = this.func.branchs[branch.fromBranchs[j]];
					if (fromBranch.nextBranch === i) {
						fromBranch.nextBranch = branch.nextBranch;
					}
					if (fromBranch.nextBranchIfTrue === i) {
						fromBranch.nextBranchIfTrue = branch.nextBranch;
					}
					if (fromBranch.nextBranchIfFalse === i) {
						fromBranch.nextBranchIfFalse = branch.nextBranch;
					}
				}
				branch.clear();
				trimCount++;
			}
		}
		if (trimCount > 0) {
			let newBranchs = [];
			let newBranchIds = [];
			for (let i = 0; i < this.func.branchs.length; i++) {
				let branch = this.func.branchs[i];
				if (i === 0 || branch.fromBranchs.length > 0) {
					newBranchIds[i] = newBranchs.length;
					newBranchs[newBranchs.length] = branch;
				} else {
					newBranchIds[i] = -1;
				}
			}
			for (let i = 0; i < newBranchs.length; i++) {
				let branch = newBranchs[i];
				if (branch.nextBranch !== - 1) {
					branch.nextBranch = newBranchIds[branch.nextBranch];
				}		
				if (branch.nextBranchIfTrue !== - 1) {
					branch.nextBranchIfTrue = newBranchIds[branch.nextBranchIfTrue];
				}		
				if (branch.nextBranchIfFalse !== - 1) {
					branch.nextBranchIfFalse = newBranchIds[branch.nextBranchIfFalse];
				}		
			}
			this.func.branchs = newBranchs;
			this.updateFromBranchs();
		}
		return trimCount;
	}
	
	updateFromBranchs() {
		for (let i = 0; i < this.func.branchs.length; i++) {
			this.func.branchs[i].fromBranchs = [];
		}
		for (let i = 0; i < this.func.branchs.length; i++) {
			let branch = this.func.branchs[i];
			if (branch.nextBranch !== -1) {
				this.func.branchs[branch.nextBranch].addFrom(i);
			}
			if (branch.nextBranchIfTrue !== -1) {
				this.func.branchs[branch.nextBranchIfTrue].addFrom(i);
			}
			if (branch.nextBranchIfFalse !== -1) {
				this.func.branchs[branch.nextBranchIfFalse].addFrom(i);
			}			
		}
	}
		
	removeTrivials() {
		let removedCount = 0;
		for (let i = 0; i < this.func.branchs.length; i++) {
			let branch = this.func.branchs[i];
			let newOpCount = 0;
			for (let j = 0; j < branch.opCount; j++) {
				if (
					newOpCount > 0 &&
					branch.ops[j].op === PLW_IR_OP_SET_LOCAL &&
					branch.ops[newOpCount - 1].op === PLW_IR_OP_LOCAL &&
					branch.ops[j].param === branch.ops[newOpCount - 1].param
				) {
					newOpCount--;
					removedCount++;
				} else if (
					newOpCount > 1 &&
					branch.ops[j].op === PLW_IR_OP_SUB_I64 &&
					branch.ops[newOpCount - 1].op === PLW_IR_OP_LOCAL &&
					branch.ops[newOpCount - 2].op === PLW_IR_OP_LOCAL &&
					branch.ops[newOpCount - 1].param === branch.ops[newOpCount - 2].param
				) {
					branch.ops[newOpCount - 2].op = PLW_IR_OP_I64;
					branch.ops[newOpCount - 2].param = 0;
					newOpCount--;
					removedCount++;
				} else if (
					newOpCount > 0 &&
					branch.ops[j].op === PLW_IR_OP_NEG_I64 &&
					branch.ops[newOpCount - 1].op === PLW_IR_I64
				) {
					branch.ops[newOpCount - 1].param = branch.ops[newOpCount - 1].param;
					removedCount++;
				} else {
					if (newOpCount !== j) {
						branch.ops[newOpCount] = branch.ops[j];
					}
					newOpCount++;
				}
			}
			branch.opCount = newOpCount;
		}
		return removedCount;
	}
	
}

class PlwIRCompiler {

	constructor(func) {
		this.func = func;
		this.localOffsets = [];
		for (let i = 0; i < func.locals.length; i++) {
			if (i < func.paramCount) {
				this.localOffsets[i] = i - func.paramCount - 3;
			} else {
				this.localOffsets[i] = i - func.paramCount;
			}
		}
	}

	codeBlock() {
		let codeBlock = new CodeBlock();
		let branchOffsets = [];
		let jmpLocs = [];
		for (let i = 0; i < this.func.branchs.length; i++) {
			let branch = this.func.branchs[i];
			branchOffsets[i] = codeBlock.codeSize;
			for (let j = 0; j < branch.ops.length; j++) {
				let op = branch.ops[j];
				switch (op.op) {
				case PLW_IR_OP_CALL:
					codeBlock.codeCall(op.param);
					break;
				case PLW_IR_OP_LOCAL:
					let offset = -1;
					codeBlock.codePushLocal(this.localOffsets[op.param]);
					break;
				case PLW_IR_OP_SET_LOCAL:
					codeBlock.codePopLocal(this.localOffsets[op.param]);
					break;
				case PLW_IR_OP_I64:
					codeBlock.codePush(op.param);
					break;
				case PLW_IR_OP_ADD_I64:
					codeBlock.codeAdd();
					break;
				case PLW_IR_OP_SUB_I64:
					codeBlock.codeSub();
					break;
				case PLW_IR_OP_MUL_I64:
					codeBlock.codeMul();
					break;
				case PLW_IR_OP_DIV_I64:
					codeBlock.codeDiv();
					break;
				case PLW_IR_OP_REM_I64:
					codeBlock.codeRem();
					break;
				case PLW_IR_OP_NEG_I64:
					codeBlock.codeNeg();
					break;
				case PLW_IR_OP_EQ_I64:
					codeBlock.codeEq(1);
					break;
				case PLW_IR_OP_GT_I64:
					codeBlock.codeGt();
					break;
				case PLW_IR_OP_GTE_I64:
					codeBlock.codeGte();
					break;
				case PLW_IR_OP_LT_I64:
					codeBlock.codeLt();
					break;
				case PLW_IR_OP_LTE_I64:
					codeBlock.codeLte();
					break;
				default:
					return null;
				}					
			}
			if (branch.nextBranch !== -1) {
				if (branch.nextBranch !== i + 1) {
					jmpLocs[jmpLocs.length] = codeBlock.codeJmp(branch.nextBranch);
				}
			} else if (branch.nextBranchIfTrue !== - 1 && branch.nextBranchIfFalse !== -1) {
				if (branch.nextBranchIfTrue === i + 1) {
					jmpLocs[jmpLocs.length] = codeBlock.codeJz(branch.nextBranchIfFalse);
				} else if (branch.nextBranchIfFalse === i + 1) {
					jmpLocs[jmpLocs.length] = codeBlock.codeJnz(branch.nextBranchIfTrue);
				} else {
					jmpLocs[jmpLocs.length] = codeBlock.codeJnz(branch.nextBranchIfTrue);
					jmpLocs[jmpLocs.length] = codeBlock.codeJmp(branch.nextBranchIfFalse);
				}
			} else {
				codeBlock.codeRet(this.func.results.length);
			}
		}
		for (let i = 0; i < jmpLocs.length; i++) {
			codeBlock.codes[jmpLocs[i]] = branchOffsets[codeBlock.codes[jmpLocs[i]]];
		}
		return codeBlock;
	}

}






