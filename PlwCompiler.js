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

class EvalResultType extends EvalResult {
	constructor(tag, isRef) {
		super(tag);
		this.isRef = isRef;
		this.key = null;
		this.globalId = 0;
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
	constructor(typeName, isRef) {
		super("res-type-built-in", isRef);
		this.typeName = typeName;
		this.key = typeName;
	}
	
	toAst() {
		return new AstTypeNamed(this.typeName);
	}
}

const EVAL_TYPE_NULL = new EvalTypeNull();
const EVAL_TYPE_EXCEPTION_HANDLER = new EvalTypeBuiltIn("_exception_handler", true);
const EVAL_TYPE_INFER = new EvalTypeBuiltIn("_infer", false);
const EVAL_TYPE_ANY = new EvalTypeBuiltIn("any", false);
const EVAL_TYPE_INTEGER = new EvalTypeBuiltIn("integer", false);
const EVAL_TYPE_REAL = new EvalTypeBuiltIn("real", false);
const EVAL_TYPE_BOOLEAN = new EvalTypeBuiltIn("boolean", false);
const EVAL_TYPE_TEXT = new EvalTypeBuiltIn("text", true);

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
	}
	
	static fromNative(functionName, parameterList, returnType, nativeIndex) {
		let nativeFunc = new EvalResultFunction(functionName, parameterList, returnType, false);
		nativeFunc.nativeIndex = nativeIndex;
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
	}
	
	static fromNative(procedureName, parameterList, nativeIndex) {
		let nativeProc = new EvalResultProcedure(procedureName, parameterList);
		nativeProc.nativeIndex = nativeIndex;
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
		this.globalScope = CompilerScope.makeGlobal();
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
	}		
}

class CompilerScope {

	static makeGlobal() {
		return new CompilerScope(null, false, false, false, null);
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
	
	generateFunctionCall(functionName, argCount, argTypes, expectedType = null) {
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
		return func.isGenerator ? this.addType(new EvalTypeSequence(func.returnType)) : func.returnType;
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
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-variable-declaration") {
			for (let i = 0; i < expr.varNameCount; i++) {
				if (this.scope.getLocalVariable(expr.varNames[i]) !== null) {
					return EvalError.variableAlreadyExists(expr.varNames[i]).fromExpr(expr);
				}
			}
			let initValueType = this.eval(expr.valueExpr);
			if (initValueType.isError()) {
				return initValueType;
			}
			if (expr.varNameCount === 1) {
				this.scope.addVariable(expr.varNames[0], initValueType, expr.isConst);
				return EVAL_RESULT_OK;
			}
			let initStructType = initValueType.structuralType();
			if (initStructType.tag !== "res-type-tuple") {
				return EvalError.wrongType(initValueType, "tuple").fromExpr(expr.valueExpr);
			}					
			if (expr.varNameCount !== initStructType.typeCount) {
				return EvalError.tupleSizeMismatch(expr.varNameCount, initStructType.typeCount).fromExpr(expr.valueExpr);
			}
			for (let i = 0; i < expr.varNameCount; i++) {
				this.scope.addVariable(expr.varNames[i], initStructType.types[i], expr.isConst);
			}
			return EVAL_RESULT_OK;
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
				let valueType = this.eval(expr.right, variable.varType);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== variable.varType) {
					return EvalError.wrongType(valueType, variable.varType.typeKey()).fromExpr(expr.right);					
				}
				// assign the value
				if (variable.isGlobal) {
					for (let i = valueType.slotCount() - 1; i >= 0; i--) { 
						this.codeBlock.codePopGlobal(variable.offset + i);
					}
				} else {
					for (let i = valueType.slotCount() - 1; i >= 0; i--) { 
						this.codeBlock.codePopLocal(variable.offset + i);
					}
				}
				if (variable.stat !== null) {
					variable.stat.addReset();
				}
				return EVAL_RESULT_OK;
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
				let valueType = this.eval(expr.right, tupleType);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== tupleType) {
					return EvalError.wrongType(valueType.types[i], variables[i].varType.typeKey()).fromExpr(expr.right);					
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
				return EVAL_RESULT_OK;				
			}
			if (expr.left.tag === "ast-index") {
				let indexExpr = expr.left;
				// Evaluate the indexed ptr
				let indexedType = this.evalForMutate(indexExpr.indexed);
				if (indexedType.isError()) {
					return indexedType;
				}
				let structType = indexedType.structuralType();
				if (structType.tag !== "res-type-array") {
					return EvalError.wrongType(indexedType, "array").fromExpr(indexExpr.indexed);
				}
				let itemType = structType.underlyingType;
				// Evaluate the index
				let indexType = this.eval(indexExpr.index);
				if (indexType.isError()) {
					return indexType;
				}
				if (indexType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(indexType, "integer").fromExpr(indexExpr.index);
				}
				if (indexExpr.indexTo !== null) {
					return EvalError.unassignable(indexExpr.tag).fromExpr(indexExpr);
				}
				if (itemType.slotCount() > 1) {
					this.codeBlock.codePush(itemType.slotCount());
					this.codeBlock.codeMul();
				}
				// Evaluate the value to assign
				let valueType = this.eval(expr.right, itemType);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== itemType) {
					return EvalError.wrongType(valueType, itemType.typeKey()).fromExpr(expr.right);
				}
				// Assign the value
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_WRITE_BLOB);
				return EVAL_RESULT_OK;
			}
			if (expr.left.tag === "ast-field") {
				let fieldExpr = expr.left;
				// evaluate the record
				let recordType = this.evalForMutate(fieldExpr.expr);
				if (recordType.isError()) {
					return recordType;
				}
				let structType = recordType.structuralType();
				if (structType.tag != "res-type-record") {
					return EvalError.wrongType(recordType, "record").fromExpr(fieldExpr.expr);
				}
				// push the offset of the field
				let field = structType.getField(fieldExpr.fieldName);
				if (field === null) {
					return EvalError.unknownField(fieldExpr.fieldName, recordType.typeKey()).fromExpr(fieldExpr);
				}
				this.codeBlock.codePush(field.offset);
				// Evaluate the value to assign
				let valueType = this.eval(expr.right, field.fieldType);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== field.fieldType) {
					return EvalError.wrongType(valueType, field.fieldType.typeKey()).fromExpr(expr.right);
				}
				// Assigne the value
				this.codeBlock.codePush(field.fieldType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_WRITE_BLOB);
				return EVAL_RESULT_OK;
			}
			return EvalError.unassignable(expr.left.tag).fromExpr(expr.left);
		}
		if (expr.tag == "ast-block") {
			let ret = EVAL_RESULT_OK;
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
				ret = this.evalStatement(expr.statements[i]);
				if (ret.isError()) {
					return ret;
				}
			}
			if (ret === EVAL_RESULT_OK) {
				if (this.scope.variableOffset > 0) {
					this.codeBlock.codePopVoid(this.scope.variableOffset);
				}
			}
			this.popScope();
			if (expr.exception === null) {
				return ret;
			}
			let endLoc = -1;
			if (ret === EVAL_RESULT_OK) {
				endLoc = this.codeBlock.codeJmp(0);
			}
			this.codeBlock.setLoc(exceptionLoc);
			this.scope.clearVarStatTmp();
			let exRet = this.evalStatement(expr.exception);
			if (exRet.isError()) {
				return exRet;
			}
			this.scope.clearVarStatTmp();
			if (endLoc !== -1) {
				this.codeBlock.setLoc(endLoc);
			}
			if (ret === EVAL_RESULT_RAISE) {
				return exRet;
			}
			if (ret === EVAL_RESULT_RETURN && exRet !== EVAL_RESULT_OK) {
				return ret;
			}
			return EVAL_RESULT_OK;
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
				let whenType = this.eval(whenStmt.whenExpr);
				if (whenType.isError()) {
					return whenType;
				}
				if (whenType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(whenType, "integer").fromExpr(whenStmt.whenExpr);	
				}
				this.codeBlock.codeEq(whenType.slotCount());
				let nextLoc = this.codeBlock.codeJz(0);
				this.scope.clearVarStatTmp();
				let stmtRes = this.evalStatement(whenStmt.statement);
				if (stmtRes.isError()) {
					return stmtRes;
				}
				this.scope.clearVarStatTmp();
				if (
					(ret === null || stmtRes === EVAL_RESULT_OK) ||
					(stmtRes === EVAL_RESULT_RETURN && ret === EVAL_RESULT_RAISE)
				) {
					ret = stmtRes;
				}
				if (stmtRes == EVAL_RESULT_OK) {
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
				let stmtRes = this.evalStatement(expr.defaultStmt);
				if (stmtRes.isError()) {
					return stmtRes;
				}
				this.scope.clearVarStatTmp();
				if (
					(ret === null || stmtRes === EVAL_RESULT_OK) ||
					(stmtRes === EVAL_RESULT_RETURN && ret === EVAL_RESULT_RAISE)
				) {
					ret = stmtRes;
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
			return ret;
		}
		if (expr.tag === "ast-if") {
			let condType = this.eval(expr.condition);
			if (condType.isError()) {
				return condType;
			}
			if (condType !== EVAL_TYPE_BOOLEAN) {
				return EvalError.wrongType(condType, "boolean").fromExpr(expr.condition);	
			}
			let falseLoc = this.codeBlock.codeJz(0);
			this.scope.clearVarStatTmp();
			let trueRet =  this.evalStatement(expr.trueStatement);
			if (trueRet.isError()) {
				return trueRet;
			}
			this.scope.clearVarStatTmp();
			let endLoc = expr.falseStatement === null ? -1 : this.codeBlock.codeJmp(0);
			this.codeBlock.setLoc(falseLoc);
			if (expr.falseStatement === null) {
				return EVAL_RESULT_OK;
			}
			let falseRet = this.evalStatement(expr.falseStatement);
			if (falseRet.isError()) {
				return falseRet;
			}
			this.scope.clearVarStatTmp();
			this.codeBlock.setLoc(endLoc);
			if (trueRet === EVAL_RESULT_RAISE && falseRet === EVAL_RESULT_RAISE) {
				return EVAL_RESULT_RAISE; 
			}
			if (
				(trueRet === EVAL_RESULT_RETURN && falseRet !== EVAL_RESULT_OK) ||
				(falseRet === EVAL_RESULT_RETURN && trueRet !== EVAL_RESULT_OK)
			) {
				return EVAL_RESULT_RETURN;
			}
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-kindof-stmt") {
			let caseType = this.eval(expr.caseExpr);
			if (caseType.isError()) {
				return caseType;
			}
			if (caseType.structuralType().tag !== "res-type-variant") {
				return EvalError.wrongType(caseType, "variant").fromExpr(expr.caseExpr);
			}
			let kindHasWhen = [];
			let returnCount = 0;
			for (let i = 0; i < caseType.structuralType().typeCount; i++) {
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
				let typeIndex = caseType.structuralType().types.indexOf(whenType);
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
				this.codeBlock.codePopVoid(caseType.slotCount() - whenType.slotCount());
				this.pushScopeBlock();
				this.scope.addVariable(expr.whens[i].varName, whenType, false);
				this.scope.clearVarStatTmp();
				let thenRet = this.evalStatement(expr.whens[i].thenBlock);
				if (thenRet.isError()) {
					return thenRet;
				}
				this.scope.clearVarStatTmp();
				if (thenRet === EVAL_RESULT_RETURN) {
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
			this.codeBlock.codePopVoid(caseType.slotCount());
			// Execute the else statement if there is one
			if (expr.elseBlock !== null) {
				this.scope.clearVarStatTmp();
				let elseRet = this.evalStatement(expr.elseBlock);
				if (elseRet.isError()) {
					return elseRet;
				}
				this.scope.clearVarStatTmp();
				if (elseRet === EVAL_RESULT_RETURN) {
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
			return returnCount === kindHasWhen.length ? EVAL_RESULT_RETURN : EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-while") {
			this.pushScopeLoop();
			let testLoc = this.codeBlock.codeSize;
			let conditionType = this.eval(expr.condition);
			if (conditionType.isError()) {
				return conditionType;
			}
			if (conditionType !== EVAL_TYPE_BOOLEAN) {
				return EvalError.wrongType(conditionType, "boolean").fromExpr(expr.condition);	
			}
			let endLoc = this.codeBlock.codeJz(0);
			this.scope.clearVarStatTmp();
			let stmtRet = this.evalStatement(expr.statement);
			if (stmtRet.isError()) {
				return stmtRet;
			}
			this.scope.clearVarStatTmp();
			this.codeBlock.codeJmp(testLoc);
			this.codeBlock.setLoc(endLoc);
			for (let i = 0; i < this.scope.exitLocCount; i++) {
				this.codeBlock.setLoc(this.scope.exitLocs[i]);
			}
			this.popScope();
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-loop") {
			this.pushScopeLoop();
			let beginLoc = this.codeBlock.codeSize;
			this.scope.clearVarStatTmp();
			let stmtRet = this.evalStatement(expr.statement);
			if (stmtRet.isError()) {
				return stmtRet;
			}
			this.scope.clearVarStatTmp();
			this.codeBlock.codeJmp(beginLoc);
			for (let i = 0; i < this.scope.exitLocCount; i++) {
				this.codeBlock.setLoc(this.scope.exitLocs[i]);
			}
			this.popScope();
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-for") {
			if (expr.sequence.tag === "ast-range") {
				this.pushScopeLoop();
				let startBoundExpr = expr.isReverse ? expr.sequence.upperBound : expr.sequence.lowerBound;
				let endBoundExpr = expr.isReverse ? expr.sequence.lowerBound : expr.sequence.upperBound;				
				let endBoundType = this.eval(endBoundExpr);
				if (endBoundType.isError()) {
					return endBoundType;
				}
				if (endBoundType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(endBoundType, "integer").fromExpr(endBoundExpr);
				}
				let endBoundVar = this.scope.addVariable("_for_range_end_bound", EVAL_TYPE_INTEGER, false);
				let startBoundType = this.eval(startBoundExpr);
				if (startBoundType.isError()) {
					return startBoundType;
				}
				if (startBoundType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(startBoundType, "integer").fromExpr(startBoundExpr);
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
				let stmtRet = this.evalStatement(expr.statement);
				if (stmtRet.isError()) {
					return stmtRet;
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
				return EVAL_RESULT_OK;
			} else {
				this.pushScopeLoop();
				let sequence = this.eval(expr.sequence);
				if (sequence.isError()) {
					return sequence;
				}
				sequence = sequence.structuralType();
				if (sequence.tag == "res-type-sequence") {
					let sequenceVar = this.scope.addVariable("_for_sequence", sequence, false);
					this.codeBlock.codePushLocal(sequenceVar.offset);
					this.codeBlock.codeExt(PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM);
					let indexVar = this.scope.addVariable(expr.index, sequence.underlyingType, false);
					let testLoc = this.codeBlock.codeSize;
					this.codeBlock.codePushLocal(sequenceVar.offset);
					this.codeBlock.codeExt(PLW_LOPCODE_HAS_GENERATOR_ENDED);
					let endLoc = this.codeBlock.codeJnz(0);
					this.scope.clearVarStatTmp();
					let stmtRet = this.evalStatement(expr.statement);
					if (stmtRet.isError()) {
						return stmtRet;
					}
					this.scope.clearVarStatTmp();
					this.codeBlock.codePushLocal(sequenceVar.offset);
					this.codeBlock.codeExt(PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM);
					for (let i = 0; i < sequence.underlyingType.slotCount(); i++) {
						this.codeBlock.codePopLocal(indexVar.offset + sequence.underlyingType.slotCount() - 1 - i);
					}
					this.codeBlock.codeJmp(testLoc);
					this.codeBlock.setLoc(endLoc);
				} else if (sequence.tag === "res-type-array") {
					let arrayVar = this.scope.addVariable("_for_array", sequence, false);
					let itemType = sequence.underlyingType;
					// Get the last_index of the array, multiply it by the itemSize
					this.codeBlock.codeDup(1);
					let lengthType = this.generateFunctionCall("last_index", 1, [sequence], EVAL_TYPE_INTEGER);
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
					let itemVar = this.scope.addVariable(expr.index, sequence.underlyingType, false);
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
					this.codeBlock.codePush(sequence.underlyingType.slotCount());
					this.codeBlock.codeExt(PLW_LOPCODE_READ_BLOB);
					// Set the item variable
					for (let i = 0; i < itemType.slotCount(); i++) {
						this.codeBlock.codePopLocal(itemVar.offset + itemType.slotCount() - i - 1);
					}
					// Evaluate the loop statement
					this.scope.clearVarStatTmp();
					let stmtRet = this.evalStatement(expr.statement);
					if (stmtRet.isError()) {
						return stmtRet;
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
				return EVAL_RESULT_OK;
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
				let condType = this.eval(expr.condition);
				if (condType.isError()) {
					return condType;
				}
				if (condType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(condType, "boolean").fromExpr(expr.condition);	
				}
				let falseLoc = this.codeBlock.codeJz(0);
				if (variableOffset > 0) {
					this.codeBlock.codePopVoid(variableOffset);
				}
				currentScope.exitLocs[currentScope.exitLocCount] = this.codeBlock.codeJmp(0);
				currentScope.exitLocCount++;
				this.codeBlock.setLoc(falseLoc);
			}
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-raise") {
			let raiseType = this.eval(expr.expr);
			if (raiseType.isError()) {
				return raiseType;
			}
			if (raiseType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(raiseType, "integer").fromExpr(expr.expr);
			}
			this.codeBlock.codeExt(PLW_LOPCODE_RAISE_EXCEPTION);
			return EVAL_RESULT_RAISE;
		}
		if (expr.tag === "ast-return") {
			// Eval the returned expression
			let retType = null;
			if (expr.expr !== null) {
				retType = this.eval(expr.expr);
				if (retType.isError()) {
					return retType;
				}
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
			return EVAL_RESULT_RETURN;
		}
		if (expr.tag === "ast-yield") {
			// Check that the frame is a generator
			let frameScope = this.scope.findFrame();
			if (frameScope === null || frameScope.isGenerator !== true) {
				return EvalError.unexpectedYield().fromExpr(expr);
			}
			// Eval the returned expression
			let retType = this.eval(expr.expr);
			if (retType.isError()) {
				return retType;
			}
			// Check the return type
			if (retType !== frameScope.returnType) {
				return EvalError.wrongType(retType, frameScope.returnType.typeKey()).fromExpr(expr.expr);
			}
			this.codeBlock.codePush(retType.slotCount());
			this.codeBlock.codeExt(PLW_LOPCODE_YIELD_GENERATOR_ITEM);
			return EVAL_RESULT_OK;
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
				return EVAL_RESULT_OK;
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
				let ret = this.evalStatement(expr.statement);
				if (ret.isError()) {
					this.context.removeFunction(evalFunc.functionKey());
					return ret;
				}
				if (evalFunc.isGenerator === true) {
					for (let i = 0; i < returnType.slotCount(); i++) {
						this.codeBlock.codePush(0);
					}
					this.codeBlock.codePush(returnType.slotCount());
					this.codeBlock.codeExt(PLW_LOPCODE_YIELD_GENERATOR_ITEM);
				} else if (ret !== EVAL_RESULT_RETURN) {
					this.context.removeFunction(evalFunc.functionKey());
					return EvalError.noFunctionReturn(evalFunc.functionKey()).fromExpr(expr.statement);
				}
				if (evalFunc.returnType === EVAL_TYPE_INFER) {
					evalFunc.returnType = this.scope.returnType;
				}
				this.popScope();
				this.codeBlock = oldCodeBlock;
			} // End Compile function
			return EVAL_RESULT_OK;
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
				return EVAL_RESULT_OK;
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
				let ret = this.evalStatement(expr.statement);
				if (ret.isError()) {
					this.context.removeProcedure(evalProc.procedureKey());
					return ret;
				}
				this.codeBlock.codeRet(0);
				this.popScope();
				this.codeBlock = oldCodeBlock;
			} // End Compile procedure
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-procedure") {
			let argTypes = [];
			let argSlotCount = 0;
			for (let i = 0; i < expr.argList.argCount; i++) {
				let argType = this.eval(expr.argList.args[i]);
				if (argType.isError()) {
					return argType;
				}
				argTypes[i] = argType;
				argSlotCount += argType.slotCount();
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
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-directive") {
			if (expr.text === "suspend") {
				this.codeBlock.codeSuspend();
			}
			return EVAL_RESULT_OK;
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
			return v.varType;
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedType = this.evalForMutate(expr.indexed);
			if (indexedType.isError()) {
				return indexedType;
			}
			let structType = indexedType.structuralType();
			if (structType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedType, "array").fromExpr(expr.indexed);
			}
			if (structType.underlyingType.slotCount() > 1) {
				return EvalError.unassignable(expr.tag).fromExpr(expr);
			}
			// evaluate the index
			let indexType = this.eval(expr.index);
			if (indexType.isError()) {
				return indexType;
			}
			if (indexType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexType, "integer").fromExpr(expr.index);
			}
			if (expr.indexTo !== null) {
				return EvalError.unassignable(expr.tag).fromExpr(expr);
			}
			// push the result on the stack
			this.codeBlock.codeExt(PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET);
			return structType.underlyingType;
		}
		if (expr.tag === "ast-field") {
			let recordType = this.evalForMutate(expr.expr);
			if (recordType.isError()) {
				return recordType;
			}
			let structType = recordType.structuralType();
			if (structType.tag != "res-type-record") {
				return EvalError.wrongType(recordType, "record").fromExpr(expr.expr);
			}
			let field = structType.getField(expr.fieldName);
			if (field === null) {
				return EvalError.unknownField(expr.fieldName, recordType.typeKey()).fromExpr(expr);
			}
			if (field.fieldType.slotCount() > 1) {
				return EvalError.unassignable(expr.tag).fromExpr(expr);
			}
			this.codeBlock.codePush(field.offset);
			this.codeBlock.codeExt(PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET);
			return field.fieldType;
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
			let valueType = this.eval(expr.expr, asType);
			if (valueType.isError()) {
				return valueType;
			}
			if (valueType === asType || valueType.structuralType() === asType.structuralType()) {
				return asType;
			}
			if (asType.structuralType().tag === "res-type-variant" && asType.structuralType().contains(valueType)) {
				if (valueType.tag !== "res-type-variant") {
					for (let i = 0; i < asType.structuralType().slotCount() - valueType.slotCount() - 1; i++) {
						this.codeBlock.codePush(0);
					}
					this.codeBlock.codePush(valueType.globalId);
				}
				return asType;
			}
			return EvalError.wrongType(valueType, asType.typeKey()).fromExpr(expr.expr);				
		}
		if (expr.tag === "ast-value-boolean") {
			this.codeBlock.codePush(expr.boolValue ? 1 : 0);
			return EVAL_TYPE_BOOLEAN;
		}
		if (expr.tag === "ast-null") {
			return EVAL_TYPE_NULL;
		}
		if (expr.tag === "ast-value-integer") {
			this.codeBlock.codePush(expr.intValue);
			return EVAL_TYPE_INTEGER;
		}
		if (expr.tag === "ast-value-real") {
			let floatId = this.codeBlock.addFloatConst(expr.realValue);
			this.codeBlock.codePushf(floatId);
			return EVAL_TYPE_REAL;
		}
		if (expr.tag === "ast-value-text") {
			if (expectedType === EVAL_TYPE_CHAR && expr.textValue.length === 1) {
				this.codeBlock.codePush(expr.textValue.charCodeAt(0));
				return EVAL_TYPE_CHAR;
			}
			let strId = this.codeBlock.addStrConst(expr.textValue);
			this.codeBlock.codePush(strId);
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_STRING);
			return EVAL_TYPE_TEXT;
		}
		if (expr.tag === "ast-value-tuple") {
			let itemTypes = [];
			for (let i = 0; i < expr.itemCount; i++) {
				let itemType = this.eval(expr.items[i]);
				if (itemType.isError()) {
					return itemType;
				}
				itemTypes[i] = itemType;
			}
			return this.addType(new EvalTypeTuple(expr.itemCount, itemTypes));
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
					return expectedType;
				}
			}
			let itemType = null;
			// Evalute the next items
			for (let i = 0; i < expr.itemCount; i++) {
				let currentItemType = this.eval(expr.items[i]);
				if (currentItemType.isError()) {
					return currentItemType;
				}
				if (itemType === null) {
					itemType = currentItemType;
				} else if (currentItemType !== itemType) {
					return EvalError.wrongType(currentItemType, itemType.typeKey()).fromExpr(expr.items[i]);
				}
			}
			// Allocate the array
			this.codeBlock.codePush(expr.itemCount * itemType.slotCount());
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB);
			return this.addType(new EvalTypeArray(itemType));
		}
		if (expr.tag === "ast-value-record") {
			let fields = [];
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldValueType = this.eval(expr.fields[i].valueExpr);
				if (fieldValueType.isError()) {
					return fieldValueType;
				}
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldValueType);
			}
			let recordType = this.addType(new EvalTypeRecord(expr.fieldCount, fields));
			this.codeBlock.codePush(recordType.fieldSlotCount);
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB);
			return recordType;
		}
		if (expr.tag === "ast-template") {
			for (let i = 0; i < expr.exprCount; i++) {
				let exprType = this.eval(expr.exprs[i]);
				if (exprType.isError()) {
					return exprType;
				}
				if (exprType !== EVAL_TYPE_TEXT) {
					let convType = this.generateFunctionCall("text", 1, [exprType], EVAL_TYPE_TEXT);
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
			return EVAL_TYPE_TEXT;
		}
		if (expr.tag === "ast-concat") {
			let firstItemType = null;
			for (let i = 0; i < expr.itemCount; i++) {
				{ // Optim: if the last item is an arrayValue, we use APPEND_BLOB instead of CONCAT_BLOB
					if (
						i == expr.itemCount - 1                                 &&
						firstItemType !== null                                  &&
						firstItemType.structuralType().tag === "res-type-array" &&
						expr.items[i].tag === "ast-value-array"
					) {
						// first, concat if necessary the items up to the last one
						if (expr.itemCount > 2) {
							this.codeBlock.codePush(expr.itemCount - 1);
							this.codeBlock.codeExt(PLW_LOPCODE_CONCAT_BLOB);
						}
						// eval all the items of the arrayValue
						let arrayValue = expr.items[i];
						let expectedArrayItemType = firstItemType.structuralType().underlyingType;
						for (let j = 0; j < arrayValue.itemCount; j++) {
							let arrayItemType = this.eval(arrayValue.items[j]);
							if (arrayItemType.isError()) {
								return arrayItemType;
							}
							if (arrayItemType !== expectedArrayItemType) {
								return EvalError.wrongType(arrayItemType, expectedArrayItemType.typeKey()).fromExpr(arrayValue.items[j]);
							}
						}
						if (arrayValue.itemCount > 0) {
							this.codeBlock.codePush(expectedArrayItemType.slotCount() * arrayValue.itemCount);
							this.codeBlock.codeExt(PLW_LOPCODE_APPEND_BLOB_ITEM);
						}
						return firstItemType;
					}
				}
				let itemType = this.eval(expr.items[i]);
				if (itemType.isError()) {
					return itemType;
				}
				if (itemType.structuralType() !== EVAL_TYPE_TEXT && itemType.structuralType().tag !== "res-type-array") {
					return EvalError.wrongType(itemType, "text or array").fromExpr(expr.items[i]);
				}
				if (i === 0) {
					firstItemType = itemType;
				} else if (firstItemType !== itemType) {
					return EvalError.wrongType(itemType, firstItemType.typeKey()).fromExpr(expr.items[i]);
				}
			}
			this.codeBlock.codePush(expr.itemCount);
			if (firstItemType.structuralType() === EVAL_TYPE_TEXT) {
				this.codeBlock.codeExt(PLW_LOPCODE_CONCAT_STRING);
			} else {
				this.codeBlock.codeExt(PLW_LOPCODE_CONCAT_BLOB);
			}
			return firstItemType;
		}
		if (expr.tag === "ast-operator-binary") {
			if (expr.operator === TOK_AND || expr.operator === TOK_OR) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(leftType, "boolean").fromExpr(expr.left);
				}
				let skipLoc = expr.operator === TOK_AND ? this.codeBlock.codeJz(0) : this.codeBlock.codeJnz(0);
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(rightType, "boolean").fromExpr(expr.right);
				}
				let endLoc = this.codeBlock.codeJmp(0);
				this.codeBlock.setLoc(skipLoc);
				this.codeBlock.codePush(expr.operator === TOK_AND ? 0 : 1);
				this.codeBlock.setLoc(endLoc);
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === TOK_TIMES) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(right, "integer").fromExpr(expr.right);
				}
				this.codeBlock.codePush(leftType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB_REPEAT_ITEM);
				return this.addType(new EvalTypeArray(leftType));
			}
			if (expr.operator === TOK_REM) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(leftType, "integer").fromExpr(expr.left);
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(rightType, "integer").fromExpr(expr.right);
				}
				this.codeBlock.codeRem();
				return EVAL_TYPE_INTEGER;
			}
			if (
				expr.operator === TOK_ADD || expr.operator === TOK_SUB ||
				expr.operator === TOK_DIV || expr.operator === TOK_MUL ||
				expr.operator === TOK_GT || expr.operator === TOK_LT ||
				expr.operator === TOK_GTE || expr.operator === TOK_LTE
			) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_INTEGER && leftType !== EVAL_TYPE_REAL) {
					return EvalError.wrongType(leftType, "integer or real").fromExpr(expr.left);
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== leftType) {
					return EvalError.wrongType(rightType, leftType.typeKey()).fromExpr(expr.right);
				}
				if (leftType === EVAL_TYPE_INTEGER) {
					if (expr.operator === TOK_ADD) {
						this.codeBlock.codeAdd();
					} else if (expr.operator === TOK_SUB) {
						this.codeBlock.codeSub();
					} else if (expr.operator === TOK_DIV) {
						this.codeBlock.codeDiv();
					} else if (expr.operator === TOK_MUL) {
						this.codeBlock.codeMul();
					} else if (expr.operator === TOK_GT) {
						this.codeBlock.codeGt();
					} else if (expr.operator === TOK_LT) {
						this.codeBlock.codeLt();
					} else if (expr.operator === TOK_GTE) {
						this.codeBlock.codeGte();
					} else {
						this.codeBlock.codeLte();
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
					return leftType;
				}
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === TOK_IN) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType.structuralType().tag !== "res-type-array") {
					return EvalError.wrongType(rightType, "array").fromExpr(expr.right);
				}
				if (leftType !== rightType.structuralType().underlyingType) {
					return EvalError.wrongType(leftType, rightType.structuralType().underlyingType.typeKey()).fromExpr(expr.left);
				}
				this.codeBlock.codePush(leftType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_GET_BLOB_INDEX_OF_ITEM);
				this.codeBlock.codePush(-1);
				this.codeBlock.codeEq(1);
				this.codeBlock.codeNot();				
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === TOK_EQ || expr.operator === TOK_NE) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				let rightType = this.eval(expr.right, leftType);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== leftType) {
					return EvalError.wrongType(rightType, leftType.typeKey()).fromExpr(expr.right);
				}
				this.codeBlock.codeEq(leftType.slotCount());				
				if (expr.operator === TOK_NE) {
					this.codeBlock.codeNot();
				}
				return EVAL_TYPE_BOOLEAN;
			}
			return EvalError.unknownBinaryOperator(expr.operator).fromExpr(expr);
		}
		if (expr.tag === "ast-operator-unary") {
			let operandType = this.eval(expr.operand);
			if (operandType.isError()) {
				return operandType;
			}
			if (expr.operator === TOK_NOT) {
				if (operandType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(operandType, "boolean").fromExpr(expr.operand);
				}
				this.codeBlock.codeNot();
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === TOK_SUB) {
				if (operandType !== EVAL_TYPE_INTEGER && operandType !== EVAL_TYPE_REAL) {
					return EvalError.wrongType(operandType, "integer or real").fromExpr(expr.operand);
				}
				if (operandType === EVAL_TYPE_INTEGER) {
					this.codeBlock.codeNeg();
				} else {
					this.codeBlock.codeNegf();
				}
				return operandType;
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
			return v.varType;
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedType = this.eval(expr.indexed);
			if (indexedType.isError()) {
				return indexedType;
			}
			let structType = indexedType.structuralType();
			if (structType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedType, "array").fromExpr(expr.indexed);
			}
			let itemType = structType.underlyingType;
			// evaluate the index
			let indexType = this.eval(expr.index);
			if (indexType.isError()) {
				return indexType;
			}
			if (indexType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexType, "integer").fromExpr(expr.index);
			}
			if (itemType.slotCount() > 1) {
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeMul();
			}
			if (expr.indexTo === null) {
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_READ_BLOB);
				return itemType;	
			}
			// indexTo is not null, we have a range index
			let indexToType = this.eval(expr.indexTo);
			if (indexToType.isError()) {
				return indexToType;
			}
			if (indexToType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexToType, "integer").fromExpr(expr.indexTo);
			}
			this.codeBlock.codePush(1);
			this.codeBlock.codeAdd();
			if (itemType.slotCount() > 1) {
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeMul();
			}
			this.codeBlock.codeExt(PLW_LOPCODE_SLICE_BLOB);
			return indexedType;
		}		
		if (expr.tag === "ast-field") {
			let recordType = this.eval(expr.expr);
			if (recordType.isError()) {
				return recordType;
			}
			let structType = recordType.structuralType();
			if (structType.tag != "res-type-record") {
				return EvalError.wrongType(recordType, "record").fromExpr(expr.expr);
			}
			let field = structType.getField(expr.fieldName);
			if (field === null) {
				return EvalError.unknownField(expr.fieldName, recordType.typeKey()).fromExpr(expr);
			}
			this.codeBlock.codePush(field.offset);
			this.codeBlock.codePush(field.fieldType.slotCount());
			this.codeBlock.codeExt(PLW_LOPCODE_READ_BLOB);
			return field.fieldType;
		}
		if (expr.tag === "ast-function") {
			let argTypes = [];
			for (let i = 0; i < expr.argList.argCount; i++) {
				let argType = this.eval(expr.argList.args[i]);
				if (argType.isError()) {
					return argType;
				}
				argTypes[i] = argType;
			}
			let resultType = this.generateFunctionCall(expr.functionName, expr.argList.argCount, argTypes, expectedType);
			if (resultType.isError()) {
				return resultType.fromExpr(expr);
			}
			return resultType;
		}
		if (expr.tag === "ast-case") {
			let caseType = null;
			if (expr.caseExpr !== null) {
				caseType = this.eval(expr.caseExpr);
				if (caseType.isError()) {
					return caseType;
				}
			}
			let endLocs = [];
			let endLocCount = 0;
			let resultType = null;
			for (let i = 0; i < expr.whenCount; i++) {
				if (caseType !== null) {
					this.codeBlock.codeDup(caseType.slotCount());
					let whenType = this.eval(expr.whens[i].whenExpr);
					if (whenType.isError()) {
						return whenType;
					}
					if (whenType !== caseType) {
						return EvalError.wrongType(whenType, caseType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					this.codeBlock.codeEq(caseType.slotCount());
					let nextLoc = this.codeBlock.codeJz(0);
					this.codeBlock.codePopVoid(caseType.slotCount());
					let thenType = this.eval(expr.whens[i].thenExpr);
					if (thenType.isError()) {
						return thenType;
					}
					if (resultType === null) {
						resultType = thenType;
					} else if (thenType !== resultType) {
						return EvalError.wrongType(thenType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					endLocs[endLocCount] = this.codeBlock.codeJmp(0);
					endLocCount++;
					this.codeBlock.setLoc(nextLoc);
				} else {
					let whenType = this.eval(expr.whens[i].whenExpr);
					if (whenType.isError()) {
						return whenType;
					}
					if (whenType !== EVAL_TYPE_BOOLEAN) {
						return EvalError.wrongType(whenType, "boolean").fromExpr(expr.whens[i].whenExpr);
					}
					let nextLoc = this.codeBlock.codeJz(0);
					let thenType = this.eval(expr.whens[i].thenExpr);
					if (thenType.isError()) {
						return thenType;
					}
					if (resultType === null) {
						resultType = thenType;
					} else if (thenType !== resultType) {
						return EvalError.wrongType(thenType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					endLocs[endLocCount] = this.codeBlock.codeJmp(0);
					endLocCount++;
					this.codeBlock.setLoc(nextLoc);
				}		
			}
			if (caseType !== null) {
				this.codeBlock.codePopVoid(caseType.slotCount());
			}
			let elseType = this.eval(expr.elseExpr);
			if (elseType.isError()) {
				return elseType;
			}
			if (resultType === null) {
				resultType = elseType;
			} else if (elseType !== resultType) {
				return EvalError.wrongType(elseType, resultType.typeKey()).fromExpr(expr.elseExpr);
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return resultType;
		}
		if (expr.tag === "ast-kindof") {
			let caseType = this.eval(expr.caseExpr);
			if (caseType.isError()) {
				return caseType;
			}
			if (caseType.structuralType().tag !== "res-type-variant") {
				return EvalError.wrongType(caseType, "variant").fromExpr(expr.caseExpr);
			}
			let endLocs = [];
			let endLocCount = 0;
			let resultType = null;
			let kindHasWhen = [];
			for (let i = 0; i < caseType.structuralType().typeCount; i++) {
				kindHasWhen[i] = false;
			}
			for (let i = 0; i < expr.whenCount; i++) {
				// Duplicate the last slot of the variant which is the variantType
				this.codeBlock.codeDup(1);
				let whenType = this.evalType(expr.whens[i].type);
				if (whenType.isError()) {
					return whenType;
				}
				let typeIndex = caseType.structuralType().types.indexOf(whenType);
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
				this.codeBlock.codePopVoid(caseType.slotCount() - whenType.slotCount());
				this.pushScopeBlock();
				this.scope.addVariable(expr.whens[i].varName, whenType, true);
				let thenType = this.eval(expr.whens[i].thenExpr);
				if (thenType.isError()) {
					return thenType;
				}
				if (resultType === null) {
					resultType = thenType;
				} else if (thenType !== resultType) {
					return EvalError.wrongType(thenType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
				}
				// Replace the when var with the then value, and pop the when var
				this.codeBlock.codeSwap(whenType.slotCount() + thenType.slotCount());
				this.codeBlock.codePopVoid(whenType.slotCount());
				if (thenType.slotCount() > 1) {
					this.codeBlock.codeSwap(thenType.slotCount());
				}
				this.popScope();
				// We are done, goto end
				endLocs[endLocCount] = this.codeBlock.codeJmp(0);
				endLocCount++;
				this.codeBlock.setLoc(nextLoc);
			}
			// No match, we still have the case var on the stack, we pop it
			this.codeBlock.codePopVoid(caseType.slotCount());
			// If there is no else expression, we check that all the kind where managed
			// Otherwise we evaluate the else expression
			if (expr.elseExpr === null) {
				for (let i = 0; i < caseType.structuralType().typeCount; i++) {
					if (kindHasWhen[i] === false) {
						return EvalError.variantKindNotManaged(caseType.structuralType().types[i].typeKey()).fromExpr(expr);
					}
				}
			} else {
				let elseType = this.eval(expr.elseExpr);
				if (elseType.isError()) {
					return elseType;
				}
				if (resultType === null) {
					resultType = elseType;
				} else if (elseType !== resultType) {
					return EvalError.wrongType(elseType, resultType.typeKey()).fromExpr(expr.elseExpr);
				}
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return resultType;
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

