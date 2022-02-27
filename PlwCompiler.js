
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
	}
	
	typeKey() {
		return "not managed " + evalType;
	}
	
}

class EvalTypeBuiltIn extends EvalResultType {
	constructor(typeName, isRef) {
		super("res-type-built-in", isRef);
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
		super("res-type-record", true);
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


class EvalTypeArray extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-array", true);
		this.underlyingType = underlyingType;
	}
	
	typeKey() {
		return (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + "[]";
	}
}

class EvalTypeSequence extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-sequence", true);
		this.underlyingType = underlyingType;
	}
	
	typeKey() {
		return "sequence(" + (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + ")";
	}
}

class EvalTypeName extends EvalResultType {
	constructor(typeName, underlyingType) {
		super("res-type-name", underlyingType.isRef);
		this.typeName = typeName;
		this.underlyingType = underlyingType;
	}
	
	typeKey() {
		return this.typeName;
	}
}

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
	}
	
	static fromNative(functionName, parameterList, returnType, nativeIndex) {
		let nativeFunc = new EvalResultFunction(functionName, parameterList, returnType, false);
		nativeFunc.nativeIndex = nativeIndex;
		return nativeFunc;
	}

	functionKey() {
		let funcKey = this.functionName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			funcKey += (i > 0 ? "," : "") + this.parameterList.parameters[i].parameterType.typeKey();
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
		return nativeProc;
	}
	
	procedureKey() {
		let procKey = this.procedureName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			procKey += (i > 0 ? "," : "") + this.parameterList.parameters[i].parameterType.typeKey();
		}
		return procKey + ")";
	}
}


class EvalResultValue extends EvalResult {
	constructor(resultType, valueType) {
		super(resultType);
		this.valueType = valueType;
	}
}

class EvalResultInteger extends EvalResultValue {
	constructor(intValue) {
		super("res-integer", EVAL_TYPE_INTEGER);
		this.intValue = intValue;
	}
}

class EvalResultBoolean extends EvalResultValue {
	constructor(boolValue) {
		super("res-boolean", EVAL_TYPE_BOOLEAN);
		this.boolValue = boolValue;
	}
}

class EvalResultReturn extends EvalResult {
	constructor(returnValue) {
		super("res-return");
		this.returnValue = returnValue;
	}
}

class EvalResultYield extends EvalResult {
	constructor(yieldValue) {
		super("res-yield");
		this.yieldValue = yieldValue;
	}
}

class EvalResultOk extends EvalResult {
	constructor(okText) {
		super("res-ok");
		this.okText = okText;
	}
}

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
	
	static unknownBinaryOperator(operator) {
		return new EvalError("Unknown binary operator " + operator);
	}
	
	static wrongType(exprType, expected) {
		return new EvalError("Wrong type " + exprType.typeKey() + ", expected " + expected);
	}
	
	static unknownType(exprType) {
		return new EvalError("Unknown type " + exprType);
	}
	
	static variableAlreadyExists(varName) {
		return new EvalError("Variable " + varName + " already exists");
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

	static unexpectedReturn() {
		return new EvalError("Unexpected return");
	}
	
	static unexpectedYield() {
		return new EvalError("Unexpected yield");
	}

	static unreachableCode() {
		return new EvalError("Unreachable code");
	}
	
}

const EVAL_TYPE_INTEGER = new EvalTypeBuiltIn("integer", false);
const EVAL_TYPE_BOOLEAN = new EvalTypeBuiltIn("boolean", false);
const EVAL_TYPE_TEXT = new EvalTypeBuiltIn("text", true);


class CompilerContext {
	
	constructor() {
		this.globalScope = new CompilerScope(null, false, false, null);
		this.types = {
			"integer": EVAL_TYPE_INTEGER,
			"boolean": EVAL_TYPE_BOOLEAN,
			"text": EVAL_TYPE_TEXT
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
	
	getProcedure(procedureKey) {
		let proc = this.procedures[procedureKey];
		return proc === undefined ? null : proc;
	}
	
	addProcedure(evalProc) {
		this.procedures[evalProc.procedureKey()] = evalProc;
	}
	
	getType(typeName) {
		let type = this.types[typeName];
		return type === undefined ? null : type;
	}
	
	addType(evalType) {
		let uniqueType = this.types[evalType.typeKey()];
		if (uniqueType === undefined) {
			this.types[evalType.typeKey()] = evalType;
			return evalType;
		}
		return uniqueType;
	}
	
	addCodeBlock() {
		let i = this.codeBlocks.length;
		this.codeBlocks[i] = [];
		return i;
	}
			
}


class CompilerVariable {
	constructor(varName, varType, isGlobal, isParameter, offset) {
		this.varName = varName;
		this.varType = varType;
		this.isGlobal = isGlobal;
		this.isParameter = isParameter;
		this.offset = offset;
	}
}

class CompilerScope {

	constructor(parent, isFrame, isGenerator, returnType) {
		this.parent = parent;
		this.isFrame = isFrame;
		this.isGenerator = isGenerator;
		this.returnType = returnType;
		this.isGlobal = parent === null || (this.parent.isGlobal && isFrame === false);
		this.variables = [];
		this.parameters = [];
		this.variableCount = 0;
		this.parameterCount = 0;
		this.offset = parent === null || isFrame ? 0 : (parent.offset + parent.variableCount);
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
		while (scope !== null) {
		 	let val = scope.getLocalVariable(varName);
			if (val !== null) {
				return val;
			}
			scope = scope.parent;
		}
		return null;
	}
	
	addParameter(varName, varType, offset) {
		let newVar = new CompilerVariable(varName, varType, false, true, offset);
		this.parameters[this.parameterCount] = newVar;
		this.parameterCount++;
		return newVar;	
	}


	addVariable(varName, varType) {
		let newVar = new CompilerVariable(varName, varType, this.isGlobal, false, this.offset + this.variableCount);
		this.variables[this.variableCount] = newVar;
		this.variableCount++;
		return newVar;	
	}
	
}


class Compiler {

	constructor(context) {
		this.context = context;
		this.scope = this.context.globalScope;
		this.codes = [];
		this.codeSize = 0;
	}
	
	resetCode() {
		this.codes = [];
		this.codeSize = 0;
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
	
	codePush(val) {
		this.code2("push", val);
	}
		
	codePushGlobal(offset) {
		this.code2("push_global", offset);
	}
	
	codePushGlobalRef(offset) {
		this.code2("push_global_ref", offset);
	}
	
	codePushLocal(offset) {
		this.code2("push_local", offset);
	}
	
	codePushOffset(offset) {
		this.code2("push_offset", offset);
	}
	
	codePushPtrOffset() {
		this.code1("push_ptr_offset");
	}
	
	codeAlloc() {
		this.code1("alloc");
	}
	
	codeAllocInit() {
		this.code1("alloc_init");
	}
	
	codePopGlobal(offset) {
		this.code2("pop_global", offset);
	}
	
	codePopLocal(offset) {
		this.code2("pop_local", offset);
	}
	
	codePopPtr(offset) {
		this.code2("pop_ptr", offset);
	}
	
	codePopPtrOffset() {
		this.code1("pop_ptr_offset");
	}
		
	codePopVoid(count) {
		this.code2("pop_void", count);
	}
	
	codeSwap() {
		this.code1("swap");
	}
	
	codeAdd() {
		this.code1("add");
	}
	
	codeSub() {
		this.code1("sub");
	}

	codeDiv() {
		this.code1("div");
	}

	codeMul() {
		this.code1("mul");
	}
	
	codeNeg() {
		this.code1("neg");
	}
	
	codeGt() {
		this.code1("gt");
	}

	codeGte() {
		this.code1("gte");
	}

	codeLt() {
		this.code1("lt");
	}

	codeLte() {
		this.code1("lte");
	}
	
	codeEq() {
		this.code1("eq");
	}
	
	codeNe() {
		this.code1("ne");
	}

	codeAnd() {
		this.code1("and");
	}
	
	codeOr() {
		this.code1("or");
	}
	
	codeNot() {
		this.code1("not");
	}
		
	codeLength() {
		this.code1("length");
	}
	
	codeNext() {
		this.code1("next");
	}
	
	codeEnded() {
		this.code1("ended");
	}
	
	codeEqStr() {
		this.code1("eq_str");
	}
	
	codeJz(offset) {
		this.code2("jz", offset);
		return this.codeSize - 1;
	}
	
	codeJnz(offset) {
		this.code2("jnz", offset);
		return this.codeSize - 1;
	}
	
	codeJmp(offset) {
		this.code2("jmp", offset);
		return this.codeSize - 1;
	}
			
	codeRet() {
		this.code1("ret");
	}

	codeRetVal() {
		this.code1("ret_val");
	}
	
	codeYield() {
		this.code1("yield");
	}
	
	codeYieldDone() {
		this.code1("yield_done");
	}
	
	codeCall(ptr) {
		this.code2("call", ptr);
	}
		
	codeCallNative(ptr) {
		this.code2("call_native", ptr);
	}
	
	codeInitGenerator(ptr) {
		this.code2("init_generator", ptr);
	}
	
	eval(expr) {
		if (expr.tag === "ast-type-named") {
			let evalType = this.context.getType(expr.typeName);
			if (evalType === null) {
				return EvalError.unknownType(expr.typeName).fromExpr(expr);
			}
			return evalType;
		}
		if (expr.tag === "ast-type-array") {
			let underType = this.eval(expr.underlyingType);
			if (underType.isError()) {
				return underType;
			}
			return this.context.addType(new EvalTypeArray(underType));
		}
		if (expr.tag === "ast-type-sequence") {
			let underType = this.eval(expr.underlyingType);
			if (underType.isError()) {
				return underType;
			}
			return this.context.addType(new EvalTypeSequence(underType));
		}
		if (expr.tag === "ast-type-record") {
			let fields = [];
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldType = this.eval(expr.fields[i].fieldType);
				if (fieldType.isError()) {
					return fieldType;
				}
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldType);
			}
			return this.context.addType(new EvalTypeRecord(expr.fieldCount, fields));
		}
		if (expr.tag === "ast-value-boolean") {
			this.codePush(expr.boolValue ? 1 : 0);
			return EVAL_TYPE_BOOLEAN;
		}
		if (expr.tag === "ast-value-integer") {
			this.codePush(expr.intValue);
			return EVAL_TYPE_INTEGER;
		}
		if (expr.tag === "ast-value-text") {
			this.codePush(0);
			this.codePush(expr.textValue.length);
			this.codeAllocInit();
			for (let i = 0; i < expr.textValue.length; i++) {
				this.code1(expr.textValue.charCodeAt(i));
			}
			return EVAL_TYPE_TEXT;
		}
		if (expr.tag === "ast-value-array") {
			if (expr.itemCount === 0) {
				return EvalError.wrongType(null, "wtf to do with empty array").fromExpr(expr);
			}
			// Evaluate first item to get the type
			let firstItemType = this.eval(expr.items[0]);
			if (firstItemType.isError()) {
				return firstItemType;
			}
			// Allocate the array
			this.codePush(firstItemType.isRef ? expr.itemCount : 0);
			this.codePush(expr.itemCount);
			this.codeAlloc();
			// Swap the array, and the first item, and pop the first item in the array
			this.codeSwap();
			this.codePopPtr(0);
			// Evalute the next items, and pop them in the array
			for (let i = 1; i < expr.itemCount; i++) {
				let itemType = this.eval(expr.items[i]);
				if (itemType.isError()) {
					return itemType;
				}
				if (itemType !== firstItemType) {
					return EvalError.wrongType(itemType, firstItemType.typeKey()).fromExpr(expr.items[i]);
				}
				this.codePopPtr(i);
			}
			return this.context.addType(new EvalTypeArray(firstItemType));
		}
		if (expr.tag === "ast-value-record") {
			let fields = [];
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldType = this.eval(expr.fields[i].fieldType);
				if (fieldType.isError()) {
					return fieldType;
				}
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldType);
			}
			let recordType = this.context.addType(new EvalTypeRecord(expr.fieldCount, fields));
			this.codePush(recordType.refFieldCount);
			this.codePush(expr.fieldCount);
			this.codeAlloc();
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldValueType = this.eval(expr.fields[i].valueExpr);
				if (fieldValueType.isError()) {
					return fieldValueType;
				}
				if (fieldValueType !== fields[i].fieldType) {
					return EvalError.wrongType(fieldValueType, fieldType.typeKey()).fromExpr(expr.fields[i].valueExpr);
				}
				this.codePopPtr(fields[i].offset);
			}
			return recordType;
		}
		if (expr.tag === "ast-operator-binary") {
			if (expr.operator === "and" || expr.operator === "or") {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(leftType, "boolean").fromExpr(expr.left);
				}
				let skipLoc = expr.operator === "and" ? this.codeJz(0) : this.codeJnz(0);
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(rightType, "boolean").fromExpr(expr.right);
				}
				let endLoc = this.codeJmp(0);
				this.setLoc(skipLoc);
				this.codePush(expr.operator === "and" ? 0 : 1);
				this.setLoc(endLoc);
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === "||") {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_TEXT) {
					return EvalError.wrongType(leftType, "text").fromExpr(expr.left);
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== EVAL_TYPE_TEXT) {
					return EvalError.wrongType(rightType, "text").fromExpr(expr.right);
				}
				this.codePush(2);
				this.codeCallNative(this.context.getFunction("concat(text,text)").nativeIndex);
				return EVAL_TYPE_TEXT;
			}
			if (
				expr.operator === "+" || expr.operator === "-" ||
				expr.operator === "/" || expr.operator === "*" ||
				expr.operator === ">" || expr.operator === "<" ||
				expr.operator === ">=" || expr.operator === "<="
			) {
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
				if (expr.operator === "+") {
					this.codeAdd();
				} else if (expr.operator === "-") {
					this.codeSub();
				} else if (expr.operator === "/") {
					this.codeDiv();
				} else if (expr.operator === "*") {
					this.codeMul();
				} else if (expr.operator === ">") {
					this.codeGt();
				} else if (expr.operator === "<") {
					this.codeLt();
				} else if (expr.operator === ">=") {
					this.codeGte();
				} else {
					this.codeLte();
				}
				if (
					expr.operator === "+" || expr.operator === "-" ||
					expr.operator === "/" || expr.operator === "*"
				) {
					return EVAL_TYPE_INTEGER;
				}
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === "=" || expr.operator === "<>") {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== leftType) {
					return EvalError.wrongType(rightType, leftType).fromExpr(expr.right);
				}
				if (rightType === EVAL_TYPE_TEXT) {
					this.codeEqStr();
					if (expr.operator === "<>") {
						this.codeNot();
					}
				} else {
					if (expr.operator === "=") {
						this.codeEq();
					} else {
						this.codeNe();
					}
				}
				return EVAL_TYPE_BOOLEAN;
			}
			return EvalError.unknownBinaryOperator(expr.operator).fromExpr(expr);
		}
		if (expr.tag === "ast-operator-unary") {
			let operandType = this.eval(expr.operand);
			if (operandType.isError()) {
				return operand;
			}
			if (expr.operator === "not") {
				if (operandType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(operandType, "boolean").fromExpr(expr.operand);
				}
				this.codeNot();
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === "-") {
				if (operandType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(operandType, "integer").fromExpr(expr.operand);
				}
				this.codeNeg();
				return EVAL_TYPE_INTEGER;
			}
			if (expr.operator === "length") {
				if (!operandType.isRef) {
					return EvalError.wrongType(operandType, "reference type").fromExpr(expr.operand);
				}
				this.codeLength();
				return EVAL_TYPE_INTEGER;
			}
			if (expr.operator === "next") {
				if (operandType.tag !== "res-type-sequence") {
					return EvalError.wrongType(operandType, "sequence").fromExpr(expr.operand);
				}
				this.codeNext();
				return operandType.underlyingType;
			}
			if (expr.operator === "ended") {
				if (operandType.tag !== "res-type-sequence") {
					return EvalError.wrongType(operandType, "sequence").fromExpr(expr.operand);
				}
				this.codeEnded();
				return EVAL_TYPE_BOOLEAN;
			}
			return EvalError.unknownUnaryOperator(expr.operator).fromExpr(expr);
		}
		if (expr.tag === "ast-type-declaration") {
			if (this.context.getType(expr.typeName) !== null) {
				return EvalError.typeAlreadyExists(expr.typeName).fromExpr(expr);
			}
			let underlyingType = this.eval(expr.typeExpr);
			if (underlyingType.isError()) {
				return underlyingType;
			}
			return this.context.addType(new EvalTypeName(expr.typeName, underlyingType));
		}
		if (expr.tag === "ast-variable-declaration") {
			if (this.scope.getLocalVariable(expr.varName) !== null) {
				return EvalError.variableAlreadyExists(expr.varName).fromExpr(expr);
			}
			let initValueType = this.eval(expr.valueExpr);
			if (initValueType.isError()) {
				return initValueType;
			}
			let varType = this.eval(expr.varType);
			if (varType.isError()) {
				return varType;
			}
			if (
				initValueType.tag === "res-type-array" &&
			    initValueType.underlyingType === null &&
			    varType.tag === "res-type-array"
			) {
				initValueType = varType;
			} else if (initValueType !== varType) {
				if (varType.tag === "res-type-name") {
					if (initValueType !== varType.underlyingType) {
						return EvalError.wrongType(
							initValueType,
							varType.typeKey() + " or " + varType.underlyingType.typeKey()
						).fromExpr(expr.valueExpr);
					}
				} else {
					return EvalError.wrongType(initValueType, varType.typeKey()).fromExpr(expr.valueExpr);
				}
			}
			this.scope.addVariable(expr.varName, varType);
			return new EvalResultOk("Variable created");
		}
		if (expr.tag === "ast-variable") {
			let v = this.scope.getVariable(expr.varName);
			if (v === null) {
				return EvalError.unknownVariable(expr.varName).fromExpr(expr);
			}
			if (v.isGlobal) {
				this.codePushGlobal(v.offset);
			} else {
				this.codePushLocal(v.offset);
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
			// push the result on the stack
			this.codePushPtrOffset();
			return indexedType.underlyingType;
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
					this.codePush(recordType.fields[i].offset);
					this.codePushPtrOffset();
					return recordType.fields[i].fieldType;
				}
			}
			return EvalError.unknownField(expr.fieldName, recordType.typeKey()).fromExpr(expr);
		}
		if (expr.tag === "ast-assign") {
			if (expr.left.tag === "ast-variable") {
				// search the variable
				let variable = this.scope.getVariable(expr.left.varName);
				if (variable === null) {
					return EvalError.unknownVariable(expr.left.varName).fromExpr(expr.left);
				}
				// evaluate the value
				let valueType = this.eval(expr.right);
				if (valueType.isError()) {
					return value;
				}
				if (valueType !== variable.varType) {
					return EvalError.wrongType(valueType, variable.varType.typeKey()).fromExpr(expr.right);					
				}
				// assign the value
				if (variable.isGlobal) {
					this.codePopGlobal(variable.offset);
				} else {
					this.codePopLocal(variable.offset);
				}
				return new EvalResultOk("assigned");
			}
			if (expr.left.tag === "ast-index") {
				let indexExpr = expr.left;
				// Evaluate the indexed ptr
				let indexedType = this.eval(indexExpr.indexed);
				if (indexedType.isError()) {
					return indexed;
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
					return index;
				}
				if (indexType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(indexType, "integer").fromExpr(indexExpr.index);
				}
				// Evaluate the value to assign
				let valueType = this.eval(expr.right);
				if (valueType.isError()) {
					return value;
				}
				if (valueType !== indexedType.underlyingType) {
					return EvalError.wrongType(valueType, indexedType.underlyingType.typeKey()).fromExpr(expr.right);
				}
				// Assigne the value
				this.codePopPtrOffset();
				return new EvalResultOk("assigned");
			}
			if (expr.left.tag === "ast-field") {
				let fieldExpr = expr.left;
				// evaluate the record
				let recordType = this.eval(fieldExpr.expr);
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
				this.codePush(recordType.fields[fieldIndex].offset);
				// Evaluate the value to assign
				let valueType = this.eval(expr.right);
				if (valueType.isError()) {
					return value;
				}
				if (valueType !== recordType.fields[fieldIndex].fieldType) {
					return EvalError.wrongType(valueType, recordType.fields[fieldIndex].fieldType.typeKey()).fromExpr(expr.right);
				}
				// Assigne the value
				this.codePopPtrOffset();
				return new EvalResultOk("assigned");
			}
			return EvalError.unassignable(expr.left.tag).fromExpr(expr.left);
		}
		if (expr.tag == "ast-block") {
			let ret = null;
			this.scope = new CompilerScope(this.scope, false, false, null);
			for (let i = 0; i < expr.statementCount; i++) {
				if (ret !== null) {
					return EvalError.unreachableCode().fromExpr(expr.statements[i]);
				}
				let val = this.eval(expr.statements[i]);
				if (val.isError()) {
					return val;
				}
				if (val.tag === "res-return") {
					if (ret === null) {
						ret = val;
					} else if ( val.returnType !== ret.returnType) {
						return EvalError.wrongType(val.valueType, ret.returnType).fromExpr(expr.statements[i]);	
					}
				} else if (val.tag !== "res-ok" && val.tag !== "res-yield") {
					return EvalError.wrongType(val.valueType, "statement").fromExpr(expr.statements[i]);	
				}
			}
			if (ret === null) {
				if (this.scope.variableCount > 0) {
					this.codePopVoid(this.scope.variableCount);
				}
			}
			this.scope = this.scope.parent;
			return ret === null ? new EvalResultOk("block") : ret;
		}
		if (expr.tag === "ast-if") {
			let condType = this.eval(expr.condition);
			if (condType.isError()) {
				return condType;
			}
			if (condType !== EVAL_TYPE_BOOLEAN) {
				return EvalError.wrongType(condType, "boolean").fromExpr(expr.condition);	
			}
			let falseLoc = this.codeJz(0);
			let trueRet =  this.eval(expr.trueStatement);
			if (trueRet.isError()) {
				return trueRet;
			}
			if (trueRet.tag !== "res-ok" && trueRet.tag !== "res-return") {
				return EvalError.wrongType(trueRet, "statement").fromExpr(expr.trueStatement);	
			}
			let endLoc = expr.falseStatement === null ? 0 : this.codeJmp(0);
			this.setLoc(falseLoc);
			if (expr.falseStatement === null) {
				return new EvalResultOk("if");
			}
			let falseRet = this.eval(expr.falseStatement);
			if (falseRet.isError()) {
				return falseRet;
			}
			if (falseRet.tag !== "res-ok" && falseRet.tag !== "res-return") {
				return EvalError.wrongType(falseRet, "statement").fromExpr(expr.falseStatement);	
			}
			this.setLoc(endLoc);
			if (falseRet.tag === "res-return" && trueRet.tag === "res-return") {
				if (falseRet.returnType !== trueRet.returnType) {
					return EvalError.wrongType(falseRet.returnType, trueRet.returnType.typeKey()).fromExpr(expr.falseStatement);	
				}
				return trueRet;
			}
			return new EvalResultOk("if");
		}
		if (expr.tag === "ast-while") {
			let testLoc = this.codeSize;
			let conditionType = this.eval(expr.condition);
			if (conditionType.isError()) {
				return condition;
			}
			if (conditionType !== EVAL_TYPE_BOOLEAN) {
				return EvalError.wrongType(conditionType, "boolean").fromExpr(expr.condition);	
			}
			let endLoc = this.codeJz(0);
			let stmtRet = this.eval(expr.statement);
			if (stmtRet.isError()) {
				return stmtRet;
			}
			if (stmtRet.tag !== "res-ok" && stmtRet.tag !== "res-return") {
				return EvalError.wrongType(stmtRet, "statement").fromExpr(expr.statements);
			}
			this.codeJmp(testLoc);
			this.setLoc(endLoc);
			return new EvalResultOk("while");
		}
		if (expr.tag === "ast-for") {
			if (expr.sequence.tag === "ast-range") {
				this.scope = new CompilerScope(this.scope, false, false, null);
				let startBoundExpr = expr.isReverse ? expr.sequence.upperBound : expr.sequence.lowerBound;
				let endBoundExpr = expr.isReverse ? expr.sequence.lowerBound : expr.sequence.upperBound;				
				let endBoundType = this.eval(endBoundExpr);
				if (endBoundType.isError()) {
					return endBoundType;
				}
				if (endBoundType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(endBoundType, "integer").fromExpr(endBoundExpr);
				}
				let endBoundVar = this.scope.addVariable("_for_range_end_bound", EVAL_TYPE_INTEGER);
				let startBoundType = this.eval(startBoundExpr);
				if (startBoundType.isError()) {
					return startBoundType;
				}
				if (startBoundType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(startBoundType, "integer").fromExpr(startBoundExpr);
				}
				let indexVar = this.scope.addVariable(expr.index, EVAL_TYPE_INTEGER);
				let testLoc = this.codeSize;
				this.codePushLocal(indexVar.offset);
				this.codePushLocal(endBoundVar.offset);
				if (expr.isReverse) {
					this.codeGte();
				} else {
					this.codeLte();
				}
				let endLoc = this.codeJz(0);
				let stmtRet = this.eval(expr.statement);
				if (stmtRet.isError()) {
					return stmtRet;
				}
				if (stmtRet.tag !== "res-ok" && stmtRet.tag !== "res-return") {
					return EvalError.wrongType(stmtRet, "statement").fromExpr(expr.statements);
				}
				this.codePush(1);
				if (expr.isReverse) {
					this.codeSub();
				} else {
					this.codeAdd();
				}
				this.codeJmp(testLoc);
				this.setLoc(endLoc);
				this.codePopVoid(this.scope.variableCount);
				this.scope = this.scope.parent;
				return new EvalResultOk("for");
			} else {
				this.scope = new CompilerScope(this.scope, false, false, null);
				let sequence = this.eval(expr.sequence);
				if (sequence.isError()) {
					return sequence;
				}
				if (sequence.tag !== "res-type-sequence") {
					return EvalError.wrongType(stmt, "sequence").fromExpr(expr.sequence);
				}
				let sequenceVar = this.scope.addVariable("_for_sequence", sequence);
				this.codePushLocal(sequenceVar.offset);
				this.codeNext();
				let indexVar = this.scope.addVariable(expr.index, sequence.underlyingType);
				let testLoc = this.codeSize;
				this.codePushLocal(sequenceVar.offset);
				this.codeEnded();
				let endLoc = this.codeJnz(0);
				let stmtRet = this.eval(expr.statement);
				if (stmtRet.isError()) {
					return stmtRet;
				}
				if (stmtRet.tag !== "res-ok" && stmtRet.tag !== "res-return") {
					return EvalError.wrongType(stmtRet, "statement").fromExpr(expr.statements);
				}
				this.codePushLocal(sequenceVar.offset);
				this.codeNext();
				this.codePopLocal(indexVar.offset);
				this.codeJmp(testLoc);
				this.setLoc(endLoc);
				this.codePopVoid(this.scope.variableCount);
				this.scope = this.scope.parent;
				return new EvalResultOk("for");
			}
			return EvalError.unknownType(expr.sequence.tag).fromExpr(expr.sequence);
		}
		if (expr.tag === "ast-parameter") {
			let paramType = this.eval(expr.parameterType);
			if (paramType.isError()) {
				return paramType;
			}
			return new EvalResultParameter(expr.parameterName, paramType);
		}
		if (expr.tag === "ast-parameter-list") {
			let parameters = [];
			for (let i = 0; i < expr.parameterCount; i++) {
				let parameter = this.eval(expr.parameters[i]);
				if (parameter.isError()) {
					return parameter;
				}
				for (let k = 0; k < i; k++) {
					if (parameters[k].parameterName === parameter.parameterName) {
						return new EvalError.parameterAlreadyExists(parameterNamer).fromExpr(expr.parameters[i]);
					}
				}
				parameters[i] = parameter;
			}
			return new EvalResultParameterList(expr.parameterCount, parameters);
		}
		if (expr.tag === "ast-return") {
			// Eval the returned expression
			let retType = this.eval(expr.expr);
			if (retType.isError()) {
				return retType;
			}
			// Find frame scope
			let currentScope = this.scope;
			while (currentScope !== null) {
				if (currentScope.isFrame) {
					break;
				}
				currentScope = currentScope.parent;
			}
			if (currentScope === null || currentScope.isGenerator !== false) {
				return EvalError.unexpectedReturn().fromExpr(expr);
			}
			// Check the return type
			if (retType !== currentScope.returnType) {
				return EvalError.wrongType(retType, currentScope.returnType.typeKey()).fromExpr(expr.expr);
			}
			this.codeRetVal();
			return new EvalResultReturn(retType);
		}
		if (expr.tag === "ast-yield") {
			// Check that the frame is a generator
			let frameScope = this.scope;
			while (frameScope !== null && frameScope.isFrame === false) {
				frameScope = frameScope.parent;
			}
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
				return EvalError.wrongType(retType, currentScope.returnType.typeKey()).fromExpr(expr.expr);
			}
			this.codeYield();
			return new EvalResultYield(retType);
		}
		if (expr.tag === "ast-function-declaration") {
			let parameterList = this.eval(expr.parameterList);
			if (parameterList.isError(parameterList)) {
				return parameterList;
			}
			let returnType = this.eval(expr.returnType);
			if (returnType.isError()) {
				return returnType;
			}
			let evalFunc = new EvalResultFunction(expr.functionName, parameterList, returnType, expr.isGenerator);
			if (this.context.getFunction(evalFunc.functionKey()) !== null) {
				return EvalError.functionAlreadyExists(evalFunc.functionKey()).fromExpr(expr);
			}
			this.context.addFunction(evalFunc);
			{ // begin Compile function
				let oldCodes = this.codes;
				let oldCodeSize = this.codeSize;
				let codeBlockIndex = this.context.addCodeBlock();
				this.codes = this.context.codeBlocks[codeBlockIndex];
				this.codeSize = 0;
				evalFunc.codeBlockIndex = codeBlockIndex;
				this.scope = new CompilerScope(this.scope, true, evalFunc.isGenerator, returnType);
				for (let i = 0; i < parameterList.parameterCount; i++) {
					if (evalFunc.isGenerator === true) {
						this.scope.addVariable(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType
						);
					} else {
						this.scope.addParameter(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType,
							i - parameterList.parameterCount - 4
						);
					}
				}
				let ret = this.eval(expr.statement);
				if (ret.isError()) {
					return ret;
				}
				if (evalFunc.isGenerator === true) {
					this.codeYieldDone();
				} else if (ret.tag !== "res-return") {
					return EvalError.noFunctionReturn(evalFunc.functionKey()).fromExpr(expr.statement);
				}
				this.scope = this.scope.parent;
				this.codes = oldCodes;
				this.codeSize = oldCodeSize;
			} // End Compile function
			return new EvalResultOk("Function created");
		}
		if (expr.tag === "ast-procedure-declaration") {
			let parameterList = this.eval(expr.parameterList);
			if (parameterList.isError(parameterList)) {
				return parameterList;
			}
			let evalProc = new EvalResultProcedure(expr.procedureName, parameterList);
			if (this.context.getProcedure(evalProc.procedureKey()) !== null) {
				return EvalError.procedureAlreadyExists(evalProc.procedureKey()).fromExpr(expr);
			}
			this.context.addProcedure(evalProc);
			{ // begin Compile procedure
				let oldCodes = this.codes;
				let oldCodeSize = this.codeSize;
				let codeBlockIndex = this.context.addCodeBlock();
				this.codes = this.context.codeBlocks[codeBlockIndex];
				this.codeSize = 0;
				evalProc.codeBlockIndex = codeBlockIndex;
				this.scope = new CompilerScope(this.scope, true, false, null);
				for (let i = 0; i < parameterList.parameterCount; i++) {
					this.scope.addParameter(
						parameterList.parameters[i].parameterName,
						parameterList.parameters[i].parameterType,
						i - parameterList.parameterCount - 4
					);
				}
				let ret = this.eval(expr.statement);
				if (ret.isError()) {
					return ret;
				}
				if (ret.tag !== "res-ok") {
					return EvalError.wrongType(ret.returnValue, "none").fromExpr(expr.statement);
				}
				this.codeRet();
				this.scope = this.scope.parent;
				this.codes = oldCodes;
				this.codeSize = oldCodeSize;
			} // End Compile procedure
			return new EvalResultOk("Procedure created");
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
				funcKey += (i > 0 ? "," : "") + argTypes[i].typeKey();
			}
			funcKey += ")";
			let func = this.context.getFunction(funcKey);
			if (func === null) {
				return EvalError.unknownFunction(funcKey).fromExpr(expr);
			}
			this.codePush(expr.argList.argCount);
			if (func.nativeIndex !== -1) {
				this.codeCallNative(func.nativeIndex);
			} else if (func.isGenerator === true) {
				this.codeInitGenerator(func.codeBlockIndex);
			} else {
				this.codeCall(func.codeBlockIndex);
			}
			return func.isGenerator ? this.context.addType(new EvalTypeSequence(func.returnType)) : func.returnType;
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
				procKey += (i > 0 ? "," : "") + argTypes[i].typeKey();
			}
			procKey += ")";
			let proc = this.context.getProcedure(procKey);
			if (proc === null) {
				return EvalError.unknownProcedure(procKey).fromExpr(expr);
			}
			this.codePush(expr.argList.argCount);
			if (proc.nativeIndex !== -1) {
				this.codeCallNative(proc.nativeIndex);
			} else {
				this.codeCall(proc.codeBlockIndex);
			}
			return new EvalResultOk("procedure");;
		}
		return EvalError.unknownType(expr.tag).fromExpr(expr);
	}
}

