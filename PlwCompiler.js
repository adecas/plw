"use strict";
/******************************************************************************************************************************************

	Compiler
	
	Transforms AST in StackMachine code

******************************************************************************************************************************************/


class EvalResult {
	
	constructor(tag) {
		this.tag = tag;
	}
	
	isError() {
		return false;
	}
	
}

class EvalResultIR extends EvalResult {

	constructor(resultType, ir) {
		super("res-ir");
		this.resultType = resultType;
		this.ir = ir;
	}
	
}

class EvalResultType extends EvalResult {
	constructor(tag, isRef) {
		super(tag);
		this.isRef = isRef;
		this.key = null;
		this.globalId = 0;
		this.irTypes = [];
	}
	
	typeKey() {
		return this.key;
	}
	
	structuralType() {
		return this;
	}
	
	toAst() {
		return null;
	}
	
	slotCount() {
		return 1;
	}

}

class EvalTypeNull extends EvalResultType {

	constructor() {
		super("res-type-null", false);
	}
	
	typeKey() {
		return "null";
	}
	
	toAst() {
		return new AstNull();
	}
	
	slotCount() {
		return 0;
	}

}

class EvalTypeBuiltIn extends EvalResultType {
	constructor(typeName, isRef, irTypes) {
		super("res-type-built-in", isRef);
		this.typeName = typeName;
		this.key = typeName;
		this.irTypes = irTypes;
		
	}
	
	toAst() {
		return new AstTypeNamed(this.typeName);
	}
}

const EVAL_TYPE_NULL = new EvalTypeNull();
const EVAL_TYPE_EXCEPTION_HANDLER = new EvalTypeBuiltIn("_exception_handler", true, null);
const EVAL_TYPE_INFER = new EvalTypeBuiltIn("_infer", false, null);
const EVAL_TYPE_ANY = new EvalTypeBuiltIn("any", false, null);
const EVAL_TYPE_INTEGER = new EvalTypeBuiltIn("integer", false, [PLW_IR_TYPE_I64]);
const EVAL_TYPE_REAL = new EvalTypeBuiltIn("real", false, [PLW_IR_TYPE_F64]);
const EVAL_TYPE_BOOLEAN = new EvalTypeBuiltIn("boolean", false, [PLW_IR_TYPE_I32]);
const EVAL_TYPE_TEXT = new EvalTypeBuiltIn("text", true, null);

class EvalTypeRecordField {
	constructor(fieldName, fieldType) {
		this.fieldName = fieldName;
		this.fieldType = fieldType;
		this.offset = 0;
	}
	
	toAst() {
		return new AstRecordField(this.fieldName, this.fieldType.toAst());
	}
}

class EvalTypeRecord extends EvalResultType {
	constructor(fieldCount, fields) {
		super("res-type-record", true);
		this.fieldCount = fieldCount;
		this.fields = fields;
		this.fieldSlotCount = 0;
		for (let i = 0; i < fields.length; i++) {
			fields[i].offset = this.fieldSlotCount;
			this.fieldSlotCount += fields[i].fieldType.slotCount();
		}
		this.key = EvalTypeRecord.makeTypeKey(fieldCount, fields);
	}
	
	static makeTypeKey(fieldCount, fields) {
		let name = "{";
		for (let i = 0; i < fieldCount; i++) {
			name += (i == 0 ? "" : ", ") + fields[i].fieldName + " " + fields[i].fieldType.typeKey();
		}
		return name + "}";
	}
	
	getField(fieldName) {
		for (let i = 0; i < this.fieldCount; i++) {
			if (this.fields[i].fieldName === fieldName) {
				return this.fields[i];
			}
		}
		return null;
	}
	
	toAst() {
		let astFields = [];
		for (let i = 0; i < this.fieldCount; i++) {
			astFields[i] = this.fields[i].toAst();
		}
		return new AstTypeRecord(this.fieldCount, astFields);
	}
}

class EvalTypeTuple extends EvalResultType {
	constructor(typeCount, types) {
		super("res-type-tuple", false);
		this.typeCount = typeCount;
		this.types = types;
		this.key = EvalTypeTuple.makeTypeKey(typeCount, types);
		this.totalSlotCount = 0;
		for (let i = 0; i < this.typeCount; i++) {
			this.totalSlotCount += this.types[i].slotCount();
		}
	}

	static makeTypeKey(typeCount, types) {
		let keys = [];
		for (let i = 0; i < typeCount; i++) {
			keys[i] = types[i].typeKey();
		}
		return "(" + keys.join(',') + ")";
	}
	
	slotCount() {
		return this.totalSlotCount;
	}
	
	toAst() {
		let astTypes = [];
		for (let i = 0; i < this.typeCount; i++) {
			astTypes[i] = this.types[i].toAst();
		}
		return new AstTypeTuple(this.typeCount, astTypes);
	}	
}

class EvalTypeVariant extends EvalResultType {
	constructor(typeCount, types) {
		super("res-type-variant", true);
		this.typeCount = typeCount;
		this.types = types;
		this.key = EvalTypeVariant.makeTypeKey(typeCount, types);
		this.maxSlotCount = 0;
		for (let i = 0; i < this.typeCount; i++) {
			if (this.types[i].slotCount() > this.maxSlotCount) {
				this.maxSlotCount = this.types[i].slotCount();
			}
		}
		this.maxSlotCount++;
	}

	static makeTypeKey(typeCount, types) {
		let keys = [];
		for (let i = 0; i < typeCount; i++) {
			keys[i] = types[i].typeKey();
		}
		return keys.join('|');
	}
	
	slotCount() {
		return this.maxSlotCount;
	}
	
	contains(type) {
		if (type.tag === "res-type-variant") {
			for (let i = 0; i < type.typeCount; i++) {
				if (!this.contains(type.types[i])) {
					return false;
				}
			}
			return true;
		}
		for (let i = 0; i < this.typeCount; i++) {
			if (this.types[i] === type) {
				return true;
			}
		}
		return false;
	}
	
	toAst() {
		let astTypes = [];
		for (let i = 0; i < this.typeCount; i++) {
			astTypes[i] = this.types[i].toAst();
		}
		return new AstTypeVariant(this.typeCount, astTypes);
	}
	
}

class EvalTypeArray extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-array", true);
		this.underlyingType = underlyingType;
		this.key = "[" + (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + "]";
	}
	
	toAst() {
		return new AstTypeArray(this.underlyingType.toAst());
	}
}

class EvalTypeSequence extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-sequence", true);
		this.underlyingType = underlyingType;
		this.key = "sequence(" + (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + ")";
	}
	
	toAst()  {
		return new AstTypeSequence(this.underlyingType.toAst());
	}
}

class EvalTypeName extends EvalResultType {
	constructor(typeName, underlyingType) {
		super("res-type-name", underlyingType.isRef);
		this.typeName = typeName;
		this.underlyingType = underlyingType;
		this.key = typeName;
		this.structType = this.underlyingType.structuralType();
	}
	
	structuralType() {
		return this.structType;
	}
	
	toAst() {
		return new AstTypeNamed(this.typeName);
	}
	
	slotCount() {
		return this.structType.slotCount();
	}
	
}

const EVAL_TYPE_CHAR = new EvalTypeName("char", EVAL_TYPE_INTEGER);

class EvalResultParameter extends EvalResult {
	constructor(parameterName, parameterType) {
		super("res-parameter");
		this.parameterName = parameterName;
		this.parameterType = parameterType;
	}
}

class EvalResultParameterList extends EvalResult {
	constructor(parameterCount, parameters) {
		super("res-parameter-list");
		this.parameterCount = parameterCount;
		this.parameters = parameters;
	}
	
	indexOfAny() {
		for (let i = 0; i < this.parameterCount; i++) {
			if (this.parameters[i].parameterType === EVAL_TYPE_ANY) {
				return i;
			}
		}
		return -1;
	}
	
	countOfAny() {
		let count = 0;
		for (let i = 0; i < this.parameterCount; i++) {
			if (this.parameters[i].parameterType === EVAL_TYPE_ANY) {
				count++;
			}
		}
		return count;
	}
	
	isMatch(argTypes) {
		if (argTypes.length !== this.parameterCount) {
			return false;
		}
		for (let i = 0; i < this.parameterCount; i++) {
			if (this.parameters[i].parameterType !== EVAL_TYPE_ANY && this.parameters[i].parameterType !== argTypes[i]) {
				return false;
			}
		}
		return true;
	}
}

class EvalResultMacroFunction extends EvalResult {
	constructor(functionName, parameterList, returnType, isGenerator, astStmt) {
		super("res-macro-function");
		this.functionName = functionName;
		this.parameterList = parameterList;
		this.returnType = returnType;
		this.isGenerator = isGenerator;
		this.astStmt = astStmt;
	}
	
	functionShortKey() {
		return this.functionName + "(" + this.parameterList.parameterCount + ")";
	}
	
	functionKey() {
		let funcKey = this.functionName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			funcKey += (i > 0 ? "," : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
		}
		return funcKey + ")";
	}	
}

class EvalResultFunction extends EvalResult {
	constructor(functionName, parameterList, returnType, isGenerator) {
		super("res-function");
		this.functionName = functionName;
		this.parameterList = parameterList;
		this.returnType = returnType;
		this.isGenerator = isGenerator;
		this.codeBlockIndex = -1;
		this.nativeIndex = -1;
		this.internalIndex = -1;
		this.irIndex = -1;
	}
	
	static fromNative(functionName, parameterList, returnType, nativeIndex, irIndex = -1) {
		let nativeFunc = new EvalResultFunction(functionName, parameterList, returnType, false);
		nativeFunc.nativeIndex = nativeIndex;
		nativeFunc.irIndex = irIndex;
		// console.log("Native function " + nativeIndex + ": " + nativeFunc.functionKey());
		return nativeFunc;
	}

	functionKey() {
		let funcKey = this.functionName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			funcKey += (i > 0 ? "," : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
		}
		return funcKey + ")";
	}
	
	static makeKey(functionName, paramCount, paramTypes) {
		let funcKey = functionName + "(";
		for (let i = 0; i < paramCount; i++) {
			funcKey += (i > 0 ? "," : "") +
				paramTypes[i].typeKey();
		}
		return funcKey + ")";
	}
	
}

class EvalResultProcedure extends EvalResult {
	constructor(procedureName, parameterList) {
		super("res-procedure");
		this.procedureName = procedureName;
		this.parameterList = parameterList;
		this.codeBlockIndex = -1;
		this.nativeIndex = -1;
		this.irIndex = -1;
	}
	
	static fromNative(procedureName, parameterList, nativeIndex, irIndex = -1) {
		let nativeProc = new EvalResultProcedure(procedureName, parameterList);
		nativeProc.nativeIndex = nativeIndex;
		nativeProc.irIndex = irIndex;
		// console.log("Native procedure " + nativeIndex + ": " + nativeProc.procedureKey());
		return nativeProc;
	}
	
	procedureKey() {
		let procKey = this.procedureName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			procKey += (i > 0 ? "," : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
		}
		return procKey + ")";
	}
}

class EvalResultMacroProcedure extends EvalResult {
	constructor(procedureName, parameterList, astStmt) {
		super("res-macro-procedure");
		this.procedureName = procedureName;
		this.parameterList = parameterList;
		this.astStmt = astStmt;
	}
	
	procedureShortKey() {
		return this.procedureName + "(" + this.parameterList.parameterCount + ")";
	}
	
	procedureKey() {
		let procKey = this.procedureName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			procKey += (i > 0 ? "," : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
		}
		return procKey + ")";
	}	
}


const EVAL_RESULT_RETURN = new EvalResult("res-return");
const EVAL_RESULT_RAISE = new EvalResult("res-raise");
const EVAL_RESULT_OK = new EvalResult("res-ok");


class EvalError extends EvalResult {

	constructor(errorText) {
		super("res-error");
		this.errorText = errorText;
		this.line = 0;
		this.col = 0;
	}
	
	isError() {
		return true;
	}
	
	fromExpr(expr) {
		this.line = expr.line;
		this.col = expr.col;
		return this;
	}
	
	static unassignable(tag) {
		return new EvalError("Unassignable left expression " + tag);
	}
	
	static cantMutateConst(varName) {
		return new EvalError("Can't mutate const " + varName);
	}
	
	static unknownBinaryOperator(operator) {
		return new EvalError("Unknown binary operator " + operator);
	}
	
	static wrongType(exprType, expected) {
		return new EvalError("Wrong type " + exprType.typeKey() + ", expected " + expected);
	}
	
	static unknownType(exprType) {
		return new EvalError("Unknown type " + exprType);
	}
	
	static noTypeArray() {
		return new EvalError("Array has no type");
	}
	
	static variableAlreadyExists(varName) {
		return new EvalError("Variable " + varName + " already exists");
	}
	
	static parameterAlreadyExists(parameterName) {
		return new EvalError("Parameter " + parameterName + " already exists");
	}
	
	static functionAlreadyExists(funcName) {
		return new EvalError("Function " + funcName + " already exists");
	}
	
	static procedureAlreadyExists(procName) {
		return new EvalError("Procedure " + procName + " already exists");
	}

	static typeAlreadyExists(typeName) {
		return new EvalError("Type " + typeName + " already exists");
	}

	static unknownVariable(varName) {
		return new EvalError("Unknown variable " + varName);
	}
	
	static unknownField(fieldName, record) {
		return new EvalError("Unknown field " + fieldName + " in " + record);
	}
	
	static unknownFunction(funcName) {
		return new EvalError("Unknown function " + funcName);
	}
	
	static unknownNativeFunction(funcName) {
		return new EvalError("Unknown native function " + funcName);
	}
	
	static unknownProcedure(procName) {
		return new EvalError("Unknown procedure " + procName);
	}

	static indexOutOfBound(index) {
		return new EvalError("Index out of bound " + index);
	}
	
	static noFunctionReturn(funcName) {
		return new EvalError("No return for function " + funcName);
	}
	
	static noFunctionYield(funcName) {
		return new EvalError("No yield for function " + funcName);
	}

	static unexpectedExit() {
		return new EvalError("Unexpected exit");
	}

	static unexpectedReturn() {
		return new EvalError("Unexpected return");
	}
	
	static unexpectedReturnWithValue() {
		return new EvalError("Unexpected return with value");
	}
	
	static unexpectedReturnWithoutValue() {
		return new EvalError("Unexpected return without value");
	}

	static unexpectedYield() {
		return new EvalError("Unexpected yield");
	}

	static unreachableCode() {
		return new EvalError("Unreachable code");
	}
	
	static variantKindAlreadyManaged(kindName) {
		return new EvalError("Variant kind " + kindName + " already managed");
	}
	
	static variantKindNotManaged(kindName) {
		return new EvalError("Variant kind " + kindName + " not managed");
	}
	
	static unknownVariantKind(kindName) {
		return new EvalError("Unknown kind " + kindName);
	}
	
	static fieldAlreadyExists(fieldName) {
		return new EvalError("Field " + fieldName + " already exists");
	}
	
	static emptyArrayMustBeTyped() {
		return new EvalError("Empty array must be typed with the as operator");
	}
	
	static tupleSizeMismatch(expected, val) {
		return new EvalError("Tuple with " + val + " items when " + expected + " were expected");
	}
	
	static todo(msg) {
		return new EvalError("TODO " + msg);
	}
		
}

class CompilerContext {
	
	constructor() {
		this.irModule = new PlwIRModule("test");
		this.globalScope = CompilerScope.makeGlobal(this.irModule);
		this.types = {};
		this.functions = {};
		this.procedures = {};
		this.macroFunctions = {};
		this.macroProcedures = {};
		this.codeBlocks = [];
		this.globalTypeIdSeq = 0;
		this.addType(EVAL_TYPE_INFER);
		this.addType(EVAL_TYPE_ANY);
		this.addType(EVAL_TYPE_INTEGER);
		this.addType(EVAL_TYPE_REAL);
		this.addType(EVAL_TYPE_BOOLEAN);
		this.addType(EVAL_TYPE_TEXT);
		this.addType(EVAL_TYPE_CHAR);
	}
		
	nextGlobalTypeId() {
		this.globalTypeIdSeq++;
		return this.globalTypeIdSeq;
	}
	
	getFunction(functionKey) {
		let func = this.functions[functionKey];
		return func === undefined ? null : func;
	}
	
	addFunction(evalFunc) {
		this.functions[evalFunc.functionKey()] = evalFunc;
	}
	
	removeFunction(functionKey) {
		delete this.functions[functionKey];
	}
	
	getProcedure(procedureKey) {
		let proc = this.procedures[procedureKey];
		return proc === undefined ? null : proc;
	}
	
	addProcedure(evalProc) {
		this.procedures[evalProc.procedureKey()] = evalProc;
	}
	
	removeProcedure(procedureKey) {
		delete this.procedures[procedureKey];
	}
	
	getType(typeName) {
		let type = this.types[typeName];
		return type === undefined ? null : type;
	}
	
	addType(evalType) {
		let uniqueType = this.getType(evalType.typeKey());
		if (uniqueType === null) {
			evalType.globalId = this.nextGlobalTypeId();
			this.types[evalType.typeKey()] = evalType;
			if (evalType === EVAL_TYPE_TEXT) {
				evalType.irTypes = [this.irModule.addRefType(new PlwIRRefType([PLW_IR_TYPE_I32], 0))];
			}
			return evalType;
		}
		return uniqueType;
	}
	
	addCodeBlock(blockName) {
		let i = this.codeBlocks.length;
		this.codeBlocks[i] = new CodeBlock(blockName);
		// console.log("Code block " + i + ": " + blockName);
		return i;
	}
	
	getMacroFunction(functionShortKey, functionKey) {
		let bucket = this.macroFunctions[functionShortKey];
		if (bucket === undefined) {
			return null;
		}
		return bucket[functionKey] === undefined ? null : buckect[functionKey];
	}
	
	addMacroFunction(macroFunction) {
		let bucket = this.macroFunctions[macroFunction.functionShortKey()];
		if (bucket === undefined) {
			bucket = {};
			this.macroFunctions[macroFunction.functionShortKey()] = bucket;
		}
		bucket[macroFunction.functionKey()] = macroFunction;
	}
	
	findMacroFunction(functionName, argTypes) {
		let bucket = this.macroFunctions[functionName + "(" + argTypes.length + ")"];
		if (bucket === undefined) {
			return null;
		}
		let minAnyCount = -1;
		let maxFirstAnyIndex = -1;
		let bestMacro = null;
		for (const macroKey in bucket) {
			let macroFunc = bucket[macroKey];
			if (macroFunc.parameterList.isMatch(argTypes)) {
				let anyCount = macroFunc.parameterList.countOfAny();
				let firstAnyIndex = macroFunc.parameterList.indexOfAny();
				if (minAnyCount === -1 || anyCount < minAnyCount) {
					minAnyCount = anyCount;
					maxFirstAnyIndex = firstAnyIndex;
					bestMacro = macroFunc;
				} else if (anyCount === minAnyCount && firstAnyIndex > maxFirstAnyIndex) {
					maxFirstAnyIndex = firstAnyIndex;
					bestMacro = macroFunc;					
				}
			}
		}
		return bestMacro;
	}
	
	getMacroProcedure(procedureShortKey, procedureKey) {
		let bucket = this.macroProcedures[procedureShortKey];
		if (bucket === undefined) {
			return null;
		}
		return bucket[procedureKey] === undefined ? null : buckect[procedureKey];
	}
	
	addMacroProcedure(macroProcedure) {
		let bucket = this.macroProcedures[macroProcedure.procedureShortKey()];
		if (bucket === undefined) {
			bucket = {};
			this.macroProcedures[macroProcedure.procedureShortKey()] = bucket;
		}
		bucket[macroProcedure.procedureKey()] = macroProcedure;
	}
	
	findMacroProcedure(procedureName, argTypes) {
		let bucket = this.macroProcedures[procedureName + "(" + argTypes.length + ")"];
		if (bucket === undefined) {
			return null;
		}
		let minAnyCount = -1;
		let maxFirstAnyIndex = -1;
		let bestMacro = null;
		for (const macroKey in bucket) {
			let macroProc = bucket[macroKey];
			if (macroProc.parameterList.isMatch(argTypes)) {
				let anyCount = macroProc.parameterList.countOfAny();
				let firstAnyIndex = macroProc.parameterList.indexOfAny();
				if (minAnyCount === -1 || anyCount < minAnyCount) {
					minAnyCount = anyCount;
					maxFirstAnyIndex = firstAnyIndex;
					bestMacro = macroProc;
				} else if (anyCount === minAnyCount && firstAnyIndex > maxFirstAnyIndex) {
					maxFirstAnyIndex = firstAnyIndex;
					bestMacro = macroProc;					
				}
			}
		}
		return bestMacro;
	}		
			
}

class VariableStatLoc {
	constructor(loc, line, col) {
		this.loc = loc;
		this.line = line;
		this.col = col;
	}
}

class VariableStat {

	constructor() {
		this.moveLocCount = 0;
		this.moveLocs = [];
		this.tmpMoveLoc = null;
	}

	addReadLoc(loc, expr) {
		this.tmpMoveLoc = new VariableStatLoc(loc, expr.line, expr.col);
	}
	
	addReset() {
		if (this.tmpMoveLoc !== null) {
			this.moveLocs[this.moveLocCount] = this.tmpMoveLoc;
			this.moveLocCount++;
			this.tmpMoveLoc = null;
		}
	}	
	
}

class CompilerVariable {
	constructor(varName, varType, isConst, isGlobal, isParameter, offset, isWithStat) {
		this.varName = varName;
		this.varType = varType;
		this.isConst = isConst;
		this.isGlobal = isGlobal;
		this.isParameter = isParameter;
		this.offset = offset;
		if (isWithStat) {
			this.stat = new VariableStat();
		} else {
			this.stat = null;
		}
		this.isMoved = false;
		this.irIndex = 0;
	}		
}

class CompilerScope {

	static makeGlobal(irModule) {
		let scope = new CompilerScope(null, false, false, false, null);
		scope.irModule = irModule;
		return scope;
	}
	
	static makeBlock(parent) {
		return new CompilerScope(parent, false, false, false, null);
	}
	
	static makeLoop(parent) {
		return new CompilerScope(parent, false, false, true, null);
	}
	
	static makeFunction(parent, isGenerator, returnType) {
		return new CompilerScope(parent, true, isGenerator, false, returnType);
	}
	
	static makeProcedure(parent) {
		return new CompilerScope(parent, true, false, false, null);
	}
	
	constructor(parent, isFrame, isGenerator, isLoop, returnType) {
		this.irModule = null;
		this.parent = parent;
		this.isFrame = isFrame;
		this.isGenerator = isGenerator;
		this.isLoop = isLoop;
		this.returnType = returnType;
		this.isGlobal = parent === null || (this.parent.isGlobal && isFrame === false);
		this.variables = [];
		this.parameters = [];
		this.variableCount = 0;
		this.parameterCount = 0;
		this.variableOffset = 0;
		this.offset = parent === null || isFrame ? 0 : (parent.offset + parent.variableOffset);
		this.exitLocs = [];
		this.exitLocCount = 0;
		this.irVarTypes = parent === null || isFrame ? [] : parent.irVarTypes;
	}
	
	addIrVarTypes(irTypes) {
		if (this.parent === null) {
			let firstIndex = -1;
			for (let i = 0; i < irTypes.length; i++) {
				if (i === 0) {
					firstIndex = this.irModule.addGlobal(irTypes[i]);
				} else {
					this.irModule.addGlobal(irType[i]);
				}
			}
			return firstIndex;
		} else {
			let firstIndex = this.irVarTypes.length;
			for (let i = 0; i < irTypes.length; i++) {
				this.irVarTypes[firstIndex + i] = irTypes[i];
			}
			return firstIndex;
		}
	}
	
	findFrame() {
		let currentScope = this;
		while (currentScope !== null) {
			if (currentScope.isFrame) {
				break;
			}
			currentScope = currentScope.parent;
		}
		return currentScope;
	}
	
	clearVarStatTmp() {
		let currentScope = this;
		while (currentScope.parent !== null) {
			for (let i = 0; i < currentScope.variableCount; i++) {
				let varStat = currentScope.variables[i].stat;
				if (varStat != null) {
					varStat.tmpMoveLoc = null;
				}
			}
			if (currentScope.isFrame) {
				break;
			}
			currentScope = currentScope.parent;
		}
	}
				
	getLocalVariable(varName) {
		for (let i = 0; i < this.variableCount; i++) {
			if (this.variables[i].varName === varName) {
				return this.variables[i];
			}
		}
		for (let i = 0; i < this.parameterCount; i++) {
			if (this.parameters[i].varName === varName) {
				return this.parameters[i];
			}
		}
		return null;
	}
	
	getVariable(varName) {
		let scope = this;
		let onlyConst = false;
		while (scope !== null) {
		 	let val = scope.getLocalVariable(varName);
			if (val !== null && (onlyConst === false || val.isConst === true)) {
				return val;
			}
			if (scope.isFrame) {
				onlyConst = true;
			}
			scope = scope.parent;
		}
		return null;
	}
	
	addParameter(varName, varType) {
		let newVar = new CompilerVariable(varName, varType, false, false, true, 0, varType.isRef);
		this.parameters[this.parameterCount] = newVar;
		this.parameterCount++;
		return newVar;
	}
	
	endAddParameter() {
		let currentOffset = -4;
		for (let i = this.parameterCount - 1; i >= 0; i--) {
			currentOffset = currentOffset - this.parameters[i].varType.slotCount();
			this.parameters[i].offset = currentOffset;
		}
	}

	addVariable(varName, varType, isConst) {
		let isWithStat = varType.isRef && this.parent !== null;
		let newVar = new CompilerVariable(varName, varType, isConst, this.isGlobal, false, this.offset + this.variableOffset, isWithStat);
		newVar.irIndex = this.addIrVarTypes(varType.irTypes);
		this.variables[this.variableCount] = newVar;
		this.variableCount++;
		this.variableOffset += varType.slotCount();
		return newVar;	
	}
	
}


class Compiler {

	constructor(context) {
		this.context = context;
		this.scope = this.context.globalScope;
		this.codeBlock = new CodeBlock("global");
	}
	
	resetCode() {
		this.codeBlock = new CodeBlock("global");
	}
	
	pushScopeBlock() {
		this.scope = CompilerScope.makeBlock(this.scope);
	}
	
	pushScopeLoop() {
		this.scope = CompilerScope.makeLoop(this.scope);
	}

	pushScopeFunction(isGenerator, returnType) {
		this.scope = CompilerScope.makeFunction(this.scope, isGenerator, returnType);
	}
	
	pushScopeProcedure() {
		this.scope = CompilerScope.makeProcedure(this.scope);
	}
	
	sequenceArray(start, length) {
		let a = [];
		for (let i = 0; i < length; i++) {
			a[i] = start + i;
		}
		return a;
	}
		
	popScope() {
		let msg = "";
		for (let i = 0; i < this.scope.variableCount; i++) {
			let variable = this.scope.variables[i];
			if (variable.stat !== null) {
				variable.stat.addReset();
				for (let k = 0; k < variable.stat.moveLocCount; k++) {
					let loc = variable.stat.moveLocs[k];
					msg += variable.varName + "(" + loc.line + "," + loc.col + ") ";
					let codeOffset = loc.loc;
					if (codeOffset < 0 || codeOffset >= this.codeBlock.codeSize) {
						console.log("Inconsistent loc " + loc.loc);
					} else {
						let opcode = this.codeBlock.codes[codeOffset];
						if (opcode === PLW_OPCODE_PUSH_GLOBAL) {
							this.codeBlock.codes[codeOffset] = PLW_OPCODE_PUSH_GLOBAL_MOVE;
						} else if (opcode === PLW_OPCODE_PUSH_LOCAL) {
							this.codeBlock.codes[codeOffset] = PLW_OPCODE_PUSH_LOCAL_MOVE;
						} else {
							console.log("Inconsistent opcode " + this.codeBlock.codes[loc.loc]);
						}
					}
				}
			}
		}
		//if (msg !== "") {
		//	console.log("Moves: " + msg); 
		//}
		this.scope = this.scope.parent;
	}
	
	addType(evalType) {
		let uniqueType = this.context.getType(evalType.typeKey());
		if (uniqueType === null) {
			uniqueType = this.context.addType(evalType);
			if (uniqueType.structuralType().tag === "res-type-array") {
				this.generateArrayFunctions(uniqueType);
			}
		}
		return uniqueType;
	}
	
	generateArrayFunctions(evalType) {
		let lengthFunc = this.generateArrayLengthFunction(evalType);
		this.generateArrayLastIndexFunction(evalType, lengthFunc);
		this.generateArrayIndexOfFunction(evalType);
	}
	
	generateArrayLengthFunction(evalType) {	
		var func = new EvalResultFunction(
			"length",
			new EvalResultParameterList(1, [new EvalResultParameter("array", evalType)]),
			EVAL_TYPE_INTEGER, 
			false
		);
		let itemType = evalType.underlyingType;	
		if (itemType.slotCount() == 1) {
			func.internalIndex = PLW_LOPCODE_GET_BLOB_SIZE;
		} else {
			func.codeBlockIndex = this.context.addCodeBlock(func.functionKey());
			let cb = this.context.codeBlocks[func.codeBlockIndex];
			cb.codePushLocal(-5);
			cb.codeExt(PLW_LOPCODE_GET_BLOB_SIZE);
			cb.codePush(evalType.underlyingType.slotCount());
			cb.codeDiv();
			cb.codeRet(1);
		}
		this.context.addFunction(func);
		return func;
	}
	
	generateArrayLastIndexFunction(evalType, lengthFunc) {
		var func = new EvalResultFunction(
			"last_index",
			new EvalResultParameterList(1, [new EvalResultParameter("array", evalType)]),
			EVAL_TYPE_INTEGER, 
			false
		);
		func.codeBlockIndex = this.context.addCodeBlock(func.functionKey());
		let cb = this.context.codeBlocks[func.codeBlockIndex];
		cb.codePushLocal(-5);
		if (lengthFunc.codeBlockIndex !== -1) {
			cb.codePush(1);
			cb.codeCall(lengthFunc.codeBlockIndex);
		} else {
			cb.codeExt(lengthFunc.internalIndex);
		}
		cb.codePush(1);
		cb.codeSub();
		cb.codeRet(1);
		this.context.addFunction(func);
		return func;
	}
	
	generateArrayIndexOfFunction(evalType) {
		let itemType = evalType.underlyingType;
		var func =  new EvalResultFunction(
			"index_of",
			new EvalResultParameterList(2, [
				new EvalResultParameter("item", itemType),
				new EvalResultParameter("array", evalType)]),
			EVAL_TYPE_INTEGER, 
			false
		);
		func.codeBlockIndex = this.context.addCodeBlock(func.functionKey());
		let cb = this.context.codeBlocks[func.codeBlockIndex];
		for (let i = 0; i < itemType.slotCount() + 1; i++) {
			cb.codePushLocal(-5 - itemType.slotCount() + i);
		}
		cb.codePush(itemType.slotCount());
		cb.codeExt(PLW_LOPCODE_GET_BLOB_INDEX_OF_ITEM);
		cb.codeRet(1);
		this.context.addFunction(func);
		return func;
	}
	
	generateFunctionCall(functionName, argCount, argTypes, expectedType = null, irExprs = null) {
		let funcKey = EvalResultFunction.makeKey(functionName, argCount, argTypes);
		let func = this.context.getFunction(funcKey);
		if (func === null) {
			let variantIndex = -1;
			for (let i = 0; i < argCount; i++) {
				if (argTypes[i].tag === "res-type-variant") {
					variantIndex = i;
					break;
				}
			}
			if (variantIndex !== -1) {
				let genRes = this.generateVariantDispatchFunction(functionName, argCount, argTypes, variantIndex, expectedType);
				if (genRes.isError()) {
					return genRes;
				}
				func = this.context.getFunction(funcKey);
			} else {
				let macroFunc = this.context.findMacroFunction(functionName, argTypes);
				if (macroFunc !== null) {
					let genRes = this.generateFunctionFromMacro(functionName, argTypes, macroFunc);
					if (genRes.isError()) {
						return genRes;
					}
				}
				func = this.context.getFunction(funcKey);
			}
			if (func === null) {
				return EvalError.unknownFunction(funcKey);
			}
		}
		let argSlotCount = 0;
		for (let i = 0; i < argCount; i++) {
			argSlotCount += argTypes[i].slotCount();
		}
		if (func.nativeIndex !== -1) {
			this.codeBlock.codePush(argSlotCount);
			this.codeBlock.codeCallNative(func.nativeIndex);
		} else if (func.internalIndex !== -1) {
			this.codeBlock.codeExt(func.internalIndex);
		} else if (func.isGenerator === true) {
			this.codeBlock.codePush(argSlotCount);
			this.codeBlock.codePush(func.codeBlockIndex);
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_GENERATOR);
		} else {
			this.codeBlock.codePush(argSlotCount);
			this.codeBlock.codeCall(func.codeBlockIndex);
		}
		if (func.irIndex === -1) {
			return EvalError.todo("Function " + funcKey + " has an invalid irIndex");
		}
		return new EvalResultIR(func.isGenerator ? this.addType(new EvalTypeSequence(func.returnType)) : func.returnType, PlwIR.callf(func.irIndex, irExprs));
	}
			
	generateFunctionFromMacro(functionName, argTypes, macroFunc) {
		let params = [];
		for (let i = 0; i < macroFunc.parameterList.parameterCount; i++) {
			params[i] = new AstParameter(
				macroFunc.parameterList.parameters[i].parameterName,
				argTypes[i].toAst());
		}
		let funcDecl = new AstFunctionDeclaration(
			macroFunc.functionName,
			new AstParameterList(macroFunc.parameterList.parameterCount, params),
			(macroFunc.returnType === EVAL_TYPE_ANY ? EVAL_TYPE_INFER : macroFunc.returnType).toAst(),
			macroFunc.astStmt,
			macroFunc.isGenerator);
		return this.evalStatement(funcDecl);
	}
	
	generateVariantDispatchFunction(functionName, argCount, argTypes, variantIndex, expectedType) {
		let params = [];
		for (let i = 0; i < argCount; i++) {
			params[i] = new AstParameter("arg" + i, argTypes[i].toAst());
		}
		let args = [];
		for (let i = 0; i < argCount; i++) {
			args[i] = new AstVariable(i == variantIndex ? "v" : "arg" + i);
		}
		let retVal = new AstFunction(functionName, new AstArgList(argCount, args));
		if (expectedType !== null) {
			retVal = new AstAs(retVal, expectedType.toAst());
		}
		let thenStmts = [new AstReturn(retVal)];
 		let thenExpr = new AstBlock(thenStmts.length, thenStmts, null);		
		let whens = [];
		for (let i = 0; i < argTypes[variantIndex].typeCount; i++) {
			whens[i] = new AstKindofWhenStmt(
				argTypes[variantIndex].types[i].toAst(),
				"v", thenExpr);
		}
		let funcDecl = new AstFunctionDeclaration(
			functionName,
			new AstParameterList(argCount, params),
			EVAL_TYPE_INFER.toAst(),
			new AstBlock(1, [ 
				new AstKindofStmt (
					new AstVariable("arg" + variantIndex),
					argTypes[variantIndex].typeCount,
					whens,
					null)],
				null),
			false);
		return this.evalStatement(funcDecl);
	}
	
	generateProcedureFromMacro(procedureName, argTypes, macroProc) {
		let params = [];
		for (let i = 0; i < macroProc.parameterList.parameterCount; i++) {
			params[i] = new AstParameter(
				macroProc.parameterList.parameters[i].parameterName,
				argTypes[i].toAst());
		}
		let procDecl = new AstProcedureDeclaration(
			macroProc.procedureName,
			new AstParameterList(macroProc.parameterList.parameterCount, params),
			macroProc.astStmt);
		return this.evalStatement(procDecl);
	}
	
	generateVariantDispatchProcedure(astProcCall, argTypes, variantIndex) {
		let params = [];
		for (let i = 0; i < astProcCall.argList.argCount; i++) {
			params[i] = new AstParameter("arg" + i, argTypes[i].toAst());
		}
		let args = [];
		for (let i = 0; i < astProcCall.argList.argCount; i++) {
			args[i] = new AstVariable(i === variantIndex ? "v" : "arg" + i);
		}
		let thenStmts = [new AstProcedure(astProcCall.procedureName, new AstArgList(astProcCall.argList.argCount, args))];
		let thenExpr = new AstBlock(thenStmts.length, thenStmts, null); 
		let whens = [];
		for (let i = 0; i < argTypes[variantIndex].typeCount; i++) {
			whens[i] = new AstKindofWhenStmt(
				argTypes[variantIndex].types[i].toAst(),
				"v", thenExpr);
		}
		let procDecl = new AstProcedureDeclaration(
			astProcCall.procedureName,
			new AstParameterList(astProcCall.argList.argCount, params),
			new AstBlock(1, [ 
				new AstKindofStmt (
					new AstVariable("arg" + variantIndex),
					argTypes[variantIndex].typeCount,
					whens,
					null)],
				null));
		return this.evalStatement(procDecl);
	}
	
	evalType(expr) {
		if (expr.tag === "ast-null") {
			return EVAL_TYPE_NULL;
		}
		if (expr.tag === "ast-type-named") {
			let evalType = this.context.getType(expr.typeName);
			if (evalType === null) {
				return EvalError.unknownType(expr.typeName).fromExpr(expr);
			}
			return evalType;
		}
		if (expr.tag === "ast-type-array") {
			let underType = this.evalType(expr.underlyingType);
			if (underType.isError()) {
				return underType;
			}
			if (underType === EVAL_TYPE_ANY) {
				return EvalError.wrongType(underType, "not any").fromExpr(expr.underlyingType);					
			}
			return this.addType(new EvalTypeArray(underType));
		}
		if (expr.tag === "ast-type-sequence") {
			let underType = this.evalType(expr.underlyingType);
			if (underType.isError()) {
				return underType;
			}
			if (underType === EVAL_TYPE_ANY) {
				return EvalError.wrongType(underType, "not any").fromExpr(expr.underlyingType);					
			}
			return this.addType(new EvalTypeSequence(underType));
		}
		if (expr.tag === "ast-type-record") {
			for (let i = 1; i < expr.fieldCount; i++) {
				for (let j = 0; j < i; j++) {
					if (expr.fields[i].fieldName === expr.fields[j].fieldName) {
						return EvalError.fieldAlreadyExists(expr.fields[i].fieldName).fromExpr(expr.fields[i]);
					}
				}
			}
			let fields = [];
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldType = this.evalType(expr.fields[i].fieldType);
				if (fieldType.isError()) {
					return fieldType;
				}
				if (fieldType === EVAL_TYPE_ANY) {
					return EvalError.wrongType(fieldType, "not any").fromExpr(expr.fields[i].fieldType);					
				}
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldType);
			}
			return this.addType(new EvalTypeRecord(expr.fieldCount, fields));
		}
		if (expr.tag === "ast-type-variant") {
			let types = [];
			for (let i = 0; i < expr.typeCount; i++) {
				let type = this.evalType(expr.types[i]);
				if (type.isError()) {
					return type;
				}
				if (type === EVAL_TYPE_ANY) {
					return EvalError.wrongType(type, "not any").fromExpr(expr.types[i]);					
				}
				if (type.tag === "res-type-variant") {
					return EvalError.cantNestVariant(type.typeKey()).fromExpr(expr.types[i]);
				}
				if (types.indexOf(type) !== -1) {
					return EvalError.fieldAlreadyExists(type.typeKey()).fromExpr(expr.types[i]);
				}
				types[i] = type;
			}
			types.sort(function (a, b) { 
				if (a.typeKey() === b.typeKey()) return 0;
					if (a.typeKey() > b.typeKey()) return 1;
					return -1;
			});			
			return this.addType(new EvalTypeVariant(expr.typeCount, types));
		}
		if (expr.tag === "ast-type-tuple") {
			let types = [];
			for (let i = 0; i < expr.typeCount; i++) {
				let type = this.evalType(expr.types[i]);
				if (type.isError()) {
					return type;
				}
				if (type === EVAL_TYPE_ANY) {
					return EvalError.wrongType(type, "not any").fromExpr(expr.types[i]);					
				}
				types[i] = type;
			}
			return this.addType(new EvalTypeTuple(expr.typeCount, types));
		}
		return EvalError.unknownType(expr.tag).fromExpr(expr);
	}
	
	
	// The eval of a statement must return:
	//   EVAL_RESULT_RAISE if all paths raise an exception, else
	//   EVAL_RESULT_RETURN if all paths return or raise, else
	//   EVAL_RESULT_OK 
	evalStatement(expr) {
		if (expr.tag === "ast-type-declaration") {
			if (this.context.getType(expr.typeName) !== null) {
				return EvalError.typeAlreadyExists(expr.typeName).fromExpr(expr);
			}
			let underlyingType = this.evalType(expr.typeExpr);
			if (underlyingType.isError()) {
				return underlyingType;
			}
			if (underlyingType === EVAL_TYPE_ANY) {
				return EvalError.wrongType(underlyingType, "not any").fromExpr(expr.typeExpr);					
			}
			let namedType = new EvalTypeName(expr.typeName, underlyingType);
			this.addType(namedType);
			return new EvalResultIR(EVAL_RESULT_OK, null);
		}
		if (expr.tag === "ast-variable-declaration") {
			for (let i = 0; i < expr.varNameCount; i++) {
				if (this.scope.getLocalVariable(expr.varNames[i]) !== null) {
					return EvalError.variableAlreadyExists(expr.varNames[i]).fromExpr(expr);
				}
			}
			let initValueResult = this.eval(expr.valueExpr);
			if (initValueResult.isError()) {
				return initValueResult;
			}
			if (expr.varNameCount === 1) {
				let newVar = this.scope.addVariable(expr.varNames[0], initValueResult.resultType, expr.isConst);
				if (newVar.isGlobal) {
					return new EvalResultIR(
						EVAL_RESULT_OK,
						PlwIR.setGlobal(
							this.sequenceArray(newVar.irIndex, initValueResult.resultType.irTypes.length),
							initValueResult.ir
						)
					);
				}
				return new EvalResultIR(EVAL_RESULT_OK, initValueResult.ir);
			}
			let initStructType = initValueResult.resultType.structuralType();
			if (initStructType.tag !== "res-type-tuple") {
				return EvalError.wrongType(initValueResult.resultType, "tuple").fromExpr(expr.valueExpr);
			}					
			if (expr.varNameCount !== initStructType.typeCount) {
				return EvalError.tupleSizeMismatch(expr.varNameCount, initStructType.typeCount).fromExpr(expr.valueExpr);
			}
			for (let i = 0; i < expr.varNameCount; i++) {
				this.scope.addVariable(expr.varNames[i], initStructType.types[i], expr.isConst);
			}
			return new EvalResultIR(EVAL_RESULT_OK, initValueResult.ir);
		}
		if (expr.tag === "ast-assign") {
			if (expr.left.tag === "ast-variable") {
				// search the variable
				let variable = this.scope.getVariable(expr.left.varName);
				if (variable === null) {
					return EvalError.unknownVariable(expr.left.varName).fromExpr(expr.left);
				}
				if (variable.isConst) {
					return EvalError.cantMutateConst(expr.left.varName).fromExpr(expr.left);
				}
				// evaluate the value
				let valueResult = this.eval(expr.right, variable.varType);
				if (valueResult.isError()) {
					return valueResult;
				}
				if (valueResult.resultType !== variable.varType) {
					return EvalError.wrongType(valueResult.resultType, variable.varType.typeKey()).fromExpr(expr.right);					
				}
				// assign the value
				let ir = null;
				if (variable.isGlobal) {
					for (let i = valueResult.resultType.slotCount() - 1; i >= 0; i--) { 
						this.codeBlock.codePopGlobal(variable.offset + i);
					}
					let globalIds = []; 
					for (let i = 0; i < valueResult.resultType.irTypes.length; i++) {
						globalIds[i] = variable.irIndex + i;
					}
					ir = PlwIR.setGlobal(globalIds, valueResult.ir);
				} else {
					for (let i = valueResult.resultType.slotCount() - 1; i >= 0; i--) { 
						this.codeBlock.codePopLocal(variable.offset + i);
					}
				}
				if (variable.stat !== null) {
					variable.stat.addReset();
				}
				return new EvalResultIR(EVAL_RESULT_OK, ir);
			}
			if (expr.left.tag === "ast-value-tuple") {
				let tupleExpr = expr.left;
				let variables = [];
				let variableTypes = [];
				for (let i = 0; i < tupleExpr.itemCount; i++) {
					if (tupleExpr.items[i].tag !== "ast-variable") {
						return EvalError.unassignable(expr.left.tag).fromExpr(expr.left);
					}
					let varName = tupleExpr.items[i].varName;
					let variable = this.scope.getVariable(varName);
					if (variable === null) {
						return EvalError.unknownVariable(varName).fromExpr(expr.left);
					}
					if (variable.isConst) {
						return EvalError.cantMutateConst(varName).fromExpr(expr.left);
					}
					variables[i] = variable;
					variableTypes[i] = variable.varType;					
				}
				let tupleType = this.addType(new EvalTypeTuple(tupleExpr.itemCount, variableTypes));
				// evaluate the value
				let valueResult = this.eval(expr.right, tupleType);
				if (valueResult.isError()) {
					return valueResult;
				}
				if (valueResult.resultType !== tupleType) {
					return EvalError.wrongType(valueResult.resultType.types[i], variables[i].varType.typeKey()).fromExpr(expr.right);					
				}
				// assign the value
				for (let i = tupleExpr.itemCount - 1; i >= 0; i--) {
					if (variables[i].isGlobal) {
						this.codeBlock.codePopGlobal(variables[i].offset);
					} else {
						this.codeBlock.codePopLocal(variables[i].offset);
					}
					if (variables[i].stat !== null) {
						variables[i].stat.addReset();
					}
				}
				return new EvalResultIR(EVAL_RESULT_OK, valueResult.ir);				
			}
			if (expr.left.tag === "ast-index") {
				let indexExpr = expr.left;
				// Evaluate the indexed ptr
				let indexedResult = this.evalForMutate(indexExpr.indexed);
				if (indexedResult.isError()) {
					return indexedResult;
				}
				let structType = indexedResult.resultType.structuralType();
				if (structType.tag !== "res-type-array") {
					return EvalError.wrongType(indexedType, "array").fromExpr(indexExpr.indexed);
				}
				let itemType = structType.underlyingType;
				// Evaluate the index
				let indexResult = this.eval(indexExpr.index);
				if (indexResult.isError()) {
					return indexResult;
				}
				if (indexResult.resultType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(indexResult.resultType, "integer").fromExpr(indexExpr.index);
				}
				if (indexExpr.indexTo !== null) {
					return EvalError.unassignable(indexExpr.tag).fromExpr(indexExpr);
				}
				if (itemType.slotCount() > 1) {
					this.codeBlock.codePush(itemType.slotCount());
					this.codeBlock.codeMul();
				}
				// Evaluate the value to assign
				let valueResult = this.eval(expr.right, itemType);
				if (valueResult.isError()) {
					return valueResult;
				}
				if (valueResult.resultType !== itemType) {
					return EvalError.wrongType(valueResult.resultType, itemType.typeKey()).fromExpr(expr.right);
				}
				// Assign the value
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_WRITE_BLOB);
				return new EvalResultIR(EVAL_RESULT_OK, valueResult.ir);
			}
			if (expr.left.tag === "ast-field") {
				let fieldExpr = expr.left;
				// evaluate the record
				let recordResult = this.evalForMutate(fieldExpr.expr);
				if (recordResult.isError()) {
					return recordResult;
				}
				let structType = recordResult.resultType.structuralType();
				if (structType.tag != "res-type-record") {
					return EvalError.wrongType(recordResult.resultType, "record").fromExpr(fieldExpr.expr);
				}
				// push the offset of the field
				let field = structType.getField(fieldExpr.fieldName);
				if (field === null) {
					return EvalError.unknownField(fieldExpr.fieldName, recordType.typeKey()).fromExpr(fieldExpr);
				}
				this.codeBlock.codePush(field.offset);
				// Evaluate the value to assign
				let valueResult = this.eval(expr.right, field.fieldType);
				if (valueResult.isError()) {
					return valueResult;
				}
				if (valueResult.resultType !== field.fieldType) {
					return EvalError.wrongType(valueResult.resultType, field.fieldType.typeKey()).fromExpr(expr.right);
				}
				// Assigne the value
				this.codeBlock.codePush(field.fieldType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_WRITE_BLOB);
				return new EvalResultIR(EVAL_RESULT_OK, valueResult.ir);
			}
			return EvalError.unassignable(expr.left.tag).fromExpr(expr.left);
		}
		if (expr.tag == "ast-block") {
			let ret = EVAL_RESULT_OK;
			let irStmts = [];
			let exceptionLoc = -1;
			this.pushScopeBlock();
			if (expr.exception !== null) {
				this.scope.clearVarStatTmp();
				exceptionLoc = this.codeBlock.codePush(0);
				this.codeBlock.codeExt(PLW_LOPCODE_CREATE_EXCEPTION_HANDLER);
				this.scope.addVariable("_exception_handler", EVAL_TYPE_EXCEPTION_HANDLER, true);
			}
			for (let i = 0; i < expr.statementCount; i++) {
				if (ret !== EVAL_RESULT_OK) {
					return EvalError.unreachableCode().fromExpr(expr.statements[i]);
				}
				let stmtResult = this.evalStatement(expr.statements[i]);
				if (stmtResult.isError()) {
					return stmtResult;
				}
				ret = stmtResult.resultType;
				irStmts[i] = stmtResult.ir;
			}
			if (ret === EVAL_RESULT_OK) {
				if (this.scope.variableOffset > 0) {
					this.codeBlock.codePopVoid(this.scope.variableOffset);
				}
			}
			this.popScope();
			if (expr.exception === null) {
				return new EvalResultIR(ret, PlwIR.block(irStmts));
			}
			let endLoc = -1;
			if (ret === EVAL_RESULT_OK) {
				endLoc = this.codeBlock.codeJmp(0);
			}
			this.codeBlock.setLoc(exceptionLoc);
			this.scope.clearVarStatTmp();
			let exResult = this.evalStatement(expr.exception);
			if (exResult.isError()) {
				return exResult;
			}
			this.scope.clearVarStatTmp();
			if (endLoc !== -1) {
				this.codeBlock.setLoc(endLoc);
			}
			if (ret === EVAL_RESULT_RAISE) {
				return new EvalResultIR(exResult.resultType, PlwIR.block(irStmts));
			}
			if (ret === EVAL_RESULT_RETURN && exResult.resultType !== EVAL_RESULT_OK) {
				return new EvalResultIR(ret, PlwIR.block(ir));
			}
			return new EvalResultIR(EVAL_RESULT_OK, PlwIR.block(irStmts));
		}
		if (expr.tag === "ast-exception") {
			this.pushScopeBlock();
			let exceptionVar = this.scope.addVariable("_exception_value", EVAL_TYPE_INTEGER, false);
			let endLocs = [];
			let endLocCount = 0;
			let ret = null;
			for (let i = 0; i < expr.whenStmtCount; i++) {
				let whenStmt = expr.whenStmts[i];
				if (whenStmt.tag !== "ast-when-statement") {
					return EvalError.unknownType(whenStmt.tag).fromExpr(expr);
				}
				this.codeBlock.codePushLocal(exceptionVar.offset);
				let whenResult = this.eval(whenStmt.whenExpr);
				if (whenResult.isError()) {
					return whenResult;
				}
				if (whenResult.resultType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(whenResult.resultType, "integer").fromExpr(whenStmt.whenExpr);	
				}
				this.codeBlock.codeEq(whenResult.resultType.slotCount());
				let nextLoc = this.codeBlock.codeJz(0);
				this.scope.clearVarStatTmp();
				let stmtResult = this.evalStatement(whenStmt.statement);
				if (stmtResult.isError()) {
					return stmtResult;
				}
				this.scope.clearVarStatTmp();
				if (
					(ret === null || stmtResult.resultType === EVAL_RESULT_OK) ||
					(stmtResult.resultType === EVAL_RESULT_RETURN && ret === EVAL_RESULT_RAISE)
				) {
					ret = stmtResult.resultType;
				}
				if (stmtResult.resultType == EVAL_RESULT_OK) {
					endLocs[endLocCount] = this.codeBlock.codeJmp(0);
					endLocCount++;
				}
				this.codeBlock.setLoc(nextLoc);
			}
			if (expr.defaultStmt === null) {
				if (ret === null) {
					ret = EVAL_RESULT_RAISE;
				}
				this.codeBlock.codeExt(PLW_LOPCODE_RAISE_EXCEPTION);
			} else {
				this.scope.clearVarStatTmp();
				let stmtResult = this.evalStatement(expr.defaultStmt);
				if (stmtResult.isError()) {
					return stmtResult;
				}
				this.scope.clearVarStatTmp();
				if (
					(ret === null || stmtResult.resultType === EVAL_RESULT_OK) ||
					(stmtResult.resultType === EVAL_RESULT_RETURN && ret === EVAL_RESULT_RAISE)
				) {
					ret = stmtResult.resultType;
				}
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			if (ret === null) {
				ret = EVAL_RESULT_OK;
			}
			if (ret === EVAL_RESULT_OK) {
				if (this.scope.variableOffset > 0) {
					this.codeBlock.codePopVoid(this.scope.variableOffset);
				}
			}
			this.popScope();			
			return new EvalResultIR(ret, null);
		}
		if (expr.tag === "ast-if") {
			let condResult = this.eval(expr.condition);
			if (condResult.isError()) {
				return condResult;
			}
			if (condResult.resultType !== EVAL_TYPE_BOOLEAN) {
				return EvalError.wrongType(condResult.resultType, "boolean").fromExpr(expr.condition);	
			}
			let falseLoc = this.codeBlock.codeJz(0);
			this.scope.clearVarStatTmp();
			let trueResult =  this.evalStatement(expr.trueStatement);
			if (trueResult.isError()) {
				return trueResult;
			}
			this.scope.clearVarStatTmp();
			let endLoc = expr.falseStatement === null ? -1 : this.codeBlock.codeJmp(0);
			this.codeBlock.setLoc(falseLoc);
			if (expr.falseStatement === null) {
				return new EvalResultIR(EVAL_RESULT_OK, null);
			}
			let falseResult = this.evalStatement(expr.falseStatement);
			if (falseResult.isError()) {
				return falseResult;
			}
			this.scope.clearVarStatTmp();
			this.codeBlock.setLoc(endLoc);
			if (trueResult.resultType === EVAL_RESULT_RAISE && falseResult.resultType === EVAL_RESULT_RAISE) {
				return new EvalResultIR(EVAL_RESULT_RAISE, null); 
			}
			if (
				(trueResult.resultType === EVAL_RESULT_RETURN && falseResult.resultType !== EVAL_RESULT_OK) ||
				(falseResult.resultType === EVAL_RESULT_RETURN && trueResult.resultType !== EVAL_RESULT_OK)
			) {
				return new EvalResultIR(EVAL_RESULT_RETURN, null);
			}
			return new EvalResultIR(EVAL_RESULT_OK, null);
		}
		if (expr.tag === "ast-kindof-stmt") {
			let caseResult = this.eval(expr.caseExpr);
			if (caseResult.isError()) {
				return caseResult;
			}
			if (caseResult.resultType.structuralType().tag !== "res-type-variant") {
				return EvalError.wrongType(caseResult.resultType, "variant").fromExpr(expr.caseExpr);
			}
			let kindHasWhen = [];
			let returnCount = 0;
			for (let i = 0; i < caseResult.resultType.structuralType().typeCount; i++) {
				kindHasWhen[i] = false;
			}
			let endLocs = [];
			let endLocCount = 0;
			for (let i = 0; i < expr.whenCount; i++) {
				// Duplicate the last slot of the variant which is the variantType
				this.codeBlock.codeDup(1);
				let whenType = this.evalType(expr.whens[i].type);
				if (whenType.isError()) {
					return whenType;
				}
				let typeIndex = caseResult.resultType.structuralType().types.indexOf(whenType);
				if (typeIndex === -1) {
					return EvalError.unknownVariantKind(whenType.typeKey()).fromExpr(expr.whens[i]);
				}
				if (kindHasWhen[typeIndex] === true) {
					return EvalError.variantKindAlreadyManaged(whenType.typeKey()).fromExpr(expr.whens[i]);
				}
				kindHasWhen[typeIndex] = true;
				// Compare the variant type with the when type
				this.codeBlock.codePush(whenType.globalId);
				this.codeBlock.codeEq(1);
				// If false, loop						
				let nextLoc = this.codeBlock.codeJz(0);
				// If true, resize the variant to the actual type size to make the when var
				this.codeBlock.codePopVoid(caseResult.resultType.slotCount() - whenType.slotCount());
				this.pushScopeBlock();
				this.scope.addVariable(expr.whens[i].varName, whenType, false);
				this.scope.clearVarStatTmp();
				let thenResult = this.evalStatement(expr.whens[i].thenBlock);
				if (thenResult.isError()) {
					return thenResult;
				}
				this.scope.clearVarStatTmp();
				if (thenResult.resultType === EVAL_RESULT_RETURN) {
					returnCount++;
				}
				// Pop the when var
				this.codeBlock.codePopVoid(whenType.slotCount());
				this.popScope();
				// It is done, goto end
				endLocs[endLocCount] = this.codeBlock.codeJmp(0);
				endLocCount++;
				this.codeBlock.setLoc(nextLoc);
			}
			// No match, we still have the case var on the stack, we pop it
			this.codeBlock.codePopVoid(caseResult.resultType.slotCount());
			// Execute the else statement if there is one
			if (expr.elseBlock !== null) {
				this.scope.clearVarStatTmp();
				let elseResult = this.evalStatement(expr.elseBlock);
				if (elseResult.isError()) {
					return elseResult;
				}
				this.scope.clearVarStatTmp();
				if (elseResult.resultType === EVAL_RESULT_RETURN) {
					for (let i = 0; i < kindHasWhen.length; i++) {
						if (kindHasWhen[i] === false) {
							returnCount++;
						}
					}
				}
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return new EvalResultIR(returnCount === kindHasWhen.length ? EVAL_RESULT_RETURN : EVAL_RESULT_OK, null);
		}
		if (expr.tag === "ast-while") {
			this.pushScopeLoop();
			let testLoc = this.codeBlock.codeSize;
			let conditionResult = this.eval(expr.condition);
			if (conditionResult.isError()) {
				return conditionResult;
			}
			if (conditionResult.resultType !== EVAL_TYPE_BOOLEAN) {
				return EvalError.wrongType(conditionResult.resultType, "boolean").fromExpr(expr.condition);	
			}
			let endLoc = this.codeBlock.codeJz(0);
			this.scope.clearVarStatTmp();
			let stmtResult = this.evalStatement(expr.statement);
			if (stmtResult.isError()) {
				return stmtResult;
			}
			this.scope.clearVarStatTmp();
			this.codeBlock.codeJmp(testLoc);
			this.codeBlock.setLoc(endLoc);
			for (let i = 0; i < this.scope.exitLocCount; i++) {
				this.codeBlock.setLoc(this.scope.exitLocs[i]);
			}
			this.popScope();
			return new EvalResultIR(EVAL_RESULT_OK, null);
		}
		if (expr.tag === "ast-loop") {
			this.pushScopeLoop();
			let beginLoc = this.codeBlock.codeSize;
			this.scope.clearVarStatTmp();
			let stmtResult = this.evalStatement(expr.statement);
			if (stmtResult.isError()) {
				return stmtResult;
			}
			this.scope.clearVarStatTmp();
			this.codeBlock.codeJmp(beginLoc);
			for (let i = 0; i < this.scope.exitLocCount; i++) {
				this.codeBlock.setLoc(this.scope.exitLocs[i]);
			}
			this.popScope();
			return new EvalResultIR(EVAL_RESULT_OK, null);
		}
		if (expr.tag === "ast-for") {
			if (expr.sequence.tag === "ast-range") {
				this.pushScopeLoop();
				let startBoundExpr = expr.isReverse ? expr.sequence.upperBound : expr.sequence.lowerBound;
				let endBoundExpr = expr.isReverse ? expr.sequence.lowerBound : expr.sequence.upperBound;				
				let endBoundResult = this.eval(endBoundExpr);
				if (endBoundResult.isError()) {
					return endBoundResult;
				}
				if (endBoundResult.resultType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(endBoundResult.resultType, "integer").fromExpr(endBoundExpr);
				}
				let endBoundVar = this.scope.addVariable("_for_range_end_bound", EVAL_TYPE_INTEGER, false);
				let startBoundResult = this.eval(startBoundExpr);
				if (startBoundResult.isError()) {
					return startBoundResult;
				}
				if (startBoundResult.resultType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(startBoundResult.result, "integer").fromExpr(startBoundExpr);
				}
				let indexVar = this.scope.addVariable(expr.index, EVAL_TYPE_INTEGER, false);
				let testLoc = this.codeBlock.codeSize;
				this.codeBlock.codePushLocal(indexVar.offset);
				this.codeBlock.codePushLocal(endBoundVar.offset);
				if (expr.isReverse) {
					this.codeBlock.codeGte();
				} else {
					this.codeBlock.codeLte();
				}
				let endLoc = this.codeBlock.codeJz(0);
				this.scope.clearVarStatTmp();
				let stmtResult = this.evalStatement(expr.statement);
				if (stmtResult.isError()) {
					return stmtResult;
				}
				this.scope.clearVarStatTmp();
				this.codeBlock.codePush(1);
				if (expr.isReverse) {
					this.codeBlock.codeSub();
				} else {
					this.codeBlock.codeAdd();
				}
				this.codeBlock.codeJmp(testLoc);
				this.codeBlock.setLoc(endLoc);
				for (let i = 0; i < this.scope.exitLocCount; i++) {
					this.codeBlock.setLoc(this.scope.exitLocs[i]);
				}
				if (this.scope.variableOffset > 0) {
					this.codeBlock.codePopVoid(this.scope.variableOffset);
				}
				this.popScope();
				return new EvalResultIR(EVAL_RESULT_OK, null);
			} else {
				this.pushScopeLoop();
				let sequenceResult = this.eval(expr.sequence);
				if (sequenceResult.isError()) {
					return sequenceResult;
				}
				let sequenceType = sequenceResult.resultType.structuralType();
				if (sequenceType.tag == "res-type-sequence") {
					let sequenceVar = this.scope.addVariable("_for_sequence", sequenceType, false);
					this.codeBlock.codePushLocal(sequenceVar.offset);
					this.codeBlock.codeExt(PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM);
					let indexVar = this.scope.addVariable(expr.index, sequenceType.underlyingType, false);
					let testLoc = this.codeBlock.codeSize;
					this.codeBlock.codePushLocal(sequenceVar.offset);
					this.codeBlock.codeExt(PLW_LOPCODE_HAS_GENERATOR_ENDED);
					let endLoc = this.codeBlock.codeJnz(0);
					this.scope.clearVarStatTmp();
					let stmtResult = this.evalStatement(expr.statement);
					if (stmtResult.isError()) {
						return stmtResult;
					}
					this.scope.clearVarStatTmp();
					this.codeBlock.codePushLocal(sequenceVar.offset);
					this.codeBlock.codeExt(PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM);
					for (let i = 0; i < sequenceType.underlyingType.slotCount(); i++) {
						this.codeBlock.codePopLocal(indexVar.offset + sequenceType.underlyingType.slotCount() - 1 - i);
					}
					this.codeBlock.codeJmp(testLoc);
					this.codeBlock.setLoc(endLoc);
				} else if (sequenceType.tag === "res-type-array") {
					let arrayVar = this.scope.addVariable("_for_array", sequenceType, false);
					let itemType = sequenceType.underlyingType;
					// Get the last_index of the array, multiply it by the itemSize
					this.codeBlock.codeDup(1);
					let lengthType = this.generateFunctionCall("last_index", 1, [sequenceType], EVAL_TYPE_INTEGER);
					if (lengthType.isError()) {
						return lengthType.fromExpr(expr);
					}
					if (lengthType !== EVAL_TYPE_INTEGER) {
						return EvalError.wrongType(lengthType, "integer").fromExpr(expr);
					}
					if (itemType.slotCount() > 1) {
						this.codeBlock.codePush(itemType.slotCount());
						this.codeBlock.codeMul();
					}
					let lastIndexVar = this.scope.addVariable("_for_last_index", EVAL_TYPE_INTEGER, false);
					// Create a variable for the item
					for (let i = 0; i < itemType.slotCount(); i++) {
						this.codeBlock.codePush(0);
					}
					let itemVar = this.scope.addVariable(expr.index, sequenceType.underlyingType, false);
					// Initialize the counter, 0 or last_index * itemSize if reverse
					if (expr.isReverse === true) {
						this.codeBlock.codePushLocal(lastIndexVar.offset);
					} else {
						this.codeBlock.codePush(0);
					}
					let indexVar = this.scope.addVariable("_for_index", EVAL_TYPE_INTEGER, false);
					// Begin of the loop
					let testLoc = this.codeBlock.codeSize;
					// Test the counter <= last_index * itemSize, or >= 0 if reverse
					this.codeBlock.codePushLocal(indexVar.offset);
					if (expr.isReverse === true) {
						this.codeBlock.codePush(0);
						this.codeBlock.codeGte();
					} else {
						this.codeBlock.codePushLocal(lastIndexVar.offset);
						this.codeBlock.codeLte();
					}
					// If no, go to the end of the loop
					let endLoc = this.codeBlock.codeJz(0);
					// Get the item in the array at the counter index
					this.codeBlock.codePushLocal(arrayVar.offset);
					this.codeBlock.codePushLocal(indexVar.offset);
					this.codeBlock.codePush(sequenceType.underlyingType.slotCount());
					this.codeBlock.codeExt(PLW_LOPCODE_READ_BLOB);
					// Set the item variable
					for (let i = 0; i < itemType.slotCount(); i++) {
						this.codeBlock.codePopLocal(itemVar.offset + itemType.slotCount() - i - 1);
					}
					// Evaluate the loop statement
					this.scope.clearVarStatTmp();
					let stmtResult = this.evalStatement(expr.statement);
					if (stmtResult.isError()) {
						return stmtResult;
					}
					this.scope.clearVarStatTmp();
					// Increment the counter, decrement if reverse
					this.codeBlock.codePush(itemType.slotCount());
					if (expr.isReverse === true) {
						this.codeBlock.codeSub();
					} else {
						this.codeBlock.codeAdd();
					}
					// Go to at the beginning of the loop
					this.codeBlock.codeJmp(testLoc);
					// End of the loop
					this.codeBlock.setLoc(endLoc);
				} else {
					return EvalError.wrongType(sequence, "sequence or array").fromExpr(expr.sequence);
				}	
				for (let i = 0; i < this.scope.exitLocCount; i++) {
					this.codeBlock.setLoc(this.scope.exitLocs[i]);
				}
				if (this.scope.variableOffset > 0) {
					this.codeBlock.codePopVoid(this.scope.variableOffset);
				}
				this.popScope();
				return new EvalResultIR(EVAL_RESULT_OK, null);
			}
			return EvalError.unknownType(expr.sequence.tag).fromExpr(expr.sequence);
		}
		if (expr.tag === "ast-exit") {
			let currentScope = this.scope;
			let variableOffset = 0;
			while (currentScope !== null && currentScope.isLoop == false) {
				variableOffset += currentScope.variableOffset;
				currentScope = currentScope.parent; 
			}
			if (currentScope === null) {
				return EvalError.unexpectedExit().fromExpr(expr);
			}
			if (expr.condition === null) {
				if (variableOffset > 0) {
					this.codeBlock.codePopVoid(variableOffset);
				}
				currentScope.exitLocs[currentScope.exitLocCount] = this.codeBlock.codeJmp(0);
				currentScope.exitLocCount++;
			} else {
				let condResult = this.eval(expr.condition);
				if (condResult.isError()) {
					return condResult;
				}
				if (condResult.resultType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(condResult.resultType, "boolean").fromExpr(expr.condition);	
				}
				let falseLoc = this.codeBlock.codeJz(0);
				if (variableOffset > 0) {
					this.codeBlock.codePopVoid(variableOffset);
				}
				currentScope.exitLocs[currentScope.exitLocCount] = this.codeBlock.codeJmp(0);
				currentScope.exitLocCount++;
				this.codeBlock.setLoc(falseLoc);
			}
			return new EvalResultIR(EVAL_RESULT_OK, null);
		}
		if (expr.tag === "ast-raise") {
			let raiseResult = this.eval(expr.expr);
			if (raiseResult.isError()) {
				return raiseResult;
			}
			if (raiseResult.resultType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(raiseResult.resultType, "integer").fromExpr(expr.expr);
			}
			this.codeBlock.codeExt(PLW_LOPCODE_RAISE_EXCEPTION);
			return new EvalResultIR(EVAL_RESULT_RAISE, null);
		}
		if (expr.tag === "ast-return") {
			// Eval the returned expression
			let retType = null;
			if (expr.expr !== null) {
				let retResult = this.eval(expr.expr);
				if (retResult.isError()) {
					return retResult;
				}
				retType = retResult.resultType;
			}
			// Find frame scope
			let frameScope = this.scope.findFrame();
			if (frameScope === null || frameScope.isGenerator !== false) {
				return EvalError.unexpectedReturn().fromExpr(expr);
			}
			// Check the return type
			if (retType === null && frameScope.returnType !== null) {
				return EvalError.unexpectedReturnWithoutValue().fromExpr(expr);
			}
			if (retType !== null && frameScope.returnType === null) {
				return EvalError.unexpectedReturnWithValue().fromExpr(expr);
			}
			if (frameScope.returnType === EVAL_TYPE_INFER) {
				frameScope.returnType = retType;
			} else if (retType !== frameScope.returnType) {
				return EvalError.wrongType(retType, frameScope.returnType.typeKey()).fromExpr(expr.expr);
			}
			this.codeBlock.codeRet(retType === null ? 0 : retType.slotCount());
			return new EvalResultIR(EVAL_RESULT_RETURN, null);
		}
		if (expr.tag === "ast-yield") {
			// Check that the frame is a generator
			let frameScope = this.scope.findFrame();
			if (frameScope === null || frameScope.isGenerator !== true) {
				return EvalError.unexpectedYield().fromExpr(expr);
			}
			// Eval the returned expression
			let retResult = this.eval(expr.expr);
			if (retResult.isError()) {
				return retResult;
			}
			// Check the return type
			if (retResult.resultType !== frameScope.returnType) {
				return EvalError.wrongType(retResult.resultType, frameScope.returnType.typeKey()).fromExpr(expr.expr);
			}
			this.codeBlock.codePush(retResult.resultType.slotCount());
			this.codeBlock.codeExt(PLW_LOPCODE_YIELD_GENERATOR_ITEM);
			return new EvalResultIR(EVAL_RESULT_OK, null);
		}
		if (expr.tag === "ast-function-declaration") {
			let parameterList = this.evalParameterList(expr.parameterList);
			if (parameterList.isError(parameterList)) {
				return parameterList;
			}
			let returnType = this.evalType(expr.returnType);
			if (returnType.isError()) {
				return returnType;
			}
			if (parameterList.indexOfAny() !== -1) {
				let macroFunc = new EvalResultMacroFunction(expr.functionName, parameterList, returnType, expr.isGenerator, expr.statement);
				if (this.context.getMacroFunction(macroFunc.functionShortKey(), macroFunc.functionKey()) !== null) {
					return EvalError.functionAlreadyExists(macroFunc.functionKey()).fromExpr(expr);
				}
				this.context.addMacroFunction(macroFunc);
				return new EvalResultIR(EVAL_RESULT_OK, null);
			}
			let evalFunc = new EvalResultFunction(expr.functionName, parameterList, returnType, expr.isGenerator);
			if (this.context.getFunction(evalFunc.functionKey()) !== null) {
				return EvalError.functionAlreadyExists(evalFunc.functionKey()).fromExpr(expr);
			}
			this.context.addFunction(evalFunc);
			{ // begin Compile function
				let oldCodeBlock = this.codeBlock;
				let codeBlockIndex = this.context.addCodeBlock(evalFunc.functionKey());
				this.codeBlock = this.context.codeBlocks[codeBlockIndex];
				evalFunc.codeBlockIndex = codeBlockIndex;
				this.pushScopeFunction(evalFunc.isGenerator, returnType);
				if (evalFunc.isGenerator === true) {
					for (let i = 0; i < parameterList.parameterCount; i++) {
						this.scope.addVariable(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType,
							false
						);
					}
				} else {
					for (let i = 0; i < parameterList.parameterCount; i++) {
						this.scope.addParameter(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType);
					}
					this.scope.endAddParameter();
				}
				let stmtResult = this.evalStatement(expr.statement);
				if (stmtResult.isError()) {
					this.context.removeFunction(evalFunc.functionKey());
					return stmtResult;
				}
				if (evalFunc.isGenerator === true) {
					for (let i = 0; i < returnType.slotCount(); i++) {
						this.codeBlock.codePush(0);
					}
					this.codeBlock.codePush(returnType.slotCount());
					this.codeBlock.codeExt(PLW_LOPCODE_YIELD_GENERATOR_ITEM);
				} else if (stmtResult.resultType !== EVAL_RESULT_RETURN) {
					this.context.removeFunction(evalFunc.functionKey());
					return EvalError.noFunctionReturn(evalFunc.functionKey()).fromExpr(expr.statement);
				}
				if (evalFunc.returnType === EVAL_TYPE_INFER) {
					evalFunc.returnType = this.scope.returnType;
				}
				this.popScope();
				this.codeBlock = oldCodeBlock;
			} // End Compile function
			return new EvalResultIR(EVAL_RESULT_OK, null);
		}
		if (expr.tag === "ast-procedure-declaration") {
			let parameterList = this.evalParameterList(expr.parameterList);
			if (parameterList.isError(parameterList)) {
				return parameterList;
			}
			if (parameterList.indexOfAny() !== -1) {
				let macroProc = new EvalResultMacroProcedure(expr.procedureName, parameterList, expr.statement);
				if (this.context.getMacroProcedure(macroProc.procedureShortKey(), macroProc.procedureKey()) !== null) {
					return EvalError.procedureAlreadyExists(macroProc.procedureKey()).fromExpr(expr);
				}
				this.context.addMacroProcedure(macroProc);
				return new EvalResultIR(EVAL_RESULT_OK, null);
			}			
			let evalProc = new EvalResultProcedure(expr.procedureName, parameterList);
			if (this.context.getProcedure(evalProc.procedureKey()) !== null) {
				return EvalError.procedureAlreadyExists(evalProc.procedureKey()).fromExpr(expr);
			}
			this.context.addProcedure(evalProc);
			{ // begin Compile procedure
				let oldCodeBlock = this.codeBlock;
				let codeBlockIndex = this.context.addCodeBlock(evalProc.procedureKey());
				this.codeBlock = this.context.codeBlocks[codeBlockIndex];
				evalProc.codeBlockIndex = codeBlockIndex;
				this.pushScopeProcedure();
				for (let i = 0; i < parameterList.parameterCount; i++) {
					this.scope.addParameter(
						parameterList.parameters[i].parameterName,
						parameterList.parameters[i].parameterType);
				}
				this.scope.endAddParameter();
				let stmtResult = this.evalStatement(expr.statement);
				if (stmtResult.isError()) {
					this.context.removeProcedure(evalProc.procedureKey());
					return stmtResult;
				}
				this.codeBlock.codeRet(0);
				this.popScope();
				this.codeBlock = oldCodeBlock;
			} // End Compile procedure
			return new EvalResultIR(EVAL_RESULT_OK, null);
		}
		if (expr.tag === "ast-procedure") {
			let argTypes = [];
			let irArgs = [];
			let argSlotCount = 0;
			for (let i = 0; i < expr.argList.argCount; i++) {
				let argResult = this.eval(expr.argList.args[i]);
				if (argResult.isError()) {
					return argResult;
				}
				argTypes[i] = argResult.resultType;
				irArgs[i] = argResult.ir;
				argSlotCount += argResult.resultType.slotCount();
			}
			let procKey = expr.procedureName + "(";
			for (let i = 0; i < expr.argList.argCount; i++) {
				procKey += (i > 0 ? "," : "") + argTypes[i].typeKey();
			}
			procKey += ")";
			let proc = this.context.getProcedure(procKey);
			if (proc === null) {
				let variantIndex = -1;
				for (let i = 0; i < expr.argList.argCount; i++) {
					if (argTypes[i].tag === "res-type-variant") {
						variantIndex = i;
						break;
					}
				}
				if (variantIndex !== -1) {
					let genRes = this.generateVariantDispatchProcedure(expr, argTypes, variantIndex);
					if (genRes.isError()) {
						return genRes.fromExpr(expr);
					}
					proc = this.context.getProcedure(procKey);
				} else {
					let macroProc = this.context.findMacroProcedure(expr.procedureName, argTypes);
					if (macroProc !== null) {
						let genRes = this.generateProcedureFromMacro(expr.procedureName, argTypes, macroProc);
						if (genRes.isError()) {
							return genRes.fromExpr(expr);
						}
					}
					proc = this.context.getProcedure(procKey);
				}
				if (proc === null) {
					return EvalError.unknownProcedure(procKey).fromExpr(expr);
				}
			}
			this.codeBlock.codePush(argSlotCount);
			if (proc.nativeIndex !== -1) {
				this.codeBlock.codeCallNative(proc.nativeIndex);
			} else {
				this.codeBlock.codeCall(proc.codeBlockIndex);
			}
			return new EvalResultIR(EVAL_RESULT_OK, PlwIR.callf(proc.irIndex, irArgs));
		}
		if (expr.tag === "ast-directive") {
			if (expr.text === "suspend") {
				this.codeBlock.codeSuspend();
			}
			return new EvalResultIR(EVAL_RESULT_OK, null);
		}
		return EvalError.unknownType(expr.tag).fromExpr(expr);
	}
	
	evalForMutate(expr) {
		if (expr.tag === "ast-variable") {
			let v = this.scope.getVariable(expr.varName);
			if (v === null) {
				return EvalError.unknownVariable(expr.varName).fromExpr(expr);
			}
			if (v.isConst) {
				return EvalError.cantMutateConst(expr.varName).fromExpr(expr);
			}
			if (v.isGlobal) {
				this.codeBlock.codePushGlobalForMutate(v.offset);
			} else {
				this.codeBlock.codePushLocalForMutate(v.offset);
			}
			if (v.stat !== null) {
				v.stat.addReadLoc(this.codeBlock.currentLoc() - 1, expr);
			}
			return new EvalResultIR(v.varType, null);
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedResult = this.evalForMutate(expr.indexed);
			if (indexedResult.isError()) {
				return indexedResult;
			}
			let structType = indexedResult.resultType.structuralType();
			if (structType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedResut.resultType, "array").fromExpr(expr.indexed);
			}
			if (structType.underlyingType.slotCount() > 1) {
				return EvalError.unassignable(expr.tag).fromExpr(expr);
			}
			// evaluate the index
			let indexResult = this.eval(expr.index);
			if (indexResult.isError()) {
				return indexResult;
			}
			if (indexResult.resultType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexResult.resultType, "integer").fromExpr(expr.index);
			}
			if (expr.indexTo !== null) {
				return EvalError.unassignable(expr.tag).fromExpr(expr);
			}
			// push the result on the stack
			this.codeBlock.codeExt(PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET);
			return new EvalResultIR(structType.underlyingType, null);
		}
		if (expr.tag === "ast-field") {
			let recordResult = this.evalForMutate(expr.expr);
			if (recordResult.isError()) {
				return recordResult;
			}
			let structType = recordResult.resultType.structuralType();
			if (structType.tag != "res-type-record") {
				return EvalError.wrongType(recordResult.resultType, "record").fromExpr(expr.expr);
			}
			let field = structType.getField(expr.fieldName);
			if (field === null) {
				return EvalError.unknownField(expr.fieldName, recordResult.resultType.typeKey()).fromExpr(expr);
			}
			if (field.fieldType.slotCount() > 1) {
				return EvalError.unassignable(expr.tag).fromExpr(expr);
			}
			this.codeBlock.codePush(field.offset);
			this.codeBlock.codeExt(PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET);
			return new EvalResultIR(field.fieldType, null);
		}
		return EvalError.unassignable(expr.tag).fromExpr(expr);
	}
	
	eval(expr, expectedType = null) {
		if (expr.tag === "ast-as") {
			let asType = this.evalType(expr.exprType);
			if (asType.isError()) {
				return asType;
			}
			if (asType === EVAL_TYPE_ANY) {
				return EvalError.wrongType(asType, "not any").fromExpr(expr.exprType);				
			}
			let valueResult = this.eval(expr.expr, asType);
			if (valueResult.isError()) {
				return valueResult;
			}
			if (valueResult.resultType === asType || valueResult.resultType.structuralType() === asType.structuralType()) {
				return new EvalResultIR(asType, null);
			}
			if (asType.structuralType().tag === "res-type-variant" && asType.structuralType().contains(valueResult.resultType)) {
				if (valueResult.resultType.tag !== "res-type-variant") {
					for (let i = 0; i < asType.structuralType().slotCount() - valueResult.resultType.slotCount() - 1; i++) {
						this.codeBlock.codePush(0);
					}
					this.codeBlock.codePush(valueResult.resultType.globalId);
				}
				return new EvalResultIR(asType, null);
			}
			return EvalError.wrongType(valueResult.resultType, asType.typeKey()).fromExpr(expr.expr);				
		}
		if (expr.tag === "ast-value-boolean") {
			this.codeBlock.codePush(expr.boolValue ? 1 : 0);
			return new EvalResultIR(EVAL_TYPE_BOOLEAN, PlwIR.i32(expr.boolValue ? 1 : 0));
		}
		if (expr.tag === "ast-null") {
			return new EvalResultIR(EVAL_TYPE_NULL, null);
		}
		if (expr.tag === "ast-value-integer") {
			this.codeBlock.codePush(expr.intValue);
			return new EvalResultIR(EVAL_TYPE_INTEGER, PlwIR.i64(expr.intValue));
		}
		if (expr.tag === "ast-value-real") {
			let floatId = this.codeBlock.addFloatConst(expr.realValue);
			this.codeBlock.codePushf(floatId);
			return new EvalResultIR(EVAL_TYPE_REAL, null);
		}
		if (expr.tag === "ast-value-text") {
			if (expectedType === EVAL_TYPE_CHAR && expr.textValue.length === 1) {
				this.codeBlock.codePush(expr.textValue.charCodeAt(0));
				return new EvalResultIR(EVAL_TYPE_CHAR, null);
			}
			let strId = this.codeBlock.addStrConst(expr.textValue);
			this.codeBlock.codePush(strId);
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_STRING);
			let ir = PlwIR.createArrayRef(EVAL_TYPE_TEXT.irTypes[0], expr.textValue.length, []);
			for (let i = 0; i < expr.textValue.length; i++) {
				ir.exprs.push(PlwIR.i32(expr.textValue.charCodeAt(i)));
			}
			return new EvalResultIR(EVAL_TYPE_TEXT, ir);
		}
		if (expr.tag === "ast-value-tuple") {
			let itemTypes = [];
			for (let i = 0; i < expr.itemCount; i++) {
				let itemResult = this.eval(expr.items[i]);
				if (itemResult.isError()) {
					return itemResult;
				}
				itemTypes[i] = itemResult.resultType;
			}
			return new EvalResultIR(this.addType(new EvalTypeTuple(expr.itemCount, itemTypes)), null);
		}
		if (expr.tag === "ast-value-array") {
			if (expr.itemCount === 0) {
				if (expectedType === null) {
					return EvalError.emptyArrayMustBeTyped().fromExpr(expr);
				} else {
					if (expectedType.structuralType().tag !== "res-type-array") {
						return EvalError.wrongType(expectedType, "array").fromExpr(expr);				
					}
					this.codeBlock.codePush(0);
					this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB);
					return new EvalResultIR(expectedType, null);
				}
			}
			let itemType = null;
			// Evalute the next items
			for (let i = 0; i < expr.itemCount; i++) {
				let currentItemResult = this.eval(expr.items[i]);
				if (currentItemResult.isError()) {
					return currentItemResult;
				}
				if (itemType === null) {
					itemType = currentItemResult.resultType;
				} else if (currentItemResult.resultType !== itemType) {
					return EvalError.wrongType(currentItemResult.resultType, itemType.typeKey()).fromExpr(expr.items[i]);
				}
			}
			// Allocate the array
			this.codeBlock.codePush(expr.itemCount * itemType.slotCount());
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB);
			return new EvalResultIR(this.addType(new EvalTypeArray(itemType)), null);
		}
		if (expr.tag === "ast-value-record") {
			let fields = [];
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldValueResult = this.eval(expr.fields[i].valueExpr);
				if (fieldValueResult.isError()) {
					return fieldValueResult;
				}
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldValueResult.resultType);
			}
			let recordType = this.addType(new EvalTypeRecord(expr.fieldCount, fields));
			this.codeBlock.codePush(recordType.fieldSlotCount);
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB);
			return new EvalResultIR(recordType, null);
		}
		if (expr.tag === "ast-template") {
			for (let i = 0; i < expr.exprCount; i++) {
				let exprResult = this.eval(expr.exprs[i]);
				if (exprResult.isError()) {
					return exprResult;
				}
				if (exprResult.resultType !== EVAL_TYPE_TEXT) {
					let convType = this.generateFunctionCall("text", 1, [exprResult.resultType], EVAL_TYPE_TEXT);
					if (convType.isError()) {
						return convType;
					}
					if (convType !== EVAL_TYPE_TEXT) {
						return EvalError.wrongType(exprType, "text").fromExpr(expr.exprs[i]);
					}
				}
			}
			if (expr.exprCount > 0) {
				this.codeBlock.codePush(expr.exprCount);
				this.codeBlock.codeExt(PLW_LOPCODE_CONCAT_STRING);				
			}
			return new EvalResultIR(EVAL_TYPE_TEXT, null);
		}
		if (expr.tag === "ast-concat") {
			let firstItemType = null;
			let ir = null;
			for (let i = 0; i < expr.itemCount; i++) {
				let itemResult = this.eval(expr.items[i]);
				if (itemResult.isError()) {
					return itemResult;
				}
				if (itemResult.resultType.structuralType() !== EVAL_TYPE_TEXT &&
					itemResult.resultType.structuralType().tag !== "res-type-array"
				) {
					return EvalError.wrongType(itemResult.resultType, "text or array").fromExpr(expr.items[i]);
				}
				if (i === 0) {
					firstItemType = itemResult.resultType;
				} else if (firstItemType !== itemResult.resultType) {
					return EvalError.wrongType(itemResult.resultType, firstItemType.typeKey()).fromExpr(expr.items[i]);
				}
				if (i  === 0) {
					ir = itemResult.ir;
				} else {
					ir = PlwIR.concatArray(ir, itemResult.ir, firstItemType.irTypes[0]);
				}
			}
			this.codeBlock.codePush(expr.itemCount);
			if (firstItemType.structuralType() === EVAL_TYPE_TEXT) {
				this.codeBlock.codeExt(PLW_LOPCODE_CONCAT_STRING);
			} else {
				this.codeBlock.codeExt(PLW_LOPCODE_CONCAT_BLOB);
			}
			return new EvalResultIR(firstItemType, ir);
		}
		if (expr.tag === "ast-operator-binary") {
			if (expr.operator === TOK_AND || expr.operator === TOK_OR) {
				let leftResult = this.eval(expr.left);
				if (leftResult.isError()) {
					return leftResult;
				}
				if (leftResult.resultType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(leftResult.resultType, "boolean").fromExpr(expr.left);
				}
				let skipLoc = expr.operator === TOK_AND ? this.codeBlock.codeJz(0) : this.codeBlock.codeJnz(0);
				let rightResult = this.eval(expr.right);
				if (rightResult.isError()) {
					return rightResult;
				}
				if (rightResult.resultType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(rightResult.resultType, "boolean").fromExpr(expr.right);
				}
				let endLoc = this.codeBlock.codeJmp(0);
				this.codeBlock.setLoc(skipLoc);
				this.codeBlock.codePush(expr.operator === TOK_AND ? 0 : 1);
				this.codeBlock.setLoc(endLoc);
				let ir = null;
				if (expr.operator === TOK_AND) {
					ir = PlwIR.iff(leftResult.ir, rightResult.ir, PlwIR.i32(0), [PLW_IR_TYPE_I32]);
				} else {
					ir = PlwIR.iff(leftResult.ir, PlwIR.i32(1), rightResult.ir, [PLW_IR_TYPE_I32]);
				}
				return new EvalResultIR(EVAL_TYPE_BOOLEAN, ir);
			}
			if (expr.operator === TOK_TIMES) {
				let leftResult = this.eval(expr.left);
				if (leftResult.isError()) {
					return leftResult;
				}
				let rightResult = this.eval(expr.right);
				if (rightResult.isError()) {
					return rightResult;
				}
				if (rightResult.resultType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(rightResult.resultType, "integer").fromExpr(expr.right);
				}
				this.codeBlock.codePush(leftResult.resultType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB_REPEAT_ITEM);
				return new EvalResultIR(this.addType(new EvalTypeArray(leftResult.resultType)), null);
			}
			if (expr.operator === TOK_REM) {
				let leftResult = this.eval(expr.left);
				if (leftResult.isError()) {
					return leftResult;
				}
				if (leftResult.resultType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(leftResult.resultType, "integer").fromExpr(expr.left);
				}
				let rightResult = this.eval(expr.right);
				if (rightResult.isError()) {
					return rightResult;
				}
				if (rightResult.resultType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(rightResult.resultType, "integer").fromExpr(expr.right);
				}
				this.codeBlock.codeRem();
				return new EvalResultIR(EVAL_TYPE_INTEGER, PlwIR.binOp(PLW_IR_OP_I64_REM, leftResult.ir, rightResult.ir));
			}
			if (
				expr.operator === TOK_ADD || expr.operator === TOK_SUB ||
				expr.operator === TOK_DIV || expr.operator === TOK_MUL ||
				expr.operator === TOK_GT || expr.operator === TOK_LT ||
				expr.operator === TOK_GTE || expr.operator === TOK_LTE
			) {
				let leftResult = this.eval(expr.left);
				if (leftResult.isError()) {
					return leftResult;
				}
				if (leftResult.resultType !== EVAL_TYPE_INTEGER && leftResult.resultType !== EVAL_TYPE_REAL) {
					return EvalError.wrongType(leftResult.resultType, "integer or real").fromExpr(expr.left);
				}
				let rightResult = this.eval(expr.right);
				if (rightResult.isError()) {
					return rightResult;
				}
				if (rightResult.resultType !== leftResult.resultType) {
					return EvalError.wrongType(rightResult.resultType, leftResult.resultType.typeKey()).fromExpr(expr.right);
				}
				let irOp = -1;
				if (leftResult.resultType === EVAL_TYPE_INTEGER) {
					if (expr.operator === TOK_ADD) {
						this.codeBlock.codeAdd();
						irOp = PLW_IR_OP_I64_ADD;
					} else if (expr.operator === TOK_SUB) {
						this.codeBlock.codeSub();
						irOp = PLW_IR_OP_I64_SUB;
					} else if (expr.operator === TOK_DIV) {
						this.codeBlock.codeDiv();
						irOp = PLW_IR_OP_I64_DIV;
					} else if (expr.operator === TOK_MUL) {
						this.codeBlock.codeMul();
						irOp = PLW_IR_OP_I64_MUL;
					} else if (expr.operator === TOK_GT) {
						this.codeBlock.codeGt();
						irOp = PLW_IR_OP_I64_GT;
					} else if (expr.operator === TOK_LT) {
						this.codeBlock.codeLt();
						irOp = PLW_IR_OP_I64_LT;
					} else if (expr.operator === TOK_GTE) {
						this.codeBlock.codeGte();
						irOp = PLW_IR_OP_I64_GTE;
					} else {
						this.codeBlock.codeLte();
						irOp = PLW_IR_OP_I64_LTE;
					}
				} else {
					if (expr.operator === TOK_ADD) {
						this.codeBlock.codeAddf();
					} else if (expr.operator === TOK_SUB) {
						this.codeBlock.codeSubf();
					} else if (expr.operator === TOK_DIV) {
						this.codeBlock.codeDivf();
					} else if (expr.operator === TOK_MUL) {
						this.codeBlock.codeMulf();
					} else if (expr.operator === TOK_GT) {
						this.codeBlock.codeGtf();
					} else if (expr.operator === TOK_LT) {
						this.codeBlock.codeLtf();
					} else if (expr.operator === TOK_GTE) {
						this.codeBlock.codeGtef();
					} else {
						this.codeBlock.codeLtef();
					}
				}
				if (
					expr.operator === TOK_ADD || expr.operator === TOK_SUB ||
					expr.operator === TOK_DIV || expr.operator === TOK_MUL
				) {
					return new EvalResultIR(leftResult.resultType, PlwIR.binOp(irOp, leftResult.ir, rightResult.ir));
				}
				return new EvalResultIR(EVAL_TYPE_BOOLEAN, PlwIR.binOp(irOp, leftResult.ir, rightResult.ir));
			}
			if (expr.operator === TOK_IN) {
				let leftResult = this.eval(expr.left);
				if (leftResult.isError()) {
					return leftResult;
				}
				let rightResult = this.eval(expr.right);
				if (rightResult.isError()) {
					return rightResult;
				}
				if (rightResult.resultType.structuralType().tag !== "res-type-array") {
					return EvalError.wrongType(rightResult.resultType, "array").fromExpr(expr.right);
				}
				if (leftResult.resultType !== rightResult.resultType.structuralType().underlyingType) {
					return EvalError.wrongType(leftResult.resultType,
						rightResult.resultType.structuralType().underlyingType.typeKey()).fromExpr(expr.left);
				}
				this.codeBlock.codePush(leftResult.resultType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_GET_BLOB_INDEX_OF_ITEM);
				this.codeBlock.codePush(-1);
				this.codeBlock.codeEq(1);
				this.codeBlock.codeNot();				
				return new EvalResultIR(EVAL_TYPE_BOOLEAN, null);
			}
			if (expr.operator === TOK_EQ || expr.operator === TOK_NE) {
				let leftResult = this.eval(expr.left);
				if (leftResult.isError()) {
					return leftResult;
				}
				let rightResult = this.eval(expr.right, leftResult.resultType);
				if (rightResult.isError()) {
					return rightResult;
				}
				if (rightResult.resultType !== leftResult.resultType) {
					return EvalError.wrongType(rightResult.resultType, leftResult.resultType.typeKey()).fromExpr(expr.right);
				}
				this.codeBlock.codeEq(leftResult.resultType.slotCount());				
				if (expr.operator === TOK_NE) {
					this.codeBlock.codeNot();
				}
				let ir = null;
				if (leftResult.resultType.irTypes.length == 1) {
					let irTypeId = leftResult.resultType.irTypes[0];
					if (irTypeId === PLW_IR_TYPE_I32) {
						ir = PlwIR.binOp(expr.operator === TOK_EQ ? PLW_IR_OP_I32_EQ : PLW_IR_OP_I32_NE, leftResult.ir, rightResult.ir);
					} else if (irTypeId === PLW_IR_TYPE_I64) {
						ir = PlwIR.binOp(expr.operator === TOK_EQ ? PLW_IR_OP_I64_EQ : PLW_IR_OP_I64_NE, leftResult.ir, rightResult.ir);
					} else if (irTypeId === PLW_IR_TYPE_F64) {
						ir = PlwIR.binOp(expr.operator === TOK_EQ ? PLW_IR_OP_F64_EQ : PLW_IR_OP_F64_NE, leftResult.ir, rightResult.ir);
					} else if (PlwIRUtil.isRef(irTypeId)) {
						ir = PlwIR.refEq(leftResult.ir, rightResult.ir, irTypeId);
						if (expr.operator === TOK_NE) {
							return new EvalError.todo("Manage ne for ir type " + irTypeId).fromExpr(expr);
						}
					} else {
						return new EvalError.todo("Manage eq for ir type " + irTypeId).fromExpr(expr);
					}
				} else {
					return new EvalError.todo("Manage eq for irtypes " + leftResult.resultType.irTypes).fromExpr(expr);
				}
				return new EvalResultIR(EVAL_TYPE_BOOLEAN, ir);
			}
			return EvalError.unknownBinaryOperator(expr.operator).fromExpr(expr);
		}
		if (expr.tag === "ast-operator-unary") {
			let operandResult = this.eval(expr.operand);
			if (operandResult.isError()) {
				return operandResult;
			}
			if (expr.operator === TOK_NOT) {
				if (operandResult.resultType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(operandResult.resultType, "boolean").fromExpr(expr.operand);
				}
				this.codeBlock.codeNot();
				return new EvalResultIR(EVAL_TYPE_BOOLEAN, null);
			}
			if (expr.operator === TOK_SUB) {
				if (operandResult.resultType !== EVAL_TYPE_INTEGER && operandResult.resultType !== EVAL_TYPE_REAL) {
					return EvalError.wrongType(operandResult.resultType, "integer or real").fromExpr(expr.operand);
				}
				if (operandResult.resultType === EVAL_TYPE_INTEGER) {
					this.codeBlock.codeNeg();
				} else {
					this.codeBlock.codeNegf();
				}
				return new EvalResultIR(operandResult.resultType, null);
			}
			return EvalError.unknownUnaryOperator(expr.operator).fromExpr(expr);
		}
		if (expr.tag === "ast-variable") {
			let v = this.scope.getVariable(expr.varName);
			if (v === null) {
				return EvalError.unknownVariable(expr.varName).fromExpr(expr);
			}
			for (let i = 0; i < v.varType.slotCount(); i++) {
				if (v.isGlobal) {
					this.codeBlock.codePushGlobal(v.offset + i);
				} else {
					this.codeBlock.codePushLocal(v.offset + i);
				}
			}
			if (v.stat !== null) {
				v.stat.addReadLoc(this.codeBlock.currentLoc() - 1, expr);
			}
			let ir = [];
			for (let i = 0; i < v.varType.irTypes.length; i++) {
				ir[i] = PlwIR.variable(v.isGlobal, v.irIndex + i);
			}
			return new EvalResultIR(v.varType, PlwIR.block(ir));
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedResult = this.eval(expr.indexed);
			if (indexedResult.isError()) {
				return indexedResult;
			}
			let structType = indexedResult.resultType.structuralType();
			if (structType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedResult.resultType, "array").fromExpr(expr.indexed);
			}
			let itemType = structType.underlyingType;
			// evaluate the index
			let indexResult = this.eval(expr.index);
			if (indexResult.isError()) {
				return indexResult;
			}
			if (indexResult.resultType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexResult.resultType, "integer").fromExpr(expr.index);
			}
			if (itemType.slotCount() > 1) {
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeMul();
			}
			if (expr.indexTo === null) {
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_READ_BLOB);
				return new EvalResultIR(itemType, null);	
			}
			// indexTo is not null, we have a range index
			let indexToResult = this.eval(expr.indexTo);
			if (indexToResult.isError()) {
				return indexToResult;
			}
			if (indexToResult.resultType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexToResult.resultType, "integer").fromExpr(expr.indexTo);
			}
			this.codeBlock.codePush(1);
			this.codeBlock.codeAdd();
			if (itemType.slotCount() > 1) {
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeMul();
			}
			this.codeBlock.codeExt(PLW_LOPCODE_SLICE_BLOB);
			return new EvalResultIR(indexedResult.resultType, null);
		}		
		if (expr.tag === "ast-field") {
			let recordResult = this.eval(expr.expr);
			if (recordResult.isError()) {
				return recordResult;
			}
			let structType = recordResult.resultType.structuralType();
			if (structType.tag != "res-type-record") {
				return EvalError.wrongType(recordResult.resultType, "record").fromExpr(expr.expr);
			}
			let field = structType.getField(expr.fieldName);
			if (field === null) {
				return EvalError.unknownField(expr.fieldName, recordResult.resultType.typeKey()).fromExpr(expr);
			}
			this.codeBlock.codePush(field.offset);
			this.codeBlock.codePush(field.fieldType.slotCount());
			this.codeBlock.codeExt(PLW_LOPCODE_READ_BLOB);
			return new EvalResultIR(field.fieldType, null);
		}
		if (expr.tag === "ast-function") {
			let argTypes = [];
			let irArgs = [];
			for (let i = 0; i < expr.argList.argCount; i++) {
				let argResult = this.eval(expr.argList.args[i]);
				if (argResult.isError()) {
					return argResult;
				}
				argTypes[i] = argResult.resultType;
				irArgs[i] = argResult.ir;
			}
			let result = this.generateFunctionCall(expr.functionName, expr.argList.argCount, argTypes, expectedType, irArgs);
			if (result.isError()) {
				return result.fromExpr(expr);
			}
			return result;
		}
		if (expr.tag === "ast-case") {
			let caseType = null;
			if (expr.caseExpr !== null) {
				let caseResult = this.eval(expr.caseExpr);
				if (caseResult.isError()) {
					return caseResult;
				}
				caseType = caseResult.resultType;
			}
			let endLocs = [];
			let endLocCount = 0;
			let resultType = null;
			for (let i = 0; i < expr.whenCount; i++) {
				if (caseType !== null) {
					this.codeBlock.codeDup(caseType.slotCount());
					let whenResult = this.eval(expr.whens[i].whenExpr);
					if (whenResult.isError()) {
						return whenResult;
					}
					if (whenResult.resultType !== caseType) {
						return EvalError.wrongType(whenResult.resultType, caseType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					this.codeBlock.codeEq(caseType.slotCount());
					let nextLoc = this.codeBlock.codeJz(0);
					this.codeBlock.codePopVoid(caseType.slotCount());
					let thenResult = this.eval(expr.whens[i].thenExpr);
					if (thenResult.isError()) {
						return thenResult;
					}
					if (resultType === null) {
						resultType = thenResult.resultType;
					} else if (thenResult.resultType !== resultType) {
						return EvalError.wrongType(thenResult.resultType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					endLocs[endLocCount] = this.codeBlock.codeJmp(0);
					endLocCount++;
					this.codeBlock.setLoc(nextLoc);
				} else {
					let whenResult = this.eval(expr.whens[i].whenExpr);
					if (whenResult.isError()) {
						return whenResult;
					}
					if (whenResult.resultType !== EVAL_TYPE_BOOLEAN) {
						return EvalError.wrongType(whenResult.resultType, "boolean").fromExpr(expr.whens[i].whenExpr);
					}
					let nextLoc = this.codeBlock.codeJz(0);
					let thenResult = this.eval(expr.whens[i].thenExpr);
					if (thenResult.isError()) {
						return thenResult;
					}
					if (resultType === null) {
						resultType = thenResult.resultType;
					} else if (thenResult.resultType !== resultType) {
						return EvalError.wrongType(thenResult.resultType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					endLocs[endLocCount] = this.codeBlock.codeJmp(0);
					endLocCount++;
					this.codeBlock.setLoc(nextLoc);
				}		
			}
			if (caseType !== null) {
				this.codeBlock.codePopVoid(caseType.slotCount());
			}
			let elseResult = this.eval(expr.elseExpr);
			if (elseResult.isError()) {
				return elseResult;
			}
			if (resultType === null) {
				resultType = elseResult.resultType;
			} else if (elseResult.resultType !== resultType) {
				return EvalError.wrongType(elseResult.resultType, resultType.typeKey()).fromExpr(expr.elseExpr);
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return new EvalResultIR(resultType, null);
		}
		if (expr.tag === "ast-kindof") {
			let caseResult = this.eval(expr.caseExpr);
			if (caseResult.isError()) {
				return caseResult;
			}
			if (caseResult.resultType.structuralType().tag !== "res-type-variant") {
				return EvalError.wrongType(caseResult.resultType, "variant").fromExpr(expr.caseExpr);
			}
			let endLocs = [];
			let endLocCount = 0;
			let resultType = null;
			let kindHasWhen = [];
			for (let i = 0; i < caseResult.resultType.structuralType().typeCount; i++) {
				kindHasWhen[i] = false;
			}
			for (let i = 0; i < expr.whenCount; i++) {
				// Duplicate the last slot of the variant which is the variantType
				this.codeBlock.codeDup(1);
				let whenType = this.evalType(expr.whens[i].type);
				if (whenType.isError()) {
					return whenType;
				}
				let typeIndex = caseResult.resultType.structuralType().types.indexOf(whenType);
				if (typeIndex === -1) {
					return EvalError.unknownVariantKind(whenType.typeKey()).fromExpr(expr.whens[i]);
				}
				if (kindHasWhen[typeIndex] === true) {
					return EvalError.variantKindAlreadyManaged(whenType.typeKey()).fromExpr(expr.whens[i]);
				}
				kindHasWhen[typeIndex] = true;
				// Duplicate the last slot of the variant which is the variantType
				this.codeBlock.codePush(whenType.globalId);
				this.codeBlock.codeEq(1);
				// If false, loop
				let nextLoc = this.codeBlock.codeJz(0);
				// If true, resize the variant type to the actual type size
				this.codeBlock.codePopVoid(caseResult.resultType.slotCount() - whenType.slotCount());
				this.pushScopeBlock();
				this.scope.addVariable(expr.whens[i].varName, whenType, true);
				let thenResult = this.eval(expr.whens[i].thenExpr);
				if (thenResult.isError()) {
					return thenResult;
				}
				if (resultType === null) {
					resultType = thenResult.resultType;
				} else if (thenResult.resultType !== resultType) {
					return EvalError.wrongType(thenResult.resultType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
				}
				// Replace the when var with the then value, and pop the when var
				this.codeBlock.codeSwap(whenType.slotCount() + thenResult.resultType.slotCount());
				this.codeBlock.codePopVoid(whenType.slotCount());
				if (thenResult.resultType.slotCount() > 1) {
					this.codeBlock.codeSwap(thenResult.resultType.slotCount());
				}
				this.popScope();
				// We are done, goto end
				endLocs[endLocCount] = this.codeBlock.codeJmp(0);
				endLocCount++;
				this.codeBlock.setLoc(nextLoc);
			}
			// No match, we still have the case var on the stack, we pop it
			this.codeBlock.codePopVoid(caseResult.resultType.slotCount());
			// If there is no else expression, we check that all the kind where managed
			// Otherwise we evaluate the else expression
			if (expr.elseExpr === null) {
				for (let i = 0; i < caseResult.resultType.structuralType().typeCount; i++) {
					if (kindHasWhen[i] === false) {
						return EvalError.variantKindNotManaged(caseResult.resultType.structuralType().types[i].typeKey()).fromExpr(expr);
					}
				}
			} else {
				let elseResult = this.eval(expr.elseExpr);
				if (elseResult.isError()) {
					return elseResult;
				}
				if (resultType === null) {
					resultType = elseResult;
				} else if (elseResult.resultType !== resultType) {
					return EvalError.wrongType(elseResult.resultType, resultType.typeKey()).fromExpr(expr.elseExpr);
				}
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return new EvalResultIR(resultType, null);
		}
		return EvalError.unknownType(expr.tag).fromExpr(expr);
	}
	
	evalParameter(expr) {
		if (expr.tag !== "ast-parameter") {
			return EvalError.unknownType(expr.tag).fromExpr(expr);
		}
		let paramType = this.evalType(expr.parameterType);
		if (paramType.isError()) {
			return paramType;
		}
		return new EvalResultParameter(expr.parameterName, paramType);
	}
	
	evalParameterList(expr) {
		if (expr.tag !== "ast-parameter-list") {
			return EvalError.unknownType(expr.tag).fromExpr(expr);
		}
		let parameters = [];
		for (let i = 0; i < expr.parameterCount; i++) {
			let parameter = this.evalParameter(expr.parameters[i]);
			if (parameter.isError()) {
				return parameter;
			}
			for (let k = 0; k < i; k++) {
				if (parameters[k].parameterName === parameter.parameterName) {
					return EvalError.parameterAlreadyExists(parameter.parameterName).fromExpr(expr.parameters[i]);
				}
			}
			parameters[i] = parameter;
		}
		return new EvalResultParameterList(expr.parameterCount, parameters);
	}

}

