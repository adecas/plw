"use strict";
/******************************************************************************************************************************************

	AST
	
	Model of the syntax language

******************************************************************************************************************************************/

class AstNode {

	constructor(tag) {
		this.tag = tag;
		this.line = 0;
		this.col = 0;
	}
	
	fromToken(token) {
		this.line = token.line;
		this.col = token.col;
		return this;
	}
}

class AstValueBoolean extends AstNode {
	constructor(boolValue) {
		super("ast-value-boolean");
		this.boolValue = boolValue;
	}
}

class AstValueInteger extends AstNode {
	constructor(intValue) {
		super("ast-value-integer");
		this.intValue = intValue;
	}
}

class AstValueReal extends AstNode {
	constructor(realValue) {
		super("ast-value-real");
		this.realValue = realValue;
	}
}

class AstValueText extends AstNode {
	constructor(textValue) {
		super("ast-value-text");
		this.textValue = textValue;
	}
}

class AstValueArray extends AstNode {
	constructor(itemCount, items) {
		super("ast-value-array");
		this.itemCount = itemCount;
		this.items = items;
	}
}

class AstValueRecordField extends AstNode {
	constructor(fieldName, valueExpr) {
		super("ast-value-record-field");
		this.fieldName = fieldName;
		this.valueExpr = valueExpr;
	}
}

class AstValueRecord extends AstNode {
	constructor(fieldCount, fields) {
		super("ast-value-record");
		this.fieldCount = fieldCount;
		this.fields = fields;
	}
}

class AstTypeRecordField extends AstNode {
	constructor(fieldName, fieldType) {
		super("ast-type-record-field");
		this.fieldName = fieldName;
		this.fieldType = fieldType;
	}
}

class AstTypeRecord extends AstNode {
	constructor(fieldCount, fields) {
		super("ast-type-record");
		this.fieldCount = fieldCount;
		this.fields = fields;
	}
}

class AstTypeVariantField extends AstNode {
	constructor(fieldName, fieldType) {
		super("ast-type-variant-field");
		this.fieldName = fieldName;
		this.fieldType = fieldType;
	}
}

class AstTypeVariant extends AstNode {
	constructor(fieldCount, fields) {
		super("ast-type-variant");
		this.fieldCount = fieldCount;
		this.fields = fields;
	}
}

class AstAs extends AstNode {
	constructor(expr, exprType) {
		super("ast-as");
		this.expr = expr;
		this.exprType = exprType;
	}
}

class AstOperatorBinary extends AstNode {
	constructor(operator, left, right) {
		super("ast-operator-binary");
		this.operator = operator;
		this.left = left;
		this.right = right;
	}	
}

class AstOperatorUnary extends AstNode {
	constructor(operator, operand) {
		super("ast-operator-unary");
		this.operator = operator;
		this.operand = operand;
	}
}

class AstVariableDeclaration extends AstNode {
	constructor(varName, valueExpr, isConst) {
		super("ast-variable-declaration");
		this.varName = varName;
		this.valueExpr = valueExpr;
		this.isConst = isConst;
	}
}

class AstVariable extends AstNode {
	constructor(varName) {
		super("ast-variable");
		this.varName = varName;
	}
}

class AstAssign extends AstNode {
	constructor(left, right) {
		super("ast-assign");
		this.left = left;
		this.right = right;
	}
}

class AstField extends AstNode {
	constructor(expr, fieldName) {
		super("ast-field");
		this.expr = expr;
		this.fieldName = fieldName;
	}	
}

class AstTypeNamed extends AstNode {
	constructor(typeName) {
		super("ast-type-named");
		this.typeName = typeName;
	}
}

class AstTypeArray extends AstNode {
	constructor(underlyingType) {
		super("ast-type-array");
		this.underlyingType = underlyingType;
	}
}

class AstTypeSequence extends AstNode {
	constructor(underlyingType) {
		super("ast-type-sequence");
		this.underlyingType = underlyingType;
	}
}

class AstIndex extends AstNode {
	constructor(indexed, index, indexTo) {
		super("ast-index");
		this.indexed = indexed;
		this.index = index;
		this.indexTo = indexTo;
	}
}

class AstBlock extends AstNode {
	constructor(statementCount, statements, exception) {
		super("ast-block");
		this.statementCount = statementCount;
		this.statements = statements;
		this.exception = exception;
	}
}

class AstException extends AstNode {
	constructor(whenStmtCount, whenStmts, defaultStmt) {
		super("ast-exception");
		this.whenStmtCount = whenStmtCount;
		this.whenStmts = whenStmts;
		this.defaultStmt = defaultStmt;
	}
}

class AstWhenStatement extends AstNode {
	constructor(whenExpr, statement) {
		super("ast-when-statement");
		this.whenExpr = whenExpr;
		this.statement = statement;
	}
}

class AstIf extends AstNode {
	constructor(condition, trueStatement, falseStatement) {
		super("ast-if");
		this.condition = condition;
		this.trueStatement = trueStatement;
		this.falseStatement = falseStatement;
	}
}

class AstWhile extends AstNode {
	constructor(condition, statement) {
		super("ast-while");
		this.condition = condition;
		this.statement = statement;
	}
}

class AstFor extends AstNode {
	constructor(index, isReverse, sequence, statement) {
		super("ast-for");
		this.index = index;
		this.isReverse = isReverse;
		this.sequence = sequence;
		this.statement = statement;
	}
}

class AstExit extends AstNode {
	constructor(condition) {
		super("ast-exit");
		this.condition = condition;
	}
}

class AstRange extends AstNode {
	constructor(lowerBound, upperBound) {
		super("ast-range");
		this.lowerBound = lowerBound;
		this.upperBound = upperBound;
	}
}

class AstParameter extends AstNode {
	constructor(parameterName, parameterType, isCtx) {
		super("ast-parameter");
		this.parameterName = parameterName;
		this.parameterType = parameterType;
		this.isCtx = isCtx;
	}
}

class AstParameterList extends AstNode {
	constructor(parameterCount, parameters) {
		super("ast-parameter-list");
		this.parameterCount = parameterCount;
		this.parameters = parameters;
	}
}

class AstFunctionDeclaration extends AstNode {
	constructor(functionName, parameterList, returnType, statement, isGenerator) {
		super("ast-function-declaration");
		this.functionName = functionName;
		this.parameterList = parameterList;
		this.returnType = returnType;
		this.statement = statement;
		this.isGenerator = isGenerator;
	} 
}

class AstProcedureDeclaration extends AstNode {
	constructor(procedureName, parameterList, statement) {
		super("ast-procedure-declaration");
		this.procedureName = procedureName;
		this.parameterList = parameterList;
		this.statement = statement;
	}
}

class AstReturn extends AstNode {
	constructor(expr) {
		super("ast-return");
		this.expr = expr;
	}
}

class AstRaise extends AstNode {
	constructor(expr) {
		super("ast-raise");
		this.expr = expr;
	}
}

class AstYield extends AstNode {
	constructor(expr) {
		super("ast-yield");
		this.expr = expr;
	}
}

class AstCtxArg extends AstNode {
	constructor(varName) {
		super("ast-ctx-arg");
		this.varName = varName;
	}
}

class AstArgList extends AstNode {
	constructor(argCount, args) {
		super("ast-args");
		this.argCount = argCount;
		this.args = args;
	}
}

class AstFunction extends AstNode {
	constructor(functionName, argList) {
		super("ast-function");
		this.functionName = functionName;
		this.argList = argList;
	}
}

class AstProcedure extends AstNode {
	constructor(procedureName, argList) {
		super("ast-procedure");
		this.procedureName = procedureName;
		this.argList = argList;
	}
	
	static fromFunction(func) {
		let proc = new AstProcedure(func.functionName, func.argList);
		proc.line = func.line;
		proc.col = func.col;
		return proc;
	}
}

class AstTypeDeclaration extends AstNode {
	constructor(typeName, typeExpr) {
		super("ast-type-declaration");
		this.typeName = typeName;
		this.typeExpr = typeExpr;
	}
}

class AstCase extends AstNode {
	constructor(caseExpr, whenCount, whens, elseExpr) {
		super("ast-case");
		this.caseExpr = caseExpr;
		this.whenCount = whenCount;
		this.whens = whens;
		this.elseExpr = elseExpr;
	}
}

class AstWhen extends AstNode {
	constructor(whenExpr, thenExpr) {
		super("ast-when");
		this.whenExpr = whenExpr;
		this.thenExpr = thenExpr;
	}
}

class AstKindof extends AstNode {
	constructor(caseExpr, whenCount, whens, elseExpr) {
		super("ast-kindof");
		this.caseExpr = caseExpr;
		this.whenCount = whenCount;
		this.whens = whens;
		this.elseExpr = elseExpr;
	}
}

class AstKindofWhen extends AstNode {
	constructor(kindName, varName, thenExpr) {
		super("ast-kindof-when");
		this.kindName = kindName;
		this.varName = varName;
		this.thenExpr = thenExpr;
	}
}

class AstKindofStmt extends AstNode {
	constructor(caseExpr, whenCount, whens, elseBlock) {
		super("ast-kindof-stmt");
		this.caseExpr = caseExpr;
		this.whenCount = whenCount;
		this.whens = whens;
		this.elseBlock = elseBlock;
	}
}

class AstKindofWhenStmt extends AstNode {
	constructor(kindName, varName, thenBlock) {
		super("ast-kindof-when-stmt");
		this.kindName = kindName;
		this.varName = varName;
		this.thenBlock = thenBlock;
	}
}

class AstTypeAbstract extends AstNode {
	constructor(methodCount, methods) {
		super("ast-type-abstract");
		this.methodCount = methodCount;
		this.methods = methods;
	} 
}

class AstTypeAbstractMethod extends AstNode {
	constructor(methodName, parameterList, returnType) {
		super("ast-type-abstract-method");
		this.methodName = methodName;
		this.parameterList = parameterList;
		this.returnType = returnType;
	} 
}

