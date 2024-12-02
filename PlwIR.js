"use strict";

// Licence: ce code est au tidoum

const PLW_IR_TYPE_I32                   = 0;
const PLW_IR_TYPE_I64                   = 1;
const PLW_IR_TYPE_F64                   = 2;
const PLW_IR_TYPE_REF                   = 3;

const PLW_IR_TYPES = [
	"i32",
	"i64",
	"f64"
];

const PLW_IR_OP_I64_EQ					= 0;					
const PLW_IR_OP_I64_NE					= 1;
const PLW_IR_OP_I64_LT                  = 2;
const PLW_IR_OP_I64_LTE	                = 3;
const PLW_IR_OP_I64_GT                  = 4;
const PLW_IR_OP_I64_GTE	                = 5;
const PLW_IR_OP_I64_ADD					= 6;
const PLW_IR_OP_I64_SUB					= 7;
const PLW_IR_OP_I64_MUL					= 8;
const PLW_IR_OP_I64_DIV					= 9;
const PLW_IR_OP_I32_EQ					= 10;
const PLW_IR_OP_I32_NE					= 11;
const PLW_IR_OP_I32_LT                  = 12;
const PLW_IR_OP_I32_LTE	                = 13;
const PLW_IR_OP_I32_GT                  = 14;
const PLW_IR_OP_I32_GTE	                = 15;
const PLW_IR_OP_I32_ADD					= 16;
const PLW_IR_OP_I32_SUB					= 17;
const PLW_IR_OP_I32_MUL					= 18;
const PLW_IR_OP_I32_DIV					= 19;

class PlwIRRefType {

	constructor(itemTypes, size) {
		this.itemTypes = itemTypes;
		this.size = size;
		this.memSize = this.itemTypes.length * 8 * size;
		this.decRcFuncId = -1;
	}

}			

class PlwIRExpr {

	constructor(tag) {
		this.tag = tag;
	}
	
}

class PlwIRI32 extends PlwIRExpr {

	constructor(intValue) {
		super("ir-i32");
		this.intValue = intValue;
	}

}

class PlwIRI64 extends PlwIRExpr {

	constructor(intValue) {
		super("ir-i64");
		this.intValue = intValue;
	}

}


class PlwIRF64 extends PlwIRExpr {

	constructor(floatValue) {
		super("ir-f64");
		this.floatValue = floatValue;
	}

}

class PlwIRStr extends PlwIRExpr {

	constructor(strValue) {
		super("ir-str");
		this.strValue = strValue;
	}

}

class PlwIRUnOp extends PlwIRExpr {

	constructor(op, expr) {
		super("ir-unop");
		this.op = op;
		this.expr = expr;
	}

}

class PlwIRBinOp extends PlwIRExpr {

	constructor(op, left, right) {
		super("ir-binop");
		this.op = op;
		this.left = left;
		this.right = right;
	}

}

class PlwIRLocal extends PlwIRExpr {

	constructor(localId) {
		super("ir-local");
		this.localId = localId;
	}

}

class PlwIRSetLocal extends PlwIRExpr {

	constructor(localIds, expr) {
		super("ir-setlocal");
		this.localIds = localIds;
		this.expr = expr;
	}

}

class PlwIRMemcopy extends PlwIRExpr {

	constructor(destPtr, destOffset, srcPtr, srcOffset, size) {
		super("ir-memcopy");
		this.destPtr = destPtr;
		this.destOffset = destOffset;
		this.srcOffsets = srcOffsets;
		this.size = size;
	}

}

class PlwIRGlobal extends PlwIRExpr {

	constructor(globalId) {
		super("ir-global");
		this.globalId = globalId;
	}

}

class PlwIRSetGlobal extends PlwIRExpr {

	constructor(globalIds, expr) {
		super("ir-setglobal");
		this.globalIds = globalIds;
		this.expr = expr;
	}

}

class PlwIRIf extends PlwIRExpr {

	constructor(condExpr, trueExpr, falseExpr) {
		super("ir-if");
		this.condExpr = condExpr;
		this.trueExpr = trueExpr;
		this.falseExpr = falseExpr;
	}

}

class PlwIRLoop extends PlwIRExpr {

	constructor(expr) {
		super("ir-loop");
		this.expr = expr;
	}

}

class PlwIRExitLoop extends PlwIRExpr {

	constructor() {
		super("ir-exitloop");
	}

}

class PlwIRReturn extends PlwIRExpr {

	constructor(exprs) {
		super("ir-return");
		this.exprs = exprs;
	}

}

class PlwIRCall extends PlwIRExpr {

	constructor(functionId, exprs) {
		super("ir-call");
		this.functionId = functionId;
		this.exprs = exprs;
	}

}

class PlwIRCallInternal extends PlwIRExpr {

	constructor(functionId, exprs) {
		super("ir-call-internal");
		this.functionId = functionId;
		this.exprs = exprs;
	}

}

class PlwIRCallExtern extends PlwIRExpr {

	constructor(functionName, exprs) {
		super("ir-call-extern");
		this.functionName = functionName;
		this.exprs = exprs;
	}

}

class PlwIRSizeof extends PlwIRExpr {

	constructor(types) {
		super("ir-sizeof");
		this.types = types;
	}

}

class PlwIROffsetof extends PlwIRExpr {

	constructor(itemId, types) {
		super("ir-offsetof");
		this.itemId = itemId;
		this.types = types;
	}

}

class PlwIRAlloc extends PlwIRExpr {

	constructor(expr) {
		super("ir-alloc");
		this.expr = expr;
	}

}

class PlwIRCreateRef extends PlwIRExpr {

	constructor(refTypeId) {
		super("ir-create-ref");
		this.refTypeId = refTypeId;
	}

}

class PlwIRCreateDSRef extends PlwIRExpr {

	constructor(refTypeId, sizeExpr) {
		super("ir-create-dsref");
		this.refTypeId = refTypeId;
		this.sizeExpr = sizeExpr;
	}

}

class PlwIRIncRefCount extends PlwIRExpr {

	constructor(expr) {
		super("ir-inc-ref-count");
		this.expr = expr;
	}

}

class PlwIRDecRefCount extends PlwIRExpr {

	constructor(localId) {
		super("ir-dec-ref-count");
		this.localId = localId;
	}

}

class PlwIRDestroyRef extends PlwIRExpr {

	constructor(expr) {
		super("ir-destroy-ref");
		this.expr = expr;
	}

}

class PlwIRFree extends PlwIRExpr {

	constructor(expr) {
		super("ir-free");
		this.expr = expr;
	}

}

class PlwIRLoadI64 extends PlwIRExpr {

	constructor(localId, fieldId, indexExpr) {
		super("ir-load-i64");
		this.localId = localId;
		this.fieldId = fieldId;
		this.indexExpr = indexExpr;
	}

}

class PlwIRStoreI64 extends PlwIRExpr {

	constructor(localId, fieldId, indexExpr, valueExpr) {
		super("ir-store-i64");
		this.localId = localId;
		this.fieldId = fieldId;
		this.indexExpr = indexExpr;
		this.valueExpr = valueExpr;
	}

}

class PlwIRLoadI32 extends PlwIRExpr {

	constructor(localId, fieldId, indexExpr, valueExpr) {
		super("ir-load-i32");
		this.localId = localId;
		this.fieldId = fieldId;
		this.indexExpr = indexExpr;
		this.valueExpr = valueExpr;
	}

}

class PlwIRStoreI32 extends PlwIRExpr {

	constructor(localId, fieldId, indexExpr, valueExpr) {
		super("ir-store-i32");
		this.localId = localId;
		this.fieldId = fieldId;
		this.indexExpr = indexExpr;
		this.valueExpr = valueExpr;
	}

}

class PlwIRBlock extends PlwIRExpr {

	constructor(exprs) {
		super("ir-block");
		this.exprs = exprs;
	}

}

class PlwIR {

	static globalInit(isVariable, type, expr) {
		return new PlwIRGlobalInit(isVariable, type, expr);
	}
	
	static global(globalId) {
		return new PlwIRGlobal(globalId);
	}

	static binOp(op, left, right) {
		return new PlwIRBinOp(op, left, right);
	}

	static i32(intValue) {
		return new PlwIRI32(intValue);
	}
	
	static i64(intValue) {
		return new PlwIRI64(intValue);
	}
	
	static callf(functionId, exprs) {
		return new PlwIRCall(functionId, exprs);
	}
	
	static callInternal(functionId, exprs) {
		return new PlwIRCallInternal(functionId, exprs);
	}
	
	static block(exprs) {
		return exprs.length == 1 ? exprs[0] : new PlwIRBlock(exprs);
	}
	
	static ret(exprs) {
		return new PlwIRReturn(exprs);
	}
	
	static alloc(size) {
		return new PlwIRAlloc(size);
	}
	
	static memcopy(destPtr, destOffset, srcPtr, srcOffset, size) {
		return new PlwIRMemcopy(destPtr, destOffset, srcPtr, srcOffset, size);
	}
	
	static createRef(typeId) {
		return new PlwIRCreateRef(typeId);
	}
	
	static createDSRef(typeId, sizeExpr) {
		return new PlwIRCreateDSRef(typeId, sizeExpr);
	}
	
	static incRefCount(expr) {
		return new PlwIRIncRefCount(expr);
	}
	
	static decRefCount(expr) {
		return new PlwIRDecRefCount(expr);
	}
	
	static destroyRef(expr) {
		return new PlwIRDestroyRef(expr);
	}	
	
	static local(localId) {
		return new PlwIRLocal(localId);
	}
	
	static setLocal(localIds, expr) {
		return new PlwIRSetLocal(localIds, expr);
	}
	
	static setGlobal(globalIds, expr) {
		return new PlwIRSetGlobal(globalIds, expr);
	}
	
	static setVariable(isGlobal, variableIds, expr) {
		return isGlobal ? PlwIR.setGlobal(variableIds, expr) : PlwIR.setLocal(variableIds, expr);
	}
	
	static variable(isGlobal, variableIds) {
		return isGlobal ? PlwIR.global(variableIds) : PlwIR.local(variableIds);
	}
	
	static storeI64(localId, fieldId, indexExpr, valueExpr) {
		return new PlwIRStoreI64(localId, fieldId, indexExpr, valueExpr);
	}
	
	static loadI64(localId, fieldId, indexExpr) {
		return new PlwIRLoadI64(localId, fieldId, indexExpr);
	}
	
	static storeI32(ptrExpr, offsetExpr, valueExpr) {
		return new PlwIRStoreI32(ptrExpr, offsetExpr, valueExpr);
	}
	
	static loadI32(ptrExpr, offsetExpr) {
		return new PlwIRLoadI32(ptrExpr, offsetExpr);
	}

	static callExtern(funcName, exprs) {
		return new PlwIRCallExtern(funcName, exprs);
	}
	
	static iff(condExpr, trueExpr, falseExpr) {
		return new PlwIRIf(condExpr, trueExpr, falseExpr);
	}

}

class PlwIRFunction {

	constructor(functionName, importedModule, paramCount, results, locals, expr) {
		this.functionName = functionName;
		this.importedModule = importedModule;
		this.paramCount = paramCount;
		this.results = results;
		this.locals = locals;
		this.expr = expr;
	}
	
}

class PlwIRModule {

	constructor(moduleName) {
		this.moduleName = moduleName;
		this.refTypes = [];
		this.globals = [];
		this.functions = [];
	}

	addRefType(refType) {
		this.refTypes.push(refType);
		
		return this.refTypes.length - 1 + PLW_IR_TYPE_REF;
	}
	
	refType(refTypeId) {
		if (!this.isRefType(refTypeId)) {
			throw new Error("not a ref type " + refTypeId);
		}
		return this.refTypes[refTypeId - PLW_IR_TYPE_REF];
	}
	
	isRefType(refTypeId) {
		return refTypeId >= PLW_IR_TYPE_REF && refTypeId - PLW_IR_TYPE_REF < this.refTypes.length;
	}
	
	addGlobal(glob) {
		this.globals.push(glob);
		return this.globals.length - 1;
	}
	
	addFunction(func) {
		this.functions.push(func);
		return this.functions.length - 1;
	}
}

const PLW_WASM_OP = [
	81,			// PLW_IR_OP_I64_EQ					
	82,			// PLW_IR_OP_I64_NE
	83,			// PLW_IR_OP_I64_LT
	87,			// PLW_IR_OP_I64_LTE
	85,			// PLW_IR_OP_I64_GT
	89,			// PLW_IR_OP_I64_GTE
	124,		// PLW_IR_OP_I64_ADD
	125, 		// PLW_IR_OP_I64_SUB
	126,		// PLW_IR_OP_I64_MUL
	127,		// PLW_IR_OP_I64_DIV
	0x46		// PLW_IR_OP_I64_EQ
];

const PLW_RT_FUNC_ALLOC = 0;
const PLW_RT_FUNC_FREE = 1;
const PLW_RT_FUNC_CREATE_REF = 2;
const PLW_RT_FUNC_INC_REF_COUNT = 3;
const PLW_RT_FUNC_DEC_REF_COUNT = 4;
const PLW_RT_FUNC_DESTROY_REF = 5;

const PLW_RT_FUNCS = [
	new PlwIRFunction("MEM_alloc", "plwruntime", 1, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32], null),
	new PlwIRFunction("MEM_free", "plwruntime", 1, [], [PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_create", "plwruntime", 1, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_incRc", "plwruntime", 1, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_decRc", "plwruntime", 1, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_destroy", "plwruntime", 1, [], [PLW_IR_TYPE_I32], null), 
	// new PlwIRFunction("print(text)", "plwnative", 1, [], [PLW_IR_TYPE_I32], null),
	// new PlwIRFunction("text(integer)", "plwnative", 1, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I64], null)
];

class PlwIRWasmCompiler {

	constructor(irModule) {
		this.irModule = irModule;
		this.typeSection = [];
		this.importSection = [this.strBytes("plwruntime").concat(this.strBytes("memory"), [2, 0, 1])];
		this.globalSection = [];
		this.functionSection = [];
		this.exportSection = [];
		this.codeSection = [];
		this.funcIndexMap = [];
		this.nestedLevel = 0;
		this.blockLevelStack = [];
		this.blockLevelStackSize = 0;
	}
	
	static findExternFuncIndex(funcName) {
		for (let i = 0; i < PLW_RT_FUNCS.length; i++) {
			if (PLW_RT_FUNCS[i].functionName === funcName) {
				return i;
			}
		}
		return -1;
	}
		
	pushBlockLevel() {
		this.blockLevelStack[this.blockLevelStackSize] = this.nestedLevel;
		this.blockLevelStackSize++;
	}
	
	popBlockLevel() {
		this.blockLevelStackSize--;
	}
	
	topBlockLevel() {
		return this.blockLevelStack[this.blockLevelStackSize - 1];
	}
	
	resetLabels() {
		this.nextLabelId = 0;
		this.blockLabelStack = [];
		this.blockLabelStackSize = 0;
	}
	
	typeByte(irType) {
		switch(irType) {
		case PLW_IR_TYPE_I64:
			return 126;
		case PLW_IR_TYPE_F64:
			return 124;
		case PLW_IR_TYPE_I32:
			return 127;
		}
		if (this.irModule.isRefType(irType)) {
			return 127;
		}
		throw new Error("Unknown type " + irType);
	}
		
	addFunctionType(func) {
		let typeBytes = [96].concat(this.uintBytes(func.paramCount));
		for (let i = 0; i < func.paramCount; i++) {
			typeBytes[typeBytes.length] = this.typeByte(func.locals[i]);
		}
		typeBytes = typeBytes.concat(this.uintBytes(func.results.length));
		for (let i = 0; i < func.results.length; i++) {
			typeBytes[typeBytes.length] = this.typeByte(func.results[i]);
		}
		let typeId = this.typeSection.length;
		this.typeSection[typeId] = typeBytes;
		return typeId;
	}
	
	compileModule() {
		for (let i = 0; i < this.irModule.globals.length; i++) {
			this.compileGlobal(this.irModule.globals[i]);
		}
		for (let i = 0; i < PLW_RT_FUNCS.length; i++) {
			this.compileFunction(i, PLW_RT_FUNCS[i]);
		}
		let funcIndex = PLW_RT_FUNCS.length;
		for (let i = 0; i < this.irModule.functions.length; i++) {
			if (this.irModule.functions[i].importedModule !== null) {
				this.funcIndexMap[i] = funcIndex;
				funcIndex++;
			}
		}
		for (let i = 0; i < this.irModule.functions.length; i++) {
			if (this.irModule.functions[i].importedModule === null) {
				this.funcIndexMap[i] = funcIndex;
				funcIndex++;
			}
		}
		for (let i = 0; i < this.irModule.refTypes.length; i++) {
			let refType = this.irModule.refTypes[i];
			let refOffsets = [];
			for (let j = 0; j < refType.itemTypes.length; j++) {
				if (this.irModule.isRefType(refType.itemTypes[j])) {
					refOffsets.push(j);
				}
			}
			if (refOffsets.length > 0) {
				if (refType.size > 0) {
					// Generate a destructor
				}
			}
		}
		for (let i = 0; i < this.irModule.functions.length; i++) {
			this.compileFunction(this.funcIndexMap[i], this.irModule.functions[i]);
		}
	}
	
	addCodeByte(byte) {
		this.codes[this.codes.length] = byte;
	}
	
	addCodeUint(uint) {
		this.appendUint(this.codes, uint);
	}
	
	compileGlobal(globalType) {
		let bytes = [this.typeByte(globalType), 1];
		switch (globalType) {
		case PLW_IR_TYPE_I32:
			bytes = bytes.concat(this.compileCode(null, PlwIR.i32(0)));
			break;
		case PLW_IR_TYPE_I64:
			bytes = bytes.concat(this.compileCode(null, PlwIR.i64(0)));
			break;
		case PLW_IR_TYPE_F64:
			bytes = bytes.concat(this.compileCode(null, PlwIR.f64(0)));
			break;
		case PLW_IR_TYPE_PTR:
			bytes = bytes.concat(this.compileCode(null, PlwIR.i32(0)));
			break;
		}
		this.globalSection[this.globalSection.length] = bytes.concat([11]);
	}
	
	compileFunction(funcIndex, func) {
		this.resetLabels();
		let typeId = this.addFunctionType(func);
		if (func.importedModule !== null) {
			let bytes = this.strBytes(func.importedModule).concat(this.strBytes(func.functionName));
			bytes = bytes.concat([0], this.uintBytes(typeId));
			this.importSection[this.importSection.length] = bytes;
		} else {
			this.functionSection[this.functionSection.length] = this.uintBytes(typeId);
			let localCount = func.locals.length - func.paramCount;
			let codes = this.uintBytes(localCount);
			for (let i = 0; i < localCount; i++) {
				codes = codes.concat([1], this.typeByte(func.locals[func.paramCount + i]));
			}
			codes = codes.concat(this.compileCode(func, func.expr), [11]);
			this.codeSection[this.codeSection.length] = this.uintBytes(codes.length).concat(codes);
			if (func.functionName !== null) {
				this.exportSection[this.exportSection.length] = this.strBytes(func.functionName).concat([0], this.uintBytes(funcIndex));
			}
		}
	}
	
	compileCode(func, expr) {
		if (expr.tag === "ir-return") {
			let bytes = [];
			for (let i = 0; i < expr.exprs.length; i++) {
				bytes = bytes.concat(this.compileCode(func, expr.exprs[i]));
			}
			return bytes.concat([15]);
		}
		if (expr.tag === "ir-local") {
			return [32].concat(this.uintBytes(expr.localId));
		}
		if (expr.tag === "ir-global") {
			return [35].concat(this.uintBytes(expr.globalId));
		}
		if (expr.tag === "ir-block") {
			let bytes = [];
			for (let i = 0; i < expr.exprs.length; i++) {
				bytes = bytes.concat(this.compileCode(func, expr.exprs[i]));
			}
			return bytes;
		}
		if (expr.tag === "ir-call" || expr.tag === "ir-call-extern" || expr.tag === "ir-call-internal") {
			let bytes = [];
			for (let i = 0; i < expr.exprs.length; i++) {
				bytes = bytes.concat(this.compileCode(func, expr.exprs[i]));
			}
			let funcId = 0;
			if (expr.tag === "ir-call") {
				funcId = this.funcIndexMap[expr.functionId];
			} else if (expr.tag === "ir-call-internal") {
				funcId = expr.functionId;
			} else {
				funcId = PlwIRWasmCompiler.findExternFuncIndex(expr.functionName);
				if (funcId === -1) {
					throw new Error("external function " + expr.functionName + " not found");
				}
			}
			return bytes.concat([16], this.uintBytes(funcId));			
		}
		if (expr.tag === "ir-setlocal") {
			let bytes = this.compileCode(func, expr.expr);
			for (let i = 0; i < expr.localIds.length; i++) {
				bytes = bytes.concat([33], this.uintBytes(expr.localIds[expr.localIds.length - 1 - i]));
			}
			return bytes;
		}
		if (expr.tag === "ir-setglobal") {
			let bytes = this.compileCode(func, expr.expr);
			for (let i = 0; i < expr.globalIds.length; i++) {
				bytes = bytes.concat([36], this.uintBytes(expr.globalIds[expr.globalIds.length - 1 - i]));
			}
			return bytes;
		}
		if (expr.tag === "ir-i32") {
			return [65].concat(this.intBytes(expr.intValue));
		}
		if (expr.tag === "ir-i64") {
			return [66].concat(this.intBytes(expr.intValue));
		}
		if (expr.tag === "ir-binop") {
			let bytes = this.compileCode(func, expr.left).concat(this.compileCode(func, expr.right));
			return bytes.concat([PLW_WASM_OP[expr.op]]);
		}
		if (expr.tag === "ir-if") {
			let bytes = this.compileCode(func, expr.condExpr);
			bytes = bytes.concat([4, 64]);
			this.nestedLevel++;
			if (expr.trueExpr !== null) {
				bytes = bytes.concat(this.compileCode(func, expr.trueExpr));
			}
			if (expr.falseExpr !== null) {
				bytes = bytes.concat([5], this.compileCode(func, expr.falseExpr));
			}
			this.nestedLevel--;
			return bytes.concat(11);
		}
		if (expr.tag === "ir-loop") {
			this.pushBlockLevel();
			this.nestedLevel += 2;
			let bytes = this.compileCode(func, expr.expr);
			this.nestedLevel -= 2;
			this.popBlockLevel();
			bytes = [2, 64, 3, 64].concat(bytes, [12, 0, 11, 11]);
			return bytes;
		}
		if (expr.tag === "ir-exitloop") {
			return [12].concat(this.uintBytes(this.nestedLevel - this.topBlockLevel() - 1));
		}
		if (expr.tag === "ir-alloc") {
			let bytes = this.compileCode(func, expr.expr);
			return bytes.concat([16], this.uintBytes(PLW_RT_FUNC_ALLOC));						
		}
		if (expr.tag === "ir-create-ref") {
			let refType = this.irModule.refType(expr.refTypeId);
			if (refType.size === 0) {
				throw new Error("invalid refTypeId " + irRefTypeId + " for ir-create-ref, a valid size is needed");
			}
			return [65].concat(this.intBytes(refType.memSize), [16], this.uintBytes(PLW_RT_FUNC_CREATE_REF));						
		}
		if (expr.tag === "ir-create-dsref") {
			let refType = this.irModule.refType(expr.refTypeId);
			if (refType.size !== 0) {
				throw new Error("invalid refTypeId " + irRefTypeId + " for ir-create-dsref, must not have a size");
			}
			return this.compileCode(func,
				PlwIR.callInternal(PLW_RT_FUNC_CREATE_REF, [
					PlwIR.binOp(PLW_IR_OP_I32_ADD,
						PlwIR.i32(4),
						PlwIR.binOp(PLW_IR_OP_I32_MUL, refType.memSize, expr.sizeExpr)
					)
				]));
		}
		if (expr.tag === "ir-dec-ref-count") {
			let refType = this.irModule.refType(func.locals[expr.localId]);
			return this.compileCode(func,
				PlwIR.iff(
					PlwIR.binOp(
						PLW_IR_OP_I32_EQ,
						PlwIR.i32(0),
						PlwIR.callInternal(PLW_RT_FUNC_DEC_REF_COUNT, [PlwIR.local(expr.localId)])),
					PlwIR.callInternal(PLW_RT_FUNC_DESTROY_REF, [PlwIR.local(expr.localId)]),
					null)
			);
		}
		if (expr.tag === "ir-inc-ref-count") {
			let bytes = this.compileCode(func, expr.expr);
			return bytes.concat([16], this.uintBytes(PLW_RT_FUNC_INC_REF_COUNT));						
		}		
		if (expr.tag === "ir-destroy-ref") {
			let bytes = this.compileCode(func, expr.expr);
			return bytes.concat([16], this.uintBytes(PLW_RT_FUNC_DESTROY_REF));						
		}		
		if (expr.tag === "ir-free") {
			let bytes = this.compileCode(func, expr.expr);
			return bytes.concat([16], this.uintBytes(PLW_RT_FUNC_FREE));						
		}
		if (expr.tag === "ir-load-i64") {
			let refTypeId = func.locals[expr.localId];
			let refType = this.irModule.refType(refTypeId);
			if (expr.fieldId < 0 || expr.fieldId > refType.itemTypes.length) {
				throw new Error("Invalid fieldId " + expr.fieldId + " for type " + refTypeId);
			}
			if (expr.indexExpr.tag === "ir-i32") {
				if (refType.size > 0) {
					if (expr.indexExpr.intValue < 0 || expr.indexExpr.intValue >= refType.size) {
						throw new Error("Invalid index " + expr.indexExpr.intValue + " for type " + refTypeId);
					}
				} else {
					// TODO generate bound check code
				}
				return [
					...this.compileCode(func, PlwIR.local(expr.localId)),
					41, 3, this.uintBytes(expr.indexExpr.intValue * refType.memSize + expr.fieldId * 8)
				];
			}
			// TODO generate bound check code
			return [
				...this.compileCode(func, PlwIR.local(expr.localId)),
				...this.compileCode(func,
					PlwIR.binOp(PLW_IR_OP_I32_ADD,
						PlwIR.binOp(PLW_IR_OP_I32_MUL, expr.indexExpr, PlwIR.i32(refType.memSize)),
						PlwIR.i32(expr.fieldId * 8))),							
				106,
				41, 3, 0
			];
		}
		if (expr.tag === "ir-memcopy") {
			return [
				...this.compileCode(func, expr.destPtr),
				...this.compileCode(func, expr.destOffset),
				106,
				...this.compileCode(func, expr.srcPtr),
				...this.compileCode(func, expr.srcOffset),
				106,
				...this.compileCode(func, expr.size),
				0xFC, 10, 0, 0
			];
		}
		if (expr.tag === "ir-store-i64") {
			let refTypeId = func.locals[expr.localId];
			let refType = this.irModule.refType(refTypeId);
			if (expr.fieldId < 0 || expr.fieldId > refType.itemTypes.length) {
				throw new Error("Invalid fieldId " + expr.fieldId + " for type " + refTypeId);
			}
			if (expr.indexExpr.tag === "ir-i32") {
				if (refType.size > 0) {
					if (expr.indexExpr.intValue < 0 || expr.indexExpr.intValue >= refType.size) {
						throw new Error("Invalid index " + expr.indexExpr.intValue + " for type " + refTypeId);
					}
				} else {
					// TODO generate bound check code
				}
				return [
					...this.compileCode(func, PlwIR.local(expr.localId)),
					...this.compileCode(func, expr.valueExpr),
					55, 3, this.uintBytes(expr.indexExpr.intValue * refType.memSize + expr.fieldId * 8)
				];
			}
			// TODO generate bound check code
			return [
				...this.compileCode(func, PlwIR.local(expr.localId)),
				...this.compileCode(func,
					PlwIR.binOp(PLW_IR_OP_I32_ADD,
						PlwIR.binOp(PLW_IR_OP_I32_MUL, expr.indexExpr, PlwIR.i32(refType.memSize)),
						PlwIR.i32(expr.fieldId * 8))),							
				106,
				...this.compileCode(func, expr.valueExpr),
				55, 3, 0
			];
		}
		if (expr.tag === "ir-store-i32") {
			return [
				...this.compileCode(func, PlwIR.local(expr.localId)),
				...this.compileCode(func, expr.offsetExpr),
				106,
				...this.compileCode(func, expr.valueExpr),
				54, 2, 0
			];
		}
		if (expr.tag === "ir-load-i32") {
			return [
				...this.compileCode(func, PlwIR.local(expr.localId)),
				...this.compileCode(func, expr.offsetExpr),
				106,
				40, 3, 0
			];
		}		
		throw new Error("Unknown tag " + expr.tag);
	}
	
	uintBytes(uint) {
		let bytes = [];
		do {
			let byte = uint % 128;
			uint = uint / 128 | 0;
			if (uint !== 0) {
				byte += 128;
			}
			bytes[bytes.length] = byte;
		} while (uint !== 0);
		return bytes;
	}
	
	intBytes(value) {
		value |= 0;
		const result = [];
 		while (true) {
			const byte_ = value & 0x7f;
			value >>= 7;
			if (
				(value === 0 && (byte_ & 0x40) === 0) ||
				(value === -1 && (byte_ & 0x40) !== 0)
			) {
				result.push(byte_);
				return result;
			}
			result.push(byte_ | 0x80);
		}
	}
	
	strBytes(str) {
		let bytes = new TextEncoder().encode(str);
		return [this.uintBytes(bytes.length), ...bytes];
	}
	
	moduleBytes() {
		let bytes = [0, 97, 115, 109, 1, 0, 0, 0];
		return bytes.concat(
			this.sectionBytes(1, this.typeSection),
			this.sectionBytes(2, this.importSection),
			this.sectionBytes(3, this.functionSection),
			this.sectionBytes(6, this.globalSection),
			this.sectionBytes(7, this.exportSection),
			this.sectionBytes(10, this.codeSection));
	}
	
	sectionBytes(sectionType, section) {
		let bytes = this.uintBytes(section.length);
		for (let i = 0; i < section.length; i++) {
			bytes = bytes.concat(section[i]);
		}
		return [sectionType].concat(this.uintBytes(bytes.length), bytes);
	}

}



