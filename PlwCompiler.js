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
	constructor(tag, isRef, isMutable) {
		super(tag);
		this.isRef = isRef;
		this.isMutable = isMutable;
	}
	
	typeKey() {
		return "not managed " + evalType;
	}
}

class EvalTypeBuiltIn extends EvalResultType {
	constructor(typeName, isRef) {
		super("res-type-built-in", isRef, false);
		this.typeName = typeName;
	}
	
	typeKey() {
		return this.typeName;
	}
	
}

class EvalTypeRecordField {
	constructor(fieldName, fieldType) {
		this.fieldName = fieldName;
		this.fieldType = fieldType;
		this.offset = 0;
	}
}

class EvalTypeRecord extends EvalResultType {
	constructor(fieldCount, fields) {
		super("res-type-record", true, true);
		this.fieldCount = fieldCount;
		this.fields = fields;
		this.refFieldCount = 0;
		for (let i = 0; i < fields.length; i++) {
			if (fields[i].fieldType.isRef) {
				fields[i].offset = this.refFieldCount;
				this.refFieldCount++;
			}
		}
		let noRefIndex = this.refFieldCount;
		for (let i = 0; i < fields.length; i++) {
			if (!fields[i].fieldType.isRef) {
				fields[i].offset = noRefIndex;
				noRefIndex++;
			}
		}
	}
	
	typeKey() {
		let name = "{";
		for (let i = 0; i < this.fieldCount; i++) {
			name += (i == 0 ? "" : ", ") + this.fields[i].fieldName + " " + this.fields[i].fieldType.typeKey();
		}
		return name + "}";
	}
}

class EvalTypeVariantField {
	constructor(fieldName, fieldType) {
		this.fieldName = fieldName;
		this.fieldType = fieldType;
		this.builder = null;
	}
}

class EvalTypeVariant extends EvalResultType {
	constructor(fieldCount, fields) {
		super("res-type-variant", true, false);
		this.fieldCount = fieldCount;
		this.fields = fields;
	}

	typeKey() {
		let name = "variant(";
		for (let i = 0; i < this.fieldCount; i++) {
			name += (i == 0 ? "" : ", ") + this.fields[i].fieldName;
			if (this.fields[i].fieldType !== null) {
				name += " " + this.fields[i].fieldType.typeKey();
			}
		}
		return name + ")";
	}
}

class EvalTypeArray extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-array", true, true);
		this.underlyingType = underlyingType;
	}
	
	typeKey() {
		return "[" + (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + "]";
	}
}

class EvalTypeSequence extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-sequence", true, false);
		this.underlyingType = underlyingType;
	}
	
	typeKey() {
		return "sequence(" + (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + ")";
	}
}

class EvalTypeAbstract extends EvalResultType {
	constructor(methodCount, methods) {
		super("res-type-abstract", true, false);
		this.methodCount = methodCount;
		this.methods = methods;
	}
	
	typeKey() {
		let name = "abstract(";
		for(let i = 0; i < this.methodCount; i++) {
			if (i > 0) {
				name += ", ";
			}
			name += this.methods[i].typeKey();
		}
		return name += ")";
	}
}

class EvalTypeAbstractMethod {
	constructor(isFunction, methodName, paramCount, params, returnType) {
		this.isFunction = isFunction;
		this.methodName = methodName;
		this.paramCount = paramCount;
		this.params = params;
		this.returnType = returnType; 
	}
	
	typeKey() {
		let name = this.methodName + "(";
		for(let i = 0; i < this.paramCount; i++) {
			if (i > 0) {
				name += ", ";
			}
			name += this.params[i].typeKey();
		}
		return name + ")" + (this.returnType === null ? (this.isFunction ? " self" : "") : " " + this.returnType.typeKey());
	}
	
	methodKey(concreteType, abstractType) {
		let key = this.methodName + "(" + concreteType.typeKey();
		for (let i = 0; i < this.paramCount; i++) {
			key += "," + (this.params[i].paramType === null ? abstractType.typeKey() : this.params[i].paramType.typeKey());
		}
		return key + ")";
	}
}

class EvalTypeAbstractParam {
	constructor(paramName, paramType) {
		this.paramName = paramName;
		this.paramType = paramType; 
	}
	
	typeKey() {
		return this.paramName + (this.paramType === null ? " self" : " " + this.paramType.typeKey());
	}
}

class EvalTypeName extends EvalResultType {
	constructor(typeName, underlyingType) {
		super("res-type-name", underlyingType.isRef, underlyingType.isMutable);
		this.typeName = typeName;
		this.underlyingType = underlyingType;
	}
	
	typeKey() {
		return this.typeName;
	}
}

class EvalResultParameter extends EvalResult {
	constructor(parameterName, parameterType, isCtx) {
		super("res-parameter");
		this.parameterName = parameterName;
		this.parameterType = parameterType;
		this.isCtx = isCtx;
	}
}

class EvalResultParameterList extends EvalResult {
	constructor(parameterCount, parameters) {
		super("res-parameter-list");
		this.parameterCount = parameterCount;
		this.parameters = parameters;
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
		this.abstractIndex = -1;
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
				(this.parameterList.parameters[i].isCtx ? "ctx " : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
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
		this.abstractIndex = -1;
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
				(this.parameterList.parameters[i].isCtx ? "ctx " : "") +
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
		
}

const EVAL_TYPE_REF = new EvalTypeBuiltIn("ref", true);
const EVAL_TYPE_INTEGER = new EvalTypeBuiltIn("integer", false);
const EVAL_TYPE_REAL = new EvalTypeBuiltIn("real", false);
const EVAL_TYPE_BOOLEAN = new EvalTypeBuiltIn("boolean", false);
const EVAL_TYPE_TEXT = new EvalTypeBuiltIn("text", true);
const EVAL_TYPE_CHAR = new EvalTypeName("char", EVAL_TYPE_INTEGER);

class CodeBlock {

	constructor(blockName) {
		this.blockName = blockName;
		this.codes = [];
		this.codeSize = 0;
		this.strConsts = [];
		this.strConstSize = 0;
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
	
	setLoc(offset) {
		this.codes[offset] = this.codeSize;
	}
	
	code1(inst) {
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
		this.code1(OPCODE_SUSPEND);
	}
	
	codeDup() {
		this.code1(OPCODE_DUP);
	}
	
	codeSwap() {
		this.code1(OPCODE_SWAP);
	}
	
	codePush(val) {
		this.code2(OPCODE_PUSH, val);
	}
		
	codePushGlobal(offset) {
		this.code2(OPCODE_PUSH_GLOBAL, offset);
	}
	
	codePushGlobalForMutate(offset) {
		this.code2(OPCODE_PUSH_GLOBAL_FOR_MUTATE, offset);
	}
	
	codePushLocal(offset) {
		this.code2(OPCODE_PUSH_LOCAL, offset);
	}
	
	codePushLocalForMutate(offset) {
		this.code2(OPCODE_PUSH_LOCAL_FOR_MUTATE, offset);
	}	
	
	codePushIndirection(offset) {
		this.code2(OPCODE_PUSH_INDIRECTION, offset);
	}
	
	codePushIndirect(offset) {
		this.code2(OPCODE_PUSH_INDIRECT, offset);
	}
	
	codePushIndirectForMutate(offset) {
		this.code2(OPCODE_PUSH_INDIRECT_FOR_MUTATE, offset);
	}

	codePushPtrOffset() {
		this.code1(OPCODE_PUSH_PTR_OFFSET);
	}
	
	codePushPtrOffsetForMutate() {
		this.code1(OPCODE_PUSH_PTR_OFFSET_FOR_MUTATE);
	}
	
	codeCreateRecord(itemCount) {
		this.code2(OPCODE_CREATE_RECORD, itemCount);
	}
	
	codeCreateBasicArray(itemCount) {
		this.code2(OPCODE_CREATE_BASIC_ARRAY, itemCount);
	}
	
	codeCreateArray(itemCount) {
		this.code2(OPCODE_CREATE_ARRAY, itemCount);
	}
	
	codeArrayTimes() {
		this.code1(OPCODE_ARRAY_TIMES);
	}
	
	codeBasicArrayTimes() {
		this.code1(OPCODE_BASIC_ARRAY_TIMES);
	}
	
	codeCreateString(strId) {
		this.code2(OPCODE_CREATE_STRING, strId);
	}
	
	codePopGlobal(offset) {
		this.code2(OPCODE_POP_GLOBAL, offset);
	}
	
	codePopLocal(offset) {
		this.code2(OPCODE_POP_LOCAL, offset);
	}
	
	codePopIndirect(offset) {
		this.code2(OPCODE_POP_INDIRECT, offset);
	}
	
	codePopPtrOffset() {
		this.code1(OPCODE_POP_PTR_OFFSET);
	}
		
	codePopVoid(count) {
		this.code2(OPCODE_POP_VOID, count);
	}
	
	codeAdd() {
		this.code1(OPCODE_ADD);
	}
	
	codeSub() {
		this.code1(OPCODE_SUB);
	}

	codeDiv() {
		this.code1(OPCODE_DIV);
	}

	codeRem() {
		this.code1(OPCODE_REM);
	}

	codeMul() {
		this.code1(OPCODE_MUL);
	}
	
	codeNeg() {
		this.code1(OPCODE_NEG);
	}
	
	codeGt() {
		this.code1(OPCODE_GT);
	}

	codeGte() {
		this.code1(OPCODE_GTE);
	}

	codeLt() {
		this.code1(OPCODE_LT);
	}

	codeLte() {
		this.code1(OPCODE_LTE);
	}
	
	codeEq() {
		this.code1(OPCODE_EQ);
	}
	
	codeNe() {
		this.code1(OPCODE_NE);
	}

	// real

	codeAddf() {
		this.code1(OPCODE_ADDF);
	}
	
	codeSubf() {
		this.code1(OPCODE_SUBF);
	}

	codeDivf() {
		this.code1(OPCODE_DIVF);
	}

	codeMulf() {
		this.code1(OPCODE_MULF);
	}
	
	codeNegf() {
		this.code1(OPCODE_NEGF);
	}
	
	codeGtf() {
		this.code1(OPCODE_GTF);
	}

	codeGtef() {
		this.code1(OPCODE_GTEF);
	}

	codeLtf() {
		this.code1(OPCODE_LTF);
	}

	codeLtef() {
		this.code1(OPCODE_LTEF);
	}
	
	codeEqf() {
		this.code1(OPCODE_EQF);
	}
	
	codeNef() {
		this.code1(OPCODE_NEF);
	}
	
	// real


	codeAnd() {
		this.code1(OPCODE_AND);
	}
	
	codeOr() {
		this.code1(OPCODE_OR);
	}
	
	codeNot() {
		this.code1(OPCODE_NOT);
	}
		
	codeNext() {
		this.code1(OPCODE_NEXT);
	}
	
	codeEnded() {
		this.code1(OPCODE_ENDED);
	}
	
	codeEqRef() {
		this.code1(OPCODE_EQ_REF);
	}
	
	codeJz(offset) {
		this.code2(OPCODE_JZ, offset);
		return this.codeSize - 1;
	}
	
	codeJnz(offset) {
		this.code2(OPCODE_JNZ, offset);
		return this.codeSize - 1;
	}
	
	codeJmp(offset) {
		this.code2(OPCODE_JMP, offset);
		return this.codeSize - 1;
	}
	
	codeRaise() {
		this.code1(OPCODE_RAISE);
	}
			
	codeRet() {
		this.code1(OPCODE_RET);
	}

	codeRetVal() {
		this.code1(OPCODE_RET_VAL);
	}
	
	codeYield() {
		this.code1(OPCODE_YIELD);
	}
	
	codeYieldDone() {
		this.code1(OPCODE_YIELD_DONE);
	}
	
	codeCall(ptr) {
		this.code2(OPCODE_CALL, ptr);
	}
		
	codeCallNative(ptr) {
		this.code2(OPCODE_CALL_NATIVE, ptr);
	}
	
	codeCallAbstract(methodIndex) {
		this.code2(OPCODE_CALL_ABSTRACT, methodIndex);
	}
	
	codeInitGenerator(ptr) {
		this.code2(OPCODE_INIT_GENERATOR, ptr);
	}
	
	codeCreateExceptionHandler(offset) {
		this.code2(OPCODE_CREATE_EXCEPTION_HANDLER, offset);
		return this.codeSize - 1;
	}
			
}


class CompilerContext {
	
	constructor() {
		this.globalScope = CompilerScope.makeGlobal();
		this.types = {
			"integer": EVAL_TYPE_INTEGER,
			"real": EVAL_TYPE_REAL,
			"boolean": EVAL_TYPE_BOOLEAN,
			"text": EVAL_TYPE_TEXT,
			"char": EVAL_TYPE_CHAR
		};
		this.functions = {};
		this.procedures = {};
		this.codeBlocks = [];
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
		let uniqueType = this.types[evalType.typeKey()];
		if (uniqueType === undefined) {
			this.types[evalType.typeKey()] = evalType;
			if (evalType.tag === "res-type-array") {
				var lengthFunc = new EvalResultFunction(
					"length",
					new EvalResultParameterList(1, [new EvalResultParameter("array", evalType, false)]),
					EVAL_TYPE_INTEGER, 
					false
				);
				if (evalType.underlyingType.isRef) {
					lengthFunc.nativeIndex = this.getFunction("length_array(ref)").nativeIndex;
				} else {
					lengthFunc.nativeIndex = this.getFunction("length_basic_array(ref)").nativeIndex;
				}
				this.addFunction(lengthFunc);
			}
			return evalType;
		}
		return uniqueType;
	}
	
	removeType(typeKey) {
		delete this.types[typeKey];		
	}
	
	addCodeBlock(blockName) {
		let i = this.codeBlocks.length;
		this.codeBlocks[i] = new CodeBlock(blockName);
		// console.log("Code block " + i + ": " + blockName);
		return i;
	}
			
}


class CompilerVariable {
	constructor(varName, varType, isCtx, isConst, isGlobal, isParameter, offset) {
		this.varName = varName;
		this.varType = varType;
		this.isCtx = isCtx;
		this.isConst = isConst;
		this.isGlobal = isGlobal;
		this.isParameter = isParameter;
		this.offset = offset;
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
		this.offset = parent === null || isFrame ? 0 : (parent.offset + parent.variableCount);
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
	
	addParameter(varName, varType, isCtx, offset) {
		let newVar = new CompilerVariable(varName, varType, isCtx, false, false, true, offset);
		this.parameters[this.parameterCount] = newVar;
		this.parameterCount++;
		return newVar;	
	}


	addVariable(varName, varType, isConst) {
		let newVar = new CompilerVariable(varName, varType, false, isConst, this.isGlobal, false, this.offset + this.variableCount);
		this.variables[this.variableCount] = newVar;
		this.variableCount++;
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
		this.scope = this.scope.parent;
	}
	
	evalType(expr) {
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
			return this.context.addType(new EvalTypeArray(underType));
		}
		if (expr.tag === "ast-type-sequence") {
			let underType = this.evalType(expr.underlyingType);
			if (underType.isError()) {
				return underType;
			}
			return this.context.addType(new EvalTypeSequence(underType));
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
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldType);
			}
			return this.context.addType(new EvalTypeRecord(expr.fieldCount, fields));
		}
		if (expr.tag === "ast-type-variant") {
			for (let i = 1; i < expr.fieldCount; i++) {
				for (let j = 0; j < i; j++) {
					if (expr.fields[i].fieldName === expr.fields[j].fieldName) {
						return EvalError.fieldAlreadyExists(expr.fields[i].fieldName).fromExpr(expr.fields[i]);
					}
				}
			}
			let fields = [];
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldType = null;
				if (expr.fields[i].fieldType !== null) {
					fieldType = this.evalType(expr.fields[i].fieldType);
					if (fieldType.isError()) {
						return fieldType;
					}
				}
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldType);
			}
			let variantType = new EvalTypeVariant(expr.fieldCount, fields);
			let existingType = this.context.getType(variantType.typeKey());
			if (existingType !== null) {
				return existingType;
			}
			this.context.addType(variantType);
			return variantType;
		}
		if (expr.tag === "ast-type-abstract") {
			let methods = [];
			for (let i = 0; i < expr.methodCount; i++) {
				let methodExpr = expr.methods[i];
				let paramListExpr = methodExpr.parameterList;
				let params = [];
				for (let j = 0; j < paramListExpr.parameterCount; j++) {
					let paramExpr = paramListExpr.parameters[j];
					let paramType = null;
					if (paramExpr.parameterType.tag === "ast-type-named" && paramExpr.parameterType.typeName === "self") {
						paramType = null;
					} else {
						paramType = this.evalType(paramExpr.parameterType);
						if (paramType.isError()) {
							return paramType;
						}
					}
					params[j] = new EvalTypeAbstractParam(paramExpr.parameterName, paramType);
				}
				let isFunction = false;
				let returnType = null;
				if (methodExpr.returnType !== null) {
					isFunction = true;
					if (methodExpr.returnType.tag  === "ast-type-named" && methodExpr.returnType.typeName === "self") {
						returnType = null;
					} else {
						returnType = this.evalType(methodExpr.returnType);
						if (returnType.isError()) {
							return returnType;
						}
					}
				}
				methods[i] = new EvalTypeAbstractMethod(isFunction, methodExpr.methodName, paramListExpr.parameterCount, params, returnType);
			}
			let abstractType = new EvalTypeAbstract(expr.methodCount, methods);
			{
				let uniqueType = this.context.getType(abstractType);
				if (uniqueType !== null) {
					return uniqueType;
				}
			}
			abstractType = this.context.addType(abstractType);
			//
			// create the abstract functions and procedure for the abstract type
			//
			for (let i = 0; i < abstractType.methodCount; i++) {
				let method = abstractType.methods[i];
				let params = [ new EvalResultParameter("self", abstractType, false) ];
				for (let j = 0; j < method.paramCount; j++) {
					params[j + 1] = new EvalResultParameter(
						method.params[j].paramName,
						method.params[j].paramType === null ? abstractType : method.params[j].paramType,
						false
					);
				}
				let paramList = new EvalResultParameterList(method.paramCount + 1, params);
				if (method.isFunction) {
					let retType = method.returnType === null ? abstractType : method.returnType;
					let evalFunc = new EvalResultFunction(method.methodName, paramList, retType, false);
					if (this.context.getFunction(evalFunc) !== null) {
						this.context.removeType(abstactType.typeKey());
						return EvalError.functionAlreadyExists(evalFunc.funcKey()).fromExpr(expr);					
					}
					this.context.addFunction(evalFunc);
					evalFunc.abstractIndex = i;
				} else {
					let evalProc = new EvalResultProcedure(method.methodName, paramList);
					if (this.context.getProcedure(evalProc) !== null) {
						this.context.removeType(abstactType.typeKey());
						return EvalError.procedureAlreadyExists(evalProc.procKey()).fromExpr(expr);					
					}
					this.context.addProcedure(evalProc);
					evalProc.abstractIndex = i;
				}
			}
			return abstractType;
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
			let namedType = new EvalTypeName(expr.typeName, underlyingType);
			this.context.addType(namedType);
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-variable-declaration") {
			if (this.scope.getLocalVariable(expr.varName) !== null) {
				return EvalError.variableAlreadyExists(expr.varName).fromExpr(expr);
			}
			let initValueType = this.eval(expr.valueExpr);
			if (initValueType.isError()) {
				return initValueType;
			}
			this.scope.addVariable(expr.varName, initValueType, expr.isConst);
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
				let valueType = this.eval(expr.right);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== variable.varType) {
					return EvalError.wrongType(valueType, variable.varType.typeKey()).fromExpr(expr.right);					
				}
				// assign the value
				if (variable.isCtx) {
					this.codeBlock.codePopIndirect(variable.offset);
				} else if (variable.isGlobal) {
					this.codeBlock.codePopGlobal(variable.offset);
				} else {
					this.codeBlock.codePopLocal(variable.offset);
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
				while (indexedType.tag === "res-type-name") {
					indexedType = indexedType.underlyingType;
				}
				if (indexedType.tag !== "res-type-array") {
					return EvalError.wrongType(indexedType, "array").fromExpr(indexExpr.indexed);
				}
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
				// Evaluate the value to assign
				let valueType = this.eval(expr.right);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== indexedType.underlyingType) {
					return EvalError.wrongType(valueType, indexedType.underlyingType.typeKey()).fromExpr(expr.right);
				}
				// Assigne the value
				this.codeBlock.codePopPtrOffset();
				return EVAL_RESULT_OK;
			}
			if (expr.left.tag === "ast-field") {
				let fieldExpr = expr.left;
				// evaluate the record
				let recordType = this.evalForMutate(fieldExpr.expr);
				if (recordType.isError()) {
					return recordType;
				}
				while (recordType.tag === "res-type-name") {
					recordType = recordType.underlyingType;
				}
				if (recordType.tag != "res-type-record") {
					return EvalError.wrongType(recordType, "record").fromExpr(fieldExpr.expr);
				}
				// search and push the offset of the field
				let fieldIndex = -1;
				for (let i = 0; i < recordType.fieldCount; i++) {
					if (recordType.fields[i].fieldName === fieldExpr.fieldName) {
						fieldIndex = i;
						break;
					}
				}
				if (fieldIndex === -1) {
					return EvalError.unknownField(fieldExpr.fieldName, recordType.typeKey()).fromExpr(fieldExpr);
				}
				this.codeBlock.codePush(recordType.fields[fieldIndex].offset);
				// Evaluate the value to assign
				let valueType = this.eval(expr.right);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== recordType.fields[fieldIndex].fieldType) {
					return EvalError.wrongType(valueType, recordType.fields[fieldIndex].fieldType.typeKey()).fromExpr(expr.right);
				}
				// Assigne the value
				this.codeBlock.codePopPtrOffset();
				return EVAL_RESULT_OK;
			}
			return EvalError.unassignable(expr.left.tag).fromExpr(expr.left);
		}
		if (expr.tag == "ast-block") {
			let ret = EVAL_RESULT_OK;
			let exceptionLoc = -1;
			this.pushScopeBlock();
			if (expr.exception !== null) {
				exceptionLoc = this.codeBlock.codeCreateExceptionHandler(0);
				this.scope.addVariable("_exception_handler", EVAL_TYPE_REF, true);
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
				if (this.scope.variableCount > 0) {
					this.codeBlock.codePopVoid(this.scope.variableCount);
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
			let exRet = this.evalStatement(expr.exception);
			if (exRet.isError()) {
				return exRet;
			}
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
				this.codeBlock.codeEq();
				let nextLoc = this.codeBlock.codeJz(0);
				let stmtRes = this.evalStatement(whenStmt.statement);
				if (stmtRes.isError()) {
					return stmtRes;
				}
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
				this.codeBlock.codeRaise();
			} else {
				let stmtRes = this.evalStatement(expr.defaultStmt);
				if (stmtRes.isError()) {
					return stmtRes;
				}
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
				if (this.scope.variableCount > 0) {
					this.codeBlock.codePopVoid(this.scope.variableCount);
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
			let trueRet =  this.evalStatement(expr.trueStatement);
			if (trueRet.isError()) {
				return trueRet;
			}
			let endLoc = expr.falseStatement === null ? -1 : this.codeBlock.codeJmp(0);
			this.codeBlock.setLoc(falseLoc);
			if (expr.falseStatement === null) {
				return EVAL_RESULT_OK;
			}
			let falseRet = this.evalStatement(expr.falseStatement);
			if (falseRet.isError()) {
				return falseRet;
			}
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
			while (caseType.tag === "res-type-name") {
				caseType = caseType.underlyingType;
			}			
			if (caseType.tag !== "res-type-variant") {
				return EvalError.wrongType(caseType, "variant").fromExpr(expr.caseExpr);
			}
			let kindHasWhen = [];
			for (let i = 0; i < caseType.fieldCount; i++) {
				kindHasWhen[i] = false;
			}
			this.codeBlock.codeDup();
			this.codeBlock.codePush(1);
			this.codeBlock.codePushPtrOffset();
			let endLocs = [];
			let endLocCount = 0;
			for (let i = 0; i < expr.whenCount; i++) {
				this.codeBlock.codeDup();
				let fieldIndex = 0;
				while (fieldIndex < caseType.fieldCount) {
					if (caseType.fields[fieldIndex].fieldName === expr.whens[i].kindName) {
						break;
					}
					fieldIndex++;
				}
				if (fieldIndex === caseType.fieldCount) {
					return EvalError.unknownVariantKind(expr.whens[i].kindName).fromExpr(expr.whens[i]);
				}
				if (kindHasWhen[fieldIndex] === true) {
					return EvalError.variantKindAlreadyManaged(expr.whens[i].kindName).fromExpr(expr.whens[i]);
				}
				this.codeBlock.codePush(fieldIndex);
				this.codeBlock.codeEq();						
				let nextLoc = this.codeBlock.codeJz(0);
				this.codeBlock.codePopVoid(1);
				this.pushScopeBlock();
				this.codeBlock.codePush(0);
				this.codeBlock.codePushPtrOffset();
				this.scope.addVariable(expr.whens[i].varName, caseType.fields[fieldIndex].fieldType, false);
				let thenRet = this.evalStatement(expr.whens[i].thenBlock);
				if (thenRet.isError()) {
					return thenRet;
				}
				this.codeBlock.codePopVoid(1);
				this.popScope();
				endLocs[endLocCount] = this.codeBlock.codeJmp(0);
				endLocCount++;
				this.codeBlock.setLoc(nextLoc);
			}
			this.codeBlock.codePopVoid(2);
			if (expr.elseBlock !== null) {
				let elseRet = this.evalStatement(expr.elseBlock);
				if (elseRet.isError()) {
					return elseRet;
				}
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return EVAL_RESULT_OK;
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
			let stmtRet = this.evalStatement(expr.statement);
			if (stmtRet.isError()) {
				return stmtRet;
			}
			this.codeBlock.codeJmp(testLoc);
			this.codeBlock.setLoc(endLoc);
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
				let stmtRet = this.evalStatement(expr.statement);
				if (stmtRet.isError()) {
					return stmtRet;
				}
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
				this.codeBlock.codePopVoid(this.scope.variableCount);
				this.popScope();
				return EVAL_RESULT_OK;
			} else {
				this.pushScopeLoop();
				let sequence = this.eval(expr.sequence);
				if (sequence.isError()) {
					return sequence;
				}
				if (sequence.tag !== "res-type-sequence") {
					return EvalError.wrongType(sequence, "sequence").fromExpr(expr.sequence);
				}
				let sequenceVar = this.scope.addVariable("_for_sequence", sequence, false);
				this.codeBlock.codePushLocal(sequenceVar.offset);
				this.codeBlock.codeNext();
				let indexVar = this.scope.addVariable(expr.index, sequence.underlyingType, false);
				let testLoc = this.codeBlock.codeSize;
				this.codeBlock.codePushLocal(sequenceVar.offset);
				this.codeBlock.codeEnded();
				let endLoc = this.codeBlock.codeJnz(0);
				let stmtRet = this.evalStatement(expr.statement);
				if (stmtRet.isError()) {
					return stmtRet;
				}
				this.codeBlock.codePushLocal(sequenceVar.offset);
				this.codeBlock.codeNext();
				this.codeBlock.codePopLocal(indexVar.offset);
				this.codeBlock.codeJmp(testLoc);
				this.codeBlock.setLoc(endLoc);
				for (let i = 0; i < this.scope.exitLocCount; i++) {
					this.codeBlock.setLoc(this.scope.exitLocs[i]);
				}
				this.codeBlock.codePopVoid(this.scope.variableCount);
				this.popScope();
				return EVAL_RESULT_OK;
			}
			return EvalError.unknownType(expr.sequence.tag).fromExpr(expr.sequence);
		}
		if (expr.tag === "ast-exit") {
			let currentScope = this.scope;
			let variableCount = 0;
			while (currentScope !== null && currentScope.isLoop == false) {
				variableCount += currentScope.variableCount;
				currentScope = currentScope.parent; 
			}
			if (currentScope === null) {
				return EvalError.unexpectedExit().fromExpr(expr);
			}
			if (expr.condition === null) {
				this.codeBlock.codePopVoid(variableCount);
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
				this.codeBlock.codePopVoid(variableCount);
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
			this.codeBlock.codeRaise();
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
			if (retType !== frameScope.returnType) {
				return EvalError.wrongType(retType, frameScope.returnType.typeKey()).fromExpr(expr.expr);
			}
			if (retType === null) {
				this.codeBlock.codeRet();
			} else {
				this.codeBlock.codeRetVal();
			}
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
			this.codeBlock.codeYield();
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
				for (let i = 0; i < parameterList.parameterCount; i++) {
					if (evalFunc.isGenerator === true) {
						this.scope.addVariable(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType,
							false
						);
					} else {
						this.scope.addParameter(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType,
							parameterList.parameters[i].isCtx,
							i - parameterList.parameterCount - 4,
							false
						);
					}
				}
				let ret = this.evalStatement(expr.statement);
				if (ret.isError()) {
					this.context.removeFunction(evalFunc.functionKey());
					return ret;
				}
				if (evalFunc.isGenerator === true) {
					this.codeBlock.codeYieldDone();
				} else if (ret !== EVAL_RESULT_RETURN) {
					this.context.removeFunction(evalFunc.functionKey());
					return EvalError.noFunctionReturn(evalFunc.functionKey()).fromExpr(expr.statement);
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
						parameterList.parameters[i].parameterType,
						parameterList.parameters[i].isCtx,
						i - parameterList.parameterCount - 4
					);
				}
				let ret = this.evalStatement(expr.statement);
				if (ret.isError()) {
					this.context.removeProcedure(evalProc.procedureKey());
					return ret;
				}
				this.codeBlock.codeRet();
				this.popScope();
				this.codeBlock = oldCodeBlock;
			} // End Compile procedure
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-procedure") {
			let argTypes = [];
			for (let i = 0; i < expr.argList.argCount; i++) {
				let argType = this.eval(expr.argList.args[i]);
				if (argType.isError()) {
					return argType;
				}
				argTypes[i] = argType;
			}
			let procKey = expr.procedureName + "(";
			for (let i = 0; i < expr.argList.argCount; i++) {
				procKey += (i > 0 ? "," : "") + (expr.argList.args[i].tag === "ast-ctx-arg" ? "ctx " : "") + argTypes[i].typeKey();
			}
			procKey += ")";
			let proc = this.context.getProcedure(procKey);
			if (proc === null) {
				return EvalError.unknownProcedure(procKey).fromExpr(expr);
			}
			this.codeBlock.codePush(expr.argList.argCount);
			if (proc.nativeIndex !== -1) {
				this.codeBlock.codeCallNative(proc.nativeIndex);
			} else if (proc.codeBlockIndex !== -1) {
				this.codeBlock.codeCall(proc.codeBlockIndex);
			} else {
				this.codeBlock.codeCallAbstract(proc.abstractIndex);
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
			if (v.isCtx) {
				this.codeBlock.codePushIndirectForMutate(v.offset);
			} else if (v.isGlobal) {
				this.codeBlock.codePushGlobalForMutate(v.offset);
			} else {
				this.codeBlock.codePushLocalForMutate(v.offset);
			}
			return v.varType;
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedType = this.evalForMutate(expr.indexed);
			if (indexedType.isError()) {
				return indexedType;
			}
			while (indexedType.tag === "res-type-name") {
				indexedType = indexedType.underlyingType;
			}
			if (indexedType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedType, "array").fromExpr(expr.indexed);
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
			this.codeBlock.codePushPtrOffsetForMutate();
			return indexedType.underlyingType;
		}
		if (expr.tag === "ast-field") {
			let recordType = this.evalForMutate(expr.expr);
			if (recordType.isError()) {
				return recordType;
			}
			while (recordType.tag === "res-type-name") {
				recordType = recordType.underlyingType;
			}
			if (recordType.tag != "res-type-record") {
				return EvalError.wrongType(recordType, "record").fromExpr(expr.expr);
			}
			for (let i = 0; i < recordType.fieldCount; i++) {
				if (recordType.fields[i].fieldName === expr.fieldName) {
					this.codeBlock.codePush(recordType.fields[i].offset);
					this.codeBlock.codePushPtrOffsetForMutate();
					return recordType.fields[i].fieldType;
				}
			}
			return EvalError.unknownField(expr.fieldName, recordType.typeKey()).fromExpr(expr);
		}
		return EvalError.unassignable(expr.tag).fromExpr(expr);
	}
	
	eval(expr) {
		if (expr.tag === "ast-as") {
			let asType = this.evalType(expr.exprType);
			if (asType.isError()) {
				return asType;
			}
			if (expr.expr.tag === "ast-value-array" && expr.expr.itemCount === 0) {
				// special case when the left expression is an empty array
				// we don't want to eval it, but directly create a basic array or array
				// depending on the as type
				let actAsType = asType;
				while (actAsType.tag === "res-type-name") {
					actAsType = actAsType.underlyingType;
				}
				if (actAsType.tag !== "res-type-array") {
					return EvalError.wrongType("empty array", asType.typeKey()).fromExpr(expr.expr);				
				}
				if (actAsType.underlyingType.isRef === true) {
					this.codeBlock.codeCreateArray(0);
				} else {
					this.codeBlock.codeCreateBasicArray(0);
				}
				return asType;
			}
			let actAsType = asType;
			while (actAsType.tag === "res-type-name") {
				actAsType = actAsType.underlyingType;
			}
			if (actAsType.tag === "res-type-variant") {
				if (expr.expr.tag === "ast-variable") {
					let varName = expr.expr.varName;
					let fieldFound = false;
					for (let i = 0; i < actAsType.fieldCount; i++) {
						if (actAsType.fields[i].fieldName === varName) {
							if (actAsType.fields[i].fieldType === null) {
								this.codeBlock.codePush(0);
								this.codeBlock.codePush(i);
								this.codeBlock.codeCreateRecord(2);
								return asType;
							}
						}
					}
				} else if (expr.expr.tag === "ast-function" && expr.expr.argList.argCount === 1) {
					let funcName = expr.expr.functionName;
					for (let i = 0; i < actAsType.fieldCount; i++) {
						if (actAsType.fields[i].fieldName === funcName) {
							if (actAsType.fields[i].fieldType !== null) {
								let argType = this.eval(expr.expr.argList.args[0]);
								if (argType.isError()) {
									return argType;
								}
								if (argType !== actAsType.fields[i].fieldType) {
									return EvalError.wrongType(
										argType,
										actAsType.fields[i].fieldType.typeKey()
									).fromExpr(expr.expr.argList.args[0]);
								}
								this.codeBlock.codePush(i);
								this.codeBlock.codeCreateRecord(2);
								return asType;
							}
						}
					}
				}
			}
			let valueType = this.eval(expr.expr);
			if (valueType.isError()) {
				return valueType;
			}
			if (valueType === asType) {
				return asType;
			}
			actAsType = asType;
			while (actAsType.tag === "res-type-name") {
				actAsType = actAsType.underlyingType;
				if (valueType === actAsType) {
					return asType;
				}
			}
			if (valueType.tag === "res-type-name" && asType === valueType.underlyingType) {
				return asType;
			}
			if (actAsType.tag === "res-type-abstract") {
				for (let i = 0; i < actAsType.methodCount; i++) {
					let methodKey = actAsType.methods[i].methodKey(valueType, asType);
					if (actAsType.methods[i].isFunction) {
						let func = this.context.getFunction(methodKey);
						if (func === null) {
							return EvalError.unknownFunction(methodKey).fromExpr(expr.expr);
						}
						let retType = actAsType.methods[i].returnType;
						if (retType === null) {
							retType = asType;
						}
						if (retType !== func.returnType) {
							return EvalError.wrongType(func.returnType, retType.typeKey()).fromExpr(expr.valueExpr);
						}
						this.codeBlock.codePush(func.codeBlockIndex);
						this.codeBlock.codePush(func.nativeIndex);
					} else {
						let proc = this.context.getProcedure(methodKey);
						if (proc === null) {
							return EvalError.unknownProcedure(methodKey);
						}
						this.codeBlock.codePush(proc.codeBlockIndex);
						this.codeBlock.codePush(proc.nativeIndex);
					}
				}
				this.codeBlock.codeCreateRecord(1 + actAsType.methodCount * 2);
				return asType;
			}
			return EvalError.wrongType(valueType, asType.typeKey()).fromExpr(expr.expr);				
		}
		if (expr.tag === "ast-value-boolean") {
			this.codeBlock.codePush(expr.boolValue ? 1 : 0);
			return EVAL_TYPE_BOOLEAN;
		}
		if (expr.tag === "ast-value-integer") {
			this.codeBlock.codePush(expr.intValue);
			return EVAL_TYPE_INTEGER;
		}
		if (expr.tag === "ast-value-real") {
			this.codeBlock.codePush(expr.realValue);
			return EVAL_TYPE_REAL;
		}
		if (expr.tag === "ast-value-text") {
			let strId = this.codeBlock.addStrConst(expr.textValue);
			this.codeBlock.codeCreateString(strId);
			return EVAL_TYPE_TEXT;
		}
		if (expr.tag === "ast-value-array") {
			if (expr.itemCount === 0) {
				return EvalError.emptyArrayMustBeTyped().fromExpr(expr);
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
			if (itemType.isRef === false) {
				this.codeBlock.codeCreateBasicArray(expr.itemCount);
			} else {
				this.codeBlock.codeCreateArray(expr.itemCount);
			}
			return this.context.addType(new EvalTypeArray(itemType));
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
			this.codeBlock.codeCreateRecord(expr.fieldCount);
			return this.context.addType(new EvalTypeRecord(expr.fieldCount, fields));
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
			if (expr.operator === TOK_CONCAT) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_TEXT && leftType.tag !== "res-type-array") {
					return EvalError.wrongType(leftType, "text or array").fromExpr(expr.left);
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType.typeKey() !== leftType.typeKey()) {
					return EvalError.wrongType(rightType, leftType.typeKey()).fromExpr(expr.right);
				}
				this.codeBlock.codePush(2);
				if (leftType === EVAL_TYPE_TEXT) {
					this.codeBlock.codeCallNative(this.context.getFunction("concat(text,text)").nativeIndex);
				} else if (leftType.underlyingType.isRef === false) {
					this.codeBlock.codeCallNative(this.context.getFunction("concat_basic_array(ref,ref)").nativeIndex)
				} else {
					this.codeBlock.codeCallNative(this.context.getFunction("concat_array(ref,ref)").nativeIndex);
				}
				return leftType;
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
				if (leftType.isRef) {
					this.codeBlock.codeArrayTimes();
				} else {
					this.codeBlock.codeBasicArrayTimes();
				}
				return this.context.addType(new EvalTypeArray(leftType));
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
			if (expr.operator === TOK_EQ || expr.operator === TOK_NE) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== leftType) {
					return EvalError.wrongType(rightType, leftType.typeKey()).fromExpr(expr.right);
				}
				if (rightType.isRef) {
					this.codeBlock.codeEqRef();
					if (expr.operator === TOK_NE) {
						this.codeBlock.codeNot();
					}
				} else if (rightType.isRef) {
					return EvalError.wrongType(rightType, "comparable type").fromExpr(expr.right);
				} else {
					if (leftType === EVAL_TYPE_REAL) {
						if (expr.operator === TOK_EQ) {
							this.codeBlock.codeEqf();
						} else {
							this.codeBlock.codeNef();
						}
					} else {
						if (expr.operator === TOK_EQ) {
							this.codeBlock.codeEq();
						} else {
							this.codeBlock.codeNe();
						}
					}
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
			if (v.isCtx) {
				this.codeBlock.codePushIndirect(v.offset);
			} else {
				if (v.isGlobal) {
					this.codeBlock.codePushGlobal(v.offset);
				} else {
					this.codeBlock.codePushLocal(v.offset);
				}
			}
			return v.varType;
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedType = this.eval(expr.indexed);
			if (indexedType.isError()) {
				return indexedType;
			}
			while (indexedType.tag === "res-type-name") {
				indexedType = indexedType.underlyingType;
			}
			if (indexedType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedType, "array").fromExpr(expr.indexed);
			}
			// evaluate the index
			let indexType = this.eval(expr.index);
			if (indexType.isError()) {
				return indexType;
			}
			if (indexType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexType, "integer").fromExpr(expr.index);
			}
			if (expr.indexTo === null) {
				// push the result on the stack
				this.codeBlock.codePushPtrOffset();
				return indexedType.underlyingType;
			}
			// indexTo is not null, we have a range index
			let indexToType = this.eval(expr.indexTo);
			if (indexToType.isError()) {
				return indexToType;
			}
			if (indexToType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexToType, "integer").fromExpr(expr.indexTo);
			}
			this.codeBlock.codePush(3);
			if (indexedType.underlyingType.isRef === false) {
				this.codeBlock.codeCallNative(this.context.getFunction("slice_basic_array(ref,integer,integer)").nativeIndex);
			} else {
				this.codeBlock.codeCallNative(this.context.getFunction("slice_array(ref,integer,integer)").nativeIndex);
			}
			return indexedType;
		}		
		if (expr.tag === "ast-field") {
			let recordType = this.eval(expr.expr);
			if (recordType.isError()) {
				return recordType;
			}
			while (recordType.tag === "res-type-name") {
				recordType = recordType.underlyingType;
			}
			if (recordType.tag != "res-type-record") {
				return EvalError.wrongType(recordType, "record").fromExpr(expr.expr);
			}
			for (let i = 0; i < recordType.fieldCount; i++) {
				if (recordType.fields[i].fieldName === expr.fieldName) {
					this.codeBlock.codePush(recordType.fields[i].offset);
					this.codeBlock.codePushPtrOffset();
					return recordType.fields[i].fieldType;
				}
			}
			return EvalError.unknownField(expr.fieldName, recordType.typeKey()).fromExpr(expr);
		}
		if (expr.tag === "ast-ctx-arg") {
			let v = this.scope.getVariable(expr.varName);
			if (v === null) {
				return EvalError.unknownVariable(expr.varName).fromExpr(expr);
			}
			if (v.isCtx) {
				this.codeBlock.codePushLocal(v.offset);
			} else {
				this.codeBlock.codePushIndirection(v.offset);
			}
			return v.varType;
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
			let funcKey = expr.functionName + "(";
			for (let i = 0; i < expr.argList.argCount; i++) {
				funcKey += (i > 0 ? "," : "") + (expr.argList.args[i].tag === "ast-ctx-arg" ? "ctx " : "") + argTypes[i].typeKey();
			}
			funcKey += ")";
			let func = this.context.getFunction(funcKey);
			if (func === null) {
				return EvalError.unknownFunction(funcKey).fromExpr(expr);
			}
			this.codeBlock.codePush(expr.argList.argCount);
			if (func.nativeIndex !== -1) {
				this.codeBlock.codeCallNative(func.nativeIndex);
			} else if (func.isGenerator === true) {
				this.codeBlock.codeInitGenerator(func.codeBlockIndex);
			} else if (func.codeBlockIndex !== -1) {
				this.codeBlock.codeCall(func.codeBlockIndex);
			} else {
				this.codeBlock.codeCallAbstract(func.abstractIndex);
			}
			return func.isGenerator ? this.context.addType(new EvalTypeSequence(func.returnType)) : func.returnType;
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
					this.codeBlock.codeDup();
					let whenType = this.eval(expr.whens[i].whenExpr);
					if (whenType.isError()) {
						return whenType;
					}
					if (whenType !== caseType) {
						return EvalError.wrongType(whenType, caseType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					if (caseType.isRef) {
						this.codeBlock.codeEqRef();
					} else {
						this.codeBlock.codeEq();
					}
					let nextLoc = this.codeBlock.codeJz(0);
					this.codeBlock.codePopVoid(1);
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
				this.codeBlock.codePopVoid(1);
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
			while (caseType.tag === "res-type-name") {
				caseType = caseType.underlyingType;
			}
			if (caseType.tag !== "res-type-variant") {
				return EvalError.wrongType(caseType, "variant").fromExpr(expr.caseExpr);
			}
			this.codeBlock.codeDup();
			this.codeBlock.codePush(1);
			this.codeBlock.codePushPtrOffset();
			let endLocs = [];
			let endLocCount = 0;
			let resultType = null;
			let kindHasWhen = [];
			for (let i = 0; i < caseType.fieldCount; i++) {
				kindHasWhen[i] = false;
			}
			for (let i = 0; i < expr.whenCount; i++) {
				this.codeBlock.codeDup();
				let fieldIndex = 0;
				while (fieldIndex < caseType.fieldCount) {
					if (caseType.fields[fieldIndex].fieldName === expr.whens[i].kindName) {
						break;
					}
					fieldIndex++;
				}
				if (fieldIndex === caseType.fieldCount) {
					return EvalError.unknownVariantKind(expr.whens[i].kindName).fromExpr(expr.whens[i]);
				}
				if (kindHasWhen[fieldIndex] === true) {
					return EvalError.variantKindAlreadyManaged(expr.whens[i].kindName).fromExpr(expr.whens[i]);
				}
				kindHasWhen[fieldIndex] = true;
				this.codeBlock.codePush(fieldIndex);
				this.codeBlock.codeEq();						
				let nextLoc = this.codeBlock.codeJz(0);
				this.codeBlock.codePopVoid(1);
				this.pushScopeBlock();
				this.codeBlock.codePush(0);
				this.codeBlock.codePushPtrOffset();
				this.scope.addVariable(expr.whens[i].varName, caseType.fields[fieldIndex].fieldType, true);
				let thenType = this.eval(expr.whens[i].thenExpr);
				if (thenType.isError()) {
					return thenType;
				}
				if (resultType === null) {
					resultType = thenType;
				} else if (thenType !== resultType) {
					return EvalError.wrongType(thenType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
				}
				this.codeBlock.codeSwap();
				this.codeBlock.codePopVoid(1);
				this.popScope();
				endLocs[endLocCount] = this.codeBlock.codeJmp(0);
				endLocCount++;
				this.codeBlock.setLoc(nextLoc);
			}
			this.codeBlock.codePopVoid(1);
			if (expr.elseExpr === null) {
				for (let i = 0; i < caseType.fieldCount; i++) {
					if (kindHasWhen[i] === false) {
						return EvalError.variantKindNotManaged(caseType.fields[i].fieldName).fromExpr(expr);
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
		return new EvalResultParameter(expr.parameterName, paramType, expr.isCtx);
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

