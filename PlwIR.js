"use strict";

// Licence: ce code est au tidoum

const PLW_IR_TYPE_I32                   = 0;
const PLW_IR_TYPE_I64                   = 1;
const PLW_IR_TYPE_F64                   = 2;
const PLW_IR_TYPE_REF                   = 3;

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

class PlwIRUtil {

	static align(offset, size) {
		if (offset % size == 0) return offset;
		return offset + size - offset % size;
	}
	
	static typeSize(typeId) {
		if (typeId === PLW_IR_TYPE_I64 || typeId === PLW_IR_TYPE_F64) {
			return 8;
		}
		return 4;
	}
	
	static isRef(typeId) {
		return typeId >= PLW_IR_TYPE_REF;
	}

}

class PlwIRRefType {

	constructor(itemTypes, size) {
		this.itemTypes = itemTypes;
		this.size = size;
		this.itemOffsets = [];
		this.itemSize = 0;
		for (let i = 0; i < itemTypes.length; i++) {
			let typeSize = PlwIRUtil.typeSize(itemTypes[i]);
			this.itemSize = PlwIRUtil.align(this.itemSize, typeSize);
			this.itemOffsets[i] = this.itemSize;
			this.itemSize += typeSize;
		}
		if (this.itemSize === 3) {
			this.itemSize = 4;
		} else if (this.itemSize > 4) {
			this.itemSize = PlwIRUtil.align(this.itemSize, 8);
		}
		this.decRcFunctionId = -1;
		this.createRefFunctionId = -1;
	}
	
	containsRef() {
		for (let i = 0; i < this.itemTypes.length; i++) {
			if (PlwIRUtil.isRef(this.itemTypes[i])) {
				return true;
			}
		}
		return false;
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
		this.incRc = false;
	}
	
}

class PlwIRSetLocal extends PlwIRExpr {

	constructor(localIds, expr) {
		super("ir-setlocal");
		this.localIds = localIds;
		this.expr = expr;
		this.toDecAfter = [];
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
		this.toDecBeforeTrue = [];
		this.toDecBeforeFalse = [];
	}

}

class PlwIRLoop extends PlwIRExpr {

	constructor(expr) {
		super("ir-loop");
		this.expr = expr;
		this.toDecAfter = [];
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

class PlwIRCreateRef extends PlwIRExpr {

	constructor(refTypeId, exprs) {
		super("ir-create-ref");
		this.refTypeId = refTypeId;
		this.exprs = exprs;
	}

}

class PlwIRCreateArrayRef extends PlwIRExpr {

	constructor(refTypeId, size, exprs) {
		super("ir-create-array-ref");
		this.refTypeId = refTypeId;
		this.size = size;
		this.exprs = exprs;
		this.funcId = -1;
	}

}

class PlwIRConcatArray extends PlwIRExpr {

	constructor(left, right, typeId) {
		super("ir-concat-array");
		this.left = left;
		this.right = right;
		this.typeId = typeId;
	}

}

class PlwIRLoadI64 extends PlwIRExpr {

	constructor(localId, fieldId, indexExpr) {
		super("ir-load-i64");
		this.localId = localId;
		this.fieldId = fieldId;
		this.indexExpr = indexExpr;
		this.toDecAfter = false;
	}

}

class PlwIRStoreI64 extends PlwIRExpr {

	constructor(localId, fieldId, indexExpr, valueExpr) {
		super("ir-store-i64");
		this.localId = localId;
		this.fieldId = fieldId;
		this.indexExpr = indexExpr;
		this.valueExpr = valueExpr;
		this.toDecAfter = false;
	}

}

class PlwIRLoadI32 extends PlwIRExpr {

	constructor(localId, fieldId, indexExpr) {
		super("ir-load-i32");
		this.localId = localId;
		this.fieldId = fieldId;
		this.indexExpr = indexExpr;
		this.toDecAfter = false;
	}

}

class PlwIRStoreI32 extends PlwIRExpr {

	constructor(localId, fieldId, indexExpr, valueExpr) {
		super("ir-store-i32");
		this.localId = localId;
		this.fieldId = fieldId;
		this.indexExpr = indexExpr;
		this.valueExpr = valueExpr;
		this.toDecAfter = false;
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
		
	static createRef(typeId, exprs) {
		return new PlwIRCreateRef(typeId, exprs);
	}
	
	static createArrayRef(refTypeId, size, exprs) {
		return new PlwIRCreateArrayRef(refTypeId, size, exprs);
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
	
	static storeI32(localId, fieldId, indexExpr, valueExpr) {
		return new PlwIRStoreI32(localId, fieldId, indexExpr, valueExpr);
	}
	
	static loadI32(localId, fieldId, indexExpr) {
		return new PlwIRLoadI32(localId, fieldId, indexExpr);
	}
	
	static iff(condExpr, trueExpr, falseExpr) {
		return new PlwIRIf(condExpr, trueExpr, falseExpr);
	}
	
	static concatArray(left, right, typeId) {
		return new PlwIRConcatArray(left, right, typeId);
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
		this.toDecBefore = [];
		this.autorc = true;
	}
	
	noautorc() {
		this.autorc = false;
		return this;
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
		// TODO reuse similar reftype
		this.refTypes.push(refType);
		let refId = this.refTypes.length - 1 + PLW_IR_TYPE_REF;
		return refId;
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

class PlwIRRefCountAnalizer {
	
	constructor(func) {
		this.func = func;
	}
	
	static analize(func) {
		let analizer = new PlwIRRefCountAnalizer(func)
		let toDec = analizer.evalExpr(func.expr, analizer.decAll());
		for (let i = 0; i < func.paramCount; i++) {
			if (toDec[i] === true) {
				func.toDecBefore.push(i);
			}
		}
		console.log(JSON.stringify(func, null, 2));
	}
	
	decAll() {
		let toDec = new Array(this.func.locals.length);
		for (let i = 0; i < this.func.locals.length; i++) {
			toDec[i] = this.func.locals[i] >= PLW_IR_TYPE_REF;
		}
		return toDec;
	}
	
	copyToDec(toDec) {
		let cp = new Array(this.func.locals.length);
		for (let i = 0; i < this.func.locals.length; i++) {
			cp[i] = toDec[i];
		}
		return cp;
	}
	
	evalExpr(expr, toDec) {
		console.log(expr.tag, JSON.stringify(toDec));
		if (expr.tag === "ir-return") {
			let toDec = this.decAll();
			for (let i = expr.exprs.length - 1; i >= 0; i--) {
				toDec = this.evalExpr(expr.exprs[i], toDec);
			}
			return toDec;
		}
		if (expr.tag === "ir-local") {
			if (toDec[expr.localId] === true) {
				toDec[expr.localId] = false;
				expr.incRc = false;
			} else if (PlwIRUtil.isRef(this.func.locals[expr.localId])) {
				expr.incRc = true;
			}
			return toDec;
		}
		if (expr.tag === "ir-block") {
			for (let i = expr.exprs.length - 1; i >= 0; i--) {
				toDec = this.evalExpr(expr.exprs[i], toDec);
			}
			return toDec;
		}
		if (expr.tag === "ir-call") {
			for (let i = expr.exprs.length - 1; i >= 0; i--) {
				toDec = this.evalExpr(expr.exprs[i], toDec);
			}
			return toDec;
		}
		if (expr.tag === "ir-create-array-ref" || expr.tag === "ir-create-ref") {
			toDec[expr.localId] = true;
			for (let i = expr.exprs.length - 1; i >= 0; i--) {
				toDec = this.evalExpr(expr.exprs[i], toDec);
			}
			return toDec;
		}
		if (expr.tag === "ir-setlocal") {
			for (let i = 0; i < expr.localIds.length; i++) {
				if (toDec[expr.localIds[i]] === true) {
					expr.toDecAfter.push(expr.localIds[i]);					
				}
				toDec[expr.localIds[i]] = true;
			}
			return this.evalExpr(expr.expr, toDec);
		}
		if (expr.tag === "ir-if") {
			let toDecTrue = expr.trueExpr === null ?  this.copyToDec(toDec) : this.evalExpr(expr.trueExpr, this.copyToDec(toDec));
			let toDecFalse = expr.falseExpr === null ?  this.copyToDec(toDec) : this.evalExpr(expr.falseExpr, this.copyToDec(toDec));
			for (let i = 0; i < toDec.length; i++) {
				if (toDecTrue[i] === false && toDecFalse[i] === true) {
					expr.toDecBeforFalse.push(i);
				} else if (toDecTrue[i] === true && toDecFalse[i] === false) {
					expr.toDecBeforeTrue[i].push(i);
					toDecTrue[i] = false;
				}
			}
			return this.evalExpr(expr.condExpr, toDecTrue);
		}
		if (expr.tag === "ir-loop") {
			let toDecBefore = this.evalExpr(expr.expr, this.copyToDec(toDec));
			for (let i = 0; i < toDec.length; i++) {
				if (toDec[i] === true && toDecBefore[i] === false) {
					expr.toDecAfter.push(i);
				}
			}
			return toDecBefore;
		}
		if (expr.tag === "ir-store-i64" || expr.tag === "ir-store-i32") {
			if (toDec[expr.localId] === true) {
				expr.toDecAfter = true;
				toDec[expr.localId] = false;
			}
			return this.evalExpr(expr.valueExpr, toDec);
		}
		if (expr.tag === "ir-load-i64" || expr.tag === "ir-load-i32") {
			if (toDec[expr.localId] === true) {
				expr.toDecAfter = true;
				toDec[expr.localId] =false;
			}
			return toDec;
		}
		if (expr.tag === "ir-binop") {
			return this.evalExpr(expr.left, this.evalExpr(expr.right, toDec));
		}
		if (expr.tag === "ir-concat-array") {
			return this.evalExpr(expr.left, this.evalExpr(expr.right, toDec));
		}
		return toDec;
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
	0x46,		// PLW_IR_OP_I32_EQ
	0x47,		// PLW_IR_OP_I32_NE
	0x48,		// PLW_IR_OP_I32_LT
	0x4C,		// PLW_IR_OP_I32_LTE
	0x4A,		// PLW_IR_OP_I32_GT
	0x4E,		// PLW_IR_OP_I32_GTE
	0x6A,		// PLW_IR_OP_I32_ADD
	0x6B,		// PLW_IR_OP_I32_SUB
	0x6C,		// PLW_IR_OP_I32_MUL
	0x6D		// PLW_IR_OP_I32_DIV
];

const PLW_RT_FUNC_REF_CREATE		= 0;
const PLW_RT_FUNC_REF_INC_RC		= 1;
const PLW_RT_FUNC_REF_DEC_RC		= 2;
const PLW_RT_FUNC_REF_DESTROY		= 3;
const PLW_RT_FUNC_REF_CREATE_ARRAY	= 4;
const PLW_RT_FUNC_REF_ARRAY_SIZE	= 5;
const PLW_RT_FUNC_REF_CONCAT_ARRAY	= 6;
const PLW_RT_FUNC_REF_CONCAT_BASIC_ARRAY	= 7;
const PLW_RT_FUNC_REF_DESTROY_ARRAY	= 8;

const PLW_RT_FUNCS = [
	new PlwIRFunction("REF_create", "plwruntime", 1, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_incRc", "plwruntime", 1, [], [PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_decRc", "plwruntime", 1, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_destroy", "plwruntime", 1, [], [PLW_IR_TYPE_I32], null), 
	new PlwIRFunction("REF_createArray", "plwruntime", 2, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32, PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_arraySize", "plwruntime", 1, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_concatArray", "plwruntime", 3, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32, PLW_IR_TYPE_I32, PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_concatBasicArray", "plwruntime", 3, [PLW_IR_TYPE_I32], [PLW_IR_TYPE_I32, PLW_IR_TYPE_I32, PLW_IR_TYPE_I32], null),
	new PlwIRFunction("REF_destroyArray", "plwruntime", 1, [], [PLW_IR_TYPE_I32], null)
];


class PlwIRWasmTypeFuncGenerator {

	constructor(irModule) {
		this.irModule = irModule;
		this.func = null;
		this.createArrayFuncMap = [];
	}
	
	generate() {
		let funcCount = this.irModule.functions.length;
		for (let i = 0; i < funcCount; i++) {
			this.func = this.irModule.functions[i];
			if (this.func.expr !== null) {
				this.evalExpr(this.func.expr);
			}
		}
		for (let i = 0; i < this.irModule.refTypes.length; i++) {
			let refType = this.irModule.refTypes[i];
			this.generateDecRc(i + PLW_IR_TYPE_REF, refType);
			if (refType.size > 0) {
				this.generateCreateRef(i + PLW_IR_TYPE_REF, refType);
			}
		}
	}
	
	evalExpr(expr) {
		if (expr.tag === "ir-return") {
			for (let i = expr.exprs.length - 1; i >= 0; i--) {
				this.evalExpr(expr.exprs[i]);
			}
			return;
		}
		if (expr.tag === "ir-block") {
			for (let i = expr.exprs.length - 1; i >= 0; i--) {
				this.evalExpr(expr.exprs[i]);
			}
			return;
		}
		if (expr.tag === "ir-call") {
			for (let i = expr.exprs.length - 1; i >= 0; i--) {
				this.evalExpr(expr.exprs[i]);
			}
		}
		if (expr.tag === "ir-create-ref") {
			for (let i = expr.exprs.length - 1; i >= 0; i--) {
				this.evalExpr(expr.exprs[i]);
			}
			return;
		}
		if (expr.tag === "ir-create-array-ref") {
			expr.funcId = this.generateCreateArrayRef(expr.refTypeId, expr.size);
			for (let i = expr.exprs.length - 1; i >= 0; i--) {
				this.evalExpr(expr.exprs[i]);
			}
			return;
		}
		if (expr.tag === "ir-setlocal") {
			this.evalExpr(expr.expr);
			return 
		}
		if (expr.tag === "ir-if") {
			this.evalExpr(expr.trueExpr);
			this.evalExpr(expr.falseExpr);
			return;
		}
		if (expr.tag === "ir-loop") {
			this.evalExpr(expr.expr);
			return toDecBefore;
		}
		if (expr.tag === "ir-store-i64" || expr.tag === "ir-store-i32") {
			this.evalExpr(expr.valueExpr);
			return 
		}
		if (expr.tag === "ir-binop" || expr.tag === "ir-concat-array") {
			this.evalExpr(expr.left);
			this.evalExpr(expr.right);
			return;
		}
	}
	
	generateCreateArrayRef(refTypeId, size) {
		let funcName = "_gen_create_array_ref_" + refTypeId + "_" + size;
		let funcId = this.createArrayFuncMap[funcName];
		if (funcId !== undefined) {
			return funcId;
		}
		let refType = this.irModule.refType(refTypeId);
		let locals = [];
		for (let i = 0; i < size; i++) {
			locals = locals.concat(refType.itemTypes);
		}
		locals.push(refTypeId);
		let resultLocalId = locals.length - 1;
		let block = [
			PlwIR.setLocal([resultLocalId], PlwIR.callInternal(PLW_RT_FUNC_REF_CREATE_ARRAY, [PlwIR.i32(size), PlwIR.i32(refType.itemSize)]))
		];
		let localIndex = 0;
		for (let i = 0; i < size; i++) {
			for (let j = 0; j < refType.itemTypes.length; j++) {
				if (refType.itemTypes[j] === PLW_IR_TYPE_I32) {
					block.push(PlwIR.storeI32(resultLocalId, j, PlwIR.i32(i), PlwIR.local(localIndex)));
				} else if (refType.itemTypes[j] === PLW_IR_TYPE_I64) {
					block.push(PlwIR.storeI64(resultLocalId, j, PlwIR.i32(i), PlwIR.local(localIndex)));
				}
				localIndex++;
			}
		}
		block.push(PlwIR.ret([PlwIR.local(resultLocalId)]));
		funcId = this.irModule.addFunction(new PlwIRFunction(funcName, null, locals.length - 1, [refTypeId], locals, PlwIR.block(block)).noautorc());
		this.createArrayFuncMap[funcName] = funcId;
		return funcId;
	}
	
	generateCreateRef(refTypeId, refType) {
		let locals = [];
		for (let i = 0; i < refType.size; i++) {
			locals = locals.concat(refType.itemTypes);
		}
		locals.push(refTypeId);
		let resultLocalId = locals.length - 1;
		let block = [
			PlwIR.setLocal([resultLocalId], PlwIR.callInternal(PLW_RT_FUNC_REF_CREATE, [PlwIR.i32(refType.itemSize * refType.size)]))
		];
		let localIndex = 0;
		for (let i = 0; i < refType.size; i++) {
			for (let j = 0; j < refType.itemTypes.length; j++) {
				if (refType.itemTypes[j] === PLW_IR_TYPE_I32) {
					block.push(PlwIR.storeI32(resultLocalId, j, PlwIR.i32(i), PlwIR.local(localIndex)));
				} else if (refType.itemTypes[j] === PLW_IR_TYPE_I64) {
					block.push(PlwIR.storeI64(resultLocalId, j, PlwIR.i32(i), PlwIR.local(localIndex)));
				} else {
					throw new Error("TODO: managed other types");
				}
				localIndex++;
			}
		}
		block.push(PlwIR.ret([PlwIR.local(resultLocalId)]));
		refType.createRefFunctionId = this.irModule.addFunction(new PlwIRFunction("_gen_create_ref_" + refTypeId, null, locals.length - 1, [refTypeId], locals, PlwIR.block(block)).noautorc());
	}
	
	generateDecRc(refTypeId, refType) {
		if (refType.size > 0) {
			let destroyBlock = [];
			for (let idx = 0; idx < refType.size; idx++) {
				for (let i = 0; i < refType.itemTypes.length; i++) {
					if (PlwIRUtil.isRef(refType.itemTypes[i])) {
						let innerType = this.irModule.refType(refType.itemTypes[i]);
						block.push(PlwIR.callf(
							innerType.decRcFunctionId,
							[PlwIR.loadi32(0, i, Plw.i32(idx))]));
					}
				}
			}
			destroyBlock.push(PlwIR.callInternal(
				PLW_RT_FUNC_REF_DESTROY,
				[PlwIR.local(0)]));
			refType.decRcFunctionId = this.irModule.addFunction(new PlwIRFunction("_gen_dec_rc_ref_" + refTypeId, null,
				1, [], [refTypeId],
				PlwIR.iff(
					PlwIR.binOp(
						PLW_IR_OP_I32_EQ,
						PlwIR.i32(0),
						PlwIR.callInternal(PLW_RT_FUNC_REF_DEC_RC, [PlwIR.local(0)])),
					PlwIR.block(destroyBlock),
					null)).noautorc());
		} else if (refType.containsRef() === false) {
			refType.decRcFunctionId = this.irModule.addFunction(new PlwIRFunction("_gen_dec_rc_ref_" + refTypeId, null,
				1, [], [refTypeId],
				PlwIR.iff(
					PlwIR.binOp(
						PLW_IR_OP_I32_EQ,
						PlwIR.i32(0),
						PlwIR.callInternal(PLW_RT_FUNC_REF_DEC_RC, [PlwIR.local(0)])),
					PlwIR.callInternal(PLW_RT_FUNC_REF_DESTROY_ARRAY, [PlwIR.local(0)]),
					null)).noautorc());
		} else {
			let destroyBlock = [];
			for (let i = 0; i < refType.itemTypes.length; i++) {
				if (PlwIRUtil.isRef(refType.itemTypes[i])) {
					let innerType = this.irModule.refType(refType.itemTypes[i]);
					block.push(PlwIR.callf(
						innerType.decRcFunctionId,
						[PlwIR.loadI32(0, i, Plw.local(1))]));
				}
			}
			if (destroyBlock.length > 0) {
				destroyBlock = [
					PlwIR.setLocal(1, PlwIR.i32(0)),
					PlwIR.setLocal(2, PlwIR.callInternal(PLW_RT_FUNC_REF_ARRAY_SIZE, [PlwIR.local(0)])),
					PlwIR.loop(PlwIR.Block([
						PlwIR.iff(PlwIR.binOp(PLW_IR_OP_I32_GTE, PlwIR.local(1), PlwIR.local(2)), PlwIR.exitLoop(), null),
						].concat(destroyBlock).concat([
							PlwIR.setLocal(1, PlwIR.binOp(PLW_IR_OP_I32_ADD, PlwIR.local(1), PlwIR.i32(1)))
						])))];
							
			}
			destroyBlock.push(PlwIR.callInternal(
				PLW_RT_FUNC_REF_DESTROY,
				[PlwIR.local(0)]));
			block = [
				PlwIR.iff(
					PlwIR.binOp(
						PLW_IR_OP_I32_EQ,
						PlwIR.i32(0),
						PlwIR.callInternal(PLW_RT_FUNC_REF_DEC_RC, [PlwIR.local(localId)])),
					PlwIR.callInternal(destroyFuncId, [PlwIR.local(localId)]),
					destroyBlock,
					null)
			];
			refType.decRcFunctionId = this.irModule.addFunction(new PlwIRFunction("_gen_dec_rc_ref_" + refTypeId, null,
				1, [], [refTypeId, PLW_IR_TYPE_I32, PLW_IR_TYPE_I32], PlwIR.block(block))).noautorc();;
		}
	}

}

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
		new PlwIRWasmTypeFuncGenerator(this.irModule).generate();
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
		default:
			bytes = bytes.concat(this.compileCode(null, PlwIR.i32(0)));
			break;
		}
		this.globalSection[this.globalSection.length] = bytes.concat([11]);
	}
	
	compileFunction(funcIndex, func) {
		console.log("func " + funcIndex + " is " + func.functionName); 
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
			if (func.autorc === true) {
				PlwIRRefCountAnalizer.analize(func);
			}
			for (let i = 0; i < func.toDecBefore.length; i++) {
				codes = codes.concat(this.decRefCountBytes(func, func.toDecBefore[i]));
			}
			codes = codes.concat(this.compileCode(func, func.expr), [11]);
			this.codeSection[this.codeSection.length] = this.uintBytes(codes.length).concat(codes);
			if (func.functionName !== null) {
				this.exportSection[this.exportSection.length] = this.strBytes(func.functionName).concat([0], this.uintBytes(funcIndex));
			}
		}
	}

	decRefCountBytes(func, localId) {	
		let refType = this.irModule.refType(func.locals[localId]);
		return this.compileCode(func, PlwIR.callf(refType.decRcFunctionId, [PlwIR.local(localId)]));
	}
	
	incRefCountBytes(func, localId) {
		return this.compileCode(func,
			PlwIR.callInternal(PLW_RT_FUNC_REF_INC_RC, [PlwIR.local(localId)]));
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
			let bytes = [32].concat(this.uintBytes(expr.localId));
			if (PlwIRUtil.isRef(func.locals[expr.localId]) && expr.incRc === true) {
				bytes = bytes.concat(this.incRefCountBytes(func, expr.localId));
			}
			return bytes;
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
		if (expr.tag === "ir-call" || expr.tag === "ir-call-internal") {
			let bytes = [];
			for (let i = 0; i < expr.exprs.length; i++) {
				bytes = bytes.concat(this.compileCode(func, expr.exprs[i]));
			}
			let funcId = 0;
			if (expr.tag === "ir-call") {
				funcId = this.funcIndexMap[expr.functionId];
			} else {
				funcId = expr.functionId;
			}
			return bytes.concat([16], this.uintBytes(funcId));
		}
		if (expr.tag === "ir-setlocal") {
			let bytes = this.compileCode(func, expr.expr);
			for (let i = 0; i < expr.localIds.length; i++) {
				bytes = bytes.concat([33], this.uintBytes(expr.localIds[expr.localIds.length - 1 - i]));
			}
			for (let i = 0; i < expr.toDecAfter.length; i++) {
				bytes = bytes.concat(this.decRefCountBytes(func, expr.toDecAfter[i]));
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
			for (let i = 0; i < expr.toDecBeforeTrue.length; i++) {
				bytes = bytes.concat(this.decRefCountBytes(func, expr.toDecBeforeTrue[i]));
			}
			if (expr.trueExpr !== null) {
				bytes = bytes.concat(this.compileCode(func, expr.trueExpr));
			}
			if (expr.falseExpr !== null || expr.toDecBeforeFalse.length > 0) {
				bytes = bytes.concat([5]);
				for (let i = 0; i < expr.toDecBeforeFalse.length; i++) {
					bytes = bytes.concat(this.decRefCountBytes(func, expr.toDecBeforeFalse[i]));
				}
				if (expr.falseExpr !== null) {
					bytes = bytes.concat(this.compileCode(func, expr.falseExpr));
				}
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
			for (let i = 0; i < expr.toDecAfter.length; i++) {
				bytes = bytes.concat(this.decRefCountBytes(func, expr.toDecAfter[i]));
			}
			return bytes;
		}
		if (expr.tag === "ir-exitloop") {
			return [12].concat(this.uintBytes(this.nestedLevel - this.topBlockLevel() - 1));
		}
		if (expr.tag === "ir-create-ref") {
			let refType = this.irModule.refType(expr.refTypeId);
			if (refType.size === 0) {
				throw new Error("invalid refTypeId " + expr.refTypeId + " for ir-create-ref, a static size is needed");
			}
			if (refType.createRefFunctionId === -1) {
				throw new Error("create ref func was not generated");
			}
			return this.compileCode(func, PlwIR.callf(refType.createRefFunctionId, expr.exprs));
		}
		if (expr.tag === "ir-create-array-ref") {
			if (expr.funcId === -1) {
				throw new Error("create array func was not generated");
			}
			return this.compileCode(func, PlwIR.callf(expr.funcId, expr.exprs));
		}
		if (expr.tag === "ir-concat-array") {
			let refType = this.irModule.refType(expr.typeId);
			if (refType.size !== 0) {
				throw new Error("not an array");
			}
			// TODO generate a custom concat array function if the refType contains other refTypes
			return this.compileCode(func,
				PlwIR.callInternal(PLW_RT_FUNC_REF_CONCAT_BASIC_ARRAY, [
						expr.left, expr.right, PlwIR.i32(refType.itemSize)]));
		}		
		if (expr.tag === "ir-load-i64" || expr.tag === "ir-load-i32") {
			let byteOp = expr.tag === "ir-load-i64" ? 41 : 40;
			let byteAlign = expr.tag === "ir-load-i64" ? 3 : 2;
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
				let bytes = [
					...this.compileCode(func, PlwIR.local(expr.localId)),
					byteOp, byteAlign,
					this.uintBytes(expr.indexExpr.intValue * refType.itemSize + refType.itemOffsets[expr.fieldId])];
				if (expr.toDecAfter === true) {
					bytes = bytes.concat(this.decRefCountBytes(func, expr.localId));
				}
				return bytes;
			}
			// TODO generate bound check code
			bytes = [
				...this.compileCode(func,
					PlwIR.binOp(PLW_IR_OP_I32_ADD,
						PlwIR.local(expr.localId),
						PlwIR.binOp(PLW_IR_OP_I32_MUL, expr.indexExpr, PlwIR.i32(refType.itemSize)))),
				byteOp, byteAlign,
				this.uintBytes(refType.itemOffsets[expr.fieldId])			
			];
			if (expr.toDecAfter === true) {
				bytes = bytes.concat(this.decRefCountBytes(func, expr.localId));
			}
			return bytes;
		}
		if (expr.tag === "ir-store-i64" || expr.tag === "ir-store-i32") {
			let byteOp = expr.tag === "ir-store-i64" ? 55 : 54;
			let byteAlign = expr.tag === "ir-store-i64" ? 3 : 2;
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
				let bytes = [
					...this.compileCode(func, PlwIR.local(expr.localId)),
					...this.compileCode(func, expr.valueExpr),
					byteOp, byteAlign,
					this.uintBytes(expr.indexExpr.intValue * refType.itemSize + refType.itemOffsets[expr.fieldId])
				];
				if (expr.toDecAfter === true) {
					bytes = bytes.concat(this.decRefCountBytes(func, expr.localId));
				}
				return bytes;
			}
			// TODO generate bound check code
			let bytes = [
				...this.compileCode(func,
					PlwIR.binOp(PLW_IR_OP_I32_ADD,
						PlwIR.local(expr.localId),
						PlwIR.binOp(PLW_IR_OP_I32_MUL, expr.indexExpr, PlwIR.i32(refType.memSize))),
						PlwIR.i32(expr.fieldId * byteSize)),							
				...this.compileCode(func, expr.valueExpr),
				byteOp, byteAlign,
				this.uintBytes(refType.itemOffsets[expr.fieldId])
			];
			if (expr.toDecAfter === true) {
				bytes = bytes.concat(this.decRefCountBytes(func, expr.localId));
			}
			return bytes;
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



